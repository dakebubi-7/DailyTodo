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

function mapTaskTree(tasks: Task[], targetId: string, updater: (task: Task) => Task): Task[] {
  return tasks.map((task) => {
    const nextTask = task.id === targetId ? updater(task) : task;
    if (!nextTask.subtasks?.length) return nextTask;
    return {
      ...nextTask,
      subtasks: mapTaskTree(nextTask.subtasks, targetId, updater),
    };
  });
}

function findTaskInTree(tasks: Task[], targetId: string): Task | undefined {
  for (const task of tasks) {
    if (task.id === targetId) return task;
    const found = task.subtasks?.length ? findTaskInTree(task.subtasks, targetId) : undefined;
    if (found) return found;
  }
  return undefined;
}

export function mergeRetainedReviewsForObsidian(
  tasks: Task[],
  retainedReviews: RetainedObsidianReview[],
) {
  if (!retainedReviews.length) return tasks;

  let nextTasks = tasks;
  const archivedOnly = new Map<string, Task>();

  retainedReviews.forEach(({ task: archivedTask, review }) => {
    const existingTask = findTaskInTree(nextTasks, archivedTask.id);
    const baseTask = existingTask || archivedTask;
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
    const nextTask = {
      ...baseTask,
      completed: true,
      completionReviews: reviews,
      completionReview: reviews[reviews.length - 1],
    };

    if (existingTask) {
      nextTasks = mapTaskTree(nextTasks, baseTask.id, () => nextTask);
    } else {
      archivedOnly.set(baseTask.id, nextTask);
    }
  });

  return [...nextTasks, ...archivedOnly.values()];
}
