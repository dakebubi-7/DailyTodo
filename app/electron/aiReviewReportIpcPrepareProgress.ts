import type { AiReviewRunReportKind, AiReviewStageDiagnostic } from '../shared/aiReview/runDiagnostics';
import { buildSourceCharsMessage } from './aiReviewIpcHelpers';
import { PREPARE_MATERIALS_LABEL } from './aiReviewIpcMessages';
import type {
  AiReviewReportProgressEmitter,
  AiReviewReportStageFactory,
} from './aiReviewReportIpcTypes';

export type CompleteReportPrepareMaterialsOptions<ReportKind extends AiReviewRunReportKind> = {
  reportKind: ReportKind;
  sourceChars: number;
  prepareStartedAt: number;
  stage: AiReviewReportStageFactory;
  emitAiReviewProgress: AiReviewReportProgressEmitter<ReportKind>;
};

export function completeReportPrepareMaterials<ReportKind extends AiReviewRunReportKind>({
  reportKind,
  sourceChars,
  prepareStartedAt,
  stage,
  emitAiReviewProgress,
}: CompleteReportPrepareMaterialsOptions<ReportKind>): {
  sourceCharsMessage: string;
  stages: AiReviewStageDiagnostic[];
} {
  const sourceCharsMessage = buildSourceCharsMessage(sourceChars);
  const stages = [
    stage('prepareMaterials', PREPARE_MATERIALS_LABEL, 'completed', Date.now() - prepareStartedAt, sourceCharsMessage),
  ];
  emitAiReviewProgress(reportKind, 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'completed', sourceCharsMessage);
  return { sourceCharsMessage, stages };
}
