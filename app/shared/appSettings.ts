export type AppLanguage = 'zh-CN' | 'en-US';

export interface AppBehaviorSettings {
  language: AppLanguage;
  rolloverTime: string;
  autoCarryForward: boolean;
  syncDeletedReviewsToObsidian: boolean;
  confirmBeforeDeletingReview: boolean;
  lockWindowPosition: boolean;
}

export interface ObsidianTemplateSettings {
  dailyNotePath: string;
  taskExportPath: string;
  workSectionTitle: string;
  inspirationSectionTitle: string;
  taskSectionTitle: string;
  reviewSectionTitle: string;
  tomorrowTaskSectionTitle: string;
  reusableKnowledgeSectionTitle: string;
  taskLineTemplate: string;
  completionReviewTemplate: string;
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
    lockWindowPosition: false,
  };
}

export function createDefaultObsidianTemplateSettings(): ObsidianTemplateSettings {
  return {
    dailyNotePath: 'logs/daily/DailyTodo/{{date}}.md',
    taskExportPath: 'logs/daily/DailyTodo/tasks/{{date}}.md',
    workSectionTitle: '今日工作',
    inspirationSectionTitle: '灵感闪念',
    taskSectionTitle: '每日任务',
    reviewSectionTitle: '复盘',
    tomorrowTaskSectionTitle: '明日待办',
    reusableKnowledgeSectionTitle: '可复用知识',
    taskLineTemplate: '- [{{checked}}] {{text}} #{{priority}}{{dateNote}}',
    completionReviewTemplate: [
      '  - 阶段记录 {{index}}：{{status}}，完成度 {{percent}}%，记录时间 {{reviewedAt}}',
      '    - 今天情况：{{summary}}',
      '    - 还没懂/卡点：{{unknowns}}',
      '    - 下一步：{{nextStep}}',
    ].join('\n'),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isLanguage(value: unknown): value is AppLanguage {
  return value === 'zh-CN' || value === 'en-US';
}

function isTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function normalizeAppSettings(value: unknown): AppBehaviorSettings {
  const defaults = createDefaultAppSettings();
  if (!isObject(value)) return defaults;

  return {
    language: isLanguage(value.language) ? value.language : defaults.language,
    rolloverTime: isTime(value.rolloverTime) ? value.rolloverTime : defaults.rolloverTime,
    autoCarryForward: typeof value.autoCarryForward === 'boolean' ? value.autoCarryForward : defaults.autoCarryForward,
    syncDeletedReviewsToObsidian:
      typeof value.syncDeletedReviewsToObsidian === 'boolean'
        ? value.syncDeletedReviewsToObsidian
        : defaults.syncDeletedReviewsToObsidian,
    confirmBeforeDeletingReview:
      typeof value.confirmBeforeDeletingReview === 'boolean'
        ? value.confirmBeforeDeletingReview
        : defaults.confirmBeforeDeletingReview,
    lockWindowPosition:
      typeof value.lockWindowPosition === 'boolean' ? value.lockWindowPosition : defaults.lockWindowPosition,
  };
}

export function normalizeObsidianTemplateSettings(value: unknown): ObsidianTemplateSettings {
  const defaults = createDefaultObsidianTemplateSettings();
  if (!isObject(value)) return defaults;

  return {
    dailyNotePath: text(value.dailyNotePath, defaults.dailyNotePath),
    taskExportPath: text(value.taskExportPath, defaults.taskExportPath),
    workSectionTitle: text(value.workSectionTitle, defaults.workSectionTitle),
    inspirationSectionTitle: text(value.inspirationSectionTitle, defaults.inspirationSectionTitle),
    taskSectionTitle: text(value.taskSectionTitle, defaults.taskSectionTitle),
    reviewSectionTitle: text(value.reviewSectionTitle, defaults.reviewSectionTitle),
    tomorrowTaskSectionTitle: text(value.tomorrowTaskSectionTitle, defaults.tomorrowTaskSectionTitle),
    reusableKnowledgeSectionTitle: text(value.reusableKnowledgeSectionTitle, defaults.reusableKnowledgeSectionTitle),
    taskLineTemplate: text(value.taskLineTemplate, defaults.taskLineTemplate),
    completionReviewTemplate: text(value.completionReviewTemplate, defaults.completionReviewTemplate),
  };
}

export function createDefaultDailyTodoSettings(): DailyTodoSettings {
  return {
    behavior: createDefaultAppSettings(),
    obsidianTemplates: createDefaultObsidianTemplateSettings(),
  };
}
