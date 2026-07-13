import type { AiReviewRunFinalStatus } from '../shared/aiReview/runDiagnostics';
import type { LlmResult } from '../shared/llm/openaiClient';
import type { ReportResult } from './aiReview/exportReports';

export function getReportFinalStatus(result: ReportResult, llmResult?: LlmResult): AiReviewRunFinalStatus {
  return result.ok ? (result.truncated ? 'completedWithWarning' : 'completed') : llmResult && !llmResult.ok ? 'providerFailed' : 'writeFailed';
}

export function getReportLlmResults(llmResult?: LlmResult): LlmResult[] {
  return llmResult ? [llmResult] : [];
}
