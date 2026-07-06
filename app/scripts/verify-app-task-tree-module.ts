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

assert.ok(taskTree.includes('export function findTaskInTree('), 'Task tree helper should export findTaskInTree.');
assert.ok(taskTree.includes('export function isSubtask('), 'Task tree helper should export isSubtask.');
assert.ok(
  app.includes("import { findTaskInTree, isSubtask } from './utils/taskTree';"),
  'App should import task tree helpers from utils.'
);
assert.ok(
  app.includes("import { shiftDateKey } from '../shared/taskRollover';"),
  'App should reuse the shared date shifting helper.'
);
assert.doesNotMatch(app, /function findTaskInTree\(/, 'App should not inline findTaskInTree.');
assert.doesNotMatch(app, /function isSubtask\(/, 'App should not inline isSubtask.');
assert.doesNotMatch(app, /function shiftDate\(/, 'App should not inline shiftDate.');
assert.ok(app.includes('shiftDateKey(prev, -1)'), 'App keyboard shortcut should use shiftDateKey for previous day.');
assert.ok(app.includes('shiftDateKey(prev, 1)'), 'App keyboard shortcut should use shiftDateKey for next day.');

console.log('verify-app-task-tree-module passed');
