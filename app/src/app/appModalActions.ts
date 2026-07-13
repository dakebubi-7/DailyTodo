import type { Dispatch, SetStateAction } from 'react';
import type { AppBehaviorSettings, ObsidianTemplateSettings } from '../../shared/appSettings';
import type { AiReviewSettings } from '../../shared/aiReview/aiReviewSettings';
import type { DailyTemplate, ReportTemplate } from '../../shared/aiReview/sectionConfig';
import type { Task } from '../types/task';
import { applyTemplateUpdate, type AppTemplateKind } from './appTemplateEditor';

interface AppModalActionsDeps {
  appSettings: AppBehaviorSettings;
  obsidianTemplates: ObsidianTemplateSettings;
  editingTemplateKind: AppTemplateKind | null;
  aiReview: {
    setSettings: (settings: AiReviewSettings) => Promise<unknown> | unknown;
  } | undefined;
  updateAppSettings: (next: AppBehaviorSettings) => void;
  updateObsidianTemplates: (next: ObsidianTemplateSettings) => void | Promise<void>;
  setCompactMode: Dispatch<SetStateAction<boolean>>;
  setSettingsOpen: Dispatch<SetStateAction<boolean>>;
  setCompanionOpen: Dispatch<SetStateAction<boolean>>;
  setAiOnboarding: Dispatch<SetStateAction<AiReviewSettings | null>>;
  setCompletionTask: Dispatch<SetStateAction<Task | null>>;
  setReviewTask: Dispatch<SetStateAction<Task | null>>;
  setEditingTemplateKind: Dispatch<SetStateAction<AppTemplateKind | null>>;
}

export function createAppModalActions({
  appSettings,
  obsidianTemplates,
  editingTemplateKind,
  aiReview,
  updateAppSettings,
  updateObsidianTemplates,
  setCompactMode,
  setSettingsOpen,
  setCompanionOpen,
  setAiOnboarding,
  setCompletionTask,
  setReviewTask,
  setEditingTemplateKind,
}: AppModalActionsDeps) {
  return {
    toggleCompactMode: () => setCompactMode((prev) => !prev),
    toggleSettings: () => setSettingsOpen((prev) => !prev),
    toggleLockWindowPosition: () => updateAppSettings({ ...appSettings, lockWindowPosition: !appSettings.lockWindowPosition }),
    closeSettings: () => setSettingsOpen(false),
    openCompanionSettings: () => {
      setCompanionOpen(true);
      setSettingsOpen(false);
    },
    completeAiOnboarding: (next: AiReviewSettings) => {
      void aiReview?.setSettings(next);
      setAiOnboarding(null);
    },
    saveTemplate: (tpl: DailyTemplate | ReportTemplate) => {
      if (!editingTemplateKind) return;
      updateObsidianTemplates(applyTemplateUpdate(obsidianTemplates, editingTemplateKind, tpl));
      setEditingTemplateKind(null);
    },
    cancelTemplate: () => setEditingTemplateKind(null),
    editTemplate: (kind: AppTemplateKind) => setEditingTemplateKind(kind),
    closeCompanion: () => setCompanionOpen(false),
    cancelCompletion: () => setCompletionTask(null),
    closeReview: () => setReviewTask(null),
    addCompletionRecord: (task: Task) => setCompletionTask(task),
  };
}
