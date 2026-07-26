import type { Task } from '../../types/task';
import type { AppLanguage } from '../../../shared/appSettings';

export const priorityTitles: Record<Task['priority'], string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

export function hasTaskReview(task: Task) {
  return Boolean(task.completionReviews?.length || task.completionReview);
}

export function getTaskTextTitle(task: Pick<Task, 'text' | 'priority'>) {
  return `${task.text} \u00b7 ${priorityTitles[task.priority]}`;
}

export interface TaskCardClassNameOptions {
  hasChildren: boolean;
  hasTags: boolean;
  canOpenReviewAction: boolean;
  completed: boolean;
}

export function getTaskCardClassName({
  hasChildren,
  hasTags,
  canOpenReviewAction,
  completed,
}: TaskCardClassNameOptions) {
  return `task-card task-cluster-main-card group ${hasChildren ? 'task-card-has-children' : 'task-card-no-children'} ${hasTags ? 'task-card-has-tags' : 'task-card-no-tags'} ${canOpenReviewAction ? 'task-card-has-review-action' : 'task-card-no-review-action'} ${completed ? 'task-card-completed' : ''}`;
}

export interface TaskClusterClassNameOptions {
  hasChildren: boolean;
  isExpanded: boolean;
}

export function getTaskClusterClassName({
  hasChildren,
  isExpanded,
}: TaskClusterClassNameOptions) {
  return `task-cluster ${hasChildren ? 'task-cluster-has-children' : 'task-cluster-no-children'} ${isExpanded ? 'task-cluster-expanded' : 'task-cluster-collapsed'}`;
}


export function getTaskCompleteActionClassName(completed: boolean) {
  return `task-complete-action ${completed ? 'task-complete-action-complete' : ''}`;
}

export function getTaskCompleteActionLabel(completed: boolean) {
  return completed ? '\u6807\u8bb0\u4e3a\u672a\u5b8c\u6210' : '\u6807\u8bb0\u4e3a\u5b8c\u6210';
}


export function getTaskReviewActionLabel(hasReview: boolean) {
  return hasReview ? '\u67e5\u770b\u5b8c\u6210\u60c5\u51b5' : '\u8865\u5199\u5b8c\u6210\u60c5\u51b5';
}

export const TASK_DRAG_HANDLE_LABEL = '\u62d6\u52a8\u8c03\u6574\u4efb\u52a1\u987a\u5e8f';
export const TASK_EDIT_INPUT_LABEL = '\u7f16\u8f91\u4efb\u52a1';
export const TASK_DELETE_ACTION_LABEL = '\u5220\u9664\u4efb\u52a1';
export const TASK_SUBTASKS_LABEL = '\u5b50\u4efb\u52a1';

export function getSubtaskCarryoverNotice(
  language: AppLanguage,
  carriedFromDate: string | undefined,
  progress: Task['subtaskCarryoverProgress'],
) {
  if (!carriedFromDate || !progress) return undefined;

  const date = new Date(`${carriedFromDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;

  const formattedDate = new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date);
  return language === 'en-US'
    ? `Continued from ${formattedDate} \u00b7 ${progress.remaining}/${progress.total} remaining`
    : `\u627f\u63a5\u81ea ${formattedDate} \u00b7 \u5269\u4f59 ${progress.remaining}/${progress.total} \u9879`;
}

export function getVisibleTaskTags(tags: string[] | undefined) {
  return {
    visibleTags: tags?.slice(0, 2) ?? [],
    remainingTagCount: Math.max((tags?.length ?? 0) - 2, 0),
  };
}

export function getVisibleScheduledDates(scheduledDates: string[] | undefined) {
  return {
    visibleScheduledDates: scheduledDates?.slice(0, 3) ?? [],
    remainingScheduledDateCount: Math.max((scheduledDates?.length ?? 0) - 3, 0),
  };
}
