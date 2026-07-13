import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'src/utils/taskTree.ts');

assert.ok(existsSync(modulePath), 'Task tree helper module should exist.');

const taskTree = readFileSync(modulePath, 'utf8');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const completionFlow = readFileSync(join(root, 'src/app/appCompletionFlow.ts'), 'utf8');
const completionActions = readFileSync(join(root, 'src/app/appCompletionActions.ts'), 'utf8');
const keyboardShortcuts = readFileSync(join(root, 'src/app/appKeyboardShortcuts.ts'), 'utf8');

assert.ok(taskTree.includes('export function findTaskInTree('), 'Task tree helper should export findTaskInTree.');
assert.ok(taskTree.includes('export function isSubtask('), 'Task tree helper should export isSubtask.');
assert.ok(
  completionActions.includes("import { findTaskInTree } from '../utils/taskTree';"),
  'Completion action helper should import findTaskInTree from utils.'
);
assert.ok(
  completionFlow.includes("import { isSubtask } from '../utils/taskTree';"),
  'Completion flow helper should import isSubtask from utils.'
);
assert.ok(
  keyboardShortcuts.includes("import { shiftDateKey } from '../../shared/taskRollover';"),
  'Keyboard shortcut helper should reuse the shared date shifting helper.'
);
assert.doesNotMatch(app, /function findTaskInTree\(/, 'App should not inline findTaskInTree.');
assert.doesNotMatch(app, /function isSubtask\(/, 'App should not inline isSubtask.');
assert.doesNotMatch(app, /function shiftDate\(/, 'App should not inline shiftDate.');
assert.ok(keyboardShortcuts.includes('shiftDateKey(prev, action.days)'), 'Keyboard shortcut action helper should use shiftDateKey with the helper-selected date delta.');
assert.ok(keyboardShortcuts.includes("days: -1"), 'Keyboard shortcut helper should preserve previous-day delta.');
assert.ok(keyboardShortcuts.includes("days: 1"), 'Keyboard shortcut helper should preserve next-day delta.');

console.log('verify-app-task-tree-module passed');
