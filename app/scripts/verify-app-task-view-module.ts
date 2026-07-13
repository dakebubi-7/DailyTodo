import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAppTaskView } from '../src/app/appTaskView';
import type { Task } from '../src/types/task';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appTaskView.ts');
const shellCompositionHookPath = join(root, 'src/app/useAppShellComposition.ts');
const appPath = join(root, 'src/App.tsx');

assert.ok(existsSync(helperPath), 'App task view helper module should exist.');
assert.ok(existsSync(shellCompositionHookPath), 'App shell composition hook should exist.');

const helper = readFileSync(helperPath, 'utf8');
const shellCompositionHook = readFileSync(shellCompositionHookPath, 'utf8');
const app = readFileSync(appPath, 'utf8');

assert.match(helper, /export type PriorityFilter = 'all' \| 'high' \| 'medium' \| 'low'/, 'helper should export PriorityFilter.');
assert.match(helper, /export function isPriorityFilter\b/, 'helper should export isPriorityFilter runtime guard.');
assert.match(helper, /value === 'all' \|\| value === 'high' \|\| value === 'medium' \|\| value === 'low'/, 'isPriorityFilter should accept only known priority filter values.');
assert.match(helper, /export interface AppTaskViewOptions\b/, 'helper should export AppTaskViewOptions.');
assert.match(helper, /export interface AppTaskView\b/, 'helper should export AppTaskView.');
assert.match(helper, /export function createAppTaskView\b/, 'helper should export createAppTaskView.');
assert.match(helper, /tasks\.filter\(\(task\) => \{/, 'helper should own visible task filtering.');
assert.match(helper, /if \(showOpenOnly && task\.completed\) return false/, 'helper should preserve open-only filtering.');
assert.match(helper, /if \(priorityFilter !== 'all' && task\.priority !== priorityFilter\) return false/, 'helper should preserve priority filtering.');
assert.match(helper, /const normalizedSearchQuery = searchQuery\.trim\(\)\.toLowerCase\(\);/, 'helper should normalize the search query once per view derivation.');
assert.match(helper, /task\.text\.toLowerCase\(\)\.includes\(normalizedSearchQuery\)/, 'helper should reuse the normalized query for case-insensitive task search.');
assert.doesNotMatch(helper, /searchQuery\.trim\(\) && !task\.text\.toLowerCase\(\)\.includes\(searchQuery\.trim\(\)\.toLowerCase\(\)\)/, 'helper should not repeat query normalization for every task.');
assert.match(helper, /isTaskDragDisabled\(\{ activeTab, searchQuery, showOpenOnly, priorityFilter \}\)/, 'helper should delegate drag-disabled logic to taskOrdering.');
assert.match(helper, /selectedDateTasksForCommands: selectedDateTaskCommands/, 'helper should preserve command task alias.');

assert.match(app, /from '\.\/app\/useAppShellComposition'/, 'App should delegate shell task view wiring through the runtime composition hook.');
assert.match(shellCompositionHook, /from '\.\/appTaskView'/, 'Runtime shell composition hook should import task view helpers.');
assert.match(shellCompositionHook, /createAppTaskView\(\{/, 'Runtime shell composition hook should delegate task view derivation to helper.');
assert.match(shellCompositionHook, /\} = useMemo\(\s*\(\) => createAppTaskView\(\{[\s\S]*\}\),\s*\[taskState\.tasks, taskState\.selectedDateTaskCommands, taskState\.activeTab, appState\.searchQuery, appState\.showOpenOnly, appState\.priorityFilter\],\s*\);/, 'Runtime shell composition hook should memoize task view derivation against only task data and active filters.');
assert.match(shellCompositionHook, /visibleTasks,\s*dragDisabled,\s*selectedDateTasksForCommands/s, 'Runtime shell composition hook should consume derived task view fields.');
assert.doesNotMatch(app, /from '\.\/app\/appTaskView'/, 'App should not import task view helpers directly after runtime composition extraction.');
assert.doesNotMatch(app, /type PriorityFilter = 'all' \| 'high' \| 'medium' \| 'low'/, 'App should not inline PriorityFilter.');
assert.doesNotMatch(app, /const visibleTasks = tasks\.filter\(\(task\) => \{/, 'App should not inline visible task filtering.');
assert.doesNotMatch(app, /isTaskDragDisabled\(\{ activeTab, searchQuery, showOpenOnly, priorityFilter \}\)/, 'App should not inline drag-disabled derivation.');

const unfilteredTasks: Task[] = [{
  id: 'unfiltered-task',
  text: 'Keep the list reference',
  completed: false,
  priority: 'medium',
  source: 'personal',
  createdAt: '2026-07-13T00:00:00.000Z',
  taskDate: '2026-07-13',
  isToday: true,
}];
assert.strictEqual(
  createAppTaskView({
    tasks: unfilteredTasks,
    selectedDateTaskCommands: [],
    activeTab: 'today',
    searchQuery: '  ',
    showOpenOnly: false,
    priorityFilter: 'all',
  }).visibleTasks,
  unfilteredTasks,
  'An inactive task filter should preserve the task list reference for memoized list consumers.',
);

console.log('App task view helper verification passed');
