import type { Task } from '../types/task';
import { isSubtask } from '../utils/taskTree';

export type CompletionTarget = { mode: 'task' | 'subtask'; id: string };

export type ToggleCompletionDecision =
  | { kind: 'toggle' }
  | { kind: 'completeSubtaskWithoutReview' }
  | { kind: 'requestReview'; target: CompletionTarget; task: Task };

export type ViewCompletionDecision =
  | { kind: 'editMissingReview'; target: CompletionTarget; task: Task }
  | { kind: 'viewReview'; target: CompletionTarget; task: Task };

export function getMainTaskToggleDecision(
  task: Task | undefined,
  mainTaskCompletionReviewEnabled: boolean,
): ToggleCompletionDecision {
  if (!task || task.completed) return { kind: 'toggle' };
  if (!mainTaskCompletionReviewEnabled) return { kind: 'toggle' };
  return { kind: 'requestReview', target: { mode: 'task', id: task.id }, task };
}

export function getSubtaskToggleDecision(
  subtask: Task | null,
  subtaskCompletionReviewEnabled: boolean,
): ToggleCompletionDecision {
  if (!subtask || subtask.completed) return { kind: 'toggle' };
  if (!subtaskCompletionReviewEnabled) return { kind: 'completeSubtaskWithoutReview' };
  return { kind: 'requestReview', target: { mode: 'subtask', id: subtask.id }, task: subtask };
}

export function resolveCompletionTarget(
  completionTarget: CompletionTarget | null,
  taskId: string,
): CompletionTarget {
  return completionTarget?.id === taskId ? completionTarget : { mode: 'task' as const, id: taskId };
}

export function getViewCompletionDecision(task: Task): ViewCompletionDecision {
  const hasReview = Boolean(task.completionReviews?.length || task.completionReview);
  const target: CompletionTarget = { mode: isSubtask(task) ? 'subtask' : 'task', id: task.id };
  if (!hasReview && task.completed) return { kind: 'editMissingReview', target, task };
  return { kind: 'viewReview', target, task };
}
