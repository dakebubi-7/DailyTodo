import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const controls = readFileSync(join(root, 'src/components/taskItem/taskItemControls.tsx'), 'utf8');
const actionControls = readFileSync(join(root, 'src/components/taskItem/taskItemActionControls.tsx'), 'utf8');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

assert.ok(controls.includes('className="task-text task-text-browse"'), 'Browse mode should render the visible two-line task title.');
assert.match(controls, /className="task-text task-text-active"\s+aria-hidden="true"/s, 'Active title should remain available as an aria-hidden one-line layout layer.');
assert.ok(controls.includes('className="task-text-row"'), 'The task title row should preserve its row class.');
assert.ok(controls.includes('title={getTaskTextTitle(task)}'), 'The task title should preserve its tooltip.');
assert.ok(controls.includes('onDoubleClick={onStartEdit}'), 'The task title should preserve double-click editing.');
assert.match(taskItem, /className="task-drag-slot"/, 'Task rows should preserve a dedicated drag slot.');
assert.doesNotMatch(taskItem, /task-cluster-main-spacer/, 'Task rows should no longer retain the removed cluster main spacer.');
assert.match(taskItem, /!isCleanupMode && \([\s\S]*?<TaskActionLayer/, 'History cleanup mode should continue to guard the action layer.');
assert.match(taskItem, /from '\.\/taskItem\/taskItemActionControls'/, 'TaskItem should retain action-layer module ownership.');
assert.match(actionControls, /export function TaskActionLayer\b/, 'The focused action-controls module should continue to own TaskActionLayer.');

assert.ok(globals.includes('.task-card-no-children {\n  grid-template-columns: auto auto auto minmax(0, 1fr) !important;'), 'No-child task cards should use the four-column row grid.');
assert.match(globals, /\.task-card > \.task-text-wrap,\n\.task-card > \.task-edit-input \{[\s\S]*?grid-column: 4 !important;/, 'Task content and editing should occupy grid column 4.');
assert.match(globals, /@media \(hover: hover\) and \(pointer: fine\)/, 'Task action reveal should be gated behind precise hover capability.');
assert.match(globals, /\.task-card:hover[\s\S]*?\.task-action-layer[\s\S]*?opacity: 1/, 'Hovering a task card should reveal its action space.');
assert.match(globals, /\.task-card:focus-within[\s\S]*?\.task-action-layer[\s\S]*?opacity: 1/, 'Focusing within a task card should reveal its action space.');
assert.match(globals, /\.task-action-layer \{[\s\S]*?opacity: 0;[\s\S]*?pointer-events: none;/, 'Idle task action space should be hidden and non-interactive.');
assert.match(globals, /\.task-card:hover[\s\S]*?\.task-action-layer[\s\S]*?pointer-events: auto;/, 'Revealed task actions should accept pointer interaction.');
assert.match(globals, /\.task-text-browse \{[\s\S]*?-webkit-line-clamp: 2;/, 'Browse titles should clamp to two lines.');
assert.match(globals, /\.task-text-active \{[\s\S]*?white-space: nowrap;[\s\S]*?text-overflow: ellipsis;/, 'Active titles should remain one-line and ellipsize.');
assert.match(globals, /\.task-text-active \{[\s\S]*?height: 1\.25em;/, 'Active titles should reserve a one-line 1.25em height.');
assert.match(globals, /\.task-card\.history-cleanup-task-card \{/, 'History cleanup styling should target the exact cleanup task-card selector.');
assert.match(globals, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.task-action-layer[\s\S]*?transition: none/, 'Reduced motion should disable task action transitions.');

assert.equal(packageJson.scripts['verify:task-row-title-retraction'], 'tsx scripts/verify-task-row-title-retraction.ts', 'package.json should expose the focused task row title retraction verifier.');
assertCleanupCoreIncludes('verify:task-row-title-retraction', 'cleanup-core should include the focused task row title retraction verifier.');

console.log('Task row title retraction verification passed');
