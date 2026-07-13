import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const stackPath = join(root, 'src/components/taskItem/taskItemStack.ts');
const stackSegmentsPath = join(root, 'src/components/taskItem/TaskStackSegments.tsx');
const taskItemPath = join(root, 'src/components/TaskItem.tsx');

assert.ok(existsSync(stackPath), 'TaskItem stack helper module should exist.');
assert.ok(existsSync(stackSegmentsPath), 'TaskItem stack segments component module should exist.');

const stack = readFileSync(stackPath, 'utf8');
const stackSegments = readFileSync(stackSegmentsPath, 'utf8');
const taskItem = readFileSync(taskItemPath, 'utf8');

assert.match(stack, /export const TASK_STACK_SEGMENT_CLASSES = \['task-stack-segment-1', 'task-stack-segment-2', 'task-stack-segment-3'\] as const/, 'stack module should own stack segment classes.');
assert.match(stack, /export const TASK_CLUSTER_SPRING = \{\s*stiffness: 180,\s*damping: 25,\s*mass: 1,\s*\}/s, 'stack module should export the cluster spring values.');
assert.match(stack, /export const TASK_STACK_SEGMENT_TRANSITIONS = TASK_STACK_SEGMENT_CLASSES\.map/, 'stack module should export stack segment transitions.');
assert.match(stack, /delay: segmentIndex \* 0\.025/, 'stack transitions should preserve per-segment delay.');
assert.match(stack, /export const TASK_CLUSTER_REDUCED_TRANSITION = \{\s*duration: 0\.01,\s*\}/s, 'stack module should export reduced-motion transition.');
assert.match(stack, /export const TASK_SUBTASK_STAGGER_MS = 50/, 'stack module should export subtask stagger timing.');
assert.match(stack, /export function getStackSegmentCount\b/, 'stack module should export getStackSegmentCount.');
assert.match(stack, /import type \{ CSSProperties \} from 'react'/, 'stack module should import CSSProperties for stack segment style.');
assert.match(stack, /export function getStackSegmentStyle\(segmentCount: number\): TaskStackSegmentStyle/, 'stack module should export getStackSegmentStyle with the typed custom-property style.');
assert.match(stack, /'--task-stack-segment-count': segmentCount/, 'stack style helper should preserve the CSS custom property name.');
assert.match(stack, /type TaskStackSegmentStyle = CSSProperties & \{\s*'--task-stack-segment-count': number;\s*\}/s, 'stack style helper should type its custom property without a return-object cast.');
assert.doesNotMatch(stack, /as CSSProperties/, 'stack style helper should not cast custom-property style objects to CSSProperties.');
assert.match(stack, /if \(subtaskCount <= 0\) return 0/, 'stack count helper should preserve non-positive count behavior.');
assert.match(stack, /Math\.min\(subtaskCount, TASK_STACK_SEGMENT_CLASSES\.length\)/, 'stack count helper should preserve cap at available segment classes.');

assert.match(stackSegments, /import \{ motion \} from 'framer-motion'/, 'TaskStackSegments should own its framer-motion dependency.');
assert.match(stackSegments, /TASK_CLUSTER_REDUCED_TRANSITION/, 'TaskStackSegments should reuse the shared reduced-motion transition.');
assert.match(stackSegments, /TASK_STACK_SEGMENT_CLASSES/, 'TaskStackSegments should reuse shared stack segment classes.');
assert.match(stackSegments, /TASK_STACK_SEGMENT_TRANSITIONS/, 'TaskStackSegments should reuse shared stack segment transitions.');
assert.match(stackSegments, /export interface TaskStackSegmentsProps\b/, 'TaskStackSegments module should export its props.');
assert.match(stackSegments, /export function TaskStackSegments\b/, 'TaskStackSegments module should export TaskStackSegments.');
assert.match(stackSegments, /segmentCount: number/, 'TaskStackSegments props should include the segment count.');
assert.match(stackSegments, /shouldReduceMotion: boolean/, 'TaskStackSegments props should include the reduced-motion flag.');
assert.match(stackSegments, /className="task-stack-segments"/, 'TaskStackSegments should preserve the segment container class.');
assert.match(stackSegments, /aria-hidden="true"/, 'TaskStackSegments should preserve decorative accessibility hiding.');
assert.match(stackSegments, /TASK_STACK_SEGMENT_CLASSES\.slice\(0, segmentCount\)/, 'TaskStackSegments should render only the requested number of segment classes.');
assert.match(stackSegments, /className=\{`task-stack-segment \$\{segmentClass\}`\}/, 'TaskStackSegments should preserve stack segment element classes.');
assert.match(stackSegments, /initial=\{shouldReduceMotion \? false : \{ opacity: 0 \}\}/, 'TaskStackSegments should preserve reduced-motion initial behavior.');
assert.match(stackSegments, /animate=\{shouldReduceMotion \? \{ opacity: 1 \} : \{ opacity: 1 \}\}/, 'TaskStackSegments should preserve opacity-only animation.');
assert.match(stackSegments, /exit=\{shouldReduceMotion \? \{ opacity: 0 \} : \{ opacity: 0 \}\}/, 'TaskStackSegments should preserve opacity-only exit animation.');
assert.match(stackSegments, /transition=\{shouldReduceMotion \? TASK_CLUSTER_REDUCED_TRANSITION : TASK_STACK_SEGMENT_TRANSITIONS\[segmentIndex\]\}/, 'TaskStackSegments should preserve transition selection.');

assert.match(taskItem, /from '\.\/taskItem\/taskItemStack'/, 'TaskItem should import stack helpers from the stack module.');
assert.match(taskItem, /from '\.\/taskItem\/TaskStackSegments'/, 'TaskItem should import TaskStackSegments from its component module.');
assert.match(taskItem, /<TaskStackSegments\s+segmentCount=\{stackSegmentCount\}\s+shouldReduceMotion=\{shouldReduceMotion\}/, 'TaskItem should render TaskStackSegments for collapsed child-task stacks.');
assert.match(taskItem, /getStackSegmentCount\(subtaskCount\)/, 'TaskItem should still use getStackSegmentCount.');
assert.match(taskItem, /getStackSegmentStyle\(stackSegmentCount\)/, 'TaskItem should still use getStackSegmentStyle for collapsed stack styling.');
assert.match(taskItem, /import \{[^}]*getStackSegmentStyle[^}]*\} from '\.\/taskItem\/taskItemStack'/s, 'TaskItem should import getStackSegmentStyle from the stack module.');
assert.doesNotMatch(taskItem, /TASK_STACK_SEGMENT_CLASSES\.slice\(0, stackSegmentCount\)/, 'TaskItem should not inline stack segment rendering after extracting TaskStackSegments.');
assert.doesNotMatch(taskItem, /TASK_STACK_SEGMENT_TRANSITIONS\[segmentIndex\]/, 'TaskItem should not wire stack segment transitions directly after extracting TaskStackSegments.');
assert.doesNotMatch(taskItem, /className="task-stack-segments"/, 'TaskItem should not inline the stack segment container after extraction.');
assert.doesNotMatch(taskItem, /className=\{`task-stack-segment \$\{segmentClass\}`\}/, 'TaskItem should not inline stack segment element classes after extraction.');
assert.doesNotMatch(taskItem, /function getStackSegmentStyle\(segmentCount: number\)/, 'TaskItem should not own getStackSegmentStyle.');
assert.doesNotMatch(taskItem, /const TASK_STACK_SEGMENT_CLASSES =/, 'TaskItem should not own stack segment classes.');
assert.doesNotMatch(taskItem, /export const TASK_CLUSTER_SPRING =/, 'TaskItem should not own cluster spring values.');
assert.doesNotMatch(taskItem, /const TASK_STACK_SEGMENT_TRANSITIONS =/, 'TaskItem should not own stack segment transitions.');
assert.doesNotMatch(taskItem, /const TASK_CLUSTER_REDUCED_TRANSITION =/, 'TaskItem should not own reduced-motion transition.');
assert.doesNotMatch(taskItem, /const TASK_SUBTASK_STAGGER_MS = 50/, 'TaskItem should not own subtask stagger timing.');
assert.doesNotMatch(taskItem, /export function getStackSegmentCount\b/, 'TaskItem should not own getStackSegmentCount.');

console.log('TaskItem stack helper verification passed');
