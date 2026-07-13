import {
  createDefaultDailyTemplate,
  createDefaultReportTemplate,
  normalizeDailyTemplate,
  normalizeReportTemplate,
} from './aiReview/sectionConfig';
import type { DailyTemplate, ReportTemplate } from './aiReview/sectionConfig';
import { migrateLegacyDailyMarkdownTemplate } from './obsidianTemplateSettingsDailyMigration';
import { areSettingValuesEqual } from './obsidianTemplateSettingsEquality';
import { resolveStoredPath, resolveStoredReportPath } from './obsidianTemplateSettingsPathMigration';
import { isObjectRecord } from './unknownValueGuards';

export interface ObsidianTemplateSettings {
  obsidianPath: string;
  dailyPath: string;
  weeklyPath: string;
  monthlyPath: string;
  externalWeeklyPath: string;
  externalMonthlyPath: string;
  dailyTemplate: DailyTemplate;
  weeklyTemplate: ReportTemplate;
  monthlyTemplate: ReportTemplate;
  externalWeeklyTemplate: ReportTemplate;
  externalMonthlyTemplate: ReportTemplate;
  syncDeletedReviewsToObsidian: boolean;
  confirmBeforeDeletingReview: boolean;
}

export function createDefaultObsidianTemplateSettings(): ObsidianTemplateSettings {
  return {
    obsidianPath: '',
    dailyPath: 'logs/daily/DailyTodo/{{date}}.md',
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

export function areObsidianTemplateSettingsEqual(
  left: ObsidianTemplateSettings,
  right: ObsidianTemplateSettings,
): boolean {
  return areSettingValuesEqual(left, right);
}

export function normalizeObsidianTemplateSettings(value: unknown): ObsidianTemplateSettings {
  const defaults = createDefaultObsidianTemplateSettings();
  if (!isObjectRecord(value)) return defaults;

  const dailyPath = resolveStoredPath(value, 'dailyPath', defaults.dailyPath, 'dailyNotePath');
  const weeklyPath = resolveStoredReportPath(value, 'weeklyPath', 'weeklyDir', 'weekly', 'personal');
  const monthlyPath = resolveStoredReportPath(value, 'monthlyPath', 'monthlyDir', 'monthly', 'personal');
  const externalWeeklyPath = resolveStoredReportPath(value, 'externalWeeklyPath', 'externalWeeklyDir', 'weekly', 'external');
  const externalMonthlyPath = resolveStoredReportPath(
    value,
    'externalMonthlyPath',
    'externalMonthlyDir',
    'monthly',
    'external',
  );

  const dailyTemplate = value.dailyTemplate
    ? normalizeDailyTemplate(value.dailyTemplate)
    : typeof value.dailyMarkdownTemplate === 'string'
      ? migrateLegacyDailyMarkdownTemplate(value.dailyMarkdownTemplate)
      : defaults.dailyTemplate;

  return {
    obsidianPath: resolveStoredPath(value, 'obsidianPath', ''),
    dailyPath,
    weeklyPath,
    monthlyPath,
    externalWeeklyPath,
    externalMonthlyPath,
    dailyTemplate,
    weeklyTemplate: value.weeklyTemplate
      ? normalizeReportTemplate(value.weeklyTemplate, 'personalWeekly')
      : defaults.weeklyTemplate,
    monthlyTemplate: value.monthlyTemplate
      ? normalizeReportTemplate(value.monthlyTemplate, 'personalMonthly')
      : defaults.monthlyTemplate,
    externalWeeklyTemplate: value.externalWeeklyTemplate
      ? normalizeReportTemplate(value.externalWeeklyTemplate, 'externalWeekly')
      : defaults.externalWeeklyTemplate,
    externalMonthlyTemplate: value.externalMonthlyTemplate
      ? normalizeReportTemplate(value.externalMonthlyTemplate, 'externalMonthly')
      : defaults.externalMonthlyTemplate,
    syncDeletedReviewsToObsidian: typeof value.syncDeletedReviewsToObsidian === 'boolean'
      ? value.syncDeletedReviewsToObsidian
      : true,
    confirmBeforeDeletingReview: typeof value.confirmBeforeDeletingReview === 'boolean'
      ? value.confirmBeforeDeletingReview
      : true,
  };
}
