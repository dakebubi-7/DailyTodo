import { useEffect, useRef, useState } from 'react';
import type { getShellText } from '../../i18n';
import type { Task } from '../../types/task';
import {
  type AiReviewSettings,
  type MonthlySourceMode,
  type WeeklySourceMode,
  createDefaultAiReviewSettings,
  normalizeAiReviewSettings,
} from '../../../shared/aiReview/aiReviewSettings';
import type { AiReviewProgressEvent, AiReviewRunDiagnostic } from '../../../shared/aiReview/runDiagnostics';
import type { AiReviewHandoffSuggestion } from '../../../shared/aiReview/aiReviewIpcResultReaders';
import {
  areDeferredPersistenceValuesEqual,
  createDeferredPersistence,
} from './aiReviewSettingsPersistence';
import {
  type GenerationAction,
} from './AiReviewSettingsWidgets';
import {
  createAiReviewPanelOptions,
  type SourceOption,
  type WeekOption,
} from './aiReviewSettingsPanelOptions';
import { useAiReviewGeneration } from './useAiReviewGeneration';

type SettingsText = ReturnType<typeof getShellText>['settings'];

interface UseAiReviewSettingsPanelStateOptions {
  isOpen: boolean;
  zh: boolean;
  text: SettingsText;
  selectedDate: string;
  tasks: Task[];
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
}

interface UseAiReviewSettingsPanelStateResult {
  aiReviewSettings: AiReviewSettings;
  weeklySourceOptions: Array<SourceOption<WeeklySourceMode>>;
  monthlySourceOptions: Array<SourceOption<MonthlySourceMode>>;
  weekOptions: WeekOption[];
  generatingAction: GenerationAction | null;
  generationStatus: string;
  currentProgress: AiReviewProgressEvent | null;
  waitingForRealProgress: string;
  lastDiagnostic: AiReviewRunDiagnostic | null;
  handoffs: AiReviewHandoffSuggestion[];
  updateAiReview: <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) => void;
  updateAiReviewInput: <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) => void;
  saveAiReviewSettings: (next: AiReviewSettings) => void;
  saveAiReviewSettingsInput: (next: AiReviewSettings) => void;
  runGeneration: (action: GenerationAction) => void;
  applyHandoff: (taskId: string, updateNextStep: boolean) => void;
  onCloseDiagnostic: () => void;
}

export function useAiReviewSettingsPanelState({
  isOpen,
  zh,
  text,
  selectedDate,
  tasks,
  onUpdateTask,
}: UseAiReviewSettingsPanelStateOptions): UseAiReviewSettingsPanelStateResult {
  const [aiReviewSettings, setAiReviewSettings] = useState<AiReviewSettings>(() => createDefaultAiReviewSettings());
  const aiReviewSettingsRef = useRef(aiReviewSettings);
  const aiReviewPersistenceRef = useRef<ReturnType<typeof createDeferredPersistence<AiReviewSettings>> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let active = true;
    window.electronAPI?.aiReview.getSettings().then((value) => {
      if (active) {
        const settings = normalizeAiReviewSettings(value);
        aiReviewSettingsRef.current = settings;
        setAiReviewSettings(settings);
      }
    });
    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => aiReviewPersistenceRef.current?.flush();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      aiReviewPersistenceRef.current?.flush();
    }
  }, [isOpen]);

  const saveAiReviewSettings = (next: AiReviewSettings) => {
    aiReviewPersistenceRef.current?.flush();
    aiReviewPersistenceRef.current = null;
    aiReviewSettingsRef.current = next;
    setAiReviewSettings(next);
    window.electronAPI?.aiReview.setSettings(next);
  };

  const saveAiReviewSettingsInput = (next: AiReviewSettings) => {
    setAiReviewSettings(next);
    if (!aiReviewPersistenceRef.current) {
      aiReviewPersistenceRef.current = createDeferredPersistence({
        delay: 300,
        initialValue: aiReviewSettingsRef.current,
        areEqual: areDeferredPersistenceValuesEqual,
        persist: (value) => window.electronAPI?.aiReview.setSettings(value),
      });
    }
    aiReviewSettingsRef.current = next;
    aiReviewPersistenceRef.current.schedule(next);
  };

  const updateAiReview = <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) => {
    saveAiReviewSettings({ ...aiReviewSettings, [key]: value });
  };

  const updateAiReviewInput = <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) => {
    saveAiReviewSettingsInput({ ...aiReviewSettings, [key]: value });
  };

  const { weeklySourceOptions, monthlySourceOptions, weekOptions } = createAiReviewPanelOptions(text, zh);
  const generation = useAiReviewGeneration({ isOpen, zh, text, selectedDate, tasks, onUpdateTask });

  return {
    aiReviewSettings,
    weeklySourceOptions,
    monthlySourceOptions,
    weekOptions,
    ...generation,
    updateAiReview,
    updateAiReviewInput,
    saveAiReviewSettings,
    saveAiReviewSettingsInput,
  };
}
