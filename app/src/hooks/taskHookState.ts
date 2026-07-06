import type { AppBehaviorSettings } from '../../shared/appSettings';
import type { Task } from '../types/task';
import type { ObsidianSyncStatus } from './taskObsidianSync';
import { normalizeTask } from './taskTransforms';

export function getInitialObsidianSyncStatus(obsidianPath: string): ObsidianSyncStatus {
  return obsidianPath ? 'idle' : 'needs-path';
}

export function getSelectedDateAfterBusinessDateChange(
  selectedDate: string,
  previousBusinessDate: string,
  nextBusinessDate: string,
): string {
  return selectedDate === previousBusinessDate ? nextBusinessDate : selectedDate;
}

export function normalizeIncomingTasks(incoming: unknown, today: string): Task[] {
  return Array.isArray(incoming)
    ? incoming.map((task) => normalizeTask(task as Task, today))
    : [];
}

export function shouldClearRetainedReviewsOnSettingsUpdate(nextSettings: AppBehaviorSettings): boolean {
  return nextSettings.syncDeletedReviewsToObsidian;
}
