import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseStoredActiveTab,
  parseStoredCarryoverLedger,
  parseStoredDateKey,
  parseStoredRetainedObsidianReviews,
  parseStoredStringRecord,
  parseStoredTaskListOrder,
  createTaskTreePersistence,
  primeTaskUiStatePersistence,
  persistTaskUiState,
  updateStringRecordValue,
} from '../src/hooks/taskPersistence';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const taskPersistence = readFileSync(join(root, 'src/hooks/taskPersistence.ts'), 'utf8');
const taskPersistenceInitializationPath = join(root, 'src/hooks/taskPersistenceInitialization.ts');
const taskBusinessDateEffectsPath = join(root, 'src/hooks/useTaskBusinessDateEffects.ts');
const taskTreePersistenceEffectsPath = join(root, 'src/hooks/useTaskTreePersistenceEffects.ts');
const taskInitializationEffectsPath = join(root, 'src/hooks/useTaskInitializationEffects.ts');
const taskUiStatePersistencePath = join(root, 'src/hooks/taskUiStatePersistence.ts');
const taskTransforms = readFileSync(join(root, 'src/hooks/taskTransforms.ts'), 'utf8');
const taskPersistenceTransforms = readFileSync(join(root, 'src/hooks/taskPersistenceTransforms.ts'), 'utf8');
const useTasks = readFileSync(join(root, 'src/hooks/useTasks.ts'), 'utf8');
const lifecycleEffects = readFileSync(join(root, 'src/hooks/useTaskLifecycleEffects.ts'), 'utf8');
assert.ok(existsSync(taskUiStatePersistencePath), 'task UI state persistence module should exist.');
assert.ok(existsSync(taskPersistenceInitializationPath), 'task persistence initialization module should exist.');
assert.ok(existsSync(taskBusinessDateEffectsPath), 'task business-date effects module should exist.');
assert.ok(existsSync(taskTreePersistenceEffectsPath), 'task-tree persistence effects module should exist.');
assert.ok(existsSync(taskInitializationEffectsPath), 'task startup initialization effects module should exist.');
const taskUiStatePersistence = readFileSync(taskUiStatePersistencePath, 'utf8');
const taskPersistenceInitialization = readFileSync(taskPersistenceInitializationPath, 'utf8');
const taskBusinessDateEffects = readFileSync(taskBusinessDateEffectsPath, 'utf8');
const taskTreePersistenceEffects = readFileSync(taskTreePersistenceEffectsPath, 'utf8');
const taskInitializationEffects = readFileSync(taskInitializationEffectsPath, 'utf8');
const taskPersistenceLineCount = taskPersistence.split(/\r?\n/).length;

type ScheduledTimer = { callback: () => void; active: boolean };
const taskPersistenceTimers: ScheduledTimer[] = [];
const persistedTaskTrees: string[][] = [];
const deferredTaskPersistence = createTaskTreePersistence<string[]>({
  delay: 150,
  persist: (tasks) => persistedTaskTrees.push(tasks),
  areEqual: (left, right) => left.length === right.length && left.every((value, index) => value === right[index]),
  scheduleTimer: (callback) => {
    const timer = { callback, active: true };
    taskPersistenceTimers.push(timer);
    return timer;
  },
  cancelTimer: (timer) => {
    timer.active = false;
  },
});

deferredTaskPersistence.schedule(['first']);
deferredTaskPersistence.schedule(['final']);
for (const timer of taskPersistenceTimers) {
  if (timer.active) timer.callback();
}
assert.deepEqual(persistedTaskTrees, [['final']], 'Task tree persistence should coalesce consecutive changes into one final write.');

deferredTaskPersistence.schedule(['discarded']);
deferredTaskPersistence.discard();
deferredTaskPersistence.flush();
assert.deepEqual(persistedTaskTrees, [['final']], 'Discarding a pending task tree should prevent a stale cross-window write.');

deferredTaskPersistence.schedule(['flush-now']);
deferredTaskPersistence.flush();
assert.deepEqual(persistedTaskTrees, [['final'], ['flush-now']], 'Flushing should persist the pending task tree immediately.');

deferredTaskPersistence.schedule(['changed']);
deferredTaskPersistence.schedule(['flush-now']);
for (const timer of taskPersistenceTimers) {
  if (timer.active) timer.callback();
}
assert.deepEqual(
  persistedTaskTrees,
  [['final'], ['flush-now']],
  'Restoring a task tree to its last persisted value should cancel the pending store write.',
);

const loadedTaskPersistenceTimers: ScheduledTimer[] = [];
const loadedTaskPersistenceWrites: string[][] = [];
const loadedTaskPersistence = createTaskTreePersistence<string[]>({
  delay: 150,
  persist: (tasks) => loadedTaskPersistenceWrites.push(tasks),
  areEqual: (left, right) => left.length === right.length && left.every((value, index) => value === right[index]),
  scheduleTimer: (callback) => {
    const timer = { callback, active: true };
    loadedTaskPersistenceTimers.push(timer);
    return timer;
  },
  cancelTimer: (timer) => {
    timer.active = false;
  },
});
loadedTaskPersistence.prime(['loaded-task']);
loadedTaskPersistence.schedule(['loaded-task']);
for (const timer of loadedTaskPersistenceTimers) {
  if (timer.active) timer.callback();
}
assert.deepEqual(
  loadedTaskPersistenceWrites,
  [],
  'The initial task effect should not rewrite the task tree that was just loaded from Store.',
);

assert.equal(parseStoredDateKey('2026-07-06'), '2026-07-06');
assert.equal(parseStoredDateKey(' 2026-07-06 '), undefined);
assert.equal(parseStoredDateKey(20260706), undefined);
assert.equal(parseStoredDateKey('07-06-2026'), undefined);
assert.equal(parseStoredDateKey(null), undefined);

assert.equal(parseStoredActiveTab('today'), 'today');
assert.equal(parseStoredActiveTab('all'), 'all');
assert.equal(parseStoredActiveTab('completed'), 'completed');
assert.equal(parseStoredActiveTab('inbox'), undefined);
assert.equal(parseStoredActiveTab(1), undefined);

assert.deepEqual(
  parseStoredStringRecord({
    '2026-07-06': 'note',
    bad: 12,
    nested: { nope: true },
  }),
  { '2026-07-06': 'note' },
);
assert.deepEqual(parseStoredStringRecord(['not-a-record']), {});
assert.deepEqual(parseStoredStringRecord(null), {});

const dailyNotes = { '2026-07-06': 'Focus on the release' };
assert.equal(
  updateStringRecordValue(dailyNotes, '2026-07-06', 'Focus on the release'),
  dailyNotes,
  'updating a daily note with unchanged text should preserve the state reference',
);
assert.deepEqual(
  updateStringRecordValue(dailyNotes, '2026-07-06', 'Review the release'),
  { '2026-07-06': 'Review the release' },
);
assert.deepEqual(updateStringRecordValue({}, '2026-07-06', ''), { '2026-07-06': '' });

const loadedTaskUiState = {
  dailyWorkNotes: { '2026-07-06': 'Focus on the release' },
  dailyInspirationNotes: { '2026-07-06': 'Capture the launch notes' },
  selectedDate: '2026-07-06',
  currentDate: '2026-07-06',
  activeTab: 'today' as const,
  taskListOrderByDate: {},
};
primeTaskUiStatePersistence(loadedTaskUiState);
assert.doesNotThrow(
  () => persistTaskUiState(loadedTaskUiState),
  'Persisting the UI state just loaded from Store should skip scheduling a redundant startup IPC.',
);

assert.deepEqual(
  parseStoredCarryoverLedger({
    '2026-07-06': ['task-a', 12, 'task-b'],
    bad: 'not-array',
    alsoBad: null,
  }),
  { '2026-07-06': ['task-a', 'task-b'] },
);
assert.deepEqual(parseStoredCarryoverLedger(['not-a-ledger']), {});

assert.deepEqual(
  parseStoredTaskListOrder({
    '2026-07-06': {
      sourceOrder: ['personal', 'invalid', 'external'],
      taskOrderBySource: {
        personal: ['a', 1, 'b'],
        external: 'nope',
        unknown: ['x'],
      },
    },
    badDate: 'nope',
  }),
  {
    '2026-07-06': {
      sourceOrder: ['personal', 'external'],
      taskOrderBySource: {
        personal: ['a', 'b'],
      },
    },
  },
);

const retained = parseStoredRetainedObsidianReviews([
  {
    task: {
      id: 'task-1',
      text: 'Keep me',
      completed: true,
      priority: 'medium',
      createdAt: '2026-07-06T01:00:00.000Z',
    },
    review: {
      status: 'done',
      percent: 100,
      summary: 'Done',
      unknowns: '',
      nextStep: '',
      reviewedAt: '2026-07-06T09:00:00.000Z',
    },
    deletedAt: '2026-07-06T10:00:00.000Z',
  },
  {
    task: {
      id: 'task-bad',
      text: 'Drop me',
      completed: 'yes',
      priority: 'medium',
      createdAt: '2026-07-06T01:00:00.000Z',
    },
    review: {
      status: 'done',
      percent: 100,
      summary: 'Done',
      unknowns: '',
      nextStep: '',
      reviewedAt: '2026-07-06T09:00:00.000Z',
    },
    deletedAt: '2026-07-06T10:00:00.000Z',
  },
  null,
  'not-retained',
]);
assert.equal(retained.length, 1);
assert.equal(retained[0]?.task.id, 'task-1');
assert.equal(retained[0]?.review.status, 'done');

assert.match(
  taskPersistenceInitialization,
  /export function parseStoredDateKey\(value:\s*unknown\):\s*string \| undefined/,
  'task persistence initialization should own the stored date-key parser.',
);
assert.match(
  taskPersistenceInitialization,
  /export function parseStoredActiveTab\(value:\s*unknown\):\s*TabType \| undefined/,
  'task persistence initialization should own the stored active-tab parser.',
);
assert.match(
  taskPersistenceInitialization,
  /export function parseStoredCarryoverLedger\(value:\s*unknown\):\s*TaskCarryoverLedger/,
  'task persistence initialization should own the stored carryover-ledger parser.',
);
assert.match(
  taskPersistenceInitialization,
  /export function parseStoredRetainedObsidianReviews\(value:\s*unknown\):\s*RetainedObsidianReview\[\]/,
  'task persistence initialization should own the retained-review parser.',
);
assert.match(
  taskPersistenceInitialization,
  /const savedSelectedDate = parseStoredDateKey\(storedState\[SELECTED_DATE_KEY\]\)/,
  'loadInitialTaskState should parse selectedDate store values before use.',
);
assert.match(
  taskPersistenceInitialization,
  /const savedLastActiveDay = parseStoredDateKey\(storedState\[LAST_ACTIVE_DAY_KEY\]\)/,
  'loadInitialTaskState should parse lastActiveDay store values before use.',
);
assert.match(
  taskPersistenceInitialization,
  /const savedActiveTab = parseStoredActiveTab\(storedState\[ACTIVE_TAB_KEY\]\)/,
  'loadInitialTaskState should parse activeTab store values before use.',
);
assert.match(
  taskPersistenceInitialization,
  /const savedCarryoverLedger = parseStoredCarryoverLedger\(storedState\[TASK_CARRYOVER_LEDGER_KEY\]\)/,
  'loadInitialTaskState should parse carryover ledger store values before use.',
);
assert.match(
  taskPersistenceInitialization,
  /const savedRetainedReviews = parseStoredRetainedObsidianReviews\(storedState\[RETAINED_OBSIDIAN_REVIEWS_KEY\]\)/,
  'loadInitialTaskState should parse retained review store values before use.',
);
assert.match(
  taskPersistenceInitialization,
  /parseTaskListOrderByDate/,
  'task persistence initialization should import the shared task-list order parser from taskOrdering.',
);
assert.match(
  taskPersistenceInitialization,
  /export function parseStoredTaskListOrder\(value:\s*unknown\):\s*TaskListOrderByDate \{\s*return parseTaskListOrderByDate\(value\);\s*\}/,
  'task persistence initialization should delegate task-list order parsing to the shared taskOrdering parser.',
);
assert.doesNotMatch(
  taskPersistenceInitialization,
  /function parseStoredTaskListDateOrder/,
  'task persistence initialization should not duplicate task-list date order parsing logic.',
);
assert.match(
  taskPersistenceTransforms,
  /export function isTaskCompletionReview\(value:\s*unknown\):\s*value is TaskCompletionReview/,
  'task persistence transforms should own the runtime completion-review validator.',
);
assert.match(
  taskPersistenceInitialization,
  /import\s*\{[^}]*isTaskCompletionReview[^}]*\}\s*from '\.\/taskTransforms';/s,
  'task persistence initialization should reuse the task completion-review validator.',
);
assert.doesNotMatch(
  taskPersistenceInitialization,
  /function isTaskCompletionReview\(/,
  'task persistence initialization should not duplicate the task completion-review validator.',
);
assert.match(
  taskPersistenceInitialization,
  /dailyWorkNotes:\s*parseStoredStringRecord\(savedWorkNotes\)/,
  'loadInitialTaskState should parse daily work notes as a string record.',
);
assert.match(
  taskPersistenceInitialization,
  /dailyInspirationNotes:\s*parseStoredStringRecord\(savedInspirationNotes\)/,
  'loadInitialTaskState should parse daily inspiration notes as a string record.',
);
assert.match(
  taskPersistenceInitialization,
  /taskListOrderByDate:\s*parseStoredTaskListOrder\(savedTaskListOrder\)/,
  'loadInitialTaskState should parse task list order store values before use.',
);
assert.doesNotMatch(
  taskPersistenceInitialization,
  /getStore\([^\n]+\) as /,
  'taskPersistence should not cast Electron Store values with `as`.',
);
assert.match(
  taskPersistenceInitialization,
  /const \[storedSettings, savedTasks, savedState, obsidianPath\] = await Promise\.all\(\[/,
  'loadInitialTaskState should start independent startup reads concurrently.',
);
assert.match(
  taskPersistenceInitialization,
  /window\.electronAPI\?\.getStoreMany\(\[[\s\S]*?DAILY_WORK_KEY,[\s\S]*?TASK_LIST_ORDER_KEY,[\s\S]*?\]\)/,
  'loadInitialTaskState should retrieve UI state through one batched store IPC call.',
);
assert.match(
  taskPersistence,
  /from '\.\/taskUiStatePersistence'/,
  'taskPersistence should re-export task UI persistence from a dedicated module.',
);
assert.match(
  taskPersistence,
  /from '\.\/taskPersistenceInitialization'/,
  'taskPersistence should retain initialization APIs as compatibility exports from a dedicated module.',
);
assert.doesNotMatch(
  taskPersistence,
  /export async function loadInitialTaskState/,
  'taskPersistence should not retain startup state assembly after initialization extraction.',
);
assert.ok(
  taskPersistenceLineCount < 300,
  `taskPersistence should stay below 300 lines after UI-state persistence extraction; saw ${taskPersistenceLineCount}.`,
);
assert.doesNotMatch(
  taskPersistenceInitialization,
  /const TASK_UI_STATE_PERSIST_DELAY_MS/,
  'taskPersistence should not own task UI state debounce timing inline.',
);
assert.doesNotMatch(
  taskPersistenceInitialization,
  /function createTaskUiStateEntries\(/,
  'taskPersistence should not build task UI state snapshots inline.',
);
assert.match(
  taskUiStatePersistence,
  /function createTaskUiStateEntries\([\s\S]*?\[DAILY_WORK_KEY\]: dailyWorkNotes,[\s\S]*?\[TASK_LIST_ORDER_KEY\]: taskListOrderByDate,[\s\S]*?\};/,
  'task UI persistence should build one complete reusable batched state snapshot.',
);
assert.match(
  taskUiStatePersistence,
  /export function primeTaskUiStatePersistence\(input: PersistTaskUiStateInput\) \{\s*lastPersistedTaskUiState = createTaskUiStateEntries\(input\);\s*\}/,
  'task UI persistence should accept the Store-loaded snapshot as its initial persisted baseline.',
);
assert.match(
  taskInitializationEffects,
  /primeTaskUiStatePersistence\(\{[\s\S]*?dailyWorkNotes: initialState\.dailyWorkNotes,[\s\S]*?taskListOrderByDate: initialState\.taskListOrderByDate,[\s\S]*?\}\);[\s\S]*?setIsLoaded\(true\);/,
  'task startup initialization effects should prime UI persistence before enabling the first post-load persistence effect.',
);
assert.match(
  taskPersistence,
  /prime\(value: T\) \{[\s\S]*?persistedValue = value;[\s\S]*?hasPersistedValue = true;/,
  'task tree persistence should accept a Store-loaded task snapshot as its persisted baseline.',
);
assert.match(
  taskPersistenceInitialization,
  /shouldPersistTasks: !areTaskListsEqual\(savedTasks, carryoverResult\.tasks\)/,
  'initial task loading should detect whether normalization or carryover changed the persisted task tree.',
);
assert.match(
  taskPersistenceInitialization,
  /shouldPersistCarryoverLedger: !areTaskCarryoverLedgersEqual\(savedCarryoverLedger, carryoverResult\.ledger\)/,
  'initial task loading should detect whether carryover changed the stored ledger.',
);
assert.match(
  taskInitializationEffects,
  /if \(initialState\.shouldPersistCarryoverLedger\) \{\s*window\.electronAPI\?\.setStore\(TASK_CARRYOVER_LEDGER_KEY, initialState\.carryoverLedger\);\s*\}/,
  'task startup initialization effects should only write the loaded carryover ledger when initialization actually changed it.',
);
assert.match(
  taskInitializationEffects,
  /if \(!initialState\.shouldPersistTasks\) \{\s*primeTaskTreePersistence\(initialState\.tasks\);\s*\}/,
  'task startup initialization effects should prime task persistence only when the loaded task tree needs no normalization or carryover writeback.',
);
assert.match(
  lifecycleEffects,
  /useTaskInitializationEffects\(/,
  'task lifecycle effects should compose the focused startup initialization hook.',
);
assert.doesNotMatch(
  lifecycleEffects,
  /const initialState = await loadInitialTaskState\(\);/,
  'task lifecycle effects should not retain asynchronous startup state hydration after extraction.',
);
assert.match(
  taskTreePersistenceEffects,
  /export function useTaskTreePersistenceEffects\([\s\S]*?const primeTaskTreePersistence = \(tasks: Task\[\]\) => \{[\s\S]*?taskTreePersistenceRef\.current\.prime\(tasks\);/,
  'task-tree persistence effects should set the loaded task tree as its persisted baseline.',
);
assert.match(
  taskBusinessDateEffects,
  /if \(!areTaskCarryoverLedgersEqual\(ledger, carryoverResult\.ledger\)\) \{\s*window\.electronAPI\?\.setStore\(TASK_CARRYOVER_LEDGER_KEY, carryoverResult\.ledger\);\s*\}/,
  'business-date rollover should avoid resending an unchanged carryover ledger to Store.',
);
assert.match(
  taskBusinessDateEffects,
  /return areTaskListsEqual\(previousTasks, carryoverResult\.tasks\) \? previousTasks : carryoverResult\.tasks;/,
  'business-date rollover should preserve the existing task list when normalization and carryover made no change.',
);
assert.match(
  taskUiStatePersistence,
  /const TASK_UI_STATE_PERSIST_DELAY_MS = 150;/,
  'task UI persistence should use a short debounce delay to coalesce note edits.',
);
assert.match(
  taskUiStatePersistence,
  /let taskUiStatePersistTimer: number \| undefined;/,
  'task UI persistence should retain one pending debounce timer.',
);
assert.match(
  taskUiStatePersistence,
  /let lastPersistedTaskUiState: Record<string, unknown> \| undefined;[\s\S]*?let pendingTaskUiState: Record<string, unknown> \| undefined;/,
  'task UI persistence should track persisted and pending snapshots to skip duplicate store IPC.',
);
assert.match(
  taskUiStatePersistence,
  /function areTaskUiStateValuesEqual\(left: unknown, right: unknown\): boolean/,
  'task UI persistence should compare recreated state records by value.',
);
assert.doesNotMatch(
  taskUiStatePersistence,
  /const leftEntries = Object\.entries\(left\);[\s\S]*?const rightEntries = Object\.entries\(right\);/,
  'Task UI persistence equality should avoid allocating entry arrays for each persisted-state comparison.',
);
assert.match(
  taskUiStatePersistence,
  /let leftKeyCount = 0;[\s\S]*?for \(const key in left\)[\s\S]*?let rightKeyCount = 0;[\s\S]*?for \(const key in right\)/,
  'Task UI persistence equality should compare own keys with allocation-free record traversal.',
);
assert.match(
  taskUiStatePersistence,
  /import \{ isObjectRecord \} from '..\/..\/shared\/unknownValueGuards';/,
  'task UI persistence should reuse the shared object-record guard.',
);
assert.doesNotMatch(
  taskUiStatePersistence,
  /function isRecord\(/,
  'task UI persistence should not duplicate the shared object-record guard.',
);
assert.match(
  taskUiStatePersistence,
  /Object\.getOwnPropertyDescriptor\(right, key\)\?\.value/,
  'task UI persistence equality should read only own right-side properties.',
);
assert.match(
  taskPersistenceInitialization,
  /import \{ isObjectRecord \} from '..\/..\/shared\/unknownValueGuards';/,
  'task persistence initialization should reuse the shared object-record guard.',
);
assert.doesNotMatch(
  taskPersistenceInitialization,
  /function isRecord\(/,
  'task persistence initialization should not duplicate the shared object-record guard.',
);
assert.match(
  taskUiStatePersistence,
  /if \(lastPersistedTaskUiState && areTaskUiStateValuesEqual\(lastPersistedTaskUiState, storeEntries\)\) \{[\s\S]*?pendingTaskUiState = undefined;[\s\S]*?return;/,
  'task UI persistence should cancel a stale pending write when state returns to its persisted snapshot.',
);
assert.match(
  taskUiStatePersistence,
  /if \(pendingTaskUiState && areTaskUiStateValuesEqual\(pendingTaskUiState, storeEntries\)\) return;/,
  'task UI persistence should retain the existing queued write for an unchanged pending snapshot.',
);
assert.match(
  taskUiStatePersistence,
  /if \(taskUiStatePersistTimer !== undefined\) \{\s*window\.clearTimeout\(taskUiStatePersistTimer\);\s*\}/,
  'task UI persistence should replace an earlier pending write with the latest snapshot.',
);
assert.match(
  taskUiStatePersistence,
  /taskUiStatePersistTimer = window\.setTimeout\(\(\) => \{\s*taskUiStatePersistTimer = undefined;[\s\S]*?window\.electronAPI\?\.setStoreMany\(storeEntries\);[\s\S]*?\}, TASK_UI_STATE_PERSIST_DELAY_MS\);/,
  'task UI persistence should write its complete batched snapshot only after the debounce delay.',
);
assert.doesNotMatch(
  taskUiStatePersistence,
  /setStore\(DAILY_WORK_KEY|setStore\(DAILY_INSPIRATION_KEY|setStore\(SELECTED_DATE_KEY|setStore\(LAST_ACTIVE_DAY_KEY|setStore\(ACTIVE_TAB_KEY|setStore\(TASK_LIST_ORDER_KEY/,
  'persistTaskUiState should not issue one IPC call per UI state key.',
);
assert.match(
  taskBusinessDateEffects,
  /parseStoredCarryoverLedger\(value\)/,
  'business-date effects should parse carryover ledger store values before applyBusinessDateCarryover.',
);
assert.doesNotMatch(
  taskBusinessDateEffects,
  /value as TaskCarryoverLedger/,
  'business-date effects should not cast carryover ledger store values with `as`.',
);

console.log('task persistence verification passed');
