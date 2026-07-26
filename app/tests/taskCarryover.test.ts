import { describe, expect, it } from 'vitest';
import { createDefaultAppSettings } from '../shared/appSettings';
import { carryForwardTasks } from '../src/hooks/taskCarryover';
import { parseStoredTasks } from '../src/hooks/taskPersistenceTransforms';
import type { Task } from '../src/types/task';

function createTask(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    text: id,
    completed: false,
    priority: 'medium',
    createdAt: '2026-07-20T08:00:00.000Z',
    taskDate: '2026-07-20',
    isToday: false,
    ...overrides,
  };
}

function createReview(percent: number): NonNullable<Task['completionReview']> {
  return {
    status: percent === 100 ? 'done' : 'partial',
    percent,
    summary: 'Progress recorded',
    unknowns: '',
    nextStep: '',
    reviewedAt: '2026-07-20T18:00:00.000Z',
  };
}

describe('task carryover workflow metadata', () => {
  it('copies a handoff as carryover context without making the next task focused', () => {
    const source = {
      id: 'source',
      text: 'Ship the release',
      completed: false,
      priority: 'high',
      createdAt: '2026-07-20T08:00:00.000Z',
      taskDate: '2026-07-20',
      isToday: false,
      focusDate: '2026-07-20',
      focusOrder: 0,
      focusState: 'in-progress',
      focusReason: 'Release is blocking users',
      nextStep: 'Write the release notes',
      handoff: {
        status: 'partial',
        progressSummary: 'Implementation is complete',
        blocker: '',
        nextStep: 'Write the release notes',
        shouldCarryForward: true,
        createdAt: '2026-07-20T18:00:00.000Z',
        source: 'manual',
      },
    } as Task;

    const result = carryForwardTasks([source], '2026-07-21', {}, createDefaultAppSettings());
    const carried = result.tasks[0]!;

    expect(carried).toMatchObject({
      carriedFromTaskId: 'source',
      carryoverContext: source.handoff,
    });
    expect(carried).not.toHaveProperty('focusDate');
    expect(carried).not.toHaveProperty('focusOrder');
    expect(carried).not.toHaveProperty('focusState');
    expect(carried).not.toHaveProperty('focusReason');
    expect(carried).not.toHaveProperty('nextStep');
    expect(carried).not.toHaveProperty('handoff');
  });

  it('creates clean continuation children and records a source snapshot', () => {
    const source = createTask('parent', {
      text: 'Release checklist',
      subtasks: [
        createTask('done-child', { completed: true, parentTaskId: 'parent' }),
        createTask('open-child', { parentTaskId: 'parent' }),
      ],
    });

    const result = carryForwardTasks([source], '2026-07-21', {}, createDefaultAppSettings());
    const carried = result.tasks[0]!;

    expect(carried.text).toBe('Release checklist');
    expect(carried.completed).toBe(false);
    expect(carried.subtaskCarryoverProgress).toEqual({ total: 2, remaining: 1 });
    expect(carried.subtasks).toHaveLength(1);
    expect(carried.subtasks?.[0]).toMatchObject({
      text: 'open-child',
      completed: false,
      taskDate: '2026-07-21',
      isToday: true,
      parentTaskId: carried.id,
    });
    expect(carried.subtasks?.[0]?.id).not.toBe('open-child');
    expect(source.subtasks?.[1]?.id).toBe('open-child');
  });

  it('continues a completed parent when a direct child remains eligible', () => {
    const source = createTask('parent', {
      completed: true,
      subtasks: [createTask('open-child', { parentTaskId: 'parent' })],
    });

    const result = carryForwardTasks([source], '2026-07-21', {}, createDefaultAppSettings());

    expect(result.tasks[0]).toMatchObject({
      completed: false,
      subtaskCarryoverProgress: { total: 1, remaining: 1 },
    });
  });

  it('copies a partially completed child as incomplete work and skips a fully completed child', () => {
    const source = createTask('parent', {
      completed: true,
      subtasks: [
        createTask('partial-child', {
          completed: true,
          completionReview: createReview(60),
          parentTaskId: 'parent',
        }),
        createTask('done-child', {
          completed: true,
          completionReview: createReview(100),
          parentTaskId: 'parent',
        }),
      ],
    });

    const result = carryForwardTasks([source], '2026-07-21', {}, createDefaultAppSettings());

    expect(result.tasks[0]?.subtasks?.map((child) => child.text)).toEqual(['partial-child']);
    expect(result.tasks[0]?.subtasks?.[0]?.completed).toBe(false);
  });

  it('keeps an incomplete parent without subtask metadata when all direct children are complete', () => {
    const source = createTask('parent', {
      subtasks: [createTask('done-child', {
        completed: true,
        completionReview: createReview(100),
        parentTaskId: 'parent',
      })],
    });

    const result = carryForwardTasks([source], '2026-07-21', {}, createDefaultAppSettings());
    const carried = result.tasks[0]!;

    expect(carried).toMatchObject({ text: 'parent', completed: false });
    expect(carried).not.toHaveProperty('subtasks');
    expect(carried).not.toHaveProperty('subtaskCarryoverProgress');
  });

  it('does not create duplicate continuation children on a repeated carryover', () => {
    const source = createTask('parent', {
      subtasks: [createTask('open-child', { parentTaskId: 'parent' })],
    });
    const firstResult = carryForwardTasks([source], '2026-07-21', {}, createDefaultAppSettings());
    const repeatedResult = carryForwardTasks(
      firstResult.tasks,
      '2026-07-21',
      firstResult.ledger,
      createDefaultAppSettings(),
    );

    expect(repeatedResult.tasks.filter((task) => task.carriedFromTaskId === 'parent')).toHaveLength(1);
    expect(repeatedResult.tasks[0]?.subtasks).toHaveLength(1);
  });

  it('retains a legacy task while stripping malformed carryover snapshots', () => {
    const [task] = parseStoredTasks([{
      ...createTask('legacy'),
      subtaskCarryoverProgress: { total: 2, remaining: 3 },
    }], '2026-07-20');

    expect(task).toMatchObject({ id: 'legacy', text: 'legacy' });
    expect(task).not.toHaveProperty('subtaskCarryoverProgress');
  });

  it('keeps a legacy task when invalid workflow metadata is encountered and removes only the invalid fields', () => {
    const [task] = parseStoredTasks([
      {
        id: 'legacy',
        text: 'Keep this task',
        completed: false,
        priority: 'medium',
        createdAt: '2026-07-20T08:00:00.000Z',
        taskDate: '2026-07-20',
        focusDate: 'not-a-date',
        focusState: 'not-a-real-state',
        handoff: { status: 'partial' },
      },
    ], '2026-07-20');

    expect(task).toMatchObject({ id: 'legacy', text: 'Keep this task' });
    expect(task).not.toHaveProperty('focusDate');
    expect(task).not.toHaveProperty('focusState');
    expect(task).not.toHaveProperty('handoff');
  });
});
