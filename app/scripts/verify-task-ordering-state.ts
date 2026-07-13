import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  removeTaskFromTaskOrderState,
  reorderSourceGroupsForDate,
  reorderTasksWithinSourceForDate,
} from '../src/hooks/taskOrderingState';
import type { Task } from '../src/types/task';
import {
  DEFAULT_SOURCE_ORDER,
  getSourceOrderForDate,
  isTaskSource,
  parseTaskListOrderByDate,
  removeTaskIdFromOrder,
  sortTasksForDisplay,
  type TaskListOrderByDate,
} from '../src/utils/taskOrdering';

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

const unchangedSourceOrder: TaskListOrderByDate = {
  '2026-07-05': {
    sourceOrder: ['personal', 'external'],
  },
};
assert.strictEqual(
  reorderSourceGroupsForDate(
    unchangedSourceOrder,
    '2026-07-05',
    'personal',
    'personal',
  ),
  unchangedSourceOrder,
  'Dropping a source group onto itself should preserve the existing order state reference.',
);

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

assert.strictEqual(
  reorderTasksWithinSourceForDate(
    previousOrder,
    tasks,
    {
      date: '2026-07-05',
      currentDate: '2026-07-05',
      source: 'personal',
      completed: false,
      activeId: 'open-a',
      overId: 'open-a',
    },
  ),
  previousOrder,
  'Dropping a task onto itself should preserve the existing order state reference.',
);

const taskOrderingStateSource = readFileSync('src/hooks/taskOrderingState.ts', 'utf8');
assert.ok(
  taskOrderingStateSource.includes('for (const task of allTasks)'),
  'task reordering should classify source and completion buckets in one task scan',
);
assert.ok(
  !taskOrderingStateSource.includes('const sourceTasks = allTasks.filter'),
  'task reordering should not allocate an intermediate source-task array before bucket selection',
);

const orderBeforeDelete: TaskListOrderByDate = {
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
  '2026-07-07': {
    sourceOrder: ['external', 'personal'],
    taskOrderBySource: {
      personal: ['unaffected-task'],
    },
  },
};
const cleanedAfterDelete = removeTaskFromTaskOrderState(orderBeforeDelete, 'deleted-task');

assert.deepEqual(cleanedAfterDelete, {
  '2026-07-05': {
    sourceOrder: ['personal', 'external'],
    taskOrderBySource: {
      personal: ['open-a', 'done-a'],
      external: ['external-a'],
    },
  },
  '2026-07-07': orderBeforeDelete['2026-07-07'],
});
assert.strictEqual(
  cleanedAfterDelete['2026-07-07'],
  orderBeforeDelete['2026-07-07'],
  'Deleting a task should retain references for unaffected date orders.',
);

const unchangedAfterMissingDelete: TaskListOrderByDate = {
  '2026-07-05': {
    sourceOrder: ['personal', 'external'],
    taskOrderBySource: {
      personal: ['open-a', 'done-a'],
      external: ['external-a'],
    },
  },
};
assert.strictEqual(
  removeTaskFromTaskOrderState(unchangedAfterMissingDelete, 'missing-task'),
  unchangedAfterMissingDelete,
  'Removing a task absent from every saved order should preserve the order state reference.',
);

assert.equal(isTaskSource('personal'), true, 'personal should be a valid task source');
assert.equal(isTaskSource('external'), true, 'external should be a valid task source');
assert.equal(isTaskSource('archive'), false, 'unknown task sources should be rejected');

assert.strictEqual(
  getSourceOrderForDate({}, '2026-07-05'),
  DEFAULT_SOURCE_ORDER,
  'The default source order should reuse its stable shared reference when no saved order exists.',
);
assert.strictEqual(
  getSourceOrderForDate({
    '2026-07-05': { sourceOrder: ['personal', 'external'] },
  }, '2026-07-05'),
  DEFAULT_SOURCE_ORDER,
  'A saved source order identical to the defaults should reuse the stable shared reference.',
);

assert.deepEqual(
  parseTaskListOrderByDate({
    '2026-07-07': {
      sourceOrder: ['external', 'invalid', 'personal'],
      taskOrderBySource: {
        external: ['external-a', 5, 'external-b'],
        archive: ['archive-a'],
        personal: 'bad',
      },
    },
    broken: null,
  }),
  {
    '2026-07-07': {
      sourceOrder: ['external', 'personal'],
      taskOrderBySource: {
        external: ['external-a', 'external-b'],
      },
    },
  },
  'taskOrdering should expose the shared runtime parser for stored task order state',
);

assert.deepEqual(
  sortTasksForDisplay(
    [
      task('personal-low', { priority: 'low' }),
      task('external-high', { source: 'external', priority: 'high' }),
      task('personal-high', { priority: 'high' }),
      task('external-done', { source: 'external', completed: true, priority: 'high' }),
    ],
    '2026-07-05',
    {},
  ).map((item) => item.id),
  ['personal-high', 'personal-low', 'external-high', 'external-done'],
  'display sorting should retain source, completion, and priority order after source bucketing',
);

assert.deepEqual(
  sortTasksForDisplay(
    [
      task('manual-low', { priority: 'low' }),
      task('manual-high', { priority: 'high' }),
      task('missing-medium', { priority: 'medium' }),
      task('missing-high', { priority: 'high' }),
      task('missing-low', { priority: 'low' }),
    ],
    '2026-07-05',
    {
      '2026-07-05': {
        taskOrderBySource: { personal: ['manual-low', 'manual-high'] },
      },
    },
  ).map((item) => item.id),
  ['missing-high', 'missing-medium', 'manual-low', 'manual-high', 'missing-low'],
  'manual ordering should insert missing tasks by priority without disturbing existing manual task order',
);

const cleanedMalformedSources = removeTaskIdFromOrder({
  '2026-07-07': {
    sourceOrder: ['personal', 'archive'],
    taskOrderBySource: {
      personal: ['keep-personal'],
      archive: ['keep-archive'],
    },
  },
} as unknown as TaskListOrderByDate, 'missing-task');

assert.deepEqual(cleanedMalformedSources, {
  '2026-07-07': {
    sourceOrder: ['personal'],
    taskOrderBySource: {
      personal: ['keep-personal'],
    },
  },
});

const taskOrderingSource = readFileSync('src/utils/taskOrdering.ts', 'utf8');
const taskOrderPersistenceSource = readFileSync('src/utils/taskOrderPersistence.ts', 'utf8');
const taskDisplayOrderingSource = readFileSync('src/utils/taskDisplayOrdering.ts', 'utf8');
assert.ok(
  taskOrderingSource.includes("from './taskOrderPersistence'"),
  'taskOrdering should retain the stable task-order persistence entrypoint through its dedicated parser module.',
);
assert.ok(
  taskOrderingSource.includes("from './taskDisplayOrdering'"),
  'taskOrdering should retain its stable display-ordering exports through a dedicated module.',
);
assert.ok(
  taskDisplayOrderingSource.includes('export function sortTasksForDisplay'),
  'task display ordering should own display sorting separately from drag-order mutation helpers.',
);
assert.ok(
  taskDisplayOrderingSource.includes('export function getSourceOrderForDate'),
  'task display ordering should own source-order normalization used by display and drag consumers.',
);
assert.ok(
  !taskDisplayOrderingSource.includes('const validSaved = saved.filter(isTaskSource)'),
  'reading saved source order should avoid a filtered-array allocation before determining whether normalization is needed.',
);
assert.ok(
  !taskDisplayOrderingSource.includes('const merged = [...validSaved'),
  'reading saved source order should avoid merging arrays when a valid saved order already supplies every source.',
);
assert.ok(
  !taskOrderingSource.includes('export function sortTasksForDisplay'),
  'taskOrdering should not retain display sorting after the display-ordering extraction.',
);
assert.ok(
  taskOrderPersistenceSource.includes('export function isTaskSource'),
  'task-order persistence should own the shared TaskSource guard.',
);
assert.ok(
  taskOrderPersistenceSource.includes('export function parseTaskListOrderByDate'),
  'task-order persistence should own stored task-list order parsing.',
);
assert.match(
  taskOrderPersistenceSource,
  /import \{ isObjectRecord \} from '..\/..\/shared\/unknownValueGuards';/,
  'task-order persistence should reuse the shared object-record guard.',
);
assert.doesNotMatch(
  taskOrderPersistenceSource,
  /function isRecord\(/,
  'task-order persistence should not duplicate the shared object-record guard.',
);
assert.ok(
  taskDisplayOrderingSource.includes('const tasksBySource = new Map<TaskSource, Task[]>();'),
  'display sorting should bucket tasks by source in one task scan',
);
assert.ok(
  !taskDisplayOrderingSource.includes('const sourceTasks = tasks.filter((task) => getTaskSource(task) === source);'),
  'display sorting should not rescan all tasks once per source group',
);
assert.ok(
  taskDisplayOrderingSource.includes('const sortedTasks: Task[] = [];'),
  'display sorting should accumulate sorted source groups without flat-mapping callback results.',
);
assert.ok(
  taskDisplayOrderingSource.includes('for (const source of orderedSources) {'),
  'display sorting should append each source group through a direct loop.',
);
assert.ok(
  !taskDisplayOrderingSource.includes('return orderedSources.flatMap((source) => {'),
  'display sorting should not allocate empty flat-map callback results for absent source groups.',
);
assert.ok(
  taskDisplayOrderingSource.includes('const missingByPriority: Record<Task[\'priority\'], Task[]>'),
  'manual display ordering should bucket missing tasks by priority before merging.',
);
assert.ok(
  !taskDisplayOrderingSource.includes('result.findIndex((existing) => priorityOrder[existing.priority] > priorityOrder[task.priority])'),
  'manual display ordering should not scan the growing result once for every missing task.',
);
assert.ok(
  /for \(const task of tasks\) \{\s*taskById\.set\(task\.id, task\);\s*\}/.test(taskDisplayOrderingSource),
  'manual display ordering should build its task lookup in one pass without an intermediate mapped array.',
);
assert.ok(
  taskDisplayOrderingSource.includes('for (const id of manualOrder) {'),
  'manual display ordering should resolve saved IDs directly while retaining their stored order.',
);
assert.ok(
  !taskDisplayOrderingSource.includes('const orderedTasks = manualOrder\n    .map((id) => taskById.get(id))'),
  'manual display ordering should not create an intermediate mapped saved-order array.',
);
assert.ok(
  !taskOrderingSource.includes('as TaskSource[]'),
  'taskOrdering should filter runtime object keys through isTaskSource instead of casting them',
);
assert.ok(
  !taskOrderingSource.includes('Object.entries(orderByDate).forEach'),
  'removing a task from persisted order should traverse stored dates without callback-array allocation.',
);
assert.ok(
  !taskOrderingSource.includes('Object.keys(dateOrder.taskOrderBySource || {}).filter(isTaskSource).forEach'),
  'removing a task from persisted order should traverse source buckets directly.',
);
assert.ok(
  !taskOrderingSource.includes('savedIds.filter((id) => id !== taskId)'),
  'removing an absent task ID should not allocate a filtered source-order array for every untouched bucket.',
);
assert.ok(
  !taskOrderingSource.includes('dateOrder.sourceOrder.filter(isTaskSource)'),
  'removing an absent task ID should not allocate a filtered source-order array for every untouched date.',
);

console.log('task ordering state verification passed');

