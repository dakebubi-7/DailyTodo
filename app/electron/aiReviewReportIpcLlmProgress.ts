import type { AiReviewRunReportKind } from '../shared/aiReview/runDiagnostics';
import type { ChatMessage, LlmResult } from '../shared/llm/openaiClient';
import { REQUEST_AI_LABEL } from './aiReviewIpcMessages';
import type { AiReviewReportProgressEmitter } from './aiReviewReportIpcTypes';

export type CallReportLlmWithProgressOptions<ReportKind extends AiReviewRunReportKind> = {
  reportKind: ReportKind;
  messages: ChatMessage[];
  callLlm(messages: ChatMessage[]): Promise<LlmResult>;
  emitAiReviewProgress: AiReviewReportProgressEmitter<ReportKind>;
  waitMessage: string;
  receivedMessage: string;
};

export async function callReportLlmWithProgress<ReportKind extends AiReviewRunReportKind>({
  reportKind,
  messages,
  callLlm,
  emitAiReviewProgress,
  waitMessage,
  receivedMessage,
}: CallReportLlmWithProgressOptions<ReportKind>): Promise<LlmResult> {
  emitAiReviewProgress(reportKind, 'requestAi', REQUEST_AI_LABEL, 'running', waitMessage);
  const result = await callLlm(messages);
  emitAiReviewProgress(
    reportKind,
    'requestAi',
    REQUEST_AI_LABEL,
    result.ok ? 'completed' : 'failed',
    result.ok ? receivedMessage : result.error
  );
  return result;
}
