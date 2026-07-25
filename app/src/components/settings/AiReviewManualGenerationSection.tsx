import type { getShellText } from '../../i18n';
import type { AiReviewProgressEvent, AiReviewRunDiagnostic } from '../../../shared/aiReview/runDiagnostics';
import type { AiReviewHandoffSuggestion } from '../../../shared/aiReview/aiReviewIpcResultReaders';
import type { Task } from '../../types/task';
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
  handoffs: AiReviewHandoffSuggestion[];
  tasks: Task[];
  runGeneration: (action: GenerationAction) => void;
  applyHandoff: (taskId: string, updateNextStep: boolean) => void;
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
  handoffs,
  tasks,
  runGeneration,
  applyHandoff,
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
      {handoffs.length > 0 && (
        <div className="settings-preview-list settings-generation-status" aria-label={zh ? '\u53ef\u5e94\u7528\u7684 AI \u4ea4\u63a5\u5efa\u8bae' : 'Available AI handoff suggestions'}>
          {handoffs.map(({ taskId, handoff }) => {
            const task = tasks.find((item) => item.id === taskId);
            return (
              <div key={taskId}>
                <strong>{task?.text ?? taskId}</strong>
                <p>{handoff.progressSummary}</p>
                {handoff.blocker && <p>{zh ? '\u5361\u70b9：' : 'Blocker: '}{handoff.blocker}</p>}
                <p>{zh ? '\u5efa\u8bae\u4e0b\u4e00\u6b65：' : 'Suggested next step: '}{handoff.nextStep}</p>
                <div className="settings-action-row settings-action-row-wide">
                  <button type="button" className="settings-reset-button" onClick={() => applyHandoff(taskId, false)}>
                    {zh ? '\u4ec5\u5e94\u7528\u4ea4\u63a5' : 'Apply handoff only'}
                  </button>
                  <button type="button" className="settings-reset-button" onClick={() => applyHandoff(taskId, true)}>
                    {zh ? '\u5e94\u7528\u4ea4\u63a5\u5e76\u66f4\u65b0\u4e0b\u4e00\u6b65' : 'Apply handoff and next step'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
