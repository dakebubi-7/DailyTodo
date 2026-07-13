import type { AiReviewSettings } from '../shared/aiReview/aiReviewSettings';
import type { AiReviewRunReportKind } from '../shared/aiReview/runDiagnostics';
import {
  PREPARE_MATERIALS_LABEL,
  REQUEST_AI_LABEL,
  WRITE_OBSIDIAN_LABEL,
} from './aiReviewIpcMessages';
import { createReportFailureResult } from './aiReviewReportIpcFailure';
import type {
  AiReviewReportDiagnosticFactory,
  AiReviewReportLlmAvailableResult,
  AiReviewReportProgressEmitter,
  AiReviewReportStageFactory,
} from './aiReviewReportIpcTypes';
import type { VaultStatus } from './sharedTypes';

export type StartReportPreflightOptions<ReportKind extends AiReviewRunReportKind> = {
  reportKind: ReportKind;
  prepareMessage: string;
  getAiReviewSettings(): AiReviewSettings;
  ensureReportLlmAvailable(reportKind: ReportKind): AiReviewReportLlmAvailableResult;
  getVaultStatus(): VaultStatus;
  emitAiReviewProgress: AiReviewReportProgressEmitter<ReportKind>;
  stage: AiReviewReportStageFactory;
  createDiagnostic: AiReviewReportDiagnosticFactory<ReportKind>;
};

export function startReportPreflight<ReportKind extends AiReviewRunReportKind>({
  reportKind,
  prepareMessage,
  getAiReviewSettings,
  ensureReportLlmAvailable,
  getVaultStatus,
  emitAiReviewProgress,
  stage,
  createDiagnostic,
}: StartReportPreflightOptions<ReportKind>):
  | {
    ok: true;
    startedAt: number;
    settings: AiReviewSettings;
    llm: Extract<AiReviewReportLlmAvailableResult, { ok: true }>;
    vaultPath: string;
  }
  | {
    ok: false;
    result: ReturnType<typeof createReportFailureResult<ReportKind>>;
  } {
  const startedAt = Date.now();
  emitAiReviewProgress(reportKind, 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'running', prepareMessage);

  const settings = getAiReviewSettings();
  const llm = ensureReportLlmAvailable(reportKind);
  if (!llm.ok) {
    emitAiReviewProgress(reportKind, 'requestAi', REQUEST_AI_LABEL, 'failed', llm.error);
    return {
      ok: false,
      result: createReportFailureResult({
        reportKind,
        startedAt,
        finalStatus: 'accountUnavailable',
        resolution: llm.resolution,
        createDiagnostic,
        stages: [stage('requestAi', REQUEST_AI_LABEL, 'failed', undefined, llm.error)],
        error: llm.error,
      }),
    };
  }

  const vaultStatus = getVaultStatus();
  if (!vaultStatus.ok || !vaultStatus.vaultPath) {
    const vaultError = vaultStatus.ok
      ? 'Obsidian vault path is missing.'
      : (vaultStatus.reason || 'Obsidian vault path is missing.');
    emitAiReviewProgress(reportKind, 'writeObsidian', WRITE_OBSIDIAN_LABEL, 'failed', vaultError);
    return {
      ok: false,
      result: createReportFailureResult({
        reportKind,
        startedAt,
        finalStatus: 'writeFailed',
        resolution: llm.resolution,
        createDiagnostic,
        error: vaultError,
      }),
    };
  }

  return { ok: true, startedAt, settings, llm, vaultPath: vaultStatus.vaultPath };
}
