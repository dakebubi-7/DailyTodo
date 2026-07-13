import { describe, expect, it } from 'vitest';
import { sortTasksForDisplay } from '../src/utils/taskDisplayOrdering';
import type { Task } from '../src/types/task';

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    text: id,
    completed: false,
    priority: 'medium',
    source: 'personal',
    createdAt: '2026-07-05T01:00:00.000Z',
    taskDate: '2026-07-05',
    isToday: true,
    ...overrides,
  };
}

describe('sortTasksForDisplay', () => {
  it('honors manual order and inserts missing tasks by priority', () => {
    const tasks = [
      task('a', { priority: 'low' }),
      task('b', { priority: 'high' }),
      task('c', { priority: 'medium' }),
    ];

    const sorted = sortTasksForDisplay(
      tasks,
      '2026-07-05',
      {
        '2026-07-05': {
          taskOrderBySource: {
            personal: ['c', 'a'],
          },
        },
      },
    );

    expect(sorted.map((item) => item.id)).toEqual(['b', 'c', 'a']);
  });
});
