import { normalizeAiReviewSettings, type AiReviewSettings } from '../../shared/aiReview/aiReviewSettings';
import { shouldShowOnboarding } from '../../shared/aiReview/onboarding';
import { readAiReviewBackfillReport } from '../../shared/aiReview/runDiagnostics';
import type { Task } from '../types/task';
import {
  getScheduledMonthlyReportDateKey,
  getScheduledWeeklyReportDateKey,
  handleScheduledReportResult,
} from './appScheduledReports';

type AiReviewApi = Window['electronAPI']['aiReview'];

export interface RegisterAiReviewLifecycleOptions {
  aiReview?: AiReviewApi;
  getCurrentTasks: () => Task[];
}

export function registerAiReviewLifecycle({
  aiReview,
  getCurrentTasks,
}: RegisterAiReviewLifecycleOptions): () => void {
  void aiReview?.getSettings().then((value) => {
    const settings = normalizeAiReviewSettings(value);
    if (settings.startupBackfillEnabled) {
      void aiReview?.backfill(getCurrentTasks()).then(readAiReviewBackfillReport);
    }
  });

  const offDaily = aiReview?.onTick(() => {
    void aiReview?.backfill(getCurrentTasks()).then(readAiReviewBackfillReport);
  });

  const offWeekly = aiReview?.onWeeklyTick(() => {
    void aiReview?.generateWeekly(getScheduledWeeklyReportDateKey(), getCurrentTasks()).then(handleScheduledReportResult);
  });

  const offMonthly = aiReview?.onMonthlyTick(() => {
    void aiReview?.generateMonthly(getScheduledMonthlyReportDateKey(), getCurrentTasks()).then(handleScheduledReportResult);
  });

  return () => {
    offDaily?.();
    offWeekly?.();
    offMonthly?.();
  };
}

export interface RequestAiReviewOnboardingOptions {
  aiReview?: AiReviewApi;
  setAiOnboarding: (settings: AiReviewSettings) => void;
}

export function requestAiReviewOnboarding({
  aiReview,
  setAiOnboarding,
}: RequestAiReviewOnboardingOptions): () => void {
  let active = true;
  void aiReview?.getSettings().then((value) => {
    const settings = normalizeAiReviewSettings(value);
    if (active && shouldShowOnboarding(settings)) setAiOnboarding(settings);
  });
  return () => {
    active = false;
  };
}
