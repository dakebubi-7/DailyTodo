import type { AppBehaviorSettings } from '../../shared/appSettings';
import { updateStringRecordValue } from './taskPersistence';

type TaskAppStateActionHandlersOptions = {
  appSettings: AppBehaviorSettings;
  selectedDate: string;
  areSettingsEqual(left: AppBehaviorSettings, right: AppBehaviorSettings): boolean;
  setAppSettings(value: AppBehaviorSettings): void;
  persistAppSettings(value: AppBehaviorSettings): void;
  setDailyWork(updater: (previous: Record<string, string>) => Record<string, string>): void;
  setDailyInspiration(updater: (previous: Record<string, string>) => Record<string, string>): void;
};

export function createTaskAppStateActionHandlers({
  appSettings,
  selectedDate,
  areSettingsEqual,
  setAppSettings,
  persistAppSettings,
  setDailyWork,
  setDailyInspiration,
}: TaskAppStateActionHandlersOptions) {
  return {
    updateAppSettings(next: AppBehaviorSettings) {
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
