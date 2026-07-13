import type { AiReviewProfileResolution } from '../shared/aiReview/aiReviewSettings';
import type {
  AiReviewRunReportKind,
  AiReviewStageDiagnostic,
} from '../shared/aiReview/runDiagnostics';
import type { ChatMessage, LlmResult } from '../shared/llm/openaiClient';
import type { ReportResult } from './aiReview/exportReports';
import { finalizeReportResult } from './aiReviewReportIpcCompletion';
import { callReportLlmWithProgress } from './aiReviewReportIpcLlmProgress';
import type {
  AiReviewReportDiagnosticFactory,
  AiReviewReportProgressEmitter,
} from './aiReviewReportIpcTypes';

export type ExecuteReportGenerationOptions<ReportKind extends AiReviewRunReportKind> = {
  reportKind: ReportKind;
  callLlm(messages: ChatMessage[]): Promise<LlmResult>;
  emitAiReviewProgress: AiReviewReportProgressEmitter<ReportKind>;
  waitMessage: string;
  receivedMessage: string;
  writtenMessage: string;
  startedAt: number;
  resolution?: AiReviewProfileResolution;
  stages: AiReviewStageDiagnostic[];
  sourceChars?: number;
  createDiagnostic: AiReviewReportDiagnosticFactory<ReportKind>;
  runReport(callLlm: (messages: ChatMessage[]) => Promise<LlmResult>): Promise<ReportResult>;
};

export async function executeReportGeneration<ReportKind extends AiReviewRunReportKind>({
  reportKind,
  callLlm,
  emitAiReviewProgress,
  waitMessage,
  receivedMessage,
  writtenMessage,
  startedAt,
  resolution,
  stages,
  sourceChars,
  createDiagnostic,
  runReport,
}: ExecuteReportGenerationOptions<ReportKind>) {
  let llmResult: LlmResult | undefined;
  const result = await runReport(async (messages) => {
    llmResult = await callReportLlmWithProgress({
      reportKind,
      messages,
      callLlm,
      emitAiReviewProgress,
      waitMessage,
      receivedMessage,
    });
    return llmResult;
  });

  return finalizeReportResult({
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
  });
}
