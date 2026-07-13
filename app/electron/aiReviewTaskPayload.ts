import type { ElectronTask, TaskCompletionReview } from './sharedTypes';
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
    (value.completionReview === undefined || isTaskCompletionReview(value.completionReview)) &&
    (value.completionReviews === undefined || (Array.isArray(value.completionReviews) && value.completionReviews.every(isTaskCompletionReview))) &&
    (value.subtasks === undefined || (Array.isArray(value.subtasks) && value.subtasks.every(isAiReviewTask)))
  );
}

export function isAiReviewTaskArray(value: unknown): value is ElectronTask[] {
  return Array.isArray(value) && value.every(isAiReviewTask);
}
