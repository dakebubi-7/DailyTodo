import type { AiReviewProfileResolution } from '../shared/aiReview/aiReviewSettings';
import { hasSourceMaterials } from '../shared/aiReview/sourceMaterials';
import type {
  AiReviewRunDiagnostic,
  AiReviewRunReportKind,
  AiReviewStageDiagnostic,
} from '../shared/aiReview/runDiagnostics';
import { failReportForNoSourceMaterials } from './aiReviewReportIpcNoSourceFailure';
import { completeReportPrepareMaterials } from './aiReviewReportIpcPrepareProgress';
import { sumReportSourceChars, type AiReviewReportSourceContent } from './aiReviewReportIpcSourceSummary';
import type {
  AiReviewReportDiagnosticFactory,
  AiReviewReportProgressEmitter,
  AiReviewReportStageFactory,
} from './aiReviewReportIpcTypes';

export type PrepareReportSourcesOptions<ReportKind extends AiReviewRunReportKind> = {
  reportKind: ReportKind;
  sources: AiReviewReportSourceContent[];
  startedAt: number;
  prepareStartedAt: number;
  resolution?: AiReviewProfileResolution;
  emitAiReviewProgress: AiReviewReportProgressEmitter<ReportKind>;
  stage: AiReviewReportStageFactory;
  createDiagnostic: AiReviewReportDiagnosticFactory<ReportKind>;
};

export function prepareReportSources<ReportKind extends AiReviewRunReportKind>({
  reportKind,
  sources,
  startedAt,
  prepareStartedAt,
  resolution,
  emitAiReviewProgress,
  stage,
  createDiagnostic,
}: PrepareReportSourcesOptions<ReportKind>):
  | { ok: true; sourceChars: number; stages: AiReviewStageDiagnostic[] }
  | { ok: false; result: { ok: false; error: string; diagnostic: AiReviewRunDiagnostic } } {
  const sourceChars = sumReportSourceChars(sources);
  const { stages } = completeReportPrepareMaterials({
    reportKind,
    sourceChars,
    prepareStartedAt,
    stage,
    emitAiReviewProgress,
  });

  if (!hasSourceMaterials(sources)) {
    return {
      ok: false,
      result: failReportForNoSourceMaterials({
        reportKind,
        startedAt,
        resolution,
        stages,
        sourceChars,
        emitAiReviewProgress,
        createDiagnostic,
      }),
    };
  }

  return { ok: true, sourceChars, stages };
}
