import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DailyReviewBatch, DailyReviewBatchItem } from '../../../shared/dailyReview';
import { shiftDateKey } from '../../../shared/taskRollover';
import type { DailyReviewSuggestionAdoption } from '../../hooks/taskTreeActions';
import type { getShellText } from '../../i18n';

const DAILY_REVIEW_PROMPT_HANDLED_STORAGE_KEY = 'daily-review-prompt-handled-source-date';

interface DailyReviewPanelProps {
  currentDate: string;
  text: ReturnType<typeof getShellText>['app'];
  onAdoptDailyReviewSuggestion: (adoption: DailyReviewSuggestionAdoption) => void;
}

function asDailyReviewBatch(value: unknown): DailyReviewBatch | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const batch = value as Partial<DailyReviewBatch>;
  return typeof batch.sourceDate === 'string' && Array.isArray(batch.items)
    ? batch as DailyReviewBatch
    : undefined;
}

function wasDailyReviewPromptHandled(sourceDate: string): boolean {
  try {
    return window.localStorage.getItem(DAILY_REVIEW_PROMPT_HANDLED_STORAGE_KEY) === sourceDate;
  } catch {
    return false;
  }
}

function markDailyReviewPromptHandled(sourceDate: string) {
  try {
    window.localStorage.setItem(DAILY_REVIEW_PROMPT_HANDLED_STORAGE_KEY, sourceDate);
  } catch {
    // The prompt remains usable when local storage is unavailable.
  }
}

function getHumanRecord(item: DailyReviewBatchItem, text: DailyReviewPanelProps['text']): string {
  if (item.review) {
    const summary = item.review.summary.trim();
    return summary
      ? `${item.review.percent}% complete. ${summary}`
      : `${item.review.percent}% complete.`;
  }
  if (item.carryoverContext) {
    const parts = [item.carryoverContext.progressSummary, item.carryoverContext.blocker]
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.length ? parts.join(' ') : text.dailyReviewNoRecord;
  }
  return text.dailyReviewNoRecord;
}

export function DailyReviewPanel({
  currentDate,
  text,
  onAdoptDailyReviewSuggestion,
}: DailyReviewPanelProps) {
  const sourceDate = useMemo(() => shiftDateKey(currentDate, -1), [currentDate]);
  const [enabled, setEnabled] = useState<boolean | undefined>();
  const [batch, setBatch] = useState<DailyReviewBatch>();
  const [isRunning, setIsRunning] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPromptHidden, setIsPromptHidden] = useState(false);
  const [adoptionItem, setAdoptionItem] = useState<DailyReviewBatchItem>();
  const [focusAction, setFocusAction] = useState('');
  const [runError, setRunError] = useState<string>();

  useEffect(() => {
    let isCurrent = true;
    const aiReview = window.electronAPI?.aiReview;
    setEnabled(undefined);
    setBatch(undefined);
    setIsDetailOpen(false);
    setIsPromptHidden(wasDailyReviewPromptHandled(sourceDate));
    setAdoptionItem(undefined);
    setRunError(undefined);

    if (!aiReview) {
      setEnabled(false);
      return () => {
        isCurrent = false;
      };
    }

    void (async () => {
      try {
        const settings = await aiReview.getSettings();
        if (!isCurrent) return;
        const isEnabled = (settings as { enabled?: unknown } | undefined)?.enabled === true;
        setEnabled(isEnabled);
        if (!isEnabled) return;
        const savedBatch = await aiReview.getDailyReviewBatch(sourceDate);
        if (isCurrent) setBatch(asDailyReviewBatch(savedBatch));
      } catch {
        if (isCurrent) setEnabled(false);
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, [sourceDate]);

  const runBatch = useCallback(async () => {
    const aiReview = window.electronAPI?.aiReview;
    if (!aiReview || isRunning) return;

    setIsRunning(true);
    setRunError(undefined);
    try {
      const result = await aiReview.runDailyReviewBatch(sourceDate);
      const resultBatch = asDailyReviewBatch((result as { batch?: unknown } | undefined)?.batch);
      if (resultBatch) {
        setBatch(resultBatch);
      } else {
        setBatch(asDailyReviewBatch(await aiReview.getDailyReviewBatch(sourceDate)));
      }
    } catch {
      setRunError(text.dailyReviewRetryFailed);
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, sourceDate, text.dailyReviewRetryFailed]);

  const startAdoption = useCallback((item: DailyReviewBatchItem) => {
    if (!item.suggestion?.suggestedAction) return;
    setAdoptionItem(item);
    setFocusAction(item.suggestion.suggestedAction);
  }, []);

  const openDetails = useCallback(() => {
    markDailyReviewPromptHandled(sourceDate);
    setIsPromptHidden(true);
    setIsDetailOpen(true);
  }, [sourceDate]);

  const dismissPrompt = useCallback(() => {
    markDailyReviewPromptHandled(sourceDate);
    setIsPromptHidden(true);
  }, [sourceDate]);

  const cancelAdoption = useCallback(() => {
    setAdoptionItem(undefined);
    setFocusAction('');
  }, []);

  const closeDetails = useCallback(() => {
    markDailyReviewPromptHandled(sourceDate);
    cancelAdoption();
    setIsDetailOpen(false);
    setIsPromptHidden(true);
  }, [cancelAdoption, sourceDate]);

  const confirmAdoption = useCallback(() => {
    const suggestedAction = adoptionItem?.suggestion?.suggestedAction;
    if (!adoptionItem || !suggestedAction) return;
    onAdoptDailyReviewSuggestion({
      taskId: adoptionItem.taskId,
      sourceDate,
      sourceReviewId: adoptionItem.sourceReviewId,
      sourceReviewRevision: adoptionItem.sourceReviewRevision,
      suggestedAction,
      action: focusAction,
    });
    cancelAdoption();
  }, [adoptionItem, cancelAdoption, focusAction, onAdoptDailyReviewSuggestion, sourceDate]);

  if (enabled !== true || (isPromptHidden && !isDetailOpen) || (batch !== undefined && batch.items.length === 0)) return null;

  const items = batch?.items ?? [];
  const suggestionCount = items.filter((item) => Boolean(item.suggestion?.suggestedAction)).length;
  const hasFailedItem = items.some((item) => item.status === 'failed');
  const prompt = !batch
    ? text.dailyReviewAvailable
    : hasFailedItem
      ? text.dailyReviewUnavailable
      : text.dailyReviewReady.replace('{count}', String(suggestionCount));

  return (
    <section className="daily-review-panel" aria-label={text.dailyReviewDetails}>
      {!isDetailOpen ? (
        <div className="daily-review-prompt">
          <p>{runError ?? prompt}</p>
          <div className="daily-review-prompt-actions">
            {batch ? (
              <button type="button" onClick={openDetails}>
                {text.dailyReviewView}
              </button>
            ) : (
              <button type="button" onClick={() => void runBatch()} disabled={isRunning}>
                {text.dailyReviewGenerate}
              </button>
            )}
            <button type="button" onClick={dismissPrompt}>
              {text.dailyReviewDismiss}
            </button>
            {hasFailedItem && (
              <button type="button" onClick={() => void runBatch()} disabled={isRunning}>
                {text.dailyReviewRetry}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="daily-review-detail" role="dialog" aria-modal="false" aria-label={text.dailyReviewDetails}>
          <div className="daily-review-detail-heading">
            <strong>{text.dailyReviewDetails}</strong>
            <button
              type="button"
              aria-label={text.dailyReviewClose}
              onClick={closeDetails}
            >
              {text.dailyReviewClose}
            </button>
          </div>
          <div className="daily-review-items">
            {items.map((item) => (
              <article className="daily-review-item" key={`${item.taskId}:${item.sourceReviewRevision}`}>
                <h3>{item.taskText}</h3>
                <section className="daily-review-evidence" aria-label={text.dailyReviewYourRecord}>
                  <h4>{text.dailyReviewYourRecord}</h4>
                  <p>{getHumanRecord(item, text)}</p>
                  {item.review?.unknowns && <p>{item.review.unknowns}</p>}
                  {item.review?.nextStep && <p>{item.review.nextStep}</p>}
                </section>
                {item.suggestion ? (
                  <section className="daily-review-suggestion" aria-label={text.dailyReviewSuggestedAction}>
                    <h4>{text.dailyReviewSuggestedAction}</h4>
                    <p>{item.suggestion.suggestedAction || text.dailyReviewNoAction}</p>
                    {item.suggestion.suggestedAction && (
                      <button type="button" onClick={() => startAdoption(item)}>
                        {text.dailyReviewAdopt}
                      </button>
                    )}
                  </section>
                ) : item.status === 'failed' ? (
                  <p className="daily-review-error">{item.error || text.dailyReviewRetryFailed}</p>
                ) : (
                  <p className="daily-review-empty">{text.dailyReviewNoAction}</p>
                )}
                {adoptionItem?.taskId === item.taskId
                  && adoptionItem.sourceReviewRevision === item.sourceReviewRevision && (
                  <div className="daily-review-adoption">
                    <label>
                      <span>{text.dailyReviewFocusAction}</span>
                      <input
                        aria-label={text.dailyReviewFocusAction}
                        value={focusAction}
                        onChange={(event) => setFocusAction(event.currentTarget.value)}
                      />
                    </label>
                    <div className="daily-review-adoption-actions">
                      <button type="button" onClick={confirmAdoption} disabled={!focusAction.trim()}>
                        {text.dailyReviewConfirm}
                      </button>
                      <button type="button" onClick={cancelAdoption}>
                        {text.cancelTodayFocus}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
