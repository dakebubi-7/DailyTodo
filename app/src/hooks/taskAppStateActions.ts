import type { AppBehaviorSettings } from '../../shared/appSettings';
import type { RetainedObsidianReview } from '../../shared/obsidianReviewRetention';
import { updateStringRecordValue } from './taskPersistence';

type TaskAppStateActionHandlersOptions = {
  appSettings: AppBehaviorSettings;
  selectedDate: string;
  areSettingsEqual(left: AppBehaviorSettings, right: AppBehaviorSettings): boolean;
  shouldClearRetainedReviews(next: AppBehaviorSettings): boolean;
  setAppSettings(value: AppBehaviorSettings): void;
  persistAppSettings(value: AppBehaviorSettings): void;
  setRetainedReviews(updater: (previous: RetainedObsidianReview[]) => RetainedObsidianReview[]): void;
  persistRetainedReviews(value: RetainedObsidianReview[]): void;
  setDailyWork(updater: (previous: Record<string, string>) => Record<string, string>): void;
  setDailyInspiration(updater: (previous: Record<string, string>) => Record<string, string>): void;
};

export function createTaskAppStateActionHandlers({
  appSettings,
  selectedDate,
  areSettingsEqual,
  shouldClearRetainedReviews,
  setAppSettings,
  persistAppSettings,
  setRetainedReviews,
  persistRetainedReviews,
  setDailyWork,
  setDailyInspiration,
}: TaskAppStateActionHandlersOptions) {
  return {
    updateAppSettings(next: AppBehaviorSettings) {
      if (shouldClearRetainedReviews(next)) {
        setRetainedReviews((previous) => {
          if (!previous.length) return previous;
          persistRetainedReviews([]);
          return [];
        });
      }
      if (areSettingsEqual(appSettings, next)) return;
      setAppSettings(next);
      persistAppSettings(next);
    },
    updateDailyWork(value: string) {
      setDailyWork((previous) => updateStringRecordValue(previous, selectedDate, value));
    },
    updateDailyInspiration(value: string) {
      setDailyInspiration((previous) => updateStringRecordValue(previous, selectedDate, value));
    },
  };
}
