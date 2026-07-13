import { ipcMain } from 'electron';
import { type AiReviewSettings } from '../shared/aiReview/aiReviewSettings';
import type { ObsidianTemplateSettings } from '../shared/appSettings';
import {
  type DailySourceRule,
} from '../shared/aiReview/sourceMaterials';
import { computeRangeStats } from '../shared/aiReview/stats';
import { generatePersonalMonthly } from './aiReview/exportReports';
import { dateKeyToLocalDate, expandPathTemplate } from '../shared/pathTemplate';
import {
  MONTHLY_WRITTEN_MESSAGE,
  READ_MONTHLY_SOURCES_MESSAGE,
  RECEIVED_MONTHLY_REPORT_MESSAGE,
  WAIT_MONTHLY_REPORT_MESSAGE,
} from './aiReviewIpcMessages';
import { executeReportGeneration } from './aiReviewReportIpcExecution';
import { collectMonthlyReportSources } from './aiReviewReportIpcSourceCollection';
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

export type RegisterAiReviewMonthlyReportIpcHandlersOptions = {
  getAiReviewSettings(): AiReviewSettings;
  getObsidianTemplateSettings(): ObsidianTemplateSettings;
  getVaultStatus(): VaultStatus;
  getDateKey(date?: unknown): string;
  getDailySourceRules(): DailySourceRule[];
  ensureReportLlmAvailable(reportKind: 'monthly'): AiReviewReportLlmAvailableResult;
  emitAiReviewProgress: AiReviewReportProgressEmitter<'monthly'>;
  stage: AiReviewReportStageFactory;
  createDiagnostic: AiReviewReportDiagnosticFactory<'monthly'>;
};

export function registerAiReviewMonthlyReportIpcHandlers({
  getAiReviewSettings,
  getObsidianTemplateSettings,
  getVaultStatus,
  getDateKey,
  getDailySourceRules,
  ensureReportLlmAvailable,
  emitAiReviewProgress,
  stage,
  createDiagnostic,
}: RegisterAiReviewMonthlyReportIpcHandlersOptions): void {
  ipcMain.handle('aiReview:generateMonthly', async (_event, date: unknown, tasks: unknown) => {
    if (!isAiReviewTaskArray(tasks)) {
      return { ok: false, error: 'AI Review tasks contain malformed entries.' };
    }
    const preflight = startReportPreflight({
      reportKind: 'monthly',
      prepareMessage: READ_MONTHLY_SOURCES_MESSAGE,
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

    const { prepareStartedAt, month, first, last, sources } = collectMonthlyReportSources({
      date,
      vaultPath,
      weeklyPathTemplate: templateSettings.weeklyPath,
      monthlySourceMode: settings.monthlySourceMode,
      getDateKey,
      getDailySourceRules,
    });
    const sourcePreparation = prepareReportSources({
      reportKind: 'monthly',
      sources,
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

    const stats = computeRangeStats(tasks, first, last);
    return executeReportGeneration({
      reportKind: 'monthly',
      callLlm: llm.callLlm,
      emitAiReviewProgress,
      waitMessage: WAIT_MONTHLY_REPORT_MESSAGE,
      receivedMessage: RECEIVED_MONTHLY_REPORT_MESSAGE,
      writtenMessage: MONTHLY_WRITTEN_MESSAGE,
      startedAt,
      resolution: llm.resolution,
      stages,
      sourceChars,
      createDiagnostic,
      runReport: async (callLlm) => generatePersonalMonthly({
        vaultPath: vaultPath,
        month,
        sources,
        stats,
        relativeFilePath: expandPathTemplate(templateSettings.monthlyPath, dateKeyToLocalDate(first)),
        reportTemplate: templateSettings.monthlyTemplate,
        systemPrompt: settings.monthlyPrompt,
        callLlm,
      }),
    });
  });
}
