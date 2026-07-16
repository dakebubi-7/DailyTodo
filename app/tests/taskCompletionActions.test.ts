import { describe, expect, it, vi } from 'vitest';
import { createTaskCompletionActionHandlers } from '../src/hooks/taskCompletionActions';
import type { Task } from '../src/types/task';

function createHarness(settings = { confirmBeforeDeletingReview: false, syncDeletedReviewsToObsidian: true }) {
  let tasks: Task[] = [{
    id: 'task-1', text: 'Ship', completed: false, priority: 'medium', createdAt: '2026-07-14T08:00:00.000Z', taskDate: '2026-07-14', isToday: true,
    subtasks: [{ id: 'subtask-1', text: 'Test', completed: false, priority: 'medium', createdAt: '2026-07-14T08:00:00.000Z', taskDate: '2026-07-14', isToday: true }],
  }];
  const persistRetainedReviews = vi.fn();
  const handlers = createTaskCompletionActionHandlers({
    appSettings: settings,
    setAllTasks: (updater) => { tasks = updater(tasks); },
    setRetainedReviews: (updater) => updater([]),
    persistRetainedReviews,
    confirmDeleteReview: () => false,
    createId: () => 'review-1',
    getTimestamp: () => '2026-07-14T10:00:00.000Z',
  });
  return { handlers, getTasks: () => tasks, persistRetainedReviews };
}

describe('task completion actions', () => {
  it('appends a review and completes the selected task', () => {
    const { handlers, getTasks } = createHarness();
    handlers.completeTaskWithReview('task-1', { status: 'done', percent: 100, summary: 'Done', unknowns: '', nextStep: '' });
    const task = getTasks()[0]!;
    expect(task.completed).toBe(true);
    expect(task.completionReviews).toMatchObject([{ id: 'review-1', reviewedAt: '2026-07-14T10:00:00.000Z' }]);
  });

  it('marks a nested task done without adding a review', () => {
    const { handlers, getTasks } = createHarness();
    handlers.markSubtaskDoneWithoutReview('subtask-1');
    const subtask = getTasks()[0]!.subtasks![0]!;
    expect(subtask).toMatchObject({ completed: true, completedAt: '2026-07-14T10:00:00.000Z' });
    expect(subtask.completionReviews).toBeUndefined();
  });
});
