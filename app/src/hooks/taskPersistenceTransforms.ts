import { getBusinessDateKey, getTaskDate, isDateKey } from '../../shared/taskRollover';
import type { FocusState, SubtaskCarryoverProgress, Task, TaskCompletionReview, TaskHandoff } from '../types/task';
import {
  isTaskCompletionReview as isSharedTaskCompletionReview,
  isTaskHandoff as isSharedTaskHandoff,
  isTaskFocusAdoption as isSharedTaskFocusAdoption,
  isTaskLike as isSharedTaskLike,
} from '../../shared/taskValidation';

export function normalizeScheduledDates(dates: string[] | undefined, primaryDate: string) {
  const uniqueDates = new Set<string>();
  for (const date of dates || []) {
    if (isDateKey(date) && date !== primaryDate) uniqueDates.add(date);
  }
  const normalized = Array.from(uniqueDates).sort();
  return normalized.length ? normalized : undefined;
}

function getLatestCompletionReview(reviews: TaskCompletionReview[] | undefined, fallback?: TaskCompletionReview) {
  if (!reviews?.length) return fallback;

  let latest = reviews[0];
  for (let index = 1; index < reviews.length; index += 1) {
    const review = reviews[index];
    if (review.reviewedAt > latest.reviewedAt) latest = review;
  }
  return latest;
}

function haveSameStrings(left: string[] | undefined, right: string[] | undefined) {
  if (left === right) return true;
  if (!left || !right || left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function normalizeSubtasks(subtasks: Task[] | undefined, currentBusinessDate: string) {
  if (!subtasks?.length) return subtasks;

  let normalizedSubtasks = subtasks;
  for (let index = 0; index < subtasks.length; index += 1) {
    const subtask = subtasks[index];
    const normalizedSubtask = normalizeTask(subtask, currentBusinessDate);
    if (normalizedSubtask === subtask) continue;
    if (normalizedSubtasks === subtasks) normalizedSubtasks = subtasks.slice();
    normalizedSubtasks[index] = normalizedSubtask;
  }
  return normalizedSubtasks;
}

export function isTaskCompletionReview(value: unknown): value is TaskCompletionReview {
  return isSharedTaskCompletionReview(value);
}

export function isTaskHandoff(value: unknown): value is TaskHandoff {
  return isSharedTaskHandoff(value);
}

export function isTaskFocusAdoption(value: unknown): boolean {
  return isSharedTaskFocusAdoption(value);
}

export function isSubtaskCarryoverProgress(value: unknown): value is SubtaskCarryoverProgress {
  if (!value || typeof value !== 'object') return false;
  const progress = value as Record<string, unknown>;
  return Number.isInteger(progress.total)
    && (progress.total as number) > 0
    && Number.isInteger(progress.remaining)
    && (progress.remaining as number) > 0
    && (progress.remaining as number) <= (progress.total as number);
}

export function isTaskLike(value: unknown): value is Task {
  return isSharedTaskLike(value);
}

export function parseStoredTasks(value: unknown, currentBusinessDate = getBusinessDateKey()): Task[] {
  if (!Array.isArray(value)) return [];
  const tasks: Task[] = [];
  for (const task of value) {
    if (!isTaskLike(task)) continue;
    tasks.push(normalizeTask(task, currentBusinessDate));
  }
  return tasks;
}

export function normalizeTask(task: Task, currentBusinessDate: string): Task {
  const completionReviews = task.completionReviews?.length
    ? task.completionReviews
    : task.completionReview
      ? [task.completionReview]
      : undefined;
  const taskDate = getTaskDate(task, currentBusinessDate);
  const normalizedScheduledDates = normalizeScheduledDates(task.scheduledDates, taskDate);
  const scheduledDates = haveSameStrings(task.scheduledDates, normalizedScheduledDates)
    ? task.scheduledDates
    : normalizedScheduledDates;
  const subtasks = normalizeSubtasks(task.subtasks, currentBusinessDate);
  const completionReview = getLatestCompletionReview(completionReviews, task.completionReview);
  const focusDate = isDateKey(task.focusDate) ? task.focusDate : undefined;
  const focusState: FocusState | undefined = task.focusState === 'not-started' || task.focusState === 'in-progress' || task.focusState === 'blocked' || task.focusState === 'completed'
    ? task.focusState
    : undefined;
  const focusOrder = focusDate && typeof task.focusOrder === 'number' && Number.isInteger(task.focusOrder) && task.focusOrder >= 0
    ? task.focusOrder
    : undefined;
  const focusReason = typeof task.focusReason === 'string' ? task.focusReason : undefined;
  const focusAction = typeof task.focusAction === 'string' ? task.focusAction : undefined;
  const focusAdoption = isTaskFocusAdoption(task.focusAdoption) ? task.focusAdoption : undefined;
  const nextStep = typeof task.nextStep === 'string' ? task.nextStep : undefined;
  const handoff = isTaskHandoff(task.handoff) ? task.handoff : undefined;
  const carryoverContext = isTaskHandoff(task.carryoverContext) ? task.carryoverContext : undefined;
  const subtaskCarryoverProgress = isSubtaskCarryoverProgress(task.subtaskCarryoverProgress)
    ? task.subtaskCarryoverProgress
    : undefined;

  if (
    task.taskDate === taskDate
    && task.isToday === (taskDate === currentBusinessDate)
    && scheduledDates === task.scheduledDates
    && subtasks === task.subtasks
    && completionReviews === task.completionReviews
    && completionReview === task.completionReview
    && focusDate === task.focusDate
    && focusOrder === task.focusOrder
    && focusState === task.focusState
    && focusReason === task.focusReason
    && focusAction === task.focusAction
    && focusAdoption === task.focusAdoption
    && nextStep === task.nextStep
    && handoff === task.handoff
    && carryoverContext === task.carryoverContext
    && subtaskCarryoverProgress === task.subtaskCarryoverProgress
    && Object.hasOwn(task, 'taskDate')
    && Object.hasOwn(task, 'isToday')
    && Object.hasOwn(task, 'scheduledDates')
    && Object.hasOwn(task, 'subtasks')
    && Object.hasOwn(task, 'completionReviews')
    && Object.hasOwn(task, 'completionReview')
    && (subtaskCarryoverProgress !== undefined || !Object.hasOwn(task, 'subtaskCarryoverProgress'))
  ) {
    return task;
  }

  const {
    focusDate: _storedFocusDate,
    focusOrder: _storedFocusOrder,
    focusState: _storedFocusState,
    focusReason: _storedFocusReason,
    focusAction: _storedFocusAction,
    focusAdoption: _storedFocusAdoption,
    nextStep: _storedNextStep,
    handoff: _storedHandoff,
    carryoverContext: _storedCarryoverContext,
    subtaskCarryoverProgress: _storedSubtaskCarryoverProgress,
    ...taskWithoutWorkflowMetadata
  } = task;

  return {
    ...taskWithoutWorkflowMetadata,
    taskDate,
    isToday: taskDate === currentBusinessDate,
    scheduledDates,
    subtasks,
    completionReviews,
    completionReview,
    ...(focusDate ? { focusDate } : {}),
    ...(focusOrder !== undefined ? { focusOrder } : {}),
    ...(focusState ? { focusState } : {}),
    ...(focusReason !== undefined ? { focusReason } : {}),
    ...(focusAction !== undefined ? { focusAction } : {}),
    ...(focusAdoption !== undefined ? { focusAdoption } : {}),
    ...(nextStep !== undefined ? { nextStep } : {}),
    ...(handoff ? { handoff } : {}),
    ...(carryoverContext ? { carryoverContext } : {}),
    ...(subtaskCarryoverProgress ? { subtaskCarryoverProgress } : {}),
  };
}
