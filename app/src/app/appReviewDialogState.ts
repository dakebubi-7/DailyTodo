import type { Task } from '../types/task';
import { findTaskInTree } from '../utils/taskTree';

export interface AppReviewDialogState {
  completionTask: Task | null;
  currentReviewTask: Task | null;
}

export function createAppReviewDialogState({
  allTasks,
  completionTask,
  reviewTask,
}: {
  allTasks: Task[];
  completionTask: Task | null;
  reviewTask: Task | null;
}): AppReviewDialogState {
  return {
    completionTask,
    currentReviewTask: reviewTask ? findTaskInTree(allTasks, reviewTask.id) : null,
  };
}
