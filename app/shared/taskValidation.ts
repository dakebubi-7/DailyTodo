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

export type ValidatedTaskHandoff = {
  status: 'done' | 'partial' | 'blocked' | 'in-progress';
  progressSummary: string;
  blocker: string;
  nextStep: string;
  shouldCarryForward: boolean;
  createdAt: string;
  source: 'manual' | 'ai';
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
  focusDate?: string;
  focusOrder?: number;
  focusState?: 'not-started' | 'in-progress' | 'blocked' | 'completed';
  focusReason?: string;
  nextStep?: string;
  handoff?: ValidatedTaskHandoff;
  carryoverContext?: ValidatedTaskHandoff;
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

export function isTaskHandoff(value: unknown): value is ValidatedTaskHandoff {
  if (!isObjectRecord(value)) return false;
  return (
    (value.status === 'done' || value.status === 'partial' || value.status === 'blocked' || value.status === 'in-progress') &&
    typeof value.progressSummary === 'string' &&
    typeof value.blocker === 'string' &&
    typeof value.nextStep === 'string' &&
    typeof value.shouldCarryForward === 'boolean' &&
    typeof value.createdAt === 'string' &&
    (value.source === 'manual' || value.source === 'ai')
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

export function isStrictTaskLike(value: unknown): value is ValidatedTask {
  if (!isTaskLike(value) || !isObjectRecord(value)) return false;
  const subtasks = value.subtasks;
  return (
    isOptionalString(value.focusDate) &&
    (value.focusOrder === undefined || (typeof value.focusOrder === 'number' && Number.isInteger(value.focusOrder) && value.focusOrder >= 0)) &&
    (value.focusState === undefined || value.focusState === 'not-started' || value.focusState === 'in-progress' || value.focusState === 'blocked' || value.focusState === 'completed') &&
    isOptionalString(value.focusReason) &&
    isOptionalString(value.nextStep) &&
    (value.handoff === undefined || isTaskHandoff(value.handoff)) &&
    (value.carryoverContext === undefined || isTaskHandoff(value.carryoverContext)) &&
    (subtasks === undefined || (Array.isArray(subtasks) && subtasks.every(isStrictTaskLike)))
  );
}

export function filterValidTasks(value: unknown): ValidatedTask[] {
  if (!Array.isArray(value)) return [];
  const tasks: ValidatedTask[] = [];
  for (const task of value) {
    if (isStrictTaskLike(task)) tasks.push(task);
  }
  return tasks;
}
