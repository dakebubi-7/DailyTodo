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

const taskClusterBlock = getCssBlock(globals, '.task-cluster');
const stackShellBlock = getCssBlock(globals, '.task-cluster-stack-shell');
const expandedStackShellBlock = getCssBlock(globals, '.task-cluster-expanded .task-cluster-stack-shell');
const stackSegmentsBlock = getCssBlock(globals, '.task-stack-segments');
const stackSegmentBlock = getCssBlock(globals, '.task-stack-segment');
const neumorphismStackSegmentBlock = getCssBlock(globals, ".app-shell[data-theme='neumorphism'] .task-stack-segment");
const neumorphismCollapsedMainCardBlock = getCssBlock(globals, ".app-shell[data-theme='neumorphism'] .task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card");
const darkCollapsedMainCardBlock = getCssBlock(globals, '.dark .task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card');

assert(taskItem.includes('TASK_CLUSTER_SPRING'), 'TaskItem should define a shared spring config for the cluster container.');
assert(taskItem.includes('stiffness: 180') && taskItem.includes('damping: 25') && taskItem.includes('mass: 1'), 'Task cluster animation should use the requested spring parameters.');
assert(taskItem.includes("const TASK_STACK_SEGMENT_CLASSES = ['task-stack-segment-1', 'task-stack-segment-2', 'task-stack-segment-3'] as const;"), 'Collapsed stack should define up to three stack segment classes.');
assert(taskItem.includes('const TASK_STACK_SEGMENT_TRANSITIONS = TASK_STACK_SEGMENT_CLASSES.map'), 'Collapsed stack should precompute segment transitions.');
assert(taskItem.includes('const stackSegmentCount = getStackSegmentCount(subtaskCount);'), 'Collapsed stack segment count should be derived through the shared helper.');
assert(taskItem.includes("'--task-stack-segment-count': segmentCount"), 'Collapsed stack shell should receive the segment count through a CSS variable.');
assert(taskItem.includes('className="task-stack-segments"'), 'Collapsed clusters should render a dedicated segment container.');
assert(taskItem.includes('className={`task-stack-segment ${segmentClass}`}'), 'Collapsed clusters should render stack segment elements rather than faux cards.');
assert(taskItem.includes('return Math.min(subtaskCount, TASK_STACK_SEGMENT_CLASSES.length);'), 'Stack segment helper should cap visible segments at three.');
assert(!taskItem.includes('task-stack-layer task-cluster-faux-card task-card'), 'Collapsed clusters should not render faux rear cards once segments are introduced.');
assert(taskItem.includes('animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}'), 'Stack segments should only animate opacity so CSS geometry remains stable.');
assert(taskItem.includes('exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}'), 'Stack segments should only animate opacity on exit so CSS geometry remains stable.');
assert(!taskItem.includes('className="task-subtasks task-subtasks-preview"'), 'Collapsed clusters should not render the preview well shell.');
assert(!taskItem.includes('task-subtask-preview-card'), 'Collapsed clusters should not render hidden preview subtask rows.');
assert(!taskItem.includes('task-subtask-preview-priority'), 'Collapsed clusters should not render hidden preview priority dots.');
assert(taskItem.includes('useVirtualSubtasks'), 'Expanded subtasks should use local virtual rendering logic.');
assert(taskItem.includes('visibleVirtualItems'), 'Only visible initialized subtask items should be rendered in the scroll viewport.');
assert(taskItem.includes('TASK_SUBTASK_VIEWPORT_HEIGHT'), 'Expanded subtask viewport should have a capped internal height.');
assert(taskItem.includes('TASK_SUBTASK_STAGGER_MS') && taskItem.includes('* 0.001'), 'Subtask cards should stagger by millisecond constants converted to seconds.');
assert(taskItem.includes('task-subtask-delete task-icon-action task-delete-action'), 'Expanded subtasks should show delete buttons again.');
assert(!taskItem.includes('task-subtask-count-badge'), 'Collapsed main task should not render a subtask count badge.');

assert(taskClusterBlock.includes('display: grid;'), 'Task cluster should remain a structural grid wrapper.');
assert(!taskClusterBlock.includes('background:'), 'Base task clusters should not get pocket backgrounds.');
assert(!taskClusterBlock.includes('padding: 0.18rem 0.18rem 0.22rem;'), 'Base task clusters should not change normal task density.');
assert(stackShellBlock.includes('--task-stack-segment-height: 0.42rem;'), 'Collapsed stack shell should define a fixed segment height.');
assert(stackShellBlock.includes('padding-bottom: calc(var(--task-stack-segment-count, 0) * var(--task-stack-segment-height));'), 'Collapsed stack shell should reserve height from segment count.');
assert(globals.includes('.task-cluster-no-children .task-cluster-stack-shell,'), 'No-child clusters should be included in the zero stack-space rule.');
assert(expandedStackShellBlock.includes('padding-bottom: 0;'), 'Expanded clusters should not reserve segment space.');
assert(stackSegmentsBlock.includes('height: calc(var(--task-stack-segment-count, 0) * var(--task-stack-segment-height));'), 'Segment container height should be driven by segment count.');
assert(stackSegmentBlock.includes('height: var(--task-stack-segment-height);'), 'Every exposed segment should use the same height.');
assert(stackSegmentBlock.includes('border: 1px solid rgba(76, 91, 112, 0.095) !important;'), 'Each stack segment should carry the same framed edge as the main task card.');
assert(stackSegmentBlock.includes('border-bottom-color: rgba(76, 91, 112, 0.12) !important;'), 'Each stack segment should keep a visible bottom edge.');
assert(stackSegmentBlock.includes('background: rgba(255, 255, 255, 0.7) !important;'), 'Segments should use the same light surface color as task cards.');
assert(stackSegmentBlock.includes('box-shadow:'), 'Segments should use shadow separation.');
assert(getCssBlock(globals, '.dark .task-stack-segment').includes('background: var(--solid-surface-dark, rgba(15, 23, 42, 0.95)) !important;'), 'Dark-mode segments should use the same dark surface family as collapsed main cards.');
assert(neumorphismStackSegmentBlock.includes('background: rgba(var(--neu-bg), 0.72) !important;'), 'Neumorphism stack segments should match neumorphism task-card color.');
assert(neumorphismStackSegmentBlock.includes('box-shadow: inset'), 'Neumorphism stack segments should look recessed with inset shadow.');
assert(neumorphismCollapsedMainCardBlock.includes('background: rgba(var(--neu-bg), 0.72) !important;'), 'Neumorphism collapsed main card should match normal neumorphism task-card color.');
assert(!globals.includes(".app-shell[data-theme='neumorphism'] .task-cluster-collapsed.task-cluster-has-children .task-stack-segment"), 'Neumorphism segment color should be applied to all stack segments, not only child clusters.');
assert(!globals.includes('background: var(--solid-surface, rgba(255, 255, 255, 0.92)) !important;'), 'Collapsed stack light surfaces should not use the overly white solid-surface fallback.');
assert(!globals.includes('background: rgba(255, 255, 255, 0.92) !important;'), 'Collapsed stack light surfaces should not use an overly white hard-coded surface.');
assert(darkCollapsedMainCardBlock.includes('background: var(--solid-surface-dark, rgba(15, 23, 42, 0.95)) !important;'), 'Dark-mode collapsed parent main card should remain opaque.');
assert(!globals.includes('.task-subtasks-preview {'), 'Collapsed preview well CSS should be removed.');
assert(!globals.includes('.task-subtasks-preview .task-subtask-row.task-subtask-card.task-subtask-preview-card'), 'Hidden preview subtask-row CSS should be removed.');
assert(getCssBlock(globals, '.task-source-group').includes('gap: 0.72rem;'), 'Grouped task rows should keep visible breathing room between main tasks.');
assert(getCssBlock(globals, '.task-scroll .space-y-2 > :not([hidden]) ~ :not([hidden])').includes('margin-top: 0.72rem;'), 'Legacy ungrouped task rows should keep visible breathing room.');

console.log('Task cluster stack verification passed');
