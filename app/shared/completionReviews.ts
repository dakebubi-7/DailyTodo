import type { Task } from '../src/types/task';

/**
 * 取任务的完成复盘记录列表。优先新版数组字段 completionReviews，
 * 回退旧版单条 completionReview。纯数据操作，无任何 Node 依赖，
 * 渲染进程与主进程都可安全引用。
 */
export function getCompletionReviews(task: Task) {
  if (task.completionReviews?.length) return task.completionReviews;
  return task.completionReview ? [task.completionReview] : [];
}
