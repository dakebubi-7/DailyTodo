import { describe, expect, it, vi } from 'vitest';
import { createTaskTreeActionHandlers } from '../src/hooks/taskTreeActions';
import type { Task } from '../src/types/task';

function createHarness() {
  let tasks: Task[] = [
    { id: 'first', text: 'First', completed: false, priority: 'high', createdAt: '2026-07-26T08:00:00.000Z', taskDate: '2026-07-26', isToday: true },
    { id: 'second', text: 'Second', completed: false, priority: 'low', createdAt: '2026-07-26T08:00:00.000Z', taskDate: '2026-07-26', isToday: true },
    { id: 'done', text: 'Done', completed: true, priority: 'medium', createdAt: '2026-07-26T08:00:00.000Z', taskDate: '2026-07-26', isToday: true },
  ];
  const handlers = createTaskTreeActionHandlers({
    currentDate: '2026-07-26',
    selectedDate: '2026-07-26',
    setAllTasks: (updater) => { tasks = updater(tasks); },
    setArchivedObsidianTasks: () => {},
    persistArchivedObsidianTasks: vi.fn(),
    createId: () => 'new-id',
    getTimestamp: () => '2026-07-26T09:00:00.000Z',
  });
  return { handlers, getTasks: () => tasks };
}

describe('Today Focus task actions', () => {
  it('routes an explicit selection through the Today Focus contract', () => {
    const { handlers, getTasks } = createHarness();

    handlers.setTodayFocus(['second', 'first']);

    expect(getTasks()).toMatchObject([
      { id: 'first', priority: 'high', focusDate: '2026-07-26', focusOrder: 1 },
      { id: 'second', priority: 'low', focusDate: '2026-07-26', focusOrder: 0 },
      { id: 'done', completed: true },
    ]);
  });

  it('keeps the existing focus unchanged when a selection includes an unavailable task', () => {
    const { handlers, getTasks } = createHarness();
    handlers.setTodayFocus(['first']);

    handlers.setTodayFocus(['done']);

    expect(getTasks()[0]).toMatchObject({
      id: 'first',
      focusDate: '2026-07-26',
      focusOrder: 0,
    });
    expect(getTasks()[2]).toMatchObject({ id: 'done', completed: true });
  });

  it('synchronizes manual focus states with task completion and reopening', () => {
    const { handlers, getTasks } = createHarness();
    handlers.setTodayFocus(['first', 'second']);

    handlers.setTodayFocusState('first', 'blocked', 'Waiting for API access');
    expect(getTasks()[0]).toMatchObject({
      id: 'first',
      completed: false,
      focusState: 'blocked',
      focusReason: 'Waiting for API access',
    });

    handlers.setTodayFocusState('first', 'completed');
    expect(getTasks()[0]).toMatchObject({ id: 'first', completed: true, focusState: 'completed' });

    handlers.toggleTask('first');
    expect(getTasks()[0]).toMatchObject({ id: 'first', completed: false, focusState: 'not-started' });
  });

  it('keeps one active focus task and reconciles nested subtask completion', () => {
    const { handlers, getTasks } = createHarness();
    const nested = getTasks()[1];
    nested.subtasks = [{
      id: 'nested', text: 'Nested', completed: false, priority: 'medium', createdAt: '2026-07-26T08:00:00.000Z', taskDate: '2026-07-26', isToday: true,
    }];

    handlers.setTodayFocus(['first', 'second', 'nested']);
    handlers.setTodayFocusState('first', 'in-progress');
    handlers.setTodayFocusState('second', 'in-progress');
    expect(getTasks()[0]).toMatchObject({ id: 'first', focusState: 'not-started' });
    expect(getTasks()[1]).toMatchObject({ id: 'second', focusState: 'in-progress' });

    handlers.toggleSubtask('nested');
    expect(getTasks()[1].subtasks?.[0]).toMatchObject({
      id: 'nested',
      completed: true,
      focusState: 'completed',
    });
  });

  it('adopts a review suggestion through the explicit action without losing completion history', () => {
    const review = {
      id: 'review-1', status: 'done' as const, percent: 100, summary: 'Released', unknowns: '', nextStep: 'Write the report', reviewedAt: '2026-07-25T18:00:00.000Z',
    };
    const completedStage: Task = {
      id: 'done', text: 'Done', completed: true, cleared: true, completedAt: '2026-07-25T18:00:00.000Z', priority: 'medium', createdAt: '2026-07-25T08:00:00.000Z', taskDate: '2026-07-25', isToday: false, completionReview: review, completionReviews: [review],
    };
    let tasks: Task[] = [completedStage];
    const adoptingHandlers = createTaskTreeActionHandlers({
      currentDate: '2026-07-26',
      selectedDate: '2026-07-26',
      setAllTasks: (updater) => { tasks = updater(tasks); },
      setArchivedObsidianTasks: () => {},
      persistArchivedObsidianTasks: vi.fn(),
      createId: () => 'new-id',
      getTimestamp: () => '2026-07-26T09:00:00.000Z',
    });

    adoptingHandlers.adoptDailyReviewSuggestion({
      taskId: 'done',
      sourceDate: '2026-07-25',
      sourceReviewId: 'review-1',
      sourceReviewRevision: 'review-1|done|100',
      suggestedAction: 'Write the release report.',
      action: 'Write the release report.',
    });

    expect(tasks[0]).toMatchObject({
      id: 'done', completed: false, focusDate: '2026-07-26', focusAction: 'Write the release report.', completionReviews: [review],
    });
    expect(tasks[0]).not.toHaveProperty('completedAt');
    expect(tasks[0]).not.toHaveProperty('cleared');
  });
});
