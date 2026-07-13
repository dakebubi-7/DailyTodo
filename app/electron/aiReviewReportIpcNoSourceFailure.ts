import { NO_SOURCE_MATERIALS_ERROR } from '../shared/aiReview/sourceMaterials';
import type { AiReviewProfileResolution } from '../shared/aiReview/aiReviewSettings';
import type { AiReviewRunReportKind, AiReviewStageDiagnostic } from '../shared/aiReview/runDiagnostics';
import { PREPARE_MATERIALS_LABEL } from './aiReviewIpcMessages';
import { createReportFailureResult } from './aiReviewReportIpcFailure';
import type {
  AiReviewReportDiagnosticFactory,
  AiReviewReportProgressEmitter,
} from './aiReviewReportIpcTypes';

export type FailReportForNoSourceMaterialsOptions<ReportKind extends AiReviewRunReportKind> = {
  reportKind: ReportKind;
  startedAt: number;
  resolution?: AiReviewProfileResolution;
  stages: AiReviewStageDiagnostic[];
  sourceChars: number;
  emitAiReviewProgress: AiReviewReportProgressEmitter<ReportKind>;
  createDiagnostic: AiReviewReportDiagnosticFactory<ReportKind>;
};

export function failReportForNoSourceMaterials<ReportKind extends AiReviewRunReportKind>({
  reportKind,
  startedAt,
  resolution,
  stages,
  sourceChars,
  emitAiReviewProgress,
  createDiagnostic,
}: FailReportForNoSourceMaterialsOptions<ReportKind>) {
  emitAiReviewProgress(reportKind, 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'failed', NO_SOURCE_MATERIALS_ERROR.zh);
  return createReportFailureResult({
    reportKind,
    startedAt,
    finalStatus: 'noSourceMaterials',
    resolution,
    createDiagnostic,
    stages,
    sourceChars,
    error: NO_SOURCE_MATERIALS_ERROR.zh,
  });
}
