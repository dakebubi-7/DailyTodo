import { describe, expect, it } from 'vitest';
import {
  applyTodayFocusState,
  applyTodayFocusSelection,
  getTodayFocusExecution,
  getTodayFocusCandidates,
  getTodayFocusRequestDraft,
  getTodayFocusTasks,
  reconcileTodayFocusCompletion,
} from '../shared/todayFocus';
import { parseStoredTasks } from '../src/hooks/taskPersistenceTransforms';

type FocusTask = Parameters<typeof applyTodayFocusSelection>[0][number];

function task(id: string, overrides: Partial<FocusTask> = {}): FocusTask {
  return {
    id,
    completed: false,
    priority: 'medium',
    taskDate: '2026-07-26',
    ...overrides,
  };
}

describe('Today Focus', () => {
  it('lists only open tasks applicable to the requested date as focus candidates', () => {
    const tasks = [
      task('open'),
      task('done', { completed: true }),
      task('cleared', { cleared: true }),
      task('tomorrow', { taskDate: '2026-07-27' }),
      task('scheduled', { taskDate: '2026-07-27', scheduledDates: ['2026-07-26'] }),
      task('parent', { subtasks: [task('subtask')] }),
    ];

    expect(getTodayFocusCandidates(tasks, '2026-07-26').map((entry) => entry.id)).toEqual([
      'open',
      'scheduled',
      'parent',
      'subtask',
    ]);
  });

  it('selects one to three existing open tasks for the requested business date in explicit order', () => {
    const tasks = [
      task('first', { priority: 'high', carriedFromDate: '2026-07-25' }),
      task('second'),
      task('third', { taskDate: '2026-07-27' }),
    ];

    const result = applyTodayFocusSelection(tasks, '2026-07-26', ['second', 'first']);

    expect(result).toEqual({ ok: true, tasks: expect.any(Array) });
    if (!result.ok) return;

    expect(getTodayFocusTasks(result.tasks, '2026-07-26').map((entry) => entry.id)).toEqual(['second', 'first']);
    expect(result.tasks).toMatchObject([
      { id: 'first', priority: 'high', carriedFromDate: '2026-07-25', focusDate: '2026-07-26', focusOrder: 1, focusState: 'not-started' },
      { id: 'second', focusDate: '2026-07-26', focusOrder: 0, focusState: 'not-started' },
      { id: 'third', taskDate: '2026-07-27' },
    ]);
  });

  it('rejects unavailable or completed task ids without changing the current focus', () => {
    const tasks = [
      task('focused', { focusDate: '2026-07-26', focusOrder: 0, focusState: 'in-progress' }),
      task('done', { completed: true }),
      task('tomorrow', { taskDate: '2026-07-27' }),
    ];

    expect(applyTodayFocusSelection(tasks, '2026-07-26', ['done'])).toEqual({
      ok: false,
      reason: 'task-unavailable',
      tasks,
    });
    expect(applyTodayFocusSelection(tasks, '2026-07-26', ['tomorrow'])).toEqual({
      ok: false,
      reason: 'task-unavailable',
      tasks,
    });
  });

  it('rejects more than three selected tasks without changing the current focus', () => {
    const tasks = [
      task('focused', { focusDate: '2026-07-26', focusOrder: 0 }),
      task('one'),
      task('two'),
      task('three'),
      task('four'),
    ];

    expect(applyTodayFocusSelection(tasks, '2026-07-26', ['one', 'two', 'three', 'four'])).toEqual({
      ok: false,
      reason: 'selection-limit',
      tasks,
    });
  });

  it('removes focus membership and reindexes the remaining focus order', () => {
    const tasks = [
      task('first', { focusDate: '2026-07-26', focusOrder: 0, focusState: 'in-progress', focusReason: 'Manual plan' }),
      task('second', { focusDate: '2026-07-26', focusOrder: 1, focusState: 'blocked' }),
      task('other-day', { focusDate: '2026-07-25', focusOrder: 0, focusState: 'completed' }),
    ];

    const result = applyTodayFocusSelection(tasks, '2026-07-26', ['second']);

    expect(result).toEqual({ ok: true, tasks: expect.any(Array) });
    if (!result.ok) return;

    expect(result.tasks).toMatchObject([
      { id: 'first' },
      { id: 'second', focusDate: '2026-07-26', focusOrder: 0, focusState: 'blocked' },
      { id: 'other-day', focusDate: '2026-07-25', focusOrder: 0, focusState: 'completed' },
    ]);
    expect(result.tasks[0]).not.toHaveProperty('focusDate');
    expect(result.tasks[0]).not.toHaveProperty('focusOrder');
    expect(result.tasks[0]).not.toHaveProperty('focusState');
    expect(result.tasks[0]).not.toHaveProperty('focusReason');
  });

  it('clears all focus membership for a date when the explicit selection is empty', () => {
    const tasks = [
      task('first', { focusDate: '2026-07-26', focusOrder: 0 }),
      task('yesterday', { focusDate: '2026-07-25', focusOrder: 0 }),
    ];

    const result = applyTodayFocusSelection(tasks, '2026-07-26', []);

    expect(result).toEqual({ ok: true, tasks: expect.any(Array) });
    if (!result.ok) return;
    expect(result.tasks).toMatchObject([
      { id: 'first' },
      { id: 'yesterday', focusDate: '2026-07-25', focusOrder: 0 },
    ]);
    expect(result.tasks[0]).not.toHaveProperty('focusDate');
    expect(result.tasks[0]).not.toHaveProperty('focusOrder');
  });

  it('prepares a requested task as an unpersisted focus draft without replacing existing focus', () => {
    const tasks = [
      task('first', { focusDate: '2026-07-26', focusOrder: 0 }),
      task('second', { focusDate: '2026-07-26', focusOrder: 1 }),
      task('requested'),
      task('fourth'),
    ];

    expect(getTodayFocusRequestDraft(tasks, '2026-07-26', 'requested')).toEqual([
      'first',
      'second',
      'requested',
    ]);
  });

  it('opens a full focus draft without replacing it when a request arrives', () => {
    const tasks = [
      task('first', { focusDate: '2026-07-26', focusOrder: 0 }),
      task('second', { focusDate: '2026-07-26', focusOrder: 1 }),
      task('third', { focusDate: '2026-07-26', focusOrder: 2 }),
      task('requested'),
    ];

    expect(getTodayFocusRequestDraft(tasks, '2026-07-26', 'requested')).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('retains validated adopted actions for an unchanged focus selection and clears them when removed', () => {
    const adoption = {
      sourceDate: '2026-07-25',
      sourceReviewId: 'review-1',
      sourceReviewRevision: 'review-1|partial|70',
      suggestedAction: 'Fix the startup error, then add the login-flow tests.',
      finalAction: 'Fix the startup error, then add the login-flow tests.',
      adoptedAt: '2026-07-26T08:30:00.000Z',
      mode: 'unchanged' as const,
    };
    const [stored] = parseStoredTasks([{
      id: 'adopted',
      text: 'Login flow',
      completed: false,
      priority: 'high',
      createdAt: '2026-07-26T08:00:00.000Z',
      taskDate: '2026-07-26',
      focusDate: '2026-07-26',
      focusOrder: 0,
      focusState: 'in-progress',
      focusAction: adoption.finalAction,
      focusAdoption: adoption,
    }], '2026-07-26');

    expect(stored).toMatchObject({
      focusAction: adoption.finalAction,
      focusAdoption: adoption,
    });

    const retained = applyTodayFocusSelection([stored], '2026-07-26', ['adopted']);
    expect(retained).toMatchObject({ ok: true });
    if (!retained.ok) return;
    expect(retained.tasks[0]).toMatchObject({
      focusAction: adoption.finalAction,
      focusAdoption: adoption,
    });

    const removed = applyTodayFocusSelection(retained.tasks, '2026-07-26', []);
    expect(removed).toMatchObject({ ok: true });
    if (!removed.ok) return;
    expect(removed.tasks[0]).not.toHaveProperty('focusAction');
    expect(removed.tasks[0]).not.toHaveProperty('focusAdoption');
  });

  it('sets one focused task in progress and resets the earlier active focus task', () => {
    const tasks = [
      task('first', { focusDate: '2026-07-26', focusOrder: 0, focusState: 'in-progress' }),
      task('second', { focusDate: '2026-07-26', focusOrder: 1 }),
      task('outside-focus'),
    ];

    const result = applyTodayFocusState(tasks, '2026-07-26', 'second', 'in-progress');

    expect(result).toEqual({ ok: true, tasks: expect.any(Array) });
    if (!result.ok) return;
    expect(getTodayFocusTasks(result.tasks, '2026-07-26')).toMatchObject([
      { id: 'first', focusState: 'not-started' },
      { id: 'second', focusState: 'in-progress' },
    ]);
    expect(result.tasks[2]).toBe(tasks[2]);
  });

  it('keeps an optional blocker reason only while a focus task is blocked', () => {
    const tasks = [task('focused', { focusDate: '2026-07-26', focusOrder: 0 })];

    const blocked = applyTodayFocusState(tasks, '2026-07-26', 'focused', 'blocked', '  Waiting for API access  ');
    expect(blocked).toEqual({ ok: true, tasks: expect.any(Array) });
    if (!blocked.ok) return;
    expect(blocked.tasks[0]).toMatchObject({ focusState: 'blocked', focusReason: 'Waiting for API access' });

    const resumed = applyTodayFocusState(blocked.tasks, '2026-07-26', 'focused', 'not-started');
    expect(resumed).toEqual({ ok: true, tasks: expect.any(Array) });
    if (!resumed.ok) return;
    expect(resumed.tasks[0]).toMatchObject({ focusState: 'not-started' });
    expect(resumed.tasks[0]).not.toHaveProperty('focusReason');
  });

  it('rejects state changes for a task that is not focused on the requested date', () => {
    const tasks = [
      task('other-day', { focusDate: '2026-07-25', focusOrder: 0 }),
      task('unfocused'),
    ];

    expect(applyTodayFocusState(tasks, '2026-07-26', 'other-day', 'blocked')).toEqual({
      ok: false,
      reason: 'task-unavailable',
      tasks,
    });
    expect(applyTodayFocusState(tasks, 'invalid', 'unfocused', 'blocked')).toEqual({
      ok: false,
      reason: 'invalid-date',
      tasks,
    });
  });

  it('synchronizes a focused task state when the underlying task is completed and reopened', () => {
    const tasks = [
      task('first', { focusDate: '2026-07-26', focusOrder: 0, focusState: 'in-progress' }),
      task('parent', { subtasks: [task('second', { focusDate: '2026-07-26', focusOrder: 1, focusState: 'blocked' })] }),
    ];

    const completed = reconcileTodayFocusCompletion(tasks, '2026-07-26', 'second', true);
    expect(getTodayFocusTasks(completed, '2026-07-26')[1]).toMatchObject({
      id: 'second',
      focusState: 'completed',
    });

    const reopened = reconcileTodayFocusCompletion(completed, '2026-07-26', 'second', false);
    expect(getTodayFocusTasks(reopened, '2026-07-26')[1]).toMatchObject({
      id: 'second',
      focusState: 'not-started',
    });
    expect(getTodayFocusTasks(reopened, '2026-07-26')[1]).not.toHaveProperty('focusReason');
  });

  it('derives an active focus task or the next incomplete task without auto-starting it', () => {
    const tasks = [
      task('first', { focusDate: '2026-07-26', focusOrder: 0, focusState: 'completed', completed: true }),
      task('second', { focusDate: '2026-07-26', focusOrder: 1, focusState: 'not-started' }),
      task('third', { focusDate: '2026-07-26', focusOrder: 2, focusState: 'in-progress' }),
    ];

    const activeExecution = getTodayFocusExecution(tasks, '2026-07-26');
    expect(activeExecution).toMatchObject({
      completedCount: 1,
      activeTaskId: 'third',
    });
    expect(activeExecution).not.toHaveProperty('nextTaskId');

    const noActive = applyTodayFocusState(tasks, '2026-07-26', 'third', 'not-started');
    expect(noActive).toEqual({ ok: true, tasks: expect.any(Array) });
    if (!noActive.ok) return;
    const nextExecution = getTodayFocusExecution(noActive.tasks, '2026-07-26');
    expect(nextExecution).toMatchObject({
      completedCount: 1,
      nextTaskId: 'second',
    });
    expect(nextExecution).not.toHaveProperty('activeTaskId');
  });

  it('does not let a non-completed focus state override an already completed task', () => {
    const tasks = [task('completed', {
      completed: true,
      focusDate: '2026-07-26',
      focusOrder: 0,
      focusState: 'completed',
    })];

    const result = applyTodayFocusState(tasks, '2026-07-26', 'completed', 'blocked', 'Waiting for access');

    expect(result).toEqual({ ok: true, tasks: expect.any(Array) });
    if (!result.ok) return;
    expect(result.tasks[0]).toMatchObject({
      completed: true,
      focusState: 'completed',
    });
    expect(result.tasks[0]).not.toHaveProperty('focusReason');
  });
});
