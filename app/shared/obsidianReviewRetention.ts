import type { Task, TaskCompletionReview } from '../src/types/task';

export interface RetainedObsidianReview {
  task: Task;
  review: TaskCompletionReview;
  deletedAt: string;
}

export function getReviewIdentity(review: TaskCompletionReview) {
  return review.id || review.reviewedAt;
}

export function retainDeletedReview(
  retainedReviews: RetainedObsidianReview[],
  task: Task,
  review: TaskCompletionReview,
  deletedAt = new Date().toISOString(),
) {
  const identity = getReviewIdentity(review);
  const alreadyRetained = retainedReviews.some((item) => (
    item.task.id === task.id && getReviewIdentity(item.review) === identity
  ));

  if (alreadyRetained) return retainedReviews;
  return [...retainedReviews, { task, review, deletedAt }];
}

export function mergeRetainedReviewsForObsidian(
  tasks: Task[],
  retainedReviews: RetainedObsidianReview[],
) {
  if (!retainedReviews.length) return tasks;

  const taskMap = new Map(tasks.map((task) => [task.id, task]));

  retainedReviews.forEach(({ task: archivedTask, review }) => {
    const baseTask = taskMap.get(archivedTask.id) || archivedTask;
    const reviews = baseTask.completionReviews?.length
      ? [...baseTask.completionReviews]
      : baseTask.completionReview
        ? [baseTask.completionReview]
        : [];
    const identity = getReviewIdentity(review);

    if (!reviews.some((existing) => getReviewIdentity(existing) === identity)) {
      reviews.push(review);
    }

    reviews.sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
    taskMap.set(baseTask.id, {
      ...baseTask,
      completed: true,
      completionReviews: reviews,
      completionReview: reviews[reviews.length - 1],
    });
  });

  const originalIds = new Set(tasks.map((task) => task.id));
  const archivedOnlyTasks = retainedReviews
    .map(({ task }) => task.id)
    .filter((id, index, ids) => !originalIds.has(id) && ids.indexOf(id) === index)
    .map((id) => taskMap.get(id))
    .filter(Boolean) as Task[];

  return [...tasks.map((task) => taskMap.get(task.id) || task), ...archivedOnlyTasks];
}
