import type { RetainedObsidianReview } from '../../shared/obsidianReviewRetention';
import type { Task, TaskCompletionReview } from '../types/task';
import { mapTaskTree } from './taskTree';
import {
  appendCompletionReviewToTask,
  deleteReviewFromTask,
  markTaskDoneWithoutReview,
  retainDeletedTaskReviewForObsidian,
  updateTaskReview,
} from './taskMutations';

type CompletionActionSettings = Pick<
  import('../../shared/appSettings').AppBehaviorSettings,
  'confirmBeforeDeletingReview'
>;

type CreateTaskCompletionActionHandlersOptions = {
  appSettings: CompletionActionSettings;
  setAllTasks(updater: (previous: Task[]) => Task[]): void;
  setRetainedReviews(updater: (previous: RetainedObsidianReview[]) => RetainedObsidianReview[]): void;
  persistRetainedReviews(value: RetainedObsidianReview[]): void;
  confirmDeleteReview(): boolean;
  createId(): string;
  getTimestamp(): string;
};

export function createTaskCompletionActionHandlers({
  appSettings,
  setAllTasks,
  setRetainedReviews,
  persistRetainedReviews,
  confirmDeleteReview,
  createId,
  getTimestamp,
}: CreateTaskCompletionActionHandlersOptions) {
  function appendReview(taskId: string, review: Omit<TaskCompletionReview, 'reviewedAt'>) {
    const reviewedAt = getTimestamp();
    const id = createId();
    setAllTasks((previous) => mapTaskTree(previous, taskId, (task) => appendCompletionReviewToTask(task, {
      review,
      id,
      reviewedAt,
    })));
  }

  return {
    completeTaskWithReview(taskId: string, review: Omit<TaskCompletionReview, 'reviewedAt'>) {
      appendReview(taskId, review);
    },
    deleteTaskReview(taskId: string, reviewId: string) {
      if (appSettings.confirmBeforeDeletingReview && !confirmDeleteReview()) return;
      setAllTasks((previous) => mapTaskTree(previous, taskId, (task) => {
        setRetainedReviews((retained) => {
          const next = retainDeletedTaskReviewForObsidian(retained, task, reviewId);
          if (next === retained) return retained;
          persistRetainedReviews(next);
          return next;
        });
        return deleteReviewFromTask(task, reviewId);
      }));
    },
    deleteTaskReviews(records: Array<{ taskId: string; reviewId: string }>) {
      if (!records.length) return;
      setAllTasks((previous) => records.reduce((tasks, { taskId, reviewId }) => (
        mapTaskTree(tasks, taskId, (task) => {
          setRetainedReviews((retained) => {
            const next = retainDeletedTaskReviewForObsidian(retained, task, reviewId);
            if (next === retained) return retained;
            persistRetainedReviews(next);
            return next;
          });
          return deleteReviewFromTask(task, reviewId);
        })
      ), previous));
    },
    updateSubtaskReview(subtaskId: string, review: Omit<TaskCompletionReview, 'reviewedAt' | 'id'>) {
      appendReview(subtaskId, review);
    },
    markSubtaskDoneWithoutReview(subtaskId: string) {
      const completedAt = getTimestamp();
      setAllTasks((previous) => mapTaskTree(previous, subtaskId, (task) => markTaskDoneWithoutReview(task, completedAt)));
    },
    editTaskReview(
      taskId: string,
      reviewId: string,
      updates: Partial<Pick<TaskCompletionReview, 'status' | 'percent' | 'summary' | 'unknowns' | 'nextStep'>>,
    ) {
      setAllTasks((previous) => mapTaskTree(previous, taskId, (task) => updateTaskReview(task, reviewId, updates)));
    },
  };
}
