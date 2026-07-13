import type { AiReviewProfileResolution } from '../shared/aiReview/aiReviewSettings';
import type {
  AiReviewRunDiagnostic,
  AiReviewRunReportKind,
  AiReviewStageDiagnostic,
} from '../shared/aiReview/runDiagnostics';
import type { LlmResult } from '../shared/llm/openaiClient';
import type { ReportResult } from './aiReview/exportReports';
import { WRITE_OBSIDIAN_LABEL } from './aiReviewIpcMessages';
import { getReportFinalStatus, getReportLlmResults } from './aiReviewReportIpcDiagnostics';
import type {
  AiReviewReportDiagnosticFactory,
  AiReviewReportProgressEmitter,
} from './aiReviewReportIpcTypes';

export type FinalizeReportResultOptions<ReportKind extends AiReviewRunReportKind> = {
  reportKind: ReportKind;
  result: ReportResult;
  llmResult?: LlmResult;
  emitAiReviewProgress: AiReviewReportProgressEmitter<ReportKind>;
  writtenMessage: string;
  startedAt: number;
  resolution?: AiReviewProfileResolution;
  stages: AiReviewStageDiagnostic[];
  sourceChars?: number;
  createDiagnostic: AiReviewReportDiagnosticFactory<ReportKind>;
};

export function finalizeReportResult<ReportKind extends AiReviewRunReportKind>({
  reportKind,
  result,
  llmResult,
  emitAiReviewProgress,
  writtenMessage,
  startedAt,
  resolution,
  stages,
  sourceChars,
  createDiagnostic,
}: FinalizeReportResultOptions<ReportKind>): ReportResult & { diagnostic: AiReviewRunDiagnostic } {
  emitAiReviewProgress(
    reportKind,
    'writeObsidian',
    WRITE_OBSIDIAN_LABEL,
    result.ok ? 'completed' : 'failed',
    result.ok ? writtenMessage : result.error
  );
  const diagnostic = createDiagnostic({
    reportKind,
    startedAt,
    finalStatus: getReportFinalStatus(result, llmResult),
    resolution,
    stages,
    llmResults: getReportLlmResults(llmResult),
    sourceChars,
    error: result.error,
  });
  return { ...result, diagnostic };
}
