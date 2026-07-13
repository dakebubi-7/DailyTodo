import type { Dispatch, SetStateAction } from 'react';
import type { Task, TaskCompletionReview } from '../types/task';
import { findTaskInTree } from '../utils/taskTree';
import {
  getMainTaskToggleDecision,
  getSubtaskToggleDecision,
  getViewCompletionDecision,
  resolveCompletionTarget,
  type CompletionTarget,
} from './appCompletionFlow';

type NullableTaskSetter = Dispatch<SetStateAction<Task | null>>;
type CompletionTargetSetter = Dispatch<SetStateAction<CompletionTarget | null>>;

export interface AppCompletionActionsDependencies {
  tasks: Task[];
  allTasks: Task[];
  completionTarget: CompletionTarget | null;
  mainTaskCompletionReviewEnabled: boolean;
  subtaskCompletionReviewEnabled: boolean;
  toggleTask: (id: string) => void;
  toggleSubtask: (id: string) => void;
  markSubtaskDoneWithoutReview: (id: string) => void;
  completeTaskWithReview: (taskId: string, review: Omit<TaskCompletionReview, 'reviewedAt' | 'id'>) => void;
  updateSubtaskReview: (taskId: string, review: Omit<TaskCompletionReview, 'reviewedAt' | 'id'>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  setCompletionTarget: CompletionTargetSetter;
  setCompletionTask: NullableTaskSetter;
  setReviewTask: NullableTaskSetter;
}

export function createAppCompletionActions({
  tasks,
  allTasks,
  completionTarget,
  mainTaskCompletionReviewEnabled,
  subtaskCompletionReviewEnabled,
  toggleTask,
  toggleSubtask,
  markSubtaskDoneWithoutReview,
  completeTaskWithReview,
  updateSubtaskReview,
  updateTask,
  setCompletionTarget,
  setCompletionTask,
  setReviewTask,
}: AppCompletionActionsDependencies) {
  return {
    toggleTask: (id: string) => {
      const decision = getMainTaskToggleDecision(
        tasks.find((item) => item.id === id),
        mainTaskCompletionReviewEnabled,
      );

      if (decision.kind === 'requestReview') {
        setCompletionTarget(decision.target);
        setCompletionTask(decision.task);
        return;
      }

      toggleTask(id);
    },
    toggleSubtask: (id: string) => {
      const decision = getSubtaskToggleDecision(
        findTaskInTree(allTasks, id),
        subtaskCompletionReviewEnabled,
      );

      if (decision.kind === 'requestReview') {
        setCompletionTarget(decision.target);
        setCompletionTask(decision.task);
        return;
      }

      if (decision.kind === 'completeSubtaskWithoutReview') {
        markSubtaskDoneWithoutReview(id);
        return;
      }

      toggleSubtask(id);
    },
    changeSubtaskPriority: (id: string, priority: Task['priority']) => {
      updateTask(id, { priority });
    },
    completeWithReview: (taskId: string, review: Omit<TaskCompletionReview, 'reviewedAt' | 'id'>) => {
      const target = resolveCompletionTarget(completionTarget, taskId);
      if (target.mode === 'subtask') {
        updateSubtaskReview(taskId, review);
      } else {
        completeTaskWithReview(taskId, review);
      }
      setCompletionTask(null);
      setReviewTask(null);
      setCompletionTarget(null);
    },
    completeWithoutReview: (taskId: string) => {
      const target = resolveCompletionTarget(completionTarget, taskId);
      if (target.mode === 'subtask') {
        markSubtaskDoneWithoutReview(taskId);
      } else {
        toggleTask(taskId);
      }
      setCompletionTask(null);
      setCompletionTarget(null);
    },
    viewCompletion: (task: Task) => {
      const decision = getViewCompletionDecision(task);
      setCompletionTarget(decision.target);
      if (decision.kind === 'editMissingReview') {
        setCompletionTask(decision.task);
        return;
      }
      setReviewTask(decision.task);
    },
  };
}
