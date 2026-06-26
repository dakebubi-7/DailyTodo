import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'src')) ? cwd : join(cwd, 'app');
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(taskItem.includes('TASK_CLUSTER_SPRING'), 'TaskItem should define a shared spring config for the cluster cascade.');
assert(taskItem.includes('stiffness: 180') && taskItem.includes('damping: 25') && taskItem.includes('mass: 1'), 'Task cluster animation should use the requested spring parameters.');
assert(taskItem.includes('getStackLayerCount(subtaskCount)'), 'Collapsed stack should derive faux layer count from actual subtask count.');
assert(taskItem.includes('Array.from({ length: stackLayerCount })'), 'Collapsed stack should render only the computed faux visual layers.');
assert(taskItem.includes('task-stack-layer-2') && taskItem.includes('task-stack-layer-3'), 'Collapsed stack should expose exactly two faux layer classes below the parent card.');
assert(taskItem.includes('task-cluster-no-children'), 'Tasks without subtasks should keep a non-stacked cluster state.');
assert(taskItem.includes('useVirtualSubtasks'), 'Expanded subtasks should use local virtual rendering logic.');
assert(taskItem.includes('visibleVirtualItems'), 'Only visible initialized subtask items should be rendered in the scroll viewport.');
assert(taskItem.includes('TASK_SUBTASK_VIEWPORT_HEIGHT'), 'Expanded subtask viewport should have a capped internal height.');
assert(taskItem.includes('TASK_SUBTASK_STAGGER_MS') && taskItem.includes('* 0.001'), 'Subtask cards should stagger by millisecond constants converted to seconds.');
assert(taskItem.includes('totalSubtaskCount') && taskItem.includes('completedSubtaskCount'), 'Main card should show an absolute subtask counter.');
assert(taskItem.includes('aria-expanded={hasChildren ? !task.collapsed : undefined}'), 'Parent card should expose expanded state only when subtasks exist.');

assert(globals.includes('.task-cluster'), 'CSS should style the task cluster wrapper.');
assert(globals.includes('.task-stack-layer'), 'CSS should style faux collapsed stack layers.');
assert(globals.includes('pointer-events: none'), 'Faux stack layers should be pointer-events none.');
assert(globals.includes('.task-stack-layer-2') && globals.includes('translateY(8px) scale(0.98)'), 'Layer 2 should be scaled to 98% and translated by 8px.');
assert(globals.includes('.task-stack-layer-3') && globals.includes('translateY(16px) scale(0.96)'), 'Layer 3 should be scaled to 96% and translated by 16px.');
assert(globals.includes('.task-subtasks-scroll-viewport'), 'CSS should cap expanded subtask list with an internal scroll viewport.');
assert(globals.includes('max-height: 400px'), 'Expanded subtask viewport should cap at 400px.');
assert(globals.includes('.task-subtasks-scroll-viewport::-webkit-scrollbar'), 'Expanded subtask viewport should customize its scrollbar.');
assert(globals.includes('.task-subtask-virtual-list'), 'CSS should style the virtualized subtask list.');
assert(globals.includes('.task-subtask-virtual-spacer'), 'CSS should reserve virtualized offscreen space.');

console.log('Task cluster stack verification passed');
