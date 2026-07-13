import assert from 'node:assert/strict';
import { createTaskOrderingActionHandlers } from '../src/hooks/taskOrderingActions';
import type { Task } from '../src/types/task';
import type { TaskListOrderByDate } from '../src/utils/taskOrdering';

const tasks: Task[] = [
  {
    id: 'personal-a',
    text: 'Personal task',
    completed: false,
    priority: 'medium',
    source: 'personal',
    createdAt: '2026-07-13T08:00:00.000Z',
    taskDate: '2026-07-13',
    isToday: true,
  },
  {
    id: 'external-a',
    text: 'External task',
    completed: false,
    priority: 'medium',
    source: 'external',
    createdAt: '2026-07-13T08:00:00.000Z',
    taskDate: '2026-07-13',
    isToday: true,
  },
];
let orderByDate: TaskListOrderByDate = {
  '2026-07-13': {
    sourceOrder: ['personal', 'external'],
    taskOrderBySource: {
      personal: ['personal-a', 'deleted-task'],
      external: ['external-a', 'deleted-task'],
    },
  },
};
const deletedTaskIds: string[] = [];

const actions = createTaskOrderingActionHandlers({
  allTasks: tasks,
  currentDate: '2026-07-13',
  deleteTaskFromTree(id) {
    deletedTaskIds.push(id);
  },
  setTaskListOrderByDate(updater) {
    orderByDate = updater(orderByDate);
  },
});

actions.deleteTask('deleted-task');
assert.deepEqual(deletedTaskIds, ['deleted-task'], 'deleting a task should retain the task-tree deletion call.');
assert.deepEqual(orderByDate['2026-07-13'].taskOrderBySource, {
  personal: ['personal-a'],
  external: ['external-a'],
}, 'deleting a task should clean its manual-order entries across sources.');

actions.reorderSourceGroups('2026-07-13', 'external', 'personal');
assert.deepEqual(orderByDate['2026-07-13'].sourceOrder, ['external', 'personal']);

actions.reorderTasksWithinSource('2026-07-13', 'personal', false, 'personal-a', 'personal-a');
assert.deepEqual(
  orderByDate['2026-07-13'].taskOrderBySource?.personal,
  ['personal-a'],
  'an in-source task reorder should retain existing manual order behavior.',
);

console.log('Task ordering actions verification passed');
