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
  pendingDailyRegeneration: boolean;
  onConfirmDailyRegeneration: () => void;
  onCancelDailyRegeneration: () => void;
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
  pendingDailyRegeneration,
  onConfirmDailyRegeneration,
  onCancelDailyRegeneration,
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
      {pendingDailyRegeneration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/35 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-[26rem] rounded-[14px] border border-white/60 bg-white/92 p-5 shadow-[0_24px_80px_rgba(31,41,55,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/92"
            role="dialog"
            aria-modal="true"
            aria-labelledby="daily-regeneration-confirmation-title"
          >
            <h4 id="daily-regeneration-confirmation-title" className="text-[1rem] font-bold text-forest dark:text-white">
              {zh ? '\u91cd\u65b0\u751f\u6210\u4eca\u65e5\u65e5\u62a5\uff1f' : 'Regenerate today?s daily review?'}
            </h4>
            <p className="mt-2 text-[0.82rem] leading-6 text-zinc-600 dark:text-zinc-300">
              {zh
                ? '\u786e\u8ba4\u540e\uff0c\u5c06\u8986\u76d6 DailyTodo \u7ba1\u7406\u7684 AI \u590d\u76d8\u533a\u5757\uff0c\u5e76\u91cd\u65b0\u8c03\u7528 AI \u5199\u5165 Obsidian \u6d4b\u8bd5\u5e93\u3002'
                : 'This replaces DailyTodo-managed AI review blocks and calls AI again to write the selected daily review.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-xl px-3 py-2 text-[0.8rem] font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10" onClick={onCancelDailyRegeneration}>
                {zh ? '\u53d6\u6d88' : 'Cancel'}
              </button>
              <button type="button" className="rounded-xl bg-forest px-3 py-2 text-[0.8rem] font-semibold text-white shadow-card hover:bg-forest/90 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white" onClick={onConfirmDailyRegeneration}>
                {zh ? '\u786e\u8ba4\u5e76\u91cd\u65b0\u751f\u6210' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}
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
