import type { TaskCompletionReview } from '../src/types/task';

export type ObsidianTemplateCompletionReview = TaskCompletionReview;

export type CompletionReviewTask = {
  completionReview?: ObsidianTemplateCompletionReview;
  completionReviews?: ObsidianTemplateCompletionReview[];
};

const EMPTY_COMPLETION_REVIEWS: ObsidianTemplateCompletionReview[] = [];

function getReviewDate(review: ObsidianTemplateCompletionReview) {
  return review.reviewedAt.slice(0, 10);
}

export function getVisibleCompletionReviews(
  task: CompletionReviewTask,
  date: string,
  taskDate: string,
): ObsidianTemplateCompletionReview[] {
  const reviews = task.completionReviews?.length
    ? task.completionReviews
    : task.completionReview
      ? [task.completionReview]
      : EMPTY_COMPLETION_REVIEWS;

  if (taskDate === date) {
    return reviews.length > 1
      ? [...reviews].sort((left, right) => left.reviewedAt.localeCompare(right.reviewedAt))
      : reviews;
  }

  let visibleReviews = EMPTY_COMPLETION_REVIEWS;
  for (const review of reviews) {
    if (getReviewDate(review) !== date) continue;
    if (visibleReviews === EMPTY_COMPLETION_REVIEWS) visibleReviews = [];
    visibleReviews.push(review);
  }

  return visibleReviews.length > 1
    ? visibleReviews.sort((left, right) => left.reviewedAt.localeCompare(right.reviewedAt))
    : visibleReviews;
}

export function forEachVisibleCompletionReview(
  task: CompletionReviewTask,
  date: string,
  includeAll: boolean,
  visit: (review: ObsidianTemplateCompletionReview) => void,
) {
  const reviews = task.completionReviews;
  const visitIfVisible = (review: ObsidianTemplateCompletionReview) => {
    if (!includeAll && getReviewDate(review) !== date) return 0;
    visit(review);
    return 1;
  };

  if (reviews?.length) {
    let count = 0;
    for (const review of reviews) count += visitIfVisible(review);
    return count;
  }

  return task.completionReview ? visitIfVisible(task.completionReview) : 0;
}
