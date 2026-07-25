import type { ElectronTask, TaskCompletionReview, TaskHandoff } from './sharedTypes';
import { isObjectRecord } from './unknownValueGuards';

function isTaskCompletionReview(value: unknown): value is TaskCompletionReview {
  if (!isObjectRecord(value)) return false;
  return (
    (value.id === undefined || typeof value.id === 'string') &&
    (value.status === 'done' || value.status === 'partial' || value.status === 'blocked') &&
    typeof value.percent === 'number' &&
    Number.isFinite(value.percent) &&
    typeof value.summary === 'string' &&
    typeof value.unknowns === 'string' &&
    typeof value.nextStep === 'string' &&
    typeof value.reviewedAt === 'string'
  );
}

function isTaskHandoff(value: unknown): value is TaskHandoff {
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

function isAiReviewTask(value: unknown): value is ElectronTask {
  if (!isObjectRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.completed === 'boolean' &&
    (value.priority === 'high' || value.priority === 'medium' || value.priority === 'low') &&
    typeof value.createdAt === 'string' &&
    typeof value.isToday === 'boolean' &&
    (value.taskDate === undefined || typeof value.taskDate === 'string') &&
    (value.carriedFromDate === undefined || typeof value.carriedFromDate === 'string') &&
    (value.carriedFromTaskId === undefined || typeof value.carriedFromTaskId === 'string') &&
    (value.completedAt === undefined || typeof value.completedAt === 'string') &&
    (value.cleared === undefined || typeof value.cleared === 'boolean') &&
    (value.focusDate === undefined || typeof value.focusDate === 'string') &&
    (value.focusOrder === undefined || (typeof value.focusOrder === 'number' && Number.isInteger(value.focusOrder) && value.focusOrder >= 0)) &&
    (value.focusState === undefined || value.focusState === 'not-started' || value.focusState === 'in-progress' || value.focusState === 'blocked' || value.focusState === 'completed') &&
    (value.focusReason === undefined || typeof value.focusReason === 'string') &&
    (value.nextStep === undefined || typeof value.nextStep === 'string') &&
    (value.handoff === undefined || isTaskHandoff(value.handoff)) &&
    (value.carryoverContext === undefined || isTaskHandoff(value.carryoverContext)) &&
    (value.completionReview === undefined || isTaskCompletionReview(value.completionReview)) &&
    (value.completionReviews === undefined || (Array.isArray(value.completionReviews) && value.completionReviews.every(isTaskCompletionReview))) &&
    (value.subtasks === undefined || (Array.isArray(value.subtasks) && value.subtasks.every(isAiReviewTask)))
  );
}

export function isAiReviewTaskArray(value: unknown): value is ElectronTask[] {
  return Array.isArray(value) && value.every(isAiReviewTask);
}
