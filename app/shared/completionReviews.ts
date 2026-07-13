import type { TaskCompletionReview } from '../src/types/task';

export type TaskCompletionReviewStatus = TaskCompletionReview['status'];

export function isTaskCompletionReviewStatus(value: unknown): value is TaskCompletionReviewStatus {
  return value === 'done' || value === 'partial' || value === 'blocked';
}

type CompletionReviewTaskLike = {
  completionReview?: TaskCompletionReview;
  completionReviews?: TaskCompletionReview[];
};

/**
 * 取任务的完成复盘记录列表。优先新版数组字段 completionReviews，
 * 回退旧版单条 completionReview。纯数据操作，无任何 Node 依赖，
 * 渲染进程与主进程都可安全引用。
 */
export function getCompletionReviews(task: CompletionReviewTaskLike) {
  const reviews = task.completionReviews?.length
    ? task.completionReviews
    : task.completionReview ? [task.completionReview] : [];
  return reviews.slice().sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
}
