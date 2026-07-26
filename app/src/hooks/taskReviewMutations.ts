import type { RetainedObsidianReview } from '../../shared/obsidianReviewRetention';
import {
  getReviewIdentity,
  retainDeletedReview,
} from '../../shared/obsidianReviewRetention';
import type { Task, TaskCompletionReview } from '../types/task';
import { resolveCompletionState } from '../../shared/taskCompletionSemantics';

export interface AppendCompletionReviewInput {
  review: Omit<TaskCompletionReview, 'reviewedAt'>;
  id: string;
  reviewedAt: string;
}

export type TaskReviewUpdates = Partial<Pick<TaskCompletionReview, 'status' | 'percent' | 'summary' | 'unknowns' | 'nextStep'>>;

function getExistingTaskReviews(task: Task): TaskCompletionReview[] {
  return task.completionReviews?.length
    ? task.completionReviews
    : task.completionReview ? [task.completionReview] : [];
}

function getLatestTaskReview(reviews: TaskCompletionReview[]) {
  let latest = reviews[0];
  for (let index = 1; index < reviews.length; index += 1) {
    const review = reviews[index];
    if (review.reviewedAt > latest.reviewedAt) latest = review;
  }
  return latest;
}

export function appendCompletionReviewToTask(task: Task, { review, id, reviewedAt }: AppendCompletionReviewInput): Task {
  const nextReview: TaskCompletionReview = {
    ...review,
    id,
    reviewedAt,
  };
  const completionReviews = [...getExistingTaskReviews(task), nextReview];

  return {
    ...task,
    ...resolveCompletionState(nextReview),
    completionReview: nextReview,
    completionReviews,
  };
}

export function deleteReviewFromTask(task: Task, reviewId: string): Task {
  const existingReviews = getExistingTaskReviews(task);
  if (!existingReviews.some((review) => getReviewIdentity(review) === reviewId)) return task;

  const reviews: TaskCompletionReview[] = [];
  let latestReview: TaskCompletionReview | undefined;
  for (const review of existingReviews) {
    if (getReviewIdentity(review) === reviewId) continue;
    reviews.push(review);
    if (!latestReview || review.reviewedAt > latestReview.reviewedAt) latestReview = review;
  }

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
    ...resolveCompletionState(latestReview),
    completionReviews: reviews,
    completionReview: latestReview,
  };
}

export function updateTaskReview(task: Task, reviewId: string, updates: TaskReviewUpdates): Task {
  const existingReviews = getExistingTaskReviews(task);
  const index = existingReviews.findIndex((review) => getReviewIdentity(review) === reviewId);
  if (index === -1) return task;

  const existingReview = existingReviews[index];
  if (Object.entries(updates).every(([key, value]) => existingReview[key as keyof TaskReviewUpdates] === value)) {
    return task;
  }

  const reviews = [...existingReviews];
  reviews[index] = { ...existingReview, ...updates };
  return {
    ...task,
    ...resolveCompletionState(getLatestTaskReview(reviews)),
    completionReviews: reviews,
    completionReview: getLatestTaskReview(reviews),
  };
}

export function findTaskReview(task: Task, reviewId: string): TaskCompletionReview | undefined {
  const existingReviews = getExistingTaskReviews(task);
  return existingReviews.find((review) => getReviewIdentity(review) === reviewId);
}

export function retainDeletedTaskReviewForObsidian(
  retainedReviews: RetainedObsidianReview[],
  task: Task,
  reviewId: string,
  deletedAt?: string,
): RetainedObsidianReview[] {
  const deletedReview = findTaskReview(task, reviewId);
  if (!deletedReview) return retainedReviews;

  return retainDeletedReview(retainedReviews, task, deletedReview, deletedAt);
}

export function getDeleteTaskReviewConfirmationMessage(): string {
  return '将删除 DailyTodo 本地完成记录；已有的 Obsidian 历史记录会保留。继续吗？';
}
