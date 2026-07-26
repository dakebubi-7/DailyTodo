import type { ElectronTask } from './sharedTypes';
import { isObjectRecord } from './unknownValueGuards';

export type ObsidianSyncTask = ElectronTask;

export type ObsidianSyncInput = {
  tasks: ObsidianSyncTask[];
  beforeTasks?: ObsidianSyncTask[];
  date?: string;
  dailyWork: string;
  inspiration: string;
};

export type ReadObsidianSyncInputResult =
  | { ok: true; value: ObsidianSyncInput }
  | { ok: false; error: string };

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string';
}

function isTaskCompletionReview(value: unknown): value is NonNullable<ObsidianSyncTask['completionReview']> {
  return (
    isObjectRecord(value) &&
    isOptionalString(value.id) &&
    (value.status === 'done' || value.status === 'partial' || value.status === 'blocked') &&
    typeof value.percent === 'number' &&
    typeof value.summary === 'string' &&
    typeof value.unknowns === 'string' &&
    typeof value.nextStep === 'string' &&
    typeof value.reviewedAt === 'string'
  );
}

function isSubtaskCarryoverProgress(value: unknown): value is NonNullable<ObsidianSyncTask['subtaskCarryoverProgress']> {
  return isObjectRecord(value)
    && typeof value.total === 'number'
    && Number.isInteger(value.total)
    && value.total > 0
    && typeof value.remaining === 'number'
    && Number.isInteger(value.remaining)
    && value.remaining > 0
    && value.remaining <= value.total;
}

function isObsidianSyncTask(value: unknown): value is ObsidianSyncTask {
  if (!isObjectRecord(value)) return false;
  const subtasks = value.subtasks;
  const completionReviews = value.completionReviews;
  return (
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.completed === 'boolean' &&
    (value.priority === 'high' || value.priority === 'medium' || value.priority === 'low') &&
    typeof value.createdAt === 'string' &&
    (value.isToday === undefined || typeof value.isToday === 'boolean') &&
    isOptionalString(value.taskDate) &&
    isOptionalString(value.carriedFromDate) &&
    isOptionalString(value.carriedFromTaskId) &&
    (value.subtaskCarryoverProgress === undefined || isSubtaskCarryoverProgress(value.subtaskCarryoverProgress)) &&
    isOptionalString(value.completedAt) &&
    (value.completionReview === undefined || isTaskCompletionReview(value.completionReview)) &&
    (completionReviews === undefined ||
      (Array.isArray(completionReviews) && completionReviews.every(isTaskCompletionReview))) &&
    (subtasks === undefined || (Array.isArray(subtasks) && subtasks.every(isObsidianSyncTask)))
  );
}

export function hasValidObsidianSyncTasks(value: unknown): value is ObsidianSyncTask[] {
  return Array.isArray(value) && value.every(isObsidianSyncTask);
}

export function readObsidianSyncInput(
  tasks: unknown,
  date: unknown,
  dailyWork: unknown,
  inspiration: unknown,
  beforeTasks?: unknown,
): ReadObsidianSyncInputResult {
  if (!Array.isArray(tasks) || (beforeTasks !== undefined && !Array.isArray(beforeTasks))) {
    return { ok: false, error: 'Obsidian sync tasks input must be an array.' };
  }
  if (!hasValidObsidianSyncTasks(tasks) || (beforeTasks !== undefined && !hasValidObsidianSyncTasks(beforeTasks))) {
    return { ok: false, error: 'Obsidian sync tasks input contains malformed task entries.' };
  }
  if (typeof dailyWork !== 'string' || typeof inspiration !== 'string') {
    return { ok: false, error: 'Obsidian sync dailyWork and inspiration inputs must be strings.' };
  }
  if (date !== undefined && typeof date !== 'string') {
    return { ok: false, error: 'Obsidian sync selected date input must be a string.' };
  }
  return {
    ok: true,
    value: { tasks, beforeTasks, date, dailyWork, inspiration },
  };
}
