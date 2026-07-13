import {
  createDefaultObsidianTemplateSettings,
  type ObsidianTemplateSettings,
} from './obsidianTemplateSettings';
import { isScheduleTime } from './aiReview/scheduleTimeParsing';
import { isObjectRecord } from './unknownValueGuards';

export {
  areObsidianTemplateSettingsEqual,
  createDefaultObsidianTemplateSettings,
  normalizeObsidianTemplateSettings,
  type ObsidianTemplateSettings,
} from './obsidianTemplateSettings';

export type AppLanguage = 'zh-CN' | 'en-US';

export interface AppBehaviorSettings {
  language: AppLanguage;
  rolloverTime: string;
  autoCarryForward: boolean;
  syncDeletedReviewsToObsidian: boolean;
  confirmBeforeDeletingReview: boolean;
  mainTaskCompletionReviewEnabled: boolean;
  subtaskCompletionReviewEnabled: boolean;
  lockWindowPosition: boolean;
  minimizeToTrayOnClose: boolean;
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
    syncDeletedReviewsToObsidian: true,
    confirmBeforeDeletingReview: false,
    mainTaskCompletionReviewEnabled: true,
    subtaskCompletionReviewEnabled: true,
    lockWindowPosition: false,
    minimizeToTrayOnClose: true,
  };
}

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === 'zh-CN' || value === 'en-US';
}

export function normalizeAppSettings(value: unknown): AppBehaviorSettings {
  const defaults = createDefaultAppSettings();
  if (!isObjectRecord(value)) return defaults;

  return {
    language: isAppLanguage(value.language) ? value.language : defaults.language,
    rolloverTime: isScheduleTime(value.rolloverTime) ? value.rolloverTime : defaults.rolloverTime,
    autoCarryForward: typeof value.autoCarryForward === 'boolean' ? value.autoCarryForward : defaults.autoCarryForward,
    syncDeletedReviewsToObsidian:
      typeof value.syncDeletedReviewsToObsidian === 'boolean'
        ? value.syncDeletedReviewsToObsidian
        : defaults.syncDeletedReviewsToObsidian,
    confirmBeforeDeletingReview:
      typeof value.confirmBeforeDeletingReview === 'boolean'
        ? value.confirmBeforeDeletingReview
        : defaults.confirmBeforeDeletingReview,
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
  };
}

export function createDefaultDailyTodoSettings(): DailyTodoSettings {
  return {
    behavior: createDefaultAppSettings(),
    obsidianTemplates: createDefaultObsidianTemplateSettings(),
  };
}
