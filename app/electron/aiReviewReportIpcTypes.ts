import type { AiReviewProfileResolution } from '../shared/aiReview/aiReviewSettings';
import type {
  AiReviewRunDiagnostic,
  AiReviewRunFinalStatus,
  AiReviewRunReportKind,
  AiReviewStageDiagnostic,
} from '../shared/aiReview/runDiagnostics';
import type { ChatMessage, LlmResult } from '../shared/llm/openaiClient';

export type AiReviewReportLlmAvailableResult =
  | {
    ok: true;
    callLlm(messages: ChatMessage[]): Promise<LlmResult>;
    resolution: AiReviewProfileResolution;
  }
  | {
    ok: false;
    error: string;
    resolution: AiReviewProfileResolution;
  };

export type AiReviewReportProgressEmitter<ReportKind extends AiReviewRunReportKind = AiReviewRunReportKind> = (
  reportKind: ReportKind,
  key: AiReviewStageDiagnostic['key'],
  label: string,
  status: AiReviewStageDiagnostic['status'],
  message?: string
) => void;

export type AiReviewReportStageFactory = (
  key: AiReviewStageDiagnostic['key'],
  label: string,
  status: AiReviewStageDiagnostic['status'],
  durationMs?: number,
  message?: string
) => AiReviewStageDiagnostic;

export type AiReviewReportDiagnosticFactory<ReportKind extends AiReviewRunReportKind = AiReviewRunReportKind> = (params: {
  reportKind: ReportKind;
  startedAt: number;
  finalStatus: AiReviewRunFinalStatus;
  resolution?: AiReviewProfileResolution;
  stages: AiReviewStageDiagnostic[];
  llmResults?: LlmResult[];
  sourceChars?: number;
  error?: string;
}) => AiReviewRunDiagnostic;
