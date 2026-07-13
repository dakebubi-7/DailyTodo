import { useEffect, useRef, useState } from 'react';
import type { getShellText } from '../../i18n';
import type { Task } from '../../types/task';
import {
  isAiReviewProgressEvent,
  readAiReviewDailyInspection,
  readAiReviewGenerationResult,
  readAiReviewRunDiagnostic,
  type AiReviewProgressEvent,
  type AiReviewRunDiagnostic,
} from '../../../shared/aiReview/runDiagnostics';
import {
  finishProgress,
  initialProgressForAction,
  previousMonthStart,
  previousWeekDate,
  resultMessage,
  type GenerationAction,
} from './AiReviewSettingsWidgets';

type SettingsText = ReturnType<typeof getShellText>['settings'];

type UseAiReviewGenerationOptions = {
  isOpen: boolean;
  zh: boolean;
  text: SettingsText;
  selectedDate: string;
  tasks: Task[];
};

export function useAiReviewGeneration({
  isOpen,
  zh,
  text,
  selectedDate,
  tasks,
}: UseAiReviewGenerationOptions) {
  const [generationStatus, setGenerationStatus] = useState('');
  const [generatingAction, setGeneratingAction] = useState<GenerationAction | null>(null);
  const [lastDiagnostic, setLastDiagnostic] = useState<AiReviewRunDiagnostic | null>(null);
  const [currentProgress, setCurrentProgress] = useState<AiReviewProgressEvent | null>(null);
  const generationActiveRef = useRef(false);
  const progressFallbackTimerRef = useRef<number | null>(null);

  const waitingForRealProgress = zh ? '\u7b49\u5f85\u771f\u5b9e\u8fdb\u5ea6...' : 'Waiting for real progress...';
  const confirmDailyRegeneration = zh
    ? '当前日报可能已存在。确认后会覆盖 DailyTodo 管理的 AI 复盘块并重新生成，继续吗？'
    : 'Today\'s daily review may already exist. Confirm to overwrite DailyTodo-managed AI review blocks and regenerate it.';

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const unsubscribe = window.electronAPI?.aiReview.onProgress?.((payload) => {
      if (!generationActiveRef.current || !isAiReviewProgressEvent(payload)) {
        return;
      }
      setCurrentProgress(payload);
    });
    return () => unsubscribe?.();
  }, [isOpen]);

  useEffect(() => () => {
    if (progressFallbackTimerRef.current) {
      window.clearTimeout(progressFallbackTimerRef.current);
    }
  }, []);

  const scheduleFallbackProgress = () => {
    if (progressFallbackTimerRef.current) {
      window.clearTimeout(progressFallbackTimerRef.current);
    }
    progressFallbackTimerRef.current = window.setTimeout(() => {
      if (!generationActiveRef.current) {
        return;
      }
      setCurrentProgress((current) =>
        current
          ? { ...current, message: waitingForRealProgress, at: new Date().toISOString() }
          : current,
      );
    }, 1200);
  };

  const runGeneration = async (action: GenerationAction) => {
    setGeneratingAction(action);
    generationActiveRef.current = true;
    setLastDiagnostic(null);
    setCurrentProgress(initialProgressForAction(action));
    scheduleFallbackProgress();
    setGenerationStatus(text.aiReview.generating);

    try {
      if (action === 'daily') {
        const inspection = readAiReviewDailyInspection(await window.electronAPI?.aiReview.inspectDaily(selectedDate));
        if (inspection?.error) {
          throw new Error(inspection.error);
        }
        const shouldRegenerate = Boolean(inspection?.hasAiContent);
        if (shouldRegenerate && !window.confirm(confirmDailyRegeneration)) {
          setCurrentProgress(finishProgress(action, false));
          setGenerationStatus(zh ? '已取消重新生成日报' : 'Daily regeneration canceled');
          return;
        }

        const rawDailyResult = await window.electronAPI?.aiReview.runForDate(selectedDate, tasks, shouldRegenerate);
        const result = readAiReviewGenerationResult(rawDailyResult);
        if (!result) {
          throw new Error('AI Review API unavailable');
        }
        const dailyDiagnostic = readAiReviewRunDiagnostic(rawDailyResult);
        if (dailyDiagnostic) {
          setLastDiagnostic(dailyDiagnostic);
        }
        setCurrentProgress(finishProgress(action, result.ok));
        setGenerationStatus(
          result.ok
            ? `${text.aiReview.genSuccess}${selectedDate}`
            : `${text.aiReview.genFailed}${result.error ?? '未知错误'}`,
        );
        return;
      }

      const rawResult =
        action === 'personalWeekly'
          ? await window.electronAPI?.aiReview.generateWeekly(previousWeekDate(), tasks)
          : action === 'personalMonthly'
            ? await window.electronAPI?.aiReview.generateMonthly(previousMonthStart(), tasks)
            : action === 'externalWeekly'
              ? await window.electronAPI?.aiReview.generateExternal('weekly', previousWeekDate())
              : await window.electronAPI?.aiReview.generateExternal('monthly', previousMonthStart());

      const result = readAiReviewGenerationResult(rawResult);
      if (!result) {
        throw new Error('AI Review API unavailable');
      }

      const diagnostic = readAiReviewRunDiagnostic(rawResult);
      if (diagnostic) {
        setLastDiagnostic(diagnostic);
      }
      setCurrentProgress(finishProgress(action, result.ok));
      setGenerationStatus(resultMessage(text.aiReview, result));
    } catch (error) {
      setCurrentProgress(finishProgress(action, false));
      setGenerationStatus(`${text.aiReview.genFailed}${error instanceof Error ? error.message : String(error)}`);
    } finally {
      generationActiveRef.current = false;
      if (progressFallbackTimerRef.current) {
        window.clearTimeout(progressFallbackTimerRef.current);
      }
      setGeneratingAction(null);
    }
  };

  return {
    generatingAction,
    generationStatus,
    currentProgress,
    waitingForRealProgress,
    lastDiagnostic,
    runGeneration,
    onCloseDiagnostic: () => setLastDiagnostic(null),
  };
}
