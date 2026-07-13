import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const interactionsPath = join(root, 'src/components/taskItem/taskItemInteractions.ts');
const taskItemPath = join(root, 'src/components/TaskItem.tsx');

assert.ok(existsSync(interactionsPath), 'TaskItem interactions helper module should exist.');

const interactions = readFileSync(interactionsPath, 'utf8');
const taskItem = readFileSync(taskItemPath, 'utf8');

assert.match(interactions, /export function stopClusterToggle\(event: [^)]+\)/, 'interactions module should export stopClusterToggle.');
assert.match(interactions, /event\.stopPropagation\(\)/, 'stopClusterToggle should preserve stopPropagation behavior.');
assert.match(interactions, /export function shouldToggleTaskClusterForKey\(key: string\)/, 'interactions module should export shouldToggleTaskClusterForKey.');
assert.match(interactions, /key === 'Enter' \|\| key === ' '/, 'cluster key helper should preserve Enter and Space toggle keys.');
assert.doesNotMatch(interactions, /from ['"]\.\.\/\.\.\/types\/task['"]/, 'interactions module should not depend on Task types.');
assert.doesNotMatch(interactions, /useState|useEffect|useMemo|useRef/, 'interactions module should stay hook-free.');

assert.match(taskItem, /import \{ stopClusterToggle, shouldToggleTaskClusterForKey \} from '\.\/taskItem\/taskItemInteractions';/, 'TaskItem should import interaction helpers from the interactions module.');
assert.match(taskItem, /onClick=\{stopClusterToggle\}/, 'TaskItem should still stop click propagation for nested interactive layers.');
assert.match(taskItem, /onPointerDown=\{stopClusterToggle\}/, 'TaskItem should still stop pointer propagation for nested interactive layers.');
assert.match(taskItem, /if \(!shouldToggleTaskClusterForKey\(event\.key\)\) return;/, 'TaskItem cluster keydown handler should use the cluster key helper before toggling.');
assert.match(taskItem, /stopClusterToggle\(event\);\s*\r?\n\s*startEditing\(\);/, 'TaskItem should still stop propagation before starting text edit on double click.');
assert.doesNotMatch(taskItem, /function stopClusterToggle\(/, 'TaskItem should not define stopClusterToggle locally.');
assert.doesNotMatch(taskItem, /event\.key !== 'Enter' && event\.key !== ' '/, 'TaskItem should not inline cluster toggle key filtering.');
assert.doesNotMatch(taskItem, /type MouseEvent,/, 'TaskItem should not import MouseEvent only for the extracted interaction helper.');
assert.doesNotMatch(taskItem, /type PointerEvent,/, 'TaskItem should not import PointerEvent only for the extracted interaction helper.');

console.log('TaskItem interactions helper verification passed');
