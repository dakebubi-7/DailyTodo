import assert from 'node:assert/strict';
import { createTaskTreeActionHandlers } from '../src/hooks/taskTreeActions';
import type { Task } from '../src/types/task';

let tasks: Task[] = [];
const actions = createTaskTreeActionHandlers({
  currentDate: '2026-07-13',
  selectedDate: '2026-07-13',
  setAllTasks(updater) {
    tasks = updater(tasks);
  },
  createId: (() => {
    let sequence = 0;
    return () => `task-${++sequence}`;
  })(),
  getTimestamp() {
    return '2026-07-13T09:00:00.000Z';
  },
});

actions.addTask('  Parent task  ', 'high');
assert.equal(tasks.length, 1);
assert.equal(tasks[0].id, 'task-1');
assert.equal(tasks[0].text, '  Parent task  ');
assert.equal(tasks[0].priority, 'high');
assert.equal(tasks[0].taskDate, '2026-07-13');

actions.addSubtask('task-1', '  Child task  ');
assert.equal(tasks[0].subtasks?.[0].id, 'task-2');
assert.equal(tasks[0].subtasks?.[0].text, 'Child task');

actions.addSubtask('task-1', '   ');
assert.equal(tasks[0].subtasks?.length, 1, 'blank subtasks should remain ignored.');

actions.toggleSubtask('task-2');
assert.equal(tasks[0].subtasks?.[0].completed, true);
assert.equal(tasks[0].subtasks?.[0].completedAt, '2026-07-13T09:00:00.000Z');

actions.updateTask('task-1', { text: 'Updated parent' });
actions.changePriority('task-1', 'low');
actions.toggleTaskCollapse('task-1');
assert.equal(tasks[0].text, 'Updated parent');
assert.equal(tasks[0].priority, 'low');
assert.equal(tasks[0].collapsed, true);

actions.toggleTask('task-1');
actions.clearCompleted();
assert.equal(tasks[0].cleared, true, 'clearing the selected day should hide completed parent tasks.');

console.log('Task tree actions verification passed');
