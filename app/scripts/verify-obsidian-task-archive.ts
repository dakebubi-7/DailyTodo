import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeArchivedTasksForObsidian, retainDeletedTask } from '../shared/obsidianTaskArchive';
import type { Task } from '../src/types/task';

const parent: Task = {
  id: 'parent-1',
  text: 'Parent task',
  completed: false,
  priority: 'medium',
  source: 'personal',
  createdAt: '2026-07-26T08:00:00.000Z',
  taskDate: '2026-07-26',
  subtasks: [{
    id: 'child-1',
    text: 'Child task',
    completed: false,
    priority: 'medium',
    source: 'personal',
    createdAt: '2026-07-26T08:00:00.000Z',
    taskDate: '2026-07-26',
    parentTaskId: 'parent-1',
  }],
};

const archived = retainDeletedTask([], parent, '2026-07-26T09:00:00.000Z');
assert.equal(archived.length, 1);
assert.equal(archived[0].task.id, 'parent-1');
assert.equal(archived[0].task.subtasks?.[0].id, 'child-1');
assert.equal(archived[0].deletedAt, '2026-07-26T09:00:00.000Z');
assert.equal(retainDeletedTask(archived, parent).length, 1);

const activeParent: Task = { ...parent, subtasks: [] };
const archivedChild = retainDeletedTask([], parent.subtasks![0], '2026-07-26T09:00:00.000Z');
const mergedTasks = mergeArchivedTasksForObsidian([activeParent], archivedChild);
assert.equal(mergedTasks.length, 1);
assert.equal(mergedTasks[0].subtasks?.[0].id, 'child-1');

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const useTasks = readFileSync(join(root, 'src/hooks/useTasks.ts'), 'utf8');
const initializationEffects = readFileSync(join(root, 'src/hooks/useTaskInitializationEffects.ts'), 'utf8');

assert.match(
  useTasks,
  /const \[archivedObsidianTasks, setArchivedObsidianTasks\] = useState<ArchivedObsidianTask\[\]>\(\[\]\);/,
  'useTasks should keep deleted task snapshots outside the active task tree.',
);
assert.match(
  initializationEffects,
  /setArchivedObsidianTasks\(initialState\.archivedObsidianTasks\);/,
  'task initialization should restore archived snapshots from Electron Store.',
);

console.log('Obsidian task archive verification passed');
