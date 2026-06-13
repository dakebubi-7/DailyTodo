import {
  createDailyBlockOrder,
  createDefaultDailyTemplate,
  createDefaultReportTemplate,
  normalizeDailyTemplate,
  normalizeReportTemplate,
} from './aiReview/sectionConfig';
import type { DailyBlockOrderItem, DailyTemplate, FixedBlockId, ReportTemplate } from './aiReview/sectionConfig';

export type AppLanguage = 'zh-CN' | 'en-US';

export interface AppBehaviorSettings {
  language: AppLanguage;
  rolloverTime: string;
  autoCarryForward: boolean;
  syncDeletedReviewsToObsidian: boolean;
  confirmBeforeDeletingReview: boolean;
  lockWindowPosition: boolean;
  minimizeToTrayOnClose: boolean;
}

export interface ObsidianTemplateSettings {
  obsidianPath: string;

  // 5 paths (one per template kind)
  dailyPath: string;
  weeklyPath: string;
  monthlyPath: string;
  externalWeeklyPath: string;
  externalMonthlyPath: string;

  // 5 structured templates
  dailyTemplate: DailyTemplate;
  weeklyTemplate: ReportTemplate;
  monthlyTemplate: ReportTemplate;
  externalWeeklyTemplate: ReportTemplate;
  externalMonthlyTemplate: ReportTemplate;

  // Behavior flags
  syncDeletedReviewsToObsidian: boolean;
  confirmBeforeDeletingReview: boolean;
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
    minimizeToTrayOnClose: true,
  };
}

export function createDefaultObsidianTemplateSettings(): ObsidianTemplateSettings {
  return {
    obsidianPath: '',
    dailyPath: 'logs/daily/{{date}}.md',
    weeklyPath: 'logs/weekly/personal/{{year}}-W{{week}}.md',
    monthlyPath: 'logs/monthly/personal/{{year}}-{{month}}.md',
    externalWeeklyPath: 'logs/weekly/external/{{year}}-W{{week}}.md',
    externalMonthlyPath: 'logs/monthly/external/{{year}}-{{month}}.md',
    dailyTemplate: createDefaultDailyTemplate(),
    weeklyTemplate: createDefaultReportTemplate('personalWeekly'),
    monthlyTemplate: createDefaultReportTemplate('personalMonthly'),
    externalWeeklyTemplate: createDefaultReportTemplate('externalWeekly'),
    externalMonthlyTemplate: createDefaultReportTemplate('externalMonthly'),
    syncDeletedReviewsToObsidian: true,
    confirmBeforeDeletingReview: true,
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
    minimizeToTrayOnClose:
      typeof value.minimizeToTrayOnClose === 'boolean' ? value.minimizeToTrayOnClose : defaults.minimizeToTrayOnClose,
  };
}

function migrateReportDir(
  old: unknown,
  kind: 'weekly' | 'monthly',
  audience: 'personal' | 'external'
): string {
  const tmpl = '{{year}}-W{{week}}.md';
  const fallback = `logs/${kind}/${audience}/${tmpl}`;
  if (typeof old !== 'string' || !old) {
    return fallback;
  }
  // Old path might be a directory (no .md) or a full file path
  if (old.endsWith('.md')) {
    return old;
  }
  // Directory, append default filename
  return `${old.replace(/\/$/, '')}/${tmpl}`;
}

const TEMPLATE_CUSTOM_TOKENS = ['review', 'tomorrow', 'knowledge'] as const;
type TemplateCustomToken = (typeof TEMPLATE_CUSTOM_TOKENS)[number];

function isTemplateCustomToken(token: string): token is TemplateCustomToken {
  return (TEMPLATE_CUSTOM_TOKENS as readonly string[]).includes(token);
}

function migrateDailyMarkdownTemplate(old: string): DailyTemplate {
  const defaults = createDefaultDailyTemplate();
  if (!old || typeof old !== 'string' || !old.includes('{{')) {
    return defaults;
  }

  const fixedBlocks = defaults.fixedBlocks;
  const markerToDefault = new Map(defaults.customBlocks.map((block) => {
    if (/明日|待办|tomorrow/i.test(block.name)) return ['tomorrow', block] as const;
    if (/知识|knowledge/i.test(block.name)) return ['knowledge', block] as const;
    return ['review', block] as const;
  }));
  const customBlocks = defaults.customBlocks;
  const blockOrder: DailyBlockOrderItem[] = [];
  const usedFixed = new Set<FixedBlockId>();
  const usedCustom = new Set<string>();
  const tokenPattern = /\{\{\s*(work|inspire|inspiration|tasks|review|tomorrow|knowledge)\s*\}\}/gi;
  const fixedTokenMap: Record<string, FixedBlockId> = {
    work: 'work',
    inspire: 'inspire',
    inspiration: 'inspire',
    tasks: 'tasks',
  };

  for (const match of old.matchAll(tokenPattern)) {
    const token = match[1].toLowerCase();
    const fixedId = fixedTokenMap[token];
    if (fixedId) {
      if (!usedFixed.has(fixedId)) {
        usedFixed.add(fixedId);
        blockOrder.push({ type: 'fixed', id: fixedId });
      }
      continue;
    }

    if (!isTemplateCustomToken(token)) continue;
    const custom = markerToDefault.get(token);
    if (custom && !usedCustom.has(custom.id)) {
      usedCustom.add(custom.id);
      blockOrder.push({ type: 'custom', id: custom.id });
    }
  }

  return {
    fixedBlocks,
    customBlocks,
    blockOrder: blockOrder.length ? blockOrder : createDailyBlockOrder(fixedBlocks, customBlocks),
  };
}

export function normalizeObsidianTemplateSettings(value: unknown): ObsidianTemplateSettings {
  const defaults = createDefaultObsidianTemplateSettings();
  if (!value || typeof value !== 'object') return defaults;
  const v = value as Record<string, unknown>;

  // Path migration
  const dailyPath = typeof v.dailyPath === 'string'
    ? v.dailyPath
    : typeof v.dailyNotePath === 'string'
    ? v.dailyNotePath
    : defaults.dailyPath;

  const weeklyPath = typeof v.weeklyPath === 'string'
    ? v.weeklyPath
    : migrateReportDir(v.weeklyDir, 'weekly', 'personal');

  const monthlyPath = typeof v.monthlyPath === 'string'
    ? v.monthlyPath
    : migrateReportDir(v.monthlyDir, 'monthly', 'personal');

  const externalWeeklyPath = typeof v.externalWeeklyPath === 'string'
    ? v.externalWeeklyPath
    : migrateReportDir(v.externalWeeklyDir, 'weekly', 'external');

  const externalMonthlyPath = typeof v.externalMonthlyPath === 'string'
    ? v.externalMonthlyPath
    : migrateReportDir(v.externalMonthlyDir, 'monthly', 'external');

  // Template migration
  const dailyTemplate = v.dailyTemplate
    ? normalizeDailyTemplate(v.dailyTemplate)
    : typeof v.dailyMarkdownTemplate === 'string'
    ? migrateDailyMarkdownTemplate(v.dailyMarkdownTemplate)
    : defaults.dailyTemplate;

  const weeklyTemplate = v.weeklyTemplate
    ? normalizeReportTemplate(v.weeklyTemplate, 'personalWeekly')
    : defaults.weeklyTemplate;

  const monthlyTemplate = v.monthlyTemplate
    ? normalizeReportTemplate(v.monthlyTemplate, 'personalMonthly')
    : defaults.monthlyTemplate;

  const externalWeeklyTemplate = v.externalWeeklyTemplate
    ? normalizeReportTemplate(v.externalWeeklyTemplate, 'externalWeekly')
    : defaults.externalWeeklyTemplate;

  const externalMonthlyTemplate = v.externalMonthlyTemplate
    ? normalizeReportTemplate(v.externalMonthlyTemplate, 'externalMonthly')
    : defaults.externalMonthlyTemplate;

  return {
    obsidianPath: typeof v.obsidianPath === 'string' ? v.obsidianPath : '',
    dailyPath,
    weeklyPath,
    monthlyPath,
    externalWeeklyPath,
    externalMonthlyPath,
    dailyTemplate,
    weeklyTemplate,
    monthlyTemplate,
    externalWeeklyTemplate,
    externalMonthlyTemplate,
    syncDeletedReviewsToObsidian: typeof v.syncDeletedReviewsToObsidian === 'boolean' ? v.syncDeletedReviewsToObsidian : true,
    confirmBeforeDeletingReview: typeof v.confirmBeforeDeletingReview === 'boolean' ? v.confirmBeforeDeletingReview : true,
  };
}

export function createDefaultDailyTodoSettings(): DailyTodoSettings {
  return {
    behavior: createDefaultAppSettings(),
    obsidianTemplates: createDefaultObsidianTemplateSettings(),
  };
}
