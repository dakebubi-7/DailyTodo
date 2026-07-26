import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDefaultAppSettings } from '../shared/appSettings';
import {
  areAppBehaviorSettingsEqual,
  areTaskListsEqual,
  getInitialObsidianSyncStatus,
  getSelectedDateAfterBusinessDateChange,
  normalizeIncomingTasks,
} from '../src/hooks/taskHookState';
import { normalizeTask, parseStoredTasks } from '../src/hooks/taskTransforms';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const viteEnv = readFileSync(join(root, 'src/vite-env.d.ts'), 'utf8');
const taskStore = readFileSync(join(root, 'src/store/taskStore.ts'), 'utf8');
const taskHookState = readFileSync(join(root, 'src/hooks/taskHookState.ts'), 'utf8');
const taskTransforms = readFileSync(join(root, 'src/hooks/taskTransforms.ts'), 'utf8');
const taskPersistenceTransforms = readFileSync(join(root, 'src/hooks/taskPersistenceTransforms.ts'), 'utf8');
const taskAppStateActions = readFileSync(join(root, 'src/hooks/taskAppStateActions.ts'), 'utf8');
const taskCompletionActionsPath = join(root, 'src/hooks/taskCompletionActions.ts');
const taskTreeActionsPath = join(root, 'src/hooks/taskTreeActions.ts');
const taskLifecycleEffects = readFileSync(join(root, 'src/hooks/useTaskLifecycleEffects.ts'), 'utf8');
const taskBusinessDateEffectsPath = join(root, 'src/hooks/useTaskBusinessDateEffects.ts');
const taskTreePersistenceEffectsPath = join(root, 'src/hooks/useTaskTreePersistenceEffects.ts');

assert.equal(getInitialObsidianSyncStatus('C:/Vault'), 'idle');
assert.equal(getInitialObsidianSyncStatus(''), 'needs-path');

assert.equal(
  getSelectedDateAfterBusinessDateChange('2026-07-05', '2026-07-05', '2026-07-06'),
  '2026-07-06',
);
assert.equal(
  getSelectedDateAfterBusinessDateChange('2026-07-04', '2026-07-05', '2026-07-06'),
  '2026-07-04',
);

const normalizedTasks = normalizeIncomingTasks([
  {
    id: 'legacy-task',
    text: 'Legacy task',
    completed: false,
    priority: 'medium',
    source: 'personal',
    createdAt: '2026-07-06T01:00:00.000Z',
  },
], '2026-07-06');

assert.equal(normalizedTasks.length, 1);
assert.equal(normalizedTasks[0].taskDate, '2026-07-06');
assert.equal(normalizedTasks[0].isToday, true);

const alreadyNormalizedSubtask = {
  id: 'already-normalized-subtask',
  text: 'Already normalized subtask',
  completed: false,
  priority: 'low' as const,
  source: 'personal' as const,
  createdAt: '2026-07-06T01:00:00.000Z',
  taskDate: '2026-07-06',
  isToday: true,
  scheduledDates: undefined,
  subtasks: undefined,
  completionReviews: undefined,
  completionReview: undefined,
};
const alreadyNormalizedTask = {
  id: 'already-normalized-task',
  text: 'Already normalized task',
  completed: false,
  priority: 'medium' as const,
  source: 'personal' as const,
  createdAt: '2026-07-06T01:00:00.000Z',
  taskDate: '2026-07-06',
  isToday: true,
  subtasks: [alreadyNormalizedSubtask],
  scheduledDates: undefined,
  completionReviews: undefined,
  completionReview: undefined,
};
assert.equal(
  normalizeTask(alreadyNormalizedTask, '2026-07-06'),
  alreadyNormalizedTask,
  'normalizing an already canonical task tree should preserve its root reference',
);
const changedDateTask = normalizeTask({
  ...alreadyNormalizedTask,
  scheduledDates: ['2026-07-08', '2026-07-08'],
}, '2026-07-06');
assert.notEqual(
  changedDateTask,
  alreadyNormalizedTask,
  'normalizing a task with duplicate scheduled dates should update the affected root task',
);
assert.equal(
  changedDateTask.subtasks?.[0],
  alreadyNormalizedSubtask,
  'normalizing an affected parent should retain canonical unchanged child references',
);
assert.equal(
  areTaskListsEqual(normalizedTasks, structuredClone(normalizedTasks)),
  true,
  'areTaskListsEqual should recognize independently allocated but equivalent task trees.',
);
assert.equal(
  areTaskListsEqual(
    [{ ...normalizedTasks[0], optionalLocalField: undefined } as typeof normalizedTasks[number]],
    structuredClone(normalizedTasks),
  ),
  true,
  'areTaskListsEqual should continue ignoring undefined object fields.',
);
assert.equal(
  areTaskListsEqual(normalizedTasks, [{
    ...structuredClone(normalizedTasks[0]),
    subtasks: [{
      ...structuredClone(normalizedTasks[0]),
      id: 'nested-task',
      completionReviews: [{
        status: 'done',
        percent: 100,
        summary: 'Changed deep field',
        unknowns: '',
        nextStep: '',
        reviewedAt: '2026-07-06T02:00:00.000Z',
      }],
    }],
  }]),
  false,
  'areTaskListsEqual should detect nested task changes without serializing the full task tree.',
);
assert.deepEqual(normalizeIncomingTasks('not tasks', '2026-07-06'), []);
assert.deepEqual(
  normalizeIncomingTasks(
    [
      {
        id: 'good-task',
        text: 'Good task',
        completed: false,
        priority: 'medium',
        source: 'personal',
        createdAt: '2026-07-06T01:00:00.000Z',
      },
      {
        id: 12,
        text: 'Bad task',
        completed: false,
        priority: 'medium',
        createdAt: '2026-07-06T01:00:00.000Z',
      },
      null,
      'not-a-task',
    ],
    '2026-07-06',
  ).map((task) => task.id),
  ['good-task'],
  'normalizeIncomingTasks should drop malformed task entries instead of casting them into Task state',
);
assert.deepEqual(
  parseStoredTasks([
    {
      id: 'stored-good',
      text: 'Stored good',
      completed: true,
      priority: 'high',
      createdAt: '2026-07-06T02:00:00.000Z',
    },
    {
      id: 'stored-bad',
      text: 'Stored bad',
      completed: 'yes',
      priority: 'high',
      createdAt: '2026-07-06T02:00:00.000Z',
    },
  ]).map((task) => task.id),
  ['stored-good'],
  'parseStoredTasks should keep only structurally valid task entries from store payloads',
);
assert.match(
  taskPersistenceTransforms,
  /export function parseStoredTasks[\s\S]*?const tasks: Task\[\] = \[\];[\s\S]*?for \(const task of value\) \{[\s\S]*?if \(!isTaskLike\(task\)\) continue;[\s\S]*?tasks\.push\(normalizeTask\(task, currentBusinessDate\)\);[\s\S]*?return tasks;/,
  'task persistence transforms should validate and normalize persisted tasks in one traversal.',
);
assert.doesNotMatch(
  taskPersistenceTransforms,
  /return value\.filter\(isTaskLike\)\.map\(\(task\) => normalizeTask\(task, currentBusinessDate\)\);/,
  'parseStoredTasks should not allocate an intermediate valid-task array before normalization.',
);
assert.match(
  taskPersistenceTransforms,
  /from '\.\.\/\.\.\/shared\/taskValidation'/,
  'Task persistence payload validation should reuse shared taskValidation guards.',
);
assert.match(
  taskPersistenceTransforms,
  /return isSharedTaskLike\(value\)/,
  'isTaskLike should delegate to shared taskValidation.',
);
assert.doesNotMatch(
  taskPersistenceTransforms,
  /function isObject\(value: unknown\)/,
  'Task persistence payload validation should not keep a duplicate local object predicate.',
);
assert.match(
  taskHookState,
  /parseStoredTasks\(incoming,\s*today\)/,
  'normalizeIncomingTasks should parse and normalize task payloads with the active business date in one traversal.',
);
assert.doesNotMatch(
  taskHookState,
  /parseStoredTasks\(incoming\)\.map\(/,
  'normalizeIncomingTasks should not recursively normalize parsed task payloads a second time.',
);
assert.match(
  taskHookState,
  /export function areTaskListsEqual\(left: Task\[\], right: Task\[\]\): boolean/,
  'task hook state should expose a reusable task-tree equality helper for broadcast handling.',
);
assert.match(
  taskHookState,
  /for \(const \[key, value\] of Object\.entries\(left\)\)/,
  'task-tree equality should compare structured values directly rather than allocating JSON strings.',
);
assert.doesNotMatch(
  taskHookState,
  /as Record<string, unknown>/,
  'task-tree equality should not narrow compared objects with Record assertions.',
);
assert.doesNotMatch(
  taskHookState,
  /Object\.keys\(left\)\.filter\(/,
  'task-tree equality should not allocate filtered key arrays for every compared object.',
);
const useTasks = readFileSync(join(root, 'src/hooks/useTasks.ts'), 'utf8');
const taskActionsPath = join(root, 'src/hooks/useTaskActions.ts');
const taskOrderingActionsPath = join(root, 'src/hooks/taskOrderingActions.ts');
assert.equal(
  existsSync(taskActionsPath),
  true,
  'task action callbacks should be isolated in a focused hook module.',
);
assert.equal(
  existsSync(taskOrderingActionsPath),
  true,
  'manual ordering callbacks should be isolated in a focused action module.',
);
const taskActions = readFileSync(taskActionsPath, 'utf8');
assert.equal(
  existsSync(taskCompletionActionsPath),
  true,
  'completion-review actions should be isolated in a focused module.',
);
const taskCompletionActions = readFileSync(taskCompletionActionsPath, 'utf8');
assert.equal(
  existsSync(taskTreeActionsPath),
  true,
  'ordinary task-tree actions should be isolated in a focused module.',
);
const taskTreeActions = readFileSync(taskTreeActionsPath, 'utf8');
assert.match(
  taskActions,
  /createTaskCompletionActionHandlers\(/,
  'task action composition should delegate completion-review lifecycle actions to the focused module.',
);
assert.doesNotMatch(
  taskActions,
  /const completeTaskWithReview = useCallback/,
  'task action composition should not retain inline completion-review callbacks.',
);
assert.match(
  taskCompletionActions,
  /persistRetainedReviews\(next\)/,
  'completion-review actions should persist retained Obsidian reviews after local deletion.',
);
assert.match(
  taskActions,
  /createTaskTreeActionHandlers\(/,
  'task action composition should delegate ordinary task-tree mutations to the focused module.',
);
assert.doesNotMatch(
  taskActions,
  /const addTask = useCallback/,
  'task action composition should not retain inline ordinary task-tree callbacks.',
);
assert.match(
  taskTreeActions,
  /deleteTask\(id: string\)/,
  'task-tree actions should retain the base task deletion operation for hook-level ordering cleanup composition.',
);
assert.equal(
  existsSync(taskTreePersistenceEffectsPath),
  true,
  'task-tree persistence effects module should exist.',
);
const taskTreePersistenceEffects = readFileSync(taskTreePersistenceEffectsPath, 'utf8');
assert.match(
  taskTreePersistenceEffects,
  /areTaskListsEqual\(previousTasks, nextTasks\)/,
  'cross-window task broadcasts should reuse structural equality before updating state in task-tree persistence effects.',
);
assert.doesNotMatch(
  taskTreePersistenceEffects,
  /JSON\.stringify\(previousTasks\) === JSON\.stringify\(nextTasks\)/,
  'cross-window task broadcasts should not serialize entire task trees just to compare them in task-tree persistence effects.',
);
assert.match(
  taskStore,
  /return parseStoredTasks\(tasks\)/,
  'loadTasks should parse Electron Store task payloads instead of casting them to Task[].',
);
assert.doesNotMatch(
  taskStore,
  /return \(tasks as Task\[\]\) \|\| \[\]/,
  'loadTasks should not cast unknown store values to Task arrays.',
);

assert.match(
  viteEnv,
  /onTasksChanged:\s*\(callback:\s*\(\w+: unknown\)\s*=>\s*void\)\s*=>\s*\(\)\s*=>\s*void;/,
  'vite-env should expose tasks-changed listener payloads as unknown runtime data.',
);
assert.doesNotMatch(
  viteEnv,
  /onTasksChanged:\s*\(callback:\s*\(\w+:\s*import\('\.\/types\/task'\)\.Task\[\]\)\s*=>\s*void\)\s*=>\s*\(\)\s*=>\s*void;/,
  'vite-env should not claim tasks-changed listener payloads are trusted Task arrays.',
);

assert.equal(
  existsSync(taskBusinessDateEffectsPath),
  true,
  'business-date lifecycle effects should be isolated in a focused hook module.',
);
const taskBusinessDateEffects = readFileSync(taskBusinessDateEffectsPath, 'utf8');
assert.match(
  taskBusinessDateEffects,
  /export function useTaskBusinessDateEffects\(/,
  'business-date lifecycle module should export its focused effect hook.',
);
assert.match(
  taskBusinessDateEffects,
  /applyBusinessDateCarryover\(/,
  'business-date lifecycle module should own automatic carryover application.',
);
assert.match(
  taskBusinessDateEffects,
  /getNextRolloverDelay\(/,
  'business-date lifecycle module should own rollover timer scheduling.',
);
assert.match(
  taskLifecycleEffects,
  /useTaskBusinessDateEffects\(/,
  'task lifecycle effects should compose the focused business-date hook.',
);
assert.doesNotMatch(
  taskLifecycleEffects,
  /const updateBusinessDate = \(\) =>/,
  'task lifecycle effects should not keep business-date transition logic inline after extraction.',
);

const normalizedOutOfOrderReviews = normalizeIncomingTasks([
  {
    id: 'review-order-task',
    text: 'Review order task',
    completed: true,
    priority: 'medium',
    source: 'personal',
    createdAt: '2026-07-06T01:00:00.000Z',
    completionReviews: [
      {
        id: 'review-newer',
        status: 'done',
        percent: 100,
        summary: 'Newest review',
        unknowns: '',
        nextStep: '',
        reviewedAt: '2026-07-06T09:00:00.000Z',
      },
      {
        id: 'review-older',
        status: 'partial',
        percent: 50,
        summary: 'Older review',
        unknowns: '',
        nextStep: 'Continue',
        reviewedAt: '2026-07-06T08:00:00.000Z',
      },
    ],
  },
], '2026-07-06');
assert.equal(
  normalizedOutOfOrderReviews[0].completionReview?.id,
  'review-newer',
  'normalizeIncomingTasks should preserve the latest review by reviewedAt even when completionReviews is out of order',
);
assert.doesNotMatch(
  taskPersistenceTransforms,
  /function getLatestCompletionReview\(reviews: TaskCompletionReview\[\] \| undefined, fallback\?: TaskCompletionReview\) \{\s*if \(!reviews\?\.length\) return fallback;\s*return reviews\.reduce\(/s,
  'Task normalization should select the latest completion review without reduce callback overhead.',
);
assert.doesNotMatch(
  taskPersistenceTransforms,
  /function normalizeScheduledDates[\s\S]*?new Set\(\(dates \|\| \[\]\)\.filter\(/,
  'Scheduled-date normalization should collect valid unique dates in one traversal.',
);

const defaultSettings = createDefaultAppSettings();
assert.equal(
  areAppBehaviorSettingsEqual(defaultSettings, { ...defaultSettings }),
  true,
  'equivalent app settings should be recognized even when the object is newly allocated.',
);
assert.equal(
  areAppBehaviorSettingsEqual(defaultSettings, {
    ...defaultSettings,
    rolloverTime: '06:00',
  }),
  false,
  'app-settings equality should detect each persisted behavior setting.',
);
assert.equal(
  areAppBehaviorSettingsEqual(defaultSettings, {
    ...defaultSettings,
    syncDeletedReviewsToObsidian: true,
  }),
  true,
  'legacy delete-sync data should not change current app behavior.',
);
assert.match(
  taskAppStateActions,
  /export function createTaskAppStateActionHandlers\(/,
  'app-state actions should continue exposing the settings action factory.',
);
assert.doesNotMatch(
  taskAppStateActions,
  /setRetainedReviews|persistRetainedReviews|shouldClearRetainedReviews/,
  'changing settings must never clear retained Obsidian review history.',
);
assert.match(
  taskAppStateActions,
  /if \(areSettingsEqual\(appSettings, next\)\) return;/,
  'app-state actions should skip equivalent state replacement and settings persistence.',
);

console.log('task hook state verification passed');
