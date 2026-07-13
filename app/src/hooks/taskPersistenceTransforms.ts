import { getBusinessDateKey, getTaskDate, isDateKey } from '../../shared/taskRollover';
import { isObjectRecord } from '../../shared/unknownValueGuards';
import type { Task, TaskCompletionReview } from '../types/task';

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

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string';
}

function isOptionalBoolean(value: unknown) {
  return value === undefined || typeof value === 'boolean';
}

function isOptionalStringArray(value: unknown) {
  return value === undefined || (Array.isArray(value) && value.every((entry) => typeof entry === 'string'));
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
  if (!isObjectRecord(value)) return false;
  return (
    isOptionalString(value.id) &&
    (value.status === 'done' || value.status === 'partial' || value.status === 'blocked') &&
    typeof value.percent === 'number' &&
    Number.isFinite(value.percent) &&
    typeof value.summary === 'string' &&
    typeof value.unknowns === 'string' &&
    typeof value.nextStep === 'string' &&
    typeof value.reviewedAt === 'string'
  );
}

export function isTaskLike(value: unknown): value is Task {
  if (!isObjectRecord(value)) return false;
  const subtasks = value.subtasks;
  const completionReviews = value.completionReviews;
  return (
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.completed === 'boolean' &&
    (value.priority === 'high' || value.priority === 'medium' || value.priority === 'low') &&
    typeof value.createdAt === 'string' &&
    (value.source === undefined || value.source === 'personal' || value.source === 'external') &&
    isOptionalString(value.taskDate) &&
    isOptionalBoolean(value.isToday) &&
    isOptionalString(value.carriedFromDate) &&
    isOptionalString(value.carriedFromTaskId) &&
    isOptionalString(value.completedAt) &&
    isOptionalBoolean(value.cleared) &&
    isOptionalStringArray(value.scheduledDates) &&
    isOptionalStringArray(value.tags) &&
    isOptionalString(value.parentTaskId) &&
    isOptionalBoolean(value.collapsed) &&
    (value.completionReview === undefined || isTaskCompletionReview(value.completionReview)) &&
    (completionReviews === undefined ||
      (Array.isArray(completionReviews) && completionReviews.every(isTaskCompletionReview))) &&
    (subtasks === undefined || (Array.isArray(subtasks) && subtasks.every(isTaskLike)))
  );
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

  if (
    task.taskDate === taskDate
    && task.isToday === (taskDate === currentBusinessDate)
    && scheduledDates === task.scheduledDates
    && subtasks === task.subtasks
    && completionReviews === task.completionReviews
    && completionReview === task.completionReview
    && Object.hasOwn(task, 'taskDate')
    && Object.hasOwn(task, 'isToday')
    && Object.hasOwn(task, 'scheduledDates')
    && Object.hasOwn(task, 'subtasks')
    && Object.hasOwn(task, 'completionReviews')
    && Object.hasOwn(task, 'completionReview')
  ) {
    return task;
  }

  return {
    ...task,
    taskDate,
    isToday: taskDate === currentBusinessDate,
    scheduledDates,
    subtasks,
    completionReviews,
    completionReview,
  };
}
