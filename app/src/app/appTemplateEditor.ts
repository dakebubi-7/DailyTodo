import type { ObsidianTemplateSettings } from '../../shared/appSettings';
import type { DailyTemplate, ReportTemplate } from '../../shared/aiReview/sectionConfig';
import {
  createDefaultDailyTemplate,
  createDefaultReportTemplate,
} from '../../shared/aiReview/sectionConfig';

export type AppTemplateKind =
  | 'daily'
  | 'personalWeekly'
  | 'personalMonthly'
  | 'externalWeekly'
  | 'externalMonthly';

export type AppReportTemplateKind = Exclude<AppTemplateKind, 'daily'>;

export type TemplateFieldName =
  | 'dailyTemplate'
  | 'weeklyTemplate'
  | 'monthlyTemplate'
  | 'externalWeeklyTemplate'
  | 'externalMonthlyTemplate';

export function getTemplateFieldForKind(kind: AppTemplateKind): TemplateFieldName {
  if (kind === 'daily') return 'dailyTemplate';
  if (kind === 'personalWeekly') return 'weeklyTemplate';
  if (kind === 'personalMonthly') return 'monthlyTemplate';
  if (kind === 'externalWeekly') return 'externalWeeklyTemplate';
  return 'externalMonthlyTemplate';
}

function isDailyTemplate(template: DailyTemplate | ReportTemplate): template is DailyTemplate {
  return 'fixedBlocks' in template;
}

export function getInitialTemplateForKind(
  kind: AppTemplateKind,
  obsidianTemplates: ObsidianTemplateSettings,
): DailyTemplate | ReportTemplate {
  if (kind === 'daily') return obsidianTemplates.dailyTemplate ?? createDefaultDailyTemplate();
  if (kind === 'personalWeekly') return obsidianTemplates.weeklyTemplate ?? createDefaultReportTemplate('personalWeekly');
  if (kind === 'personalMonthly') return obsidianTemplates.monthlyTemplate ?? createDefaultReportTemplate('personalMonthly');
  if (kind === 'externalWeekly') return obsidianTemplates.externalWeeklyTemplate ?? createDefaultReportTemplate('externalWeekly');
  return obsidianTemplates.externalMonthlyTemplate ?? createDefaultReportTemplate('externalMonthly');
}

export function applyTemplateUpdate(
  obsidianTemplates: ObsidianTemplateSettings,
  kind: AppTemplateKind,
  template: DailyTemplate | ReportTemplate,
): ObsidianTemplateSettings {
  if (kind === 'daily') {
    if (!isDailyTemplate(template)) return obsidianTemplates;
    return { ...obsidianTemplates, dailyTemplate: template };
  }
  if (isDailyTemplate(template)) return obsidianTemplates;
  if (kind === 'personalWeekly') {
    return { ...obsidianTemplates, weeklyTemplate: template };
  }
  if (kind === 'personalMonthly') {
    return { ...obsidianTemplates, monthlyTemplate: template };
  }
  if (kind === 'externalWeekly') {
    return { ...obsidianTemplates, externalWeeklyTemplate: template };
  }
  return { ...obsidianTemplates, externalMonthlyTemplate: template };
}
