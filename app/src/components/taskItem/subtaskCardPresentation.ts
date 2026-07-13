import type { Task } from '../../types/task';
import { priorityTitles } from './taskItemPresentation';

export function getSubtaskCompleteActionLabel(completed: boolean) {
  return completed ? '\u6807\u8bb0\u5b50\u4efb\u52a1\u4e3a\u672a\u5b8c\u6210' : '\u6807\u8bb0\u5b50\u4efb\u52a1\u4e3a\u5b8c\u6210';
}

export function getSubtaskRowClassName(completed: boolean) {
  return `task-subtask-row task-subtask-card ${completed ? 'task-subtask-row-completed' : ''}`;
}

export const SUBTASK_PRIORITY_PICKER_TITLE = '\u8c03\u6574\u5b50\u4efb\u52a1\u4f18\u5148\u7ea7';
export const SUBTASK_EDIT_INPUT_LABEL = '\u7f16\u8f91\u5b50\u4efb\u52a1';
export const SUBTASK_DELETE_ACTION_LABEL = '\u5220\u9664\u5b50\u4efb\u52a1';

export function getSubtaskTextTitle(subtask: Pick<Task, 'text' | 'priority'>) {
  return `${subtask.text} \u00b7 ${priorityTitles[subtask.priority]}`;
}

export function getSubtaskReviewActionLabel(hasReview: boolean) {
  return hasReview ? '\u67e5\u770b\u5b50\u4efb\u52a1\u5b8c\u6210\u60c5\u51b5' : '\u8865\u5199\u5b50\u4efb\u52a1\u5b8c\u6210\u60c5\u51b5';
}
