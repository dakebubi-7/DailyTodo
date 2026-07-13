import type { AppBehaviorSettings } from '../../shared/appSettings';
import type { Task } from '../types/task';
import type { ObsidianSyncStatus } from './taskObsidianSync';
import { parseStoredTasks } from './taskTransforms';

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
  return parseStoredTasks(incoming, today);
}

function areTaskValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((entry, index) => areTaskValuesEqual(entry, right[index]));
  }

  let leftKeyCount = 0;
  for (const [key, value] of Object.entries(left)) {
    if (value === undefined) continue;
    const rightValue = Object.getOwnPropertyDescriptor(right, key)?.value;
    if (!Object.hasOwn(right, key) || !areTaskValuesEqual(value, rightValue)) return false;
    leftKeyCount += 1;
  }

  let rightKeyCount = 0;
  for (const value of Object.values(right)) {
    if (value !== undefined) rightKeyCount += 1;
  }
  return leftKeyCount === rightKeyCount;
}

export function areTaskListsEqual(left: Task[], right: Task[]): boolean {
  return areTaskValuesEqual(left, right);
}

export function areAppBehaviorSettingsEqual(
  left: AppBehaviorSettings,
  right: AppBehaviorSettings,
): boolean {
  return left.language === right.language
    && left.rolloverTime === right.rolloverTime
    && left.autoCarryForward === right.autoCarryForward
    && left.syncDeletedReviewsToObsidian === right.syncDeletedReviewsToObsidian
    && left.confirmBeforeDeletingReview === right.confirmBeforeDeletingReview
    && left.mainTaskCompletionReviewEnabled === right.mainTaskCompletionReviewEnabled
    && left.subtaskCompletionReviewEnabled === right.subtaskCompletionReviewEnabled
    && left.lockWindowPosition === right.lockWindowPosition
    && left.minimizeToTrayOnClose === right.minimizeToTrayOnClose;
}

export function shouldClearRetainedReviewsOnSettingsUpdate(nextSettings: AppBehaviorSettings): boolean {
  return nextSettings.syncDeletedReviewsToObsidian;
}
