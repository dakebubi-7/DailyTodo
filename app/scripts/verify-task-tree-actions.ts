import assert from 'node:assert/strict';
import type { ArchivedObsidianTask } from '../shared/obsidianTaskArchive';
import { createTaskTreeActionHandlers } from '../src/hooks/taskTreeActions';
import type { Task } from '../src/types/task';

let tasks: Task[] = [];
let archivedTasks: ArchivedObsidianTask[] = [];
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
  setArchivedObsidianTasks(updater) {
    archivedTasks = updater(archivedTasks);
  },
  persistArchivedObsidianTasks() {},
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

actions.deleteSubtask('task-2');
assert.equal(tasks[0].subtasks?.length, 0, 'deleting a subtask should remove it from the active tree.');
assert.equal(archivedTasks[0].task.id, 'task-2', 'deleting a subtask should archive its snapshot.');

actions.deleteTask('task-1');
assert.equal(tasks.length, 0, 'deleting a task should remove it from the active tree.');
assert.equal(archivedTasks[1].task.id, 'task-1', 'deleting a task should archive its snapshot.');

console.log('Task tree actions verification passed');
