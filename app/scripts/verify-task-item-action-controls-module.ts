import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const controlsPath = join(root, 'src/components/taskItem/taskItemControls.tsx');
const actionControlsPath = join(root, 'src/components/taskItem/taskItemActionControls.tsx');
const taskItemPath = join(root, 'src/components/TaskItem.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(controlsPath), 'TaskItem content controls module should exist.');
assert.ok(existsSync(actionControlsPath), 'TaskItem action controls should live in a focused module.');

const controls = readFileSync(controlsPath, 'utf8');
const actionControls = readFileSync(actionControlsPath, 'utf8');
const taskItem = readFileSync(taskItemPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(taskItem, /from '\.\/taskItem\/taskItemActionControls'/, 'TaskItem should import parent actions from the focused action-controls module.');
assert.match(actionControls, /export function ReviewActionButton\b/, 'Action controls should export ReviewActionButton.');
assert.match(actionControls, /export function TaskActionLayer\b/, 'Action controls should export TaskActionLayer.');
assert.match(actionControls, /export function CompleteActionButton\b/, 'Action controls should export CompleteActionButton.');
assert.match(actionControls, /export function DeleteActionButton\b/, 'Action controls should export DeleteActionButton.');
assert.match(actionControls, /className="task-action-layer"/, 'Action controls should preserve the action-layer class.');
assert.match(actionControls, /className="task-action-slot task-action-slot-review task-review-zone"/, 'Action controls should preserve the review action slot.');
assert.match(actionControls, /className="task-action-slot task-action-slot-delete task-delete-zone"/, 'Action controls should preserve the delete action slot.');
assert.match(actionControls, /className=\{getTaskCompleteActionClassName\(completed\)\}/, 'Action controls should preserve completion action class derivation.');
assert.match(actionControls, /event\.stopPropagation\(\);\s*onClick\(\);/s, 'Completion action should stop propagation before toggling.');
assert.match(actionControls, /aria-label=\{TASK_DELETE_ACTION_LABEL\}/, 'Delete action should preserve accessible copy.');
assert.match(actionControls, /<ReviewIcon hasReview=\{hasReview\} \/>/, 'Review action should preserve its icon state.');
assert.match(actionControls, /<TrashIcon \/>/, 'Delete action should preserve its icon.');
assert.doesNotMatch(controls, /export function ReviewActionButton\b/, 'Content controls should not own review actions after extraction.');
assert.doesNotMatch(controls, /export function TaskActionLayer\b/, 'Content controls should not own the action layer after extraction.');
assert.doesNotMatch(controls, /export function CompleteActionButton\b/, 'Content controls should not own completion actions after extraction.');
assert.doesNotMatch(controls, /export function DeleteActionButton\b/, 'Content controls should not own delete actions after extraction.');
assert.equal(scripts['verify:task-item-action-controls-module'], 'tsx scripts/verify-task-item-action-controls-module.ts', 'package.json should expose the focused task action-controls verifier.');
assertCleanupCoreIncludes('verify:task-item-action-controls-module', 'cleanup-core should include the focused task action-controls verifier.');

console.log('TaskItem action controls module verification passed');
