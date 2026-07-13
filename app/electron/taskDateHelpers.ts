import type { ElectronTask } from './sharedTypes';
import { getTaskDate as getSharedTaskDate } from '../shared/taskRollover';

type ElectronTaskReview = NonNullable<ElectronTask['completionReview']>;

export function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateKey(date?: unknown) {
  const value = typeof date === 'string' && date ? date : getTodayDate();
  return value.slice(0, 10);
}

export function getTaskDate(task: ElectronTask) {
  return getSharedTaskDate(task, getTodayDate());
}

export function getReviewDate(review: ElectronTaskReview) {
  return getDateKey(review.reviewedAt);
}

export function getCompletionReviews(task: ElectronTask) {
  if (task.completionReviews?.length) return task.completionReviews;
  return task.completionReview ? [task.completionReview] : [];
}
