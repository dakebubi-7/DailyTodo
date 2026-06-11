import {
  DEFAULT_COMPLETION_REVIEW_TEMPLATE,
  DEFAULT_TASK_LINE_TEMPLATE,
  createDefaultModules,
  normalizeTemplateModules,
  normalizeTemplatePresetId,
  syncTemplateTitlesFromModules,
} from './obsidianTemplateCenter';
import type { ObsidianTemplateModules, ObsidianTemplatePresetId } from './obsidianTemplateCenter';

export type {
  ObsidianTemplateModuleId,
  ObsidianTemplateModuleSettings,
  ObsidianTemplateModules,
  ObsidianTemplatePreset,
  ObsidianTemplatePresetId,
} from './obsidianTemplateCenter';
export {
  DEFAULT_COMPLETION_REVIEW_TEMPLATE,
  DEFAULT_TASK_LINE_TEMPLATE,
  OBSIDIAN_TEMPLATE_MODULE_IDS,
  OBSIDIAN_TEMPLATE_MODULE_LABELS,
  OBSIDIAN_TEMPLATE_PRESETS,
  applyObsidianTemplatePreset,
  createDefaultModules,
  getObsidianTemplatePreset,
  moduleTitleKey,
  normalizeTemplateModules,
  normalizeTemplatePresetId,
  syncTemplateTitlesFromModules,
  updateAdvancedTemplateField,
  updateTemplateModule,
} from './obsidianTemplateCenter';

export type AppLanguage = 'zh-CN' | 'en-US';

export interface AppBehaviorSettings {
  language: AppLanguage;
  rolloverTime: string;
  autoCarryForward: boolean;
  syncDeletedReviewsToObsidian: boolean;
  confirmBeforeDeletingReview: boolean;
  lockWindowPosition: boolean;
}

export interface DailySourceRule {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
}

export interface ObsidianTemplateSettings {
  dailyNotePath: string;
  taskExportPath: string;
  dailyMarkdownTemplate: string;
  dailySourceRules: DailySourceRule[];
  presetId: ObsidianTemplatePresetId;
  modules: ObsidianTemplateModules;
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

export const DEFAULT_DAILY_MARKDOWN_TEMPLATE = `---
类型: 日报
日期: {{date}}
标签:
  - 日报
---

# DailyTodo · {{date}}

## 今日工作
{{work}}

## 灵感随笔
{{inspiration}}

## 每日任务
{{tasks}}

## 复盘
{{review}}

## 明日待办
{{tomorrow}}

## 可复用知识
{{knowledge}}
`;

export function createDefaultDailySourceRules(dailyNotePath = 'logs/daily/DailyTodo/{{date}}.md'): DailySourceRule[] {
  return [{ id: 'daily-note-path', label: '每日记录文件位置', path: dailyNotePath, enabled: true }];
}

export function createDefaultObsidianTemplateSettings(): ObsidianTemplateSettings {
  const dailyNotePath = 'logs/daily/DailyTodo/{{date}}.md';
  return syncTemplateTitlesFromModules({
    dailyNotePath,
    taskExportPath: 'logs/daily/DailyTodo/tasks/{{date}}.md',
    dailyMarkdownTemplate: DEFAULT_DAILY_MARKDOWN_TEMPLATE,
    dailySourceRules: createDefaultDailySourceRules(dailyNotePath),
    presetId: 'simple',
    modules: createDefaultModules(),
    workSectionTitle: '今日工作',
    inspirationSectionTitle: '灵感闪念',
    taskSectionTitle: '每日任务',
    reviewSectionTitle: '复盘',
    tomorrowTaskSectionTitle: '明日待办',
    reusableKnowledgeSectionTitle: '可复用知识',
    taskLineTemplate: DEFAULT_TASK_LINE_TEMPLATE,
    completionReviewTemplate: DEFAULT_COMPLETION_REVIEW_TEMPLATE,
  });
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

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined;
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

function normalizeDailySourceRules(value: unknown, dailyNotePath: string): DailySourceRule[] {
  if (!Array.isArray(value)) return createDefaultDailySourceRules(dailyNotePath);
  const rules = value
    .filter(isObject)
    .map((rule, index) => ({
      id: text(rule.id, `daily-source-${index + 1}`),
      label: text(rule.label, `素材规则 ${index + 1}`),
      path: text(rule.path, dailyNotePath),
      enabled: typeof rule.enabled === 'boolean' ? rule.enabled : true,
    }))
    .filter((rule) => rule.path.trim());
  return rules.length ? rules : createDefaultDailySourceRules(dailyNotePath);
}

export function normalizeObsidianTemplateSettings(value: unknown): ObsidianTemplateSettings {
  const defaults = createDefaultObsidianTemplateSettings();
  if (!isObject(value)) return defaults;

  const legacyTitles = {
    work: optionalText(value.workSectionTitle),
    inspiration: optionalText(value.inspirationSectionTitle),
    tasks: optionalText(value.taskSectionTitle),
    review: optionalText(value.reviewSectionTitle),
    tomorrow: optionalText(value.tomorrowTaskSectionTitle),
    knowledge: optionalText(value.reusableKnowledgeSectionTitle),
  };
  const modules = normalizeTemplateModules(value.modules, legacyTitles);
  const dailyNotePath = text(value.dailyNotePath, defaults.dailyNotePath);

  return syncTemplateTitlesFromModules({
    dailyNotePath,
    taskExportPath: text(value.taskExportPath, defaults.taskExportPath),
    dailyMarkdownTemplate: text(value.dailyMarkdownTemplate, defaults.dailyMarkdownTemplate),
    dailySourceRules: normalizeDailySourceRules(value.dailySourceRules, dailyNotePath),
    presetId: normalizeTemplatePresetId(value.presetId),
    modules,
    workSectionTitle: modules.work.title,
    inspirationSectionTitle: modules.inspiration.title,
    taskSectionTitle: modules.tasks.title,
    reviewSectionTitle: modules.review.title,
    tomorrowTaskSectionTitle: modules.tomorrow.title,
    reusableKnowledgeSectionTitle: modules.knowledge.title,
    taskLineTemplate: text(value.taskLineTemplate, defaults.taskLineTemplate),
    completionReviewTemplate: text(value.completionReviewTemplate, defaults.completionReviewTemplate),
  });
}

export function createDefaultDailyTodoSettings(): DailyTodoSettings {
  return {
    behavior: createDefaultAppSettings(),
    obsidianTemplates: createDefaultObsidianTemplateSettings(),
  };
}
