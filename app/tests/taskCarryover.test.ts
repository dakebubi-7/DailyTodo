import { describe, expect, it } from 'vitest';
import { createDefaultAppSettings } from '../shared/appSettings';
import { carryForwardTasks } from '../src/hooks/taskCarryover';
import { parseStoredTasks } from '../src/hooks/taskPersistenceTransforms';
import type { Task } from '../src/types/task';

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
