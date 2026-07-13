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

function mergeReviewsIntoTask(task: Task, retainedReviews: RetainedObsidianReview[]): Task {
  const reviews = task.completionReviews?.length
    ? [...task.completionReviews]
    : task.completionReview
      ? [task.completionReview]
      : [];
  const reviewIds = new Set(reviews.map(getReviewIdentity));

  for (const { review } of retainedReviews) {
    const identity = getReviewIdentity(review);
    if (reviewIds.has(identity)) continue;
    reviewIds.add(identity);
    reviews.push(review);
  }

  reviews.sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
  return {
    ...task,
    completed: true,
    completionReviews: reviews,
    completionReview: reviews[reviews.length - 1],
  };
}

function mergeRetainedReviewsIntoTaskTree(
  tasks: Task[],
  retainedReviewsByTaskId: Map<string, RetainedObsidianReview[]>,
  mergedTaskIds: Set<string>,
): Task[] {
  let nextTasks = tasks;

  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    const retainedReviews = retainedReviewsByTaskId.get(task.id);
    const nextSubtasks = task.subtasks?.length
      ? mergeRetainedReviewsIntoTaskTree(task.subtasks, retainedReviewsByTaskId, mergedTaskIds)
      : task.subtasks;
    const nextTask = retainedReviews
      ? mergeReviewsIntoTask({ ...task, subtasks: nextSubtasks }, retainedReviews)
      : nextSubtasks === task.subtasks
        ? task
        : { ...task, subtasks: nextSubtasks };

    if (retainedReviews) mergedTaskIds.add(task.id);
    if (nextTask === task) continue;

    if (nextTasks === tasks) nextTasks = tasks.slice();
    nextTasks[index] = nextTask;
  }

  return nextTasks;
}

export function mergeRetainedReviewsForObsidian(
  tasks: Task[],
  retainedReviews: RetainedObsidianReview[],
) {
  if (!retainedReviews.length) return tasks;

  const retainedReviewsByTaskId = new Map<string, RetainedObsidianReview[]>();
  for (const retainedReview of retainedReviews) {
    const taskReviews = retainedReviewsByTaskId.get(retainedReview.task.id);
    if (taskReviews) taskReviews.push(retainedReview);
    else retainedReviewsByTaskId.set(retainedReview.task.id, [retainedReview]);
  }

  const mergedTaskIds = new Set<string>();
  const nextTasks = mergeRetainedReviewsIntoTaskTree(tasks, retainedReviewsByTaskId, mergedTaskIds);
  const archivedOnly: Task[] = [];

  for (const [taskId, taskReviews] of retainedReviewsByTaskId) {
    if (mergedTaskIds.has(taskId)) continue;
    archivedOnly.push(mergeReviewsIntoTask(taskReviews[0].task, taskReviews));
  }

  return [...nextTasks, ...archivedOnly];
}
