import { isObjectRecord } from './unknownValueGuards';

export type ValidatedTaskSource = 'personal' | 'external';

export type ValidatedTaskCompletionReview = {
  id?: string;
  status: 'done' | 'partial' | 'blocked';
  percent: number;
  summary: string;
  unknowns: string;
  nextStep: string;
  reviewedAt: string;
};

export type ValidatedTask = {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  source?: ValidatedTaskSource;
  createdAt: string;
  taskDate?: string;
  isToday?: boolean;
  carriedFromDate?: string;
  carriedFromTaskId?: string;
  completedAt?: string;
  completionReview?: ValidatedTaskCompletionReview;
  completionReviews?: ValidatedTaskCompletionReview[];
  cleared?: boolean;
  scheduledDates?: string[];
  tags?: string[];
  subtasks?: ValidatedTask[];
  parentTaskId?: string;
  collapsed?: boolean;
};

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string';
}

function isOptionalBoolean(value: unknown) {
  return value === undefined || typeof value === 'boolean';
}

function isOptionalStringArray(value: unknown) {
  return value === undefined || (Array.isArray(value) && value.every((entry) => typeof entry === 'string'));
}

export function isTaskCompletionReview(value: unknown): value is ValidatedTaskCompletionReview {
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

export function isTaskLike(value: unknown): value is ValidatedTask {
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

export function filterValidTasks(value: unknown): ValidatedTask[] {
  if (!Array.isArray(value)) return [];
  const tasks: ValidatedTask[] = [];
  for (const task of value) {
    if (isTaskLike(task)) tasks.push(task);
  }
  return tasks;
}
