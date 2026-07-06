import type { RetainedObsidianReview } from '../../shared/obsidianReviewRetention';
import {
  getReviewIdentity,
  retainDeletedReview,
} from '../../shared/obsidianReviewRetention';
import type { Task, TaskCompletionReview } from '../types/task';

export interface AppendCompletionReviewInput {
  review: Omit<TaskCompletionReview, 'reviewedAt'>;
  id: string;
  reviewedAt: string;
}

export type TaskReviewUpdates = Partial<Pick<TaskCompletionReview, 'status' | 'percent' | 'summary' | 'unknowns' | 'nextStep'>>;

export function appendCompletionReviewToTask(task: Task, { review, id, reviewedAt }: AppendCompletionReviewInput): Task {
  const nextReview: TaskCompletionReview = {
    ...review,
    id,
    reviewedAt,
  };
  const completionReviews = [...(task.completionReviews || (task.completionReview ? [task.completionReview] : [])), nextReview];

  return {
    ...task,
    completed: true,
    completedAt: task.completedAt || reviewedAt,
    completionReview: nextReview,
    completionReviews,
  };
}

export function deleteReviewFromTask(task: Task, reviewId: string): Task {
  const existingReviews = task.completionReviews || (task.completionReview ? [task.completionReview] : []);
  const reviews = existingReviews.filter((review) => getReviewIdentity(review) !== reviewId);
  const latestReview = reviews[reviews.length - 1];

  if (!latestReview) {
    return {
      ...task,
      completed: false,
      completedAt: undefined,
      completionReviews: undefined,
      completionReview: undefined,
    };
  }

  return {
    ...task,
    completionReviews: reviews,
    completionReview: latestReview,
  };
}

export function updateTaskReview(task: Task, reviewId: string, updates: TaskReviewUpdates): Task {
  const reviews = [...(task.completionReviews?.length
    ? task.completionReviews
    : task.completionReview ? [task.completionReview] : [])];
  const index = reviews.findIndex((review) => getReviewIdentity(review) === reviewId);
  if (index === -1) return task;

  reviews[index] = { ...reviews[index], ...updates };
  return {
    ...task,
    completionReviews: reviews,
    completionReview: reviews[reviews.length - 1],
  };
}

export function findTaskReview(task: Task, reviewId: string): TaskCompletionReview | undefined {
  const existingReviews = task.completionReviews || (task.completionReview ? [task.completionReview] : []);
  return existingReviews.find((review) => getReviewIdentity(review) === reviewId);
}

export function retainDeletedTaskReviewForObsidian(
  retainedReviews: RetainedObsidianReview[],
  task: Task,
  reviewId: string,
  syncDeletedReviewsToObsidian: boolean,
  deletedAt?: string,
): RetainedObsidianReview[] {
  if (syncDeletedReviewsToObsidian) return retainedReviews;

  const deletedReview = findTaskReview(task, reviewId);
  if (!deletedReview) return retainedReviews;

  return retainDeletedReview(retainedReviews, task, deletedReview, deletedAt);
}

export function getDeleteTaskReviewConfirmationMessage(syncDeletedReviewsToObsidian: boolean): string {
  return syncDeletedReviewsToObsidian
    ? '将删除本地完成记录。因为已开启删除同步，下一次 Obsidian 同步会从 DailyTodo 管理区块中移除这条记录。继续吗？'
    : '将删除本地完成记录。继续吗？';
}
