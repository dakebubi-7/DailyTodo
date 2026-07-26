import { describe, expect, it } from 'vitest';
import { areSelectedDailyNoteSyncInputsEquivalent } from '../src/hooks/taskObsidianSync';
import type { Task } from '../src/types/task';

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'parent-task',
    text: 'Release checklist',
    completed: false,
    priority: 'medium',
    createdAt: '2026-07-20T08:00:00.000Z',
    taskDate: '2026-07-21',
    isToday: true,
    carriedFromDate: '2026-07-20',
    subtaskCarryoverProgress: { total: 3, remaining: 2 },
    ...overrides,
  };
}

describe('Obsidian daily note sync equivalence', () => {
  it('detects a remaining carryover subtask count change', () => {
    const previous = {
      tasks: [createTask()],
      selectedDate: '2026-07-21',
      dailyWork: '',
      dailyInspiration: '',
    };

    expect(areSelectedDailyNoteSyncInputsEquivalent(previous, {
      ...previous,
      tasks: [createTask({ subtaskCarryoverProgress: { total: 3, remaining: 1 } })],
    })).toBe(false);
  });

  it('detects a total carryover subtask count change', () => {
    const previous = {
      tasks: [createTask()],
      selectedDate: '2026-07-21',
      dailyWork: '',
      dailyInspiration: '',
    };

    expect(areSelectedDailyNoteSyncInputsEquivalent(previous, {
      ...previous,
      tasks: [createTask({ subtaskCarryoverProgress: { total: 4, remaining: 2 } })],
    })).toBe(false);
  });
});
