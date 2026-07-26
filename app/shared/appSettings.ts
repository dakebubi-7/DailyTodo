import {
  createDefaultObsidianTemplateSettings,
  type ObsidianTemplateSettings,
} from './obsidianTemplateSettings';
import {
  createDefaultInputKeybindingSettings,
  isInputKeybindingPreset,
  normalizeInputKeybindingSettings,
  type InputKeybindingSettings,
} from './inputKeybindings';
import { isScheduleTime } from './aiReview/scheduleTimeParsing';
import { isDateKey } from './taskRollover';
import { isObjectRecord } from './unknownValueGuards';

export {
  areObsidianTemplateSettingsEqual,
  createDefaultObsidianTemplateSettings,
  normalizeObsidianTemplateSettings,
  type ObsidianTemplateSettings,
} from './obsidianTemplateSettings';

export type AppLanguage = 'zh-CN' | 'en-US';

export type TaskHistoryRange = 'two-months' | 'three-months' | 'six-months' | 'all' | 'custom';

export interface AppBehaviorSettings {
  language: AppLanguage;
  rolloverTime: string;
  autoCarryForward: boolean;
  confirmBeforeDeletingReview: boolean;
  taskHistoryRange: TaskHistoryRange;
  taskHistoryStartDate?: string;
  mainTaskCompletionReviewEnabled: boolean;
  subtaskCompletionReviewEnabled: boolean;
  lockWindowPosition: boolean;
  minimizeToTrayOnClose: boolean;
  edgeAutoHide: boolean;
  inputKeybindings: InputKeybindingSettings;
}

export interface DailyTodoSettings {
  behavior: AppBehaviorSettings;
  obsidianTemplates: ObsidianTemplateSettings;
}

export const APP_SETTINGS_KEY = 'appBehaviorSettings';
export const OBSIDIAN_TEMPLATE_SETTINGS_KEY = 'obsidianTemplateSettings';

export function createDefaultAppSettings(): AppBehaviorSettings {
  return {
    language: 'zh-CN',
    rolloverTime: '05:00',
    autoCarryForward: true,
    confirmBeforeDeletingReview: false,
    taskHistoryRange: 'three-months',
    taskHistoryStartDate: undefined,
    mainTaskCompletionReviewEnabled: true,
    subtaskCompletionReviewEnabled: true,
    lockWindowPosition: false,
    minimizeToTrayOnClose: true,
    edgeAutoHide: true,
    inputKeybindings: createDefaultInputKeybindingSettings(),
  };
}

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === 'zh-CN' || value === 'en-US';
}

export function isTaskHistoryRange(value: unknown): value is TaskHistoryRange {
  return value === 'two-months'
    || value === 'three-months'
    || value === 'six-months'
    || value === 'all'
    || value === 'custom';
}

export function normalizeAppSettings(value: unknown): AppBehaviorSettings {
  const defaults = createDefaultAppSettings();
  if (!isObjectRecord(value)) return defaults;

  return {
    language: isAppLanguage(value.language) ? value.language : defaults.language,
    rolloverTime: isScheduleTime(value.rolloverTime) ? value.rolloverTime : defaults.rolloverTime,
    autoCarryForward: typeof value.autoCarryForward === 'boolean' ? value.autoCarryForward : defaults.autoCarryForward,
    confirmBeforeDeletingReview:
      typeof value.confirmBeforeDeletingReview === 'boolean'
        ? value.confirmBeforeDeletingReview
        : defaults.confirmBeforeDeletingReview,
    taskHistoryRange: isTaskHistoryRange(value.taskHistoryRange)
      ? value.taskHistoryRange
      : defaults.taskHistoryRange,
    taskHistoryStartDate: isDateKey(value.taskHistoryStartDate) ? value.taskHistoryStartDate : undefined,
    mainTaskCompletionReviewEnabled:
      typeof value.mainTaskCompletionReviewEnabled === 'boolean'
        ? value.mainTaskCompletionReviewEnabled
        : defaults.mainTaskCompletionReviewEnabled,
    subtaskCompletionReviewEnabled:
      typeof value.subtaskCompletionReviewEnabled === 'boolean'
        ? value.subtaskCompletionReviewEnabled
        : defaults.subtaskCompletionReviewEnabled,
    lockWindowPosition:
      typeof value.lockWindowPosition === 'boolean' ? value.lockWindowPosition : defaults.lockWindowPosition,
    minimizeToTrayOnClose:
      typeof value.minimizeToTrayOnClose === 'boolean' ? value.minimizeToTrayOnClose : defaults.minimizeToTrayOnClose,
    edgeAutoHide: typeof value.edgeAutoHide === 'boolean' ? value.edgeAutoHide : defaults.edgeAutoHide,
    inputKeybindings: value.inputKeybindings !== undefined
      ? normalizeInputKeybindingSettings(value.inputKeybindings)
      : isInputKeybindingPreset(value.inputKeyboardMode)
        ? { preset: value.inputKeyboardMode, overrides: {} }
        : defaults.inputKeybindings,
  };
}

export function createDefaultDailyTodoSettings(): DailyTodoSettings {
  return {
    behavior: createDefaultAppSettings(),
    obsidianTemplates: createDefaultObsidianTemplateSettings(),
  };
}
