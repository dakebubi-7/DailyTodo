import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const viewportPath = join(root, 'src/components/taskItem/TaskSubtasksViewport.tsx');
const taskItemPath = join(root, 'src/components/TaskItem.tsx');

assert.ok(existsSync(viewportPath), 'TaskSubtasksViewport component module should exist.');

const viewport = readFileSync(viewportPath, 'utf8');
const taskItem = readFileSync(taskItemPath, 'utf8');

assert.match(viewport, /import \{ motion \} from 'framer-motion'/, 'TaskSubtasksViewport should own its framer-motion dependency.');
assert.match(viewport, /import \{ SubtaskCard \} from '\.\/SubtaskCard'/, 'TaskSubtasksViewport should own SubtaskCard rendering.');
assert.match(viewport, /type VirtualSubtaskItem \} from '\.\/useVirtualSubtasks'/, 'TaskSubtasksViewport should use the virtual-subtask item type.');
assert.match(viewport, /export interface TaskSubtasksViewportProps\b/, 'TaskSubtasksViewport module should export its props.');
assert.match(viewport, /export function TaskSubtasksViewport\b/, 'TaskSubtasksViewport module should export TaskSubtasksViewport.');
assert.match(viewport, /taskId: string/, 'TaskSubtasksViewport props should receive the parent task id for aria-controls matching.');
assert.match(viewport, /language: AppLanguage/, 'TaskSubtasksViewport props should receive the app language for localized carryover text.');
assert.match(viewport, /carriedFromDate: string \| undefined/, 'TaskSubtasksViewport props should receive optional carryover provenance.');
assert.match(viewport, /subtaskCarryoverProgress: Task\['subtaskCarryoverProgress'\]/, 'TaskSubtasksViewport props should receive optional carryover progress.');
assert.match(viewport, /visibleVirtualItems: VirtualSubtaskItem\[\]/, 'TaskSubtasksViewport props should receive visible virtual items.');
assert.match(viewport, /viewportRef: RefObject<HTMLSpanElement>/, 'TaskSubtasksViewport props should receive the virtual scroll viewport ref.');
assert.match(viewport, /isVirtual: boolean/, 'TaskSubtasksViewport props should receive virtual-list mode.');
assert.match(viewport, /totalHeight: number \| undefined/, 'TaskSubtasksViewport props should receive total virtual height.');
assert.match(viewport, /shouldReduceMotion: boolean \| null/, 'TaskSubtasksViewport props should receive the reduced-motion flag.');
assert.match(viewport, /onToggleSubtask: \(id: string\) => void/, 'TaskSubtasksViewport props should receive subtask toggle routing.');
assert.match(viewport, /onDeleteSubtask: \(id: string\) => void/, 'TaskSubtasksViewport props should receive subtask delete routing.');
assert.match(viewport, /onViewSubtaskReview: \(task: Task\) => void/, 'TaskSubtasksViewport props should receive subtask review routing.');
assert.match(viewport, /onEditSubtask: \(id: string, text: string\) => void/, 'TaskSubtasksViewport props should receive subtask edit routing.');
assert.match(viewport, /onChangeSubtaskPriority: \(id: string, priority: Task\['priority'\]\) => void/, 'TaskSubtasksViewport props should receive subtask priority routing.');
assert.match(viewport, /aria-label=\{TASK_SUBTASKS_LABEL\}/, 'TaskSubtasksViewport should preserve the subtasks accessible label.');
assert.match(viewport, /id=\{`task-subtasks-\$\{taskId\}`\}/, 'TaskSubtasksViewport should preserve the subtasks region id format.');
assert.match(viewport, /className="task-subtasks task-subtasks-scroll-viewport"/, 'TaskSubtasksViewport should preserve viewport classes.');
assert.match(viewport, /style=\{\{ maxHeight: TASK_SUBTASK_VIEWPORT_HEIGHT \}\}/, 'TaskSubtasksViewport should preserve max-height capping.');
assert.match(viewport, /ref=\{viewportRef\}/, 'TaskSubtasksViewport should attach the virtual scroll ref.');
assert.match(viewport, /onClick=\{stopClusterToggle\}/, 'TaskSubtasksViewport should preserve click propagation blocking.');
assert.match(viewport, /onPointerDown=\{stopClusterToggle\}/, 'TaskSubtasksViewport should preserve pointer propagation blocking.');
assert.match(viewport, /getSubtaskCarryoverNotice\(language, carriedFromDate, subtaskCarryoverProgress\)/, 'TaskSubtasksViewport should derive the localized carryover notice from parent provenance and progress.');
assert.match(viewport, /className="task-subtask-carryover-notice"/, 'TaskSubtasksViewport should render the carryover notice with a dedicated class.');
assert.match(viewport, /className=\{`task-subtask-virtual-list \$\{isVirtual \? 'task-subtask-virtual-list-active' : ''\}`\}/, 'TaskSubtasksViewport should preserve virtual-list classes.');
assert.match(viewport, /style=\{isVirtual \? \{ height: totalHeight \} : undefined\}/, 'TaskSubtasksViewport should preserve virtual-list height behavior.');
assert.match(viewport, /visibleVirtualItems\.map\(\(virtualItem\) =>/, 'TaskSubtasksViewport should render only visible virtual items.');
assert.match(viewport, /className="task-subtask-virtual-spacer"/, 'TaskSubtasksViewport should preserve virtual spacer class.');
assert.match(viewport, /style=\{isVirtual \? \{ top: virtualItem\.top \} : undefined\}/, 'TaskSubtasksViewport should preserve virtual spacer top positioning.');
assert.match(viewport, /delay: virtualItem\.index \* TASK_SUBTASK_STAGGER_MS \* 0\.001/, 'TaskSubtasksViewport should preserve subtask stagger timing.');
assert.match(viewport, /<SubtaskCard\s+subtask=\{virtualItem\.task\}\s+onToggleSubtask=\{onToggleSubtask\}\s+onDeleteSubtask=\{onDeleteSubtask\}\s+onViewSubtaskReview=\{onViewSubtaskReview\}\s+onEditSubtask=\{onEditSubtask\}\s+onChangeSubtaskPriority=\{onChangeSubtaskPriority\}/s, 'TaskSubtasksViewport should pass subtask callbacks through to SubtaskCard.');
assert.ok(
  viewport.indexOf('className="task-subtask-carryover-notice"') < viewport.indexOf('className={`task-subtask-virtual-list'),
  'TaskSubtasksViewport should render the carryover notice above its virtual subtask list.',
);

assert.match(taskItem, /lazy\(\(\) => import\('\.\/taskItem\/TaskSubtasksViewport'\)/, 'TaskItem should lazy-load TaskSubtasksViewport.');
assert.doesNotMatch(taskItem, /import \{ TaskSubtasksViewport \} from '\.\/taskItem\/TaskSubtasksViewport'/, 'TaskItem should not statically import TaskSubtasksViewport.');
assert.match(taskItem, /<Suspense fallback=\{null\}>[\s\S]*<TaskSubtasksViewport/s, 'TaskItem should suspend only the expanded subtask viewport while its chunk loads.');
assert.match(taskItem, /\{isExpanded && \(\s*<Suspense fallback=\{null\}>[\s\S]*?<TaskSubtasksViewport/s, 'TaskItem should mount the carryover notice only with expanded subtasks.');
assert.match(taskItem, /<TaskSubtasksViewport\s+taskId=\{task\.id\}\s+language=\{language\}\s+carriedFromDate=\{task\.carriedFromDate\}\s+subtaskCarryoverProgress=\{task\.subtaskCarryoverProgress\}\s+viewportRef=\{virtualSubtasks\.viewportRef\}\s+isVirtual=\{virtualSubtasks\.isVirtual\}\s+totalHeight=\{virtualSubtasks\.totalHeight\}\s+visibleVirtualItems=\{virtualSubtasks\.visibleVirtualItems\}\s+shouldReduceMotion=\{shouldReduceMotion\}/s, 'TaskItem should render TaskSubtasksViewport with localized carryover data and hook output.');
assert.match(taskItem, /onToggleSubtask=\{onToggleSubtask\}/, 'TaskItem should pass subtask toggle routing into TaskSubtasksViewport.');
assert.match(taskItem, /onDeleteSubtask=\{onDeleteSubtask\}/, 'TaskItem should pass subtask delete routing into TaskSubtasksViewport.');
assert.match(taskItem, /onViewSubtaskReview=\{onViewSubtaskReview\}/, 'TaskItem should pass subtask review routing into TaskSubtasksViewport.');
assert.match(taskItem, /onEditSubtask=\{onEditSubtask\}/, 'TaskItem should pass subtask edit routing into TaskSubtasksViewport.');
assert.match(taskItem, /onChangeSubtaskPriority=\{onChangeSubtaskPriority\}/, 'TaskItem should pass subtask priority routing into TaskSubtasksViewport.');
assert.doesNotMatch(taskItem, /className="task-subtasks task-subtasks-scroll-viewport"/, 'TaskItem should not inline the expanded subtask viewport markup.');
assert.doesNotMatch(taskItem, /className=\{`task-subtask-virtual-list/, 'TaskItem should not inline the virtual subtask list markup.');
assert.doesNotMatch(taskItem, /className="task-subtask-virtual-spacer"/, 'TaskItem should not inline the virtual subtask spacer markup.');
assert.doesNotMatch(taskItem, /visibleVirtualItems\.map\(\(virtualItem\) =>/, 'TaskItem should not map virtual subtask items directly after extraction.');
assert.doesNotMatch(taskItem, /<SubtaskCard\s+subtask=\{virtualItem\.task\}/, 'TaskItem should not render SubtaskCard directly after extracting the viewport component.');
assert.doesNotMatch(taskItem, /TASK_SUBTASK_VIEWPORT_HEIGHT/, 'TaskItem should not own the expanded subtask viewport max-height after extraction.');
assert.doesNotMatch(taskItem, /TASK_SUBTASK_STAGGER_MS/, 'TaskItem should not own subtask stagger animation timing after extraction.');

console.log('TaskItem subtasks viewport verification passed');
