import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'src')) ? cwd : join(cwd, 'app');
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function getCssBlock(css: string, selector: string) {
  const start = css.indexOf(`${selector} {`);
  assert(start >= 0, `Missing CSS block: ${selector}`);
  const bodyStart = css.indexOf('{', start) + 1;
  const end = css.indexOf('\n}', bodyStart);
  assert(end > bodyStart, `Malformed CSS block: ${selector}`);
  return css.slice(bodyStart, end);
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
assert(!taskItem.includes('task-subtask-count-badge'), 'Collapsed main task should not render a subtask count badge.');
assert(taskItem.includes('task-subtask-delete task-icon-action task-delete-action'), 'Expanded subtasks should show delete buttons again.');
assert(globals.includes('.task-cluster-main-card.task-card') && globals.includes('background: var(--solid-surface, rgba(255, 255, 255, 0.92)) !important;'), 'Main cluster card should use an opaque solid surface instead of a transparent glass layer.');
assert(globals.includes('.dark .task-cluster-main-card.task-card') && globals.includes('background: var(--solid-surface-dark, rgba(15, 23, 42, 0.95)) !important;'), 'Dark theme main cluster card should also use an opaque solid surface.');
assert(globals.includes('.task-cluster-collapsed.task-cluster-has-children .task-cluster-stack-shell') && globals.includes('padding-bottom: 0.64rem;'), 'Collapsed stack shell should keep only a tight two-layer reveal.');
assert(globals.includes('.task-stack-layer-2') && globals.includes('translateY(3px) scale(0.992)'), 'Layer 2 should sit very close under the main card.');
assert(globals.includes('.task-stack-layer-3') && globals.includes('translateY(6px) scale(0.984)'), 'Layer 3 should sit the same distance below layer 2.');
assert(globals.includes('.task-stack-layer-2') && globals.includes('box-shadow: 0 12px 24px rgba(31, 41, 55, 0.14) !important;'), 'Layer 2 should keep its own visible shadow without spreading too far downward.');
assert(globals.includes('.task-stack-layer-3') && globals.includes('box-shadow: 0 16px 28px rgba(31, 41, 55, 0.18) !important;'), 'Layer 3 should keep a deeper visible shadow without swallowing the next task.');

console.log('Task cluster stack verification passed');
