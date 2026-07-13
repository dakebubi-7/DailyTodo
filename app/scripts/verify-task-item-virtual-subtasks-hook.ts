import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const hookPath = join(root, 'src/components/taskItem/useVirtualSubtasks.ts');
const subtasksViewportPath = join(root, 'src/components/taskItem/TaskSubtasksViewport.tsx');
const taskItemPath = join(root, 'src/components/TaskItem.tsx');

assert.ok(existsSync(hookPath), 'TaskItem virtual subtask hook module should exist.');
assert.ok(existsSync(subtasksViewportPath), 'TaskItem subtasks viewport component module should exist.');

const hook = readFileSync(hookPath, 'utf8');
const subtasksViewport = readFileSync(subtasksViewportPath, 'utf8');
const taskItem = readFileSync(taskItemPath, 'utf8');

assert.match(hook, /export const TASK_SUBTASK_VIEWPORT_HEIGHT = 400/, 'hook module should export the subtask viewport height.');
assert.match(hook, /const TASK_SUBTASK_ROW_HEIGHT = 46/, 'hook module should own the row-height constant.');
assert.match(hook, /const TASK_SUBTASK_OVERSCAN = 4/, 'hook module should own the overscan constant.');
assert.match(hook, /const TASK_SUBTASK_VIRTUAL_THRESHOLD = 30/, 'hook module should own the virtualization threshold.');
assert.match(hook, /export interface VirtualSubtaskItem\b/, 'hook module should export VirtualSubtaskItem.');
assert.match(hook, /export function useVirtualSubtasks\b/, 'hook module should export useVirtualSubtasks.');
assert.match(hook, /useRef<HTMLSpanElement>\(null\)/, 'hook should keep the viewport ref behavior.');
assert.match(hook, /addEventListener\('scroll', handleScroll, \{ passive: true \}\)/, 'hook should keep passive scroll tracking.');
assert.match(hook, /removeEventListener\('scroll', handleScroll\)/, 'hook should clean up scroll tracking.');
assert.match(hook, /const scrollFrameRef = useRef<number \| undefined>\(undefined\);/, 'hook should retain one pending frame for coalescing virtual-list scroll updates.');
assert.match(hook, /if \(scrollFrameRef\.current !== undefined\) return;[\s\S]*?scrollFrameRef\.current = window\.requestAnimationFrame\(\(\) => \{[\s\S]*?scrollFrameRef\.current = undefined;[\s\S]*?setScrollTop\(viewport\.scrollTop\);/, 'hook should coalesce high-frequency native scroll events into one state update per frame.');
assert.match(hook, /if \(scrollFrameRef\.current !== undefined\) \{[\s\S]*?window\.cancelAnimationFrame\(scrollFrameRef\.current\);[\s\S]*?scrollFrameRef\.current = undefined;[\s\S]*?\}/, 'hook should cancel a pending virtual-list scroll frame during cleanup.');
assert.match(hook, /if \(!isExpanded\) return \[\];/, 'collapsed task clusters should skip building unused subtask render descriptors.');
assert.match(hook, /Math\.floor\(scrollTop \/ TASK_SUBTASK_ROW_HEIGHT\) - TASK_SUBTASK_OVERSCAN/, 'hook should preserve start index overscan math.');
assert.match(hook, /Math\.ceil\(\(scrollTop \+ viewportHeight\) \/ TASK_SUBTASK_ROW_HEIGHT\) \+ TASK_SUBTASK_OVERSCAN/, 'hook should preserve end index overscan math.');
assert.match(hook, /top: index \* TASK_SUBTASK_ROW_HEIGHT/, 'hook should preserve virtual item top positioning.');

assert.match(taskItem, /from '\.\/taskItem\/useVirtualSubtasks'/, 'TaskItem should import the virtual subtask hook module.');
assert.match(taskItem, /useVirtualSubtasks\(directSubtasks, isExpanded\)/, 'TaskItem should still use the virtual subtask hook.');
assert.match(taskItem, /lazy\(\(\) => import\('\.\/taskItem\/TaskSubtasksViewport'\)/, 'TaskItem should lazy-load the extracted subtasks viewport.');
assert.match(taskItem, /<TaskSubtasksViewport\b/, 'TaskItem should render the extracted subtasks viewport after it loads.');
assert.match(subtasksViewport, /TASK_SUBTASK_VIEWPORT_HEIGHT/, 'TaskSubtasksViewport should use the exported viewport height for maxHeight.');
assert.doesNotMatch(taskItem, /function useVirtualSubtasks\(/, 'TaskItem should not inline useVirtualSubtasks.');
assert.doesNotMatch(taskItem, /interface VirtualSubtaskItem\b/, 'TaskItem should not inline VirtualSubtaskItem.');
assert.doesNotMatch(taskItem, /TASK_SUBTASK_VIEWPORT_HEIGHT/, 'TaskItem should not own expanded viewport sizing after extracting TaskSubtasksViewport.');
assert.doesNotMatch(taskItem, /const TASK_SUBTASK_ROW_HEIGHT = 46/, 'TaskItem should not own virtual subtask row height.');
assert.doesNotMatch(taskItem, /const TASK_SUBTASK_OVERSCAN = 4/, 'TaskItem should not own virtual subtask overscan.');
assert.doesNotMatch(taskItem, /const TASK_SUBTASK_VIRTUAL_THRESHOLD = 30/, 'TaskItem should not own virtual subtask threshold.');

console.log('TaskItem virtual subtask hook verification passed');
