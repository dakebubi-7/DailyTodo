import { ipcMain } from 'electron';
import { resolveActiveProfile, type AiReviewSettings } from '../shared/aiReview/aiReviewSettings';
import type { ObsidianTemplateSettings } from '../shared/appSettings';
import {
  DEFAULT_EXTERNAL_MONTHLY_SYSTEM,
  DEFAULT_EXTERNAL_WEEKLY_SYSTEM,
} from '../shared/aiReview/defaultPrompts';
import { buildMonthlyMessages, monthKey } from '../shared/aiReview/monthly';
import {
  NO_SOURCE_MATERIALS_ERROR,
  collectDailySourcesForDates,
  collectMonthlySources,
  hasSourceMaterials,
  type DailySourceRule,
} from '../shared/aiReview/sourceMaterials';
import { isoWeekKey } from '../shared/aiReview/weekly';
import { dateKeyToLocalDate, expandPathTemplate } from '../shared/pathTemplate';
import type { ChatMessage, LlmResult } from '../shared/llm/openaiClient';
import { generateExternalReport } from './aiReview/exportReports';
import { getMonthDates, getWeekDates } from './aiReviewIpcHelpers';
import { AI_REVIEW_DISABLED_ERROR } from './aiReviewIpcMessages';
import { AI_REVIEW_REPORT_KIND_ERROR, isAiReviewReportKind } from './aiReviewReportKind';
import type { VaultStatus } from './sharedTypes';

export type RegisterAiReviewExternalReportIpcHandlersOptions = {
  getAiReviewSettings(): AiReviewSettings;
  getObsidianTemplateSettings(): ObsidianTemplateSettings;
  getVaultStatus(): VaultStatus;
  getDateKey(date?: unknown): string;
  getDailySourceRules(): DailySourceRule[];
  getLlmCaller(): (messages: ChatMessage[]) => Promise<LlmResult>;
};

export function registerAiReviewExternalReportIpcHandlers({
  getAiReviewSettings,
  getObsidianTemplateSettings,
  getVaultStatus,
  getDateKey,
  getDailySourceRules,
  getLlmCaller,
}: RegisterAiReviewExternalReportIpcHandlersOptions): void {
  ipcMain.handle('aiReview:generateExternal', async (_event, kind: unknown, date: unknown) => {
    if (!isAiReviewReportKind(kind)) {
      return { ok: false, error: AI_REVIEW_REPORT_KIND_ERROR };
    }
    const settings = getAiReviewSettings();
    const templateSettings = getObsidianTemplateSettings();
    if (!settings.enabled || !resolveActiveProfile(settings).apiKey) {
      return { ok: false, error: AI_REVIEW_DISABLED_ERROR };
    }

    const vaultStatus = getVaultStatus();
    if (!vaultStatus.ok || !vaultStatus.vaultPath) {
      return { ok: false, error: vaultStatus.reason };
    }

    const selected = getDateKey(date);
    let periodKey: string;
    let dates: string[];
    let rawDailyContents: string[];
    if (kind === 'weekly') {
      const week = getWeekDates(selected);
      dates = week.dates;
      periodKey = isoWeekKey(selected);
      rawDailyContents =
        settings.externalWeeklySourceMode === 'manual-files'
          ? []
          : collectDailySourcesForDates({
            vaultPath: vaultStatus.vaultPath,
            dates,
            rules: getDailySourceRules(),
          }).map((source) => source.content);
    } else {
      const month = monthKey(selected);
      const monthDates = getMonthDates(month);
      dates = monthDates.dates;
      periodKey = month;
      rawDailyContents = collectMonthlySources({
        vaultPath: vaultStatus.vaultPath,
        month,
        weeklyPathTemplate: templateSettings.weeklyPath,
        dailyRules: getDailySourceRules(),
        mode: settings.externalMonthlySourceMode,
      }).map((source) => source.content);
    }

    if (!hasSourceMaterials(rawDailyContents.map((content) => ({ content })))) {
      return { ok: false, error: NO_SOURCE_MATERIALS_ERROR.zh };
    }

    const externalPath = kind === 'weekly'
      ? templateSettings.externalWeeklyPath
      : templateSettings.externalMonthlyPath;
    const reportTemplate = kind === 'weekly'
      ? templateSettings.externalWeeklyTemplate
      : templateSettings.externalMonthlyTemplate;
    const externalPrompt = kind === 'weekly' ? settings.externalWeeklyPrompt : settings.externalMonthlyPrompt;
    const externalDefault = kind === 'weekly' ? DEFAULT_EXTERNAL_WEEKLY_SYSTEM : DEFAULT_EXTERNAL_MONTHLY_SYSTEM;
    return generateExternalReport({
      vaultPath: vaultStatus.vaultPath,
      kind,
      periodKey,
      relativeFilePath: expandPathTemplate(externalPath, dateKeyToLocalDate(selected)),
      reportTemplate,
      rawDailyContents,
      buildMessages: (redacted) =>
        buildMonthlyMessages({
          month: periodKey,
          sources: [{ label: periodKey, content: redacted }],
          stats: {
            start: dates[0],
            end: dates[dates.length - 1],
            activeDays: 0,
            totalCompleted: 0,
            totalTasks: 0,
            streak: 0,
          },
          systemPrompt: externalPrompt?.trim() || externalDefault,
        }),
      callLlm: getLlmCaller(),
    });
  });
}
