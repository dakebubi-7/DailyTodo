import type { ObsidianSyncTask } from './obsidianSyncValidation';

type ObsidianSyncPlanningOptions = {
  getTaskDate(task: ObsidianSyncTask): string;
  getReviewDate(review: NonNullable<ObsidianSyncTask['completionReview']>): string;
};

function hasCompletionRecordOnDate(
  task: ObsidianSyncTask,
  selected: string,
  { getReviewDate }: ObsidianSyncPlanningOptions,
) {
  const reviews = task.completionReviews;
  if (reviews?.length) {
    return reviews.some((review) => getReviewDate(review) === selected);
  }
  return task.completionReview ? getReviewDate(task.completionReview) === selected : false;
}

function collectAffectedSyncDates(
  tasks: ObsidianSyncTask[],
  selected: string,
  dates: Set<string>,
  options: ObsidianSyncPlanningOptions,
) {
  const visit = (task: ObsidianSyncTask) => {
    const taskDate = options.getTaskDate(task);
    const hasRecordOnSelected = hasCompletionRecordOnDate(task, selected, options);

    if (taskDate === selected || hasRecordOnSelected) {
      dates.add(taskDate);
    }
    task.subtasks?.forEach(visit);
  };

  tasks.forEach(visit);
}

export function getDatesAffectedBySync(
  tasksAfterSync: ObsidianSyncTask[],
  selected: string,
  options: ObsidianSyncPlanningOptions,
  tasksBeforeSync?: ObsidianSyncTask[],
) {
  const dates = new Set([selected]);
  if (tasksBeforeSync?.length) {
    collectAffectedSyncDates(tasksBeforeSync, selected, dates, options);
  }
  collectAffectedSyncDates(tasksAfterSync, selected, dates, options);
  return Array.from(dates);
}
