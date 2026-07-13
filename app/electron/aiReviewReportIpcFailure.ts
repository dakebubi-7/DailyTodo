import type { AiReviewProfileResolution } from '../shared/aiReview/aiReviewSettings';
import type {
  AiReviewRunDiagnostic,
  AiReviewRunFinalStatus,
  AiReviewRunReportKind,
  AiReviewStageDiagnostic,
} from '../shared/aiReview/runDiagnostics';
import type { AiReviewReportDiagnosticFactory } from './aiReviewReportIpcTypes';

export type AiReviewReportFailureFinalStatus = Extract<
  AiReviewRunFinalStatus,
  'accountUnavailable' | 'writeFailed' | 'noSourceMaterials'
>;

export type CreateReportFailureResultOptions<ReportKind extends AiReviewRunReportKind> = {
  reportKind: ReportKind;
  startedAt: number;
  finalStatus: AiReviewReportFailureFinalStatus;
  resolution?: AiReviewProfileResolution;
  createDiagnostic: AiReviewReportDiagnosticFactory<ReportKind>;
  stages?: AiReviewStageDiagnostic[];
  sourceChars?: number;
  error: string;
};

export function createReportFailureResult<ReportKind extends AiReviewRunReportKind>({
  reportKind,
  startedAt,
  finalStatus,
  resolution,
  createDiagnostic,
  stages,
  sourceChars,
  error,
}: CreateReportFailureResultOptions<ReportKind>): { ok: false; error: string; diagnostic: AiReviewRunDiagnostic } {
  const diagnostic = createDiagnostic({
    reportKind,
    startedAt,
    finalStatus,
    resolution,
    stages: stages ?? [],
    sourceChars,
    error,
  });
  return { ok: false, error, diagnostic };
}
