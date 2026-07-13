import {
  forEachVisibleCompletionReview,
  getVisibleCompletionReviews,
} from './obsidianTemplateCompletionReviewVisibility';
import { getTaskDate } from './taskRollover';
import type { ObsidianTemplateCompletionReview, ObsidianTemplateTask } from './obsidianTemplateTaskLines';

export function collectVisibleTaskData(tasks: ObsidianTemplateTask[], date: string) {
  const visibleTasks = new Set<ObsidianTemplateTask>();
  const visibleReviewsByTask = new Map<ObsidianTemplateTask, ObsidianTemplateCompletionReview[]>();
  const taskDates = new Map<ObsidianTemplateTask, string>();

  const collectTask = (task: ObsidianTemplateTask): boolean => {
    let hasVisibleChild = false;
    for (const subtask of task.subtasks || []) {
      if (collectTask(subtask)) hasVisibleChild = true;
    }

    const taskDate = getTaskDate(task, '');
    const visibleReviews = getVisibleCompletionReviews(task, date, taskDate);
    taskDates.set(task, taskDate);
    visibleReviewsByTask.set(task, visibleReviews);
    const isVisible = taskDate === date || visibleReviews.length > 0 || hasVisibleChild;
    if (isVisible) visibleTasks.add(task);
    return isVisible;
  };

  for (const task of tasks) collectTask(task);
  return { visibleTasks, visibleReviewsByTask, taskDates };
}

export function collectVisibleTaskStats(tasks: ObsidianTemplateTask[], date: string) {
  const reviewKeys = new Set<string>();
  let completionRecordCount = 0;
  let taskCount = 0;

  const collectTask = (task: ObsidianTemplateTask): boolean => {
    let hasVisibleChild = false;
    for (const subtask of task.subtasks || []) {
      if (collectTask(subtask)) hasVisibleChild = true;
    }

    const taskDate = getTaskDate(task, '');
    const visibleReviewCount = forEachVisibleCompletionReview(task, date, taskDate === date, (review) => {
      reviewKeys.add(`${task.id}:${review.id || review.reviewedAt}`);
    });
    const isVisible = taskDate === date || visibleReviewCount > 0 || hasVisibleChild;
    if (!isVisible) return false;

    taskCount += 1;
    completionRecordCount += visibleReviewCount;
    return true;
  };

  for (const task of tasks) collectTask(task);
  return { taskCount, completionRecordCount, reviewKeys };
}
