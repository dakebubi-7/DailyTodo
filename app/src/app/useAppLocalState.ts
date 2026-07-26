import { useState, type Dispatch, type SetStateAction } from 'react';
import type { SyncPreview } from '../../shared/obsidianTemplates';
import { createDefaultObsidianTemplateSettings, type ObsidianTemplateSettings } from '../../shared/appSettings';
import { createDefaultCompanionSettings } from '../../shared/obsidianCompanionDefaults';
import type { CaptureItem, CompanionSettings, SyncPlan } from '../../shared/obsidianCompanion';
import type { AiReviewSettings } from '../../shared/aiReview/aiReviewSettings';
import { DEFAULT_PERSONALIZATION, type PersonalizationSettings, type ThemeOpacityOverride } from '../types/personalization';
import type { Task } from '../types/task';
import type { CompletionTarget } from './appCompletionFlow';
import type { AppTemplateKind } from './appTemplateEditor';
import type { PriorityFilter } from './appTaskView';

type StateSetter<T> = Dispatch<SetStateAction<T>>;

export interface AppLocalState {
  isDailyWorkOpen: boolean;
  setIsDailyWorkOpen: StateSetter<boolean>;
  isInspirationOpen: boolean;
  setIsInspirationOpen: StateSetter<boolean>;
  compactMode: boolean;
  setCompactMode: StateSetter<boolean>;
  searchQuery: string;
  setSearchQuery: StateSetter<string>;
  searchOpen: boolean;
  setSearchOpen: StateSetter<boolean>;
  showOpenOnly: boolean;
  setShowOpenOnly: StateSetter<boolean>;
  priorityFilter: PriorityFilter;
  setPriorityFilter: StateSetter<PriorityFilter>;
  settingsOpen: boolean;
  setSettingsOpen: StateSetter<boolean>;
  editingTemplateKind: AppTemplateKind | null;
  setEditingTemplateKind: StateSetter<AppTemplateKind | null>;
  aiOnboarding: AiReviewSettings | null;
  setAiOnboarding: StateSetter<AiReviewSettings | null>;
  completionTask: Task | null;
  setCompletionTask: StateSetter<Task | null>;
  reviewTask: Task | null;
  setReviewTask: StateSetter<Task | null>;
  completionTarget: CompletionTarget | null;
  setCompletionTarget: StateSetter<CompletionTarget | null>;
  personalization: PersonalizationSettings;
  setPersonalization: StateSetter<PersonalizationSettings>;
  editRequest: { id: string; nonce: number } | null;
  setEditRequest: StateSetter<{ id: string; nonce: number } | null>;
  todayFocusRequest: { id: string; nonce: number } | null;
  setTodayFocusRequest: StateSetter<{ id: string; nonce: number } | null>;
  themeOverrides: Record<string, ThemeOpacityOverride>;
  setThemeOverrides: StateSetter<Record<string, ThemeOpacityOverride>>;
  personalizationReady: boolean;
  setPersonalizationReady: StateSetter<boolean>;
  companionOpen: boolean;
  setCompanionOpen: StateSetter<boolean>;
  companionSettings: CompanionSettings;
  setCompanionSettingsState: StateSetter<CompanionSettings>;
  companionPlan: SyncPlan | null;
  setCompanionPlan: StateSetter<SyncPlan | null>;
  companionStatus: string;
  setCompanionStatus: StateSetter<string>;
  mobileCaptureItems: CaptureItem[];
  setMobileCaptureItems: StateSetter<CaptureItem[]>;
  obsidianTemplates: ObsidianTemplateSettings;
  setObsidianTemplatesState: StateSetter<ObsidianTemplateSettings>;
  settingsSyncPreview: SyncPreview | null;
  setSettingsSyncPreview: StateSetter<SyncPreview | null>;
}

export function useAppLocalState(): AppLocalState {
  const [isDailyWorkOpen, setIsDailyWorkOpen] = useState(false);
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingTemplateKind, setEditingTemplateKind] = useState<AppTemplateKind | null>(null);
  const [aiOnboarding, setAiOnboarding] = useState<AiReviewSettings | null>(null);
  const [completionTask, setCompletionTask] = useState<Task | null>(null);
  const [reviewTask, setReviewTask] = useState<Task | null>(null);
  const [completionTarget, setCompletionTarget] = useState<CompletionTarget | null>(null);
  const [personalization, setPersonalization] = useState<PersonalizationSettings>(DEFAULT_PERSONALIZATION);
  const [editRequest, setEditRequest] = useState<{ id: string; nonce: number } | null>(null);
  const [todayFocusRequest, setTodayFocusRequest] = useState<{ id: string; nonce: number } | null>(null);
  const [themeOverrides, setThemeOverrides] = useState<Record<string, ThemeOpacityOverride>>({});
  const [personalizationReady, setPersonalizationReady] = useState(false);
  const [companionOpen, setCompanionOpen] = useState(false);
  const [companionSettings, setCompanionSettingsState] = useState(createDefaultCompanionSettings());
  const [companionPlan, setCompanionPlan] = useState<SyncPlan | null>(null);
  const [companionStatus, setCompanionStatus] = useState('');
  const [mobileCaptureItems, setMobileCaptureItems] = useState<CaptureItem[]>([]);
  const [obsidianTemplates, setObsidianTemplatesState] = useState<ObsidianTemplateSettings>(createDefaultObsidianTemplateSettings());
  const [settingsSyncPreview, setSettingsSyncPreview] = useState<SyncPreview | null>(null);

  return {
    isDailyWorkOpen, setIsDailyWorkOpen, isInspirationOpen, setIsInspirationOpen,
    compactMode, setCompactMode, searchQuery, setSearchQuery, searchOpen, setSearchOpen,
    showOpenOnly, setShowOpenOnly, priorityFilter, setPriorityFilter, settingsOpen, setSettingsOpen,
    editingTemplateKind, setEditingTemplateKind, aiOnboarding, setAiOnboarding,
    completionTask, setCompletionTask, reviewTask, setReviewTask, completionTarget, setCompletionTarget,
    personalization, setPersonalization, editRequest, setEditRequest, todayFocusRequest, setTodayFocusRequest, themeOverrides, setThemeOverrides,
    personalizationReady, setPersonalizationReady, companionOpen, setCompanionOpen,
    companionSettings, setCompanionSettingsState, companionPlan, setCompanionPlan,
    companionStatus, setCompanionStatus, mobileCaptureItems, setMobileCaptureItems,
    obsidianTemplates, setObsidianTemplatesState, settingsSyncPreview, setSettingsSyncPreview,
  };
}
