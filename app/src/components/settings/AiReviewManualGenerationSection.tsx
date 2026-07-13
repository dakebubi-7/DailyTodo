import type { getShellText } from '../../i18n';
import type { AiReviewProgressEvent, AiReviewRunDiagnostic } from '../../../shared/aiReview/runDiagnostics';
import {
  DiagnosticCard,
  GenerationProgress,
  progressDisplay,
  type GenerationAction,
} from './AiReviewSettingsWidgets';

type SettingsText = ReturnType<typeof getShellText>['settings'];

interface AiReviewManualGenerationSectionProps {
  text: SettingsText;
  zh: boolean;
  generatingAction: GenerationAction | null;
  generationStatus: string;
  currentProgress: AiReviewProgressEvent | null;
  waitingForRealProgress: string;
  lastDiagnostic: AiReviewRunDiagnostic | null;
  runGeneration: (action: GenerationAction) => void;
  onCloseDiagnostic: () => void;
}

export function AiReviewManualGenerationSection({
  text,
  zh,
  generatingAction,
  generationStatus,
  currentProgress,
  waitingForRealProgress,
  lastDiagnostic,
  runGeneration,
  onCloseDiagnostic,
}: AiReviewManualGenerationSectionProps) {
  const generationActions: ReadonlyArray<readonly [GenerationAction, string]> = [
    ['personalWeekly', text.aiReview.genWeekly],
    ['personalMonthly', text.aiReview.genMonthly],
    ['externalWeekly', text.aiReview.genExternalWeekly],
    ['externalMonthly', text.aiReview.genExternalMonthly],
    ['daily', zh ? '重新生成今日日报' : 'Regenerate today'],
  ];

  return (
    <section className="settings-inline-section settings-highlight-section">
      <h3>{zh ? '手动生成' : 'Manual generation'}</h3>
      <div className="settings-action-row settings-action-row-wide">
        {generationActions.map(([action, label]) => (
          <button
            key={action}
            type="button"
            className="settings-reset-button"
            disabled={generatingAction !== null}
            onClick={() => runGeneration(action)}
          >
            {generatingAction === action ? progressDisplay(currentProgress, waitingForRealProgress) : label}
          </button>
        ))}
      </div>
      {generationStatus && (
        <div className="settings-preview-list settings-generation-status">
          <p>{generationStatus}</p>
          <GenerationProgress currentProgress={currentProgress} fallback={waitingForRealProgress} />
        </div>
      )}
      {lastDiagnostic && <DiagnosticCard diagnostic={lastDiagnostic} onClose={onCloseDiagnostic} />}
    </section>
  );
}
