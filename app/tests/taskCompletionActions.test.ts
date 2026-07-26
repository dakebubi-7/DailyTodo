import { describe, expect, it, vi } from 'vitest';
import { createTaskCompletionActionHandlers } from '../src/hooks/taskCompletionActions';
import type { Task } from '../src/types/task';

function createHarness(
  settings = { confirmBeforeDeletingReview: false },
  ids = ['review-1'],
  timestamps = ['2026-07-14T10:00:00.000Z'],
) {
  let idIndex = 0;
  let timestampIndex = 0;
  let tasks: Task[] = [{
    id: 'task-1', text: 'Ship', completed: false, priority: 'medium', createdAt: '2026-07-14T08:00:00.000Z', taskDate: '2026-07-14', isToday: true,
    focusDate: '2026-07-14', focusOrder: 0,
    subtasks: [{ id: 'subtask-1', text: 'Test', completed: false, priority: 'medium', createdAt: '2026-07-14T08:00:00.000Z', taskDate: '2026-07-14', isToday: true, focusDate: '2026-07-14', focusOrder: 1 }],
  }];
  const persistRetainedReviews = vi.fn();
  const handlers = createTaskCompletionActionHandlers({
    appSettings: settings,
    currentDate: '2026-07-14',
    setAllTasks: (updater) => { tasks = updater(tasks); },
    setRetainedReviews: (updater) => updater([]),
    persistRetainedReviews,
    confirmDeleteReview: () => false,
    createId: () => ids[idIndex++]!,
    getTimestamp: () => timestamps[timestampIndex++]!,
  });
  return { handlers, getTasks: () => tasks, persistRetainedReviews };
}

describe('task completion actions', () => {
  it('appends a review and completes the selected task', () => {
    const { handlers, getTasks } = createHarness();
    handlers.completeTaskWithReview('task-1', { status: 'done', percent: 100, summary: 'Done', unknowns: '', nextStep: '' });
    const task = getTasks()[0]!;
    expect(task.completed).toBe(true);
    expect(task.focusState).toBe('completed');
    expect(task.completionReviews).toMatchObject([{ id: 'review-1', reviewedAt: '2026-07-14T10:00:00.000Z' }]);
  });

  it('marks a nested task done without adding a review', () => {
    const { handlers, getTasks } = createHarness();
    handlers.markSubtaskDoneWithoutReview('subtask-1');
    const subtask = getTasks()[0]!.subtasks![0]!;
    expect(subtask).toMatchObject({ completed: true, completedAt: '2026-07-14T10:00:00.000Z' });
    expect(subtask.focusState).toBe('completed');
    expect(subtask.completionReviews).toBeUndefined();
  });

  it('restores the previous done state after deleting the latest partial record', () => {
    const { handlers, getTasks } = createHarness(
      { confirmBeforeDeletingReview: false },
      ['review-done', 'review-partial'],
      ['2026-07-14T10:00:00.000Z', '2026-07-14T11:00:00.000Z'],
    );
    handlers.completeTaskWithReview('task-1', {
      status: 'done', percent: 100, summary: 'Initial stage', unknowns: '', nextStep: '',
    });
    handlers.completeTaskWithReview('task-1', {
      status: 'partial', percent: 70, summary: 'Continued work', unknowns: '', nextStep: 'Finish it',
    });

    handlers.deleteTaskReview('task-1', 'review-partial');

    expect(getTasks()[0]).toMatchObject({
      completed: true,
      completedAt: '2026-07-14T10:00:00.000Z',
      completionReview: { id: 'review-done', status: 'done' },
    });
  });
});
