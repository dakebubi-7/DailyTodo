import assert from 'node:assert/strict';
import {
  removeTaskFromTaskOrderState,
  reorderSourceGroupsForDate,
  reorderTasksWithinSourceForDate,
} from '../src/hooks/taskOrderingState';
import type { Task } from '../src/types/task';
import type { TaskListOrderByDate } from '../src/utils/taskOrdering';

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

const sourceReordered = reorderSourceGroupsForDate(
  {
    '2026-07-05': {
      sourceOrder: ['personal', 'external'],
      taskOrderBySource: { personal: ['a'] },
    },
  },
  '2026-07-05',
  'external',
  'personal',
);
assert.deepEqual(sourceReordered['2026-07-05'], {
  sourceOrder: ['external', 'personal'],
  taskOrderBySource: { personal: ['a'] },
});

const previousOrder: TaskListOrderByDate = {
  '2026-07-05': {
    sourceOrder: ['personal', 'external'],
    taskOrderBySource: {
      personal: ['open-a', 'open-b', 'done-a'],
      external: ['external-a'],
    },
  },
};

const tasks = [
  task('open-a'),
  task('open-b', { priority: 'high' }),
  task('done-a', { completed: true }),
  task('external-a', { source: 'external' }),
  task('cleared-a', { cleared: true }),
  task('tomorrow-a', { taskDate: '2026-07-06', isToday: false }),
];

const taskReordered = reorderTasksWithinSourceForDate(
  previousOrder,
  tasks,
  {
    date: '2026-07-05',
    currentDate: '2026-07-05',
    source: 'personal',
    completed: false,
    activeId: 'open-b',
    overId: 'open-a',
  },
);

assert.deepEqual(taskReordered['2026-07-05'], {
  sourceOrder: ['personal', 'external'],
  taskOrderBySource: {
    personal: ['open-b', 'open-a', 'done-a'],
    external: ['external-a'],
  },
});

const cleanedAfterDelete = removeTaskFromTaskOrderState(
  {
    '2026-07-05': {
      sourceOrder: ['personal', 'external'],
      taskOrderBySource: {
        personal: ['open-a', 'deleted-task', 'done-a'],
        external: ['deleted-task', 'external-a'],
      },
    },
    '2026-07-06': {
      taskOrderBySource: {
        personal: ['deleted-task'],
      },
    },
  },
  'deleted-task',
);

assert.deepEqual(cleanedAfterDelete, {
  '2026-07-05': {
    sourceOrder: ['personal', 'external'],
    taskOrderBySource: {
      personal: ['open-a', 'done-a'],
      external: ['external-a'],
    },
  },
});

console.log('task ordering state verification passed');
