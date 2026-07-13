import { ipcMain } from 'electron';
import { type AiReviewSettings } from '../shared/aiReview/aiReviewSettings';
import type { ObsidianTemplateSettings } from '../shared/appSettings';
import {
  type DailySourceRule,
} from '../shared/aiReview/sourceMaterials';
import { computeRangeStats } from '../shared/aiReview/stats';
import { isoWeekKey } from '../shared/aiReview/weekly';
import { dateKeyToLocalDate, expandPathTemplate } from '../shared/pathTemplate';
import { generatePersonalWeekly } from './aiReview/exportReports';
import {
  READ_WEEKLY_SOURCES_MESSAGE,
  RECEIVED_WEEKLY_REPORT_MESSAGE,
  WAIT_WEEKLY_REPORT_MESSAGE,
  WEEKLY_WRITTEN_MESSAGE,
} from './aiReviewIpcMessages';
import { executeReportGeneration } from './aiReviewReportIpcExecution';
import { collectWeeklyReportSources } from './aiReviewReportIpcSourceCollection';
import { startReportPreflight } from './aiReviewReportIpcPreflight';
import { prepareReportSources } from './aiReviewReportIpcSourcePreparation';
import type {
  AiReviewReportDiagnosticFactory,
  AiReviewReportLlmAvailableResult,
  AiReviewReportProgressEmitter,
  AiReviewReportStageFactory,
} from './aiReviewReportIpcTypes';
import { isAiReviewTaskArray } from './aiReviewTaskPayload';
import type { VaultStatus } from './sharedTypes';

export type RegisterAiReviewWeeklyReportIpcHandlersOptions = {
  getAiReviewSettings(): AiReviewSettings;
  getObsidianTemplateSettings(): ObsidianTemplateSettings;
  getVaultStatus(): VaultStatus;
  getDateKey(date?: unknown): string;
  getDailySourceRules(): DailySourceRule[];
  ensureReportLlmAvailable(reportKind: 'weekly'): AiReviewReportLlmAvailableResult;
  emitAiReviewProgress: AiReviewReportProgressEmitter<'weekly'>;
  stage: AiReviewReportStageFactory;
  createDiagnostic: AiReviewReportDiagnosticFactory<'weekly'>;
};

export function registerAiReviewWeeklyReportIpcHandlers({
  getAiReviewSettings,
  getObsidianTemplateSettings,
  getVaultStatus,
  getDateKey,
  getDailySourceRules,
  ensureReportLlmAvailable,
  emitAiReviewProgress,
  stage,
  createDiagnostic,
}: RegisterAiReviewWeeklyReportIpcHandlersOptions): void {
  ipcMain.handle('aiReview:generateWeekly', async (_event, date: unknown, tasks: unknown) => {
    if (!isAiReviewTaskArray(tasks)) {
      return { ok: false, error: 'AI Review tasks contain malformed entries.' };
    }
    const preflight = startReportPreflight({
      reportKind: 'weekly',
      prepareMessage: READ_WEEKLY_SOURCES_MESSAGE,
      getAiReviewSettings,
      ensureReportLlmAvailable,
      getVaultStatus,
      emitAiReviewProgress,
      stage,
      createDiagnostic,
    });
    if (!preflight.ok) {
      return preflight.result;
    }
    const { startedAt, settings, llm, vaultPath } = preflight;
    const templateSettings = getObsidianTemplateSettings();

    const { prepareStartedAt, selected, monday, weekDates, dailyContents } = collectWeeklyReportSources({
      date,
      vaultPath,
      weeklySourceMode: settings.weeklySourceMode,
      getDateKey,
      getDailySourceRules,
    });
    const sourcePreparation = prepareReportSources({
      reportKind: 'weekly',
      sources: dailyContents,
      startedAt,
      prepareStartedAt,
      resolution: llm.resolution,
      emitAiReviewProgress,
      stage,
      createDiagnostic,
    });
    if (!sourcePreparation.ok) {
      return sourcePreparation.result;
    }
    const { sourceChars, stages } = sourcePreparation;

    const stats = computeRangeStats(tasks, monday, weekDates[6]);
    return executeReportGeneration({
      reportKind: 'weekly',
      callLlm: llm.callLlm,
      emitAiReviewProgress,
      waitMessage: WAIT_WEEKLY_REPORT_MESSAGE,
      receivedMessage: RECEIVED_WEEKLY_REPORT_MESSAGE,
      writtenMessage: WEEKLY_WRITTEN_MESSAGE,
      startedAt,
      resolution: llm.resolution,
      stages,
      sourceChars,
      createDiagnostic,
      runReport: async (callLlm) => generatePersonalWeekly({
        vaultPath: vaultPath,
        weekKey: isoWeekKey(selected),
        dailyContents,
        stats,
        relativeFilePath: expandPathTemplate(templateSettings.weeklyPath, dateKeyToLocalDate(selected)),
        reportTemplate: templateSettings.weeklyTemplate,
        systemPrompt: settings.weeklyPrompt,
        callLlm,
      }),
    });
  });
}
