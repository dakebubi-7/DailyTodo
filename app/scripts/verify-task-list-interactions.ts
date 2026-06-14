import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Task } from '../src/types/task';
import {
  DEFAULT_SOURCE_ORDER,
  TASK_LIST_ORDER_KEY,
  TaskListOrderByDate,
  buildTaskOrderAfterMove,
  getSourceOrderForDate,
  isTaskDragDisabled,
  moveSourceInOrder,
  removeTaskIdFromOrder,
  sortTasksForDisplay,
} from '../src/utils/taskOrdering';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'src')) ? cwd : join(cwd, 'app');

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function ids(tasks: Task[]) {
  return tasks.map((task) => task.id).join(',');
}

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    text: id,
    completed: false,
    priority: 'medium',
    source: 'personal',
    createdAt: `2026-06-12T00:00:00.000Z`,
    taskDate: '2026-06-12',
    isToday: true,
    ...overrides,
  };
}

assert(TASK_LIST_ORDER_KEY === 'taskListOrderByDate', 'Manual task ordering should persist under a dedicated store key.');
assert(ids(DEFAULT_SOURCE_ORDER.map((source) => task(source, { source }))) === 'personal,external', 'Default source order should be personal then external.');

const mixedTasks: Task[] = [
  task('external-high', { source: 'external', priority: 'high' }),
  task('personal-low', { source: 'personal', priority: 'low' }),
  task('personal-done-high', { source: 'personal', priority: 'high', completed: true }),
  task('personal-high', { source: 'personal', priority: 'high' }),
];

assert(
  ids(sortTasksForDisplay(mixedTasks, '2026-06-12', {})) === 'personal-high,personal-low,personal-done-high,external-high',
  'Default sorting should keep personal before external, open before done, then priority inside each source.',
);

const manualSourceOrder: TaskListOrderByDate = {
  '2026-06-12': { sourceOrder: ['external', 'personal'] },
};
assert(ids(getSourceOrderForDate(manualSourceOrder, '2026-06-12').map((source) => task(source, { source }))) === 'external,personal', 'Saved sourceOrder should apply only for that date.');
assert(ids(getSourceOrderForDate(manualSourceOrder, '2026-06-13').map((source) => task(source, { source }))) === 'personal,external', 'Dates without saved sourceOrder should keep the default order.');
assert(
  ids(sortTasksForDisplay(mixedTasks, '2026-06-12', manualSourceOrder)) === 'external-high,personal-high,personal-low,personal-done-high',
  'Manual sourceOrder should reorder the two large groups for the selected date.',
);

const manualTaskOrder: TaskListOrderByDate = {
  '2026-06-12': {
    taskOrderBySource: {
      personal: ['personal-done-high', 'personal-low', 'personal-high'],
    },
  },
};
assert(
  ids(sortTasksForDisplay(mixedTasks, '2026-06-12', manualTaskOrder)) === 'personal-low,personal-high,personal-done-high,external-high',
  'Manual task order should apply inside the same completion bucket while open tasks still stay before done tasks.',
);

const newTaskInsertion: Task[] = [
  task('manual-medium', { priority: 'medium' }),
  task('manual-low', { priority: 'low' }),
  task('new-high', { priority: 'high' }),
];
assert(
  ids(sortTasksForDisplay(newTaskInsertion, '2026-06-12', {
    '2026-06-12': { taskOrderBySource: { personal: ['manual-medium', 'manual-low'] } },
  })) === 'new-high,manual-medium,manual-low',
  'New tasks missing from manual order should insert by priority without changing existing manual relative order.',
);

assert(
  ids(moveSourceInOrder(['personal', 'external'], 'external', 'personal').map((source) => task(source, { source }))) === 'external,personal',
  'Dragging source group titles should produce a new source order.',
);

assert(
  buildTaskOrderAfterMove([task('a'), task('b'), task('c')], ['a', 'b', 'c'], 'c', 'a').join(',') === 'c,a,b',
  'Dragging a main task within a group should produce a persisted source-local task order.',
);

assert(
  buildTaskOrderAfterMove([task('manual-medium'), task('manual-low'), task('new-high', { priority: 'high' })], ['manual-medium', 'manual-low'], 'manual-low', 'manual-medium').join(',') === 'manual-low,manual-medium',
  'Dragging existing manually ordered tasks should not persist new missing tasks and should keep future priority insertion intact.',
);

assert(
  JSON.stringify(removeTaskIdFromOrder({ '2026-06-12': { taskOrderBySource: { personal: ['a', 'b'], external: ['b', 'c'] } } }, 'b')) ===
    JSON.stringify({ '2026-06-12': { taskOrderBySource: { personal: ['a'], external: ['c'] } } }),
  'Deleting a task should remove stale ids from all persisted manual order arrays.',
);

assert(isTaskDragDisabled({ activeTab: 'today', searchQuery: '', showOpenOnly: false, priorityFilter: 'all' }) === false, 'Drag should be enabled for an unfiltered today list.');
assert(isTaskDragDisabled({ activeTab: 'today', searchQuery: 'abc', showOpenOnly: false, priorityFilter: 'all' }) === true, 'Search should disable drag.');
assert(isTaskDragDisabled({ activeTab: 'today', searchQuery: '', showOpenOnly: true, priorityFilter: 'all' }) === true, 'Open-only filter should disable drag.');
assert(isTaskDragDisabled({ activeTab: 'today', searchQuery: '', showOpenOnly: false, priorityFilter: 'high' }) === true, 'Priority filter should disable drag.');
assert(isTaskDragDisabled({ activeTab: 'all', searchQuery: '', showOpenOnly: false, priorityFilter: 'all' }) === true, 'Non-today tabs should disable drag.');

const taskList = readFileSync(join(root, 'src/components/TaskList.tsx'), 'utf8');
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const addTaskInput = readFileSync(join(root, 'src/components/AddTaskInput.tsx'), 'utf8');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
const useTasks = readFileSync(join(root, 'src/hooks/useTasks.ts'), 'utf8');
const packageJson = readFileSync(join(root, 'package.json'), 'utf8');

assert(useTasks.includes('const selectedDateTasks = allTasks.filter((task) => taskMatchesDate(task, selectedDate, currentDate) && !task.cleared);'), 'Selected-day counts and commands should include tasks visible via scheduledDates.');
assert(useTasks.includes('taskMatchesDate(task, selectedDate, currentDate) && task.completed && !task.cleared'), 'Clearing completed tasks should include completed tasks visible via scheduledDates.');
assert(useTasks.includes('const todayCount = allTasks.filter((task) => taskMatchesDate(task, currentDate, currentDate) && !task.cleared).length;'), 'Today count should include tasks scheduled for today.');
assert(taskItem.includes('const canOpenReviewAction = task.completed || hasReview;'), 'Completed tasks without an existing review should still expose the completion-review backfill action.');
assert(taskItem.includes("label={hasReview ? '查看完成情况' : '补写完成情况'}"), 'Completion review action should distinguish viewing existing reviews from backfilling a missing one.');
assert(taskItem.includes("canOpenReviewAction ? 'task-card-has-review-action' : 'task-card-no-review-action'"), 'Task layout should reserve review-action space for completed tasks that can backfill a review.');
assert(packageJson.includes('verify:task-list-interactions'), 'package.json should expose verify:task-list-interactions.');
assert(useTasks.includes(TASK_LIST_ORDER_KEY), 'useTasks should load and save task list manual order state.');
assert(useTasks.includes('reorderSourceGroups'), 'useTasks should expose source group reordering.');
assert(useTasks.includes('reorderTasksWithinSource'), 'useTasks should expose in-source task reordering.');
assert(useTasks.includes('preservedOtherBucketOrder'), 'Reordering one completion bucket should preserve any saved order from the other completion bucket.');
assert(app.includes('dragDisabled') && app.includes('isTaskDragDisabled'), 'App should compute and pass drag disabled state from active filters.');
assert(taskList.includes('DndContext') && taskList.includes('SortableContext'), 'TaskList should use dnd-kit sortable contexts.');
assert(taskList.includes('source-drag-handle') && taskItem.includes('task-drag-handle'), 'TaskList/TaskItem should expose drag handles for tasks and source groups.');
assert(useTasks.includes('taskMatchesDate(task, date, currentDate)'), 'Manual reorder should include tasks visible via scheduledDates on the selected date.');
assert(taskItem.includes('task-delete-zone') && taskItem.includes('task-action-layer'), 'TaskItem should use a stable right-side delete hot zone and action layer.');
assert(!taskItem.includes('initial={{ opacity: 0 }}\n              whileHover={{ scale: 1.06 }}\n              whileTap={{ scale: 0.94 }}\n              onClick={onDelete}'), 'Delete button visibility should be controlled by CSS hot-zone hover, not a permanent inline opacity of 0.');
assert(!taskItem.includes('setIsHovered') && !taskItem.includes('isHovered'), 'TaskItem delete visibility should not depend on whole-card hover state.');
assert(taskList.includes("active.type === 'source'") && taskList.includes("candidate.type === 'source'") && !taskList.includes("candidate.type === 'source' || candidate.type === 'task'"), 'Source group dragging should only collide with source containers, not nested task cards.');
assert(taskList.includes('scopedCollisionDetection') && taskList.includes('droppableContainers.filter'), 'Drag collision detection should filter out invalid droppable targets before dnd-kit computes over.');
assert(taskList.includes('candidate.type === \'task\'') && taskList.includes('candidate.source === active.source') && taskList.includes('candidate.completed === active.completed'), 'Task dragging should only collide with tasks in the same source and completion bucket.');
assert(taskList.includes('collisionDetection={scopedCollisionDetection}'), 'DndContext should use scoped collision detection to prevent invalid cross-group collisions.');
assert(taskList.includes('if (activeSourceDrag) setActiveSourceDrag(null);'), 'Drag end should always clear source drag state even when the drop target is invalid.');
assert(taskList.includes('handleDragOver') && !taskList.includes('setDraftSourceOrder'), 'Source group drag over should not reorder React state during drag; dnd-kit transforms should preview movement to avoid group flash.');
assert(taskList.includes('onDragStart={handleDragStart}') && taskList.includes('onDragCancel={handleDragCancel}'), 'DndContext should isolate drag lifecycle with start/cancel/end handlers.');
assert(taskList.includes('task-sortable-shell') && taskList.includes('task-source-group-shell'), 'Sortable items should keep stable shell elements to prevent container collapse while dragging.');
assert(taskList.includes('task-source-group-title') && taskList.includes('ref={setActivatorNodeRef}') && taskList.includes('role="button"'), 'The whole source group title row should be the drag activator, not only the tiny handle.');
assert(taskList.includes('handleDragOver') && taskList.includes('dnd-kit transform previews movement'), 'Source drag over should keep React order stable and let dnd-kit preview movement.');
assert(taskList.includes("active.type === 'source'") && taskList.includes('getSourceDragTarget'), 'Source group reorder should be committed once on drag end.');
assert(taskList.includes('const activeSortableStyle') && taskList.includes('x: transform?.x ?? 0') && taskList.includes('y: transform?.y ?? 0'), 'Dragged item should use direct x/y values from dnd-kit so it follows the pointer immediately.');
assert(!taskList.includes('isDragging && transform\n    ? {\n        transform: CSS.Transform.toString(transform)'), 'Dragged item should not depend on transform string truthiness because it can freeze when transform is temporarily null.');
assert(taskList.includes('useSpring') && taskList.includes('useMotionValue') && taskList.includes('transition: null'), 'Sortable displacement should use Framer Motion springs fed by dnd-kit transforms, not CSS-only transitions.');
assert(taskList.includes('springX.jump(0)') && taskList.includes('springY.jump(0)') && taskList.includes('useLayoutEffect'), 'On drag end the displacement springs should jump to 0 before paint so released items do not double-offset and bounce.');
assert(taskList.includes('if (isDragActive) return;') && taskList.includes('isDragActive={isDragActive}'), 'A shared drag-active flag should drive the jump-to-rest so the settle is instant and bounce-free.');
assert(taskList.includes('TASK_SORTABLE_MOTION') && taskList.includes('SOURCE_GROUP_SORTABLE_MOTION'), 'Task items and source groups should use separate spring presets so large groups can move slower than individual tasks.');
assert(taskList.includes('SOURCE_GROUP_SORTABLE_MOTION') && taskList.includes('stiffness: 55') && taskList.includes('damping: 13') && taskList.includes('mass: 1.8'), 'Source group sortable motion should be much slower/heavier than task item motion for large groups.');
assert(taskList.includes('TASK_SORTABLE_MOTION') && taskList.includes('stiffness: 95') && taskList.includes('damping: 14') && taskList.includes('mass: 1.35'), 'Task sortable motion should keep the currently approved group-internal speed.');
assert(!taskList.includes('animate={{ opacity: isDragging ? 0.78 : 1, y: 0 }}'), 'Sortable transform node should not also animate y with Framer Motion because it suppresses dnd-kit live displacement.');
assert(!taskList.includes('IOS_BOUNCE_SORTABLE_TRANSITION') && !taskList.includes('cubic-bezier(0.18, 1.25, 0.28, 1)'), 'The overshoot fallback transition should be gone — it added a visible bounce when items settled on release.');
assert(!taskList.includes('layout="position"'), 'Source groups should not run a layout animation on drop because it fights the displacement spring and causes a release bounce.');
assert(addTaskInput.includes('source-toggle-button') && addTaskInput.includes('TaskSource'), 'AddTaskInput should keep the personal/external source toggle.');
assert(globals.includes('.task-subtask-row:hover .task-subtask-delete') && globals.includes('pointer-events: none'), 'Subtask delete should keep its slot but hide visually until row hover/focus.');
assert(globals.includes('.task-delete-zone') && globals.includes('height: 40px'), 'CSS should keep a tall delete hot zone while using a compact width so task text has room.');
assert(globals.includes('--task-action-safe-space: 3.9rem'), 'Trailing source/review/delete controls should reserve a compact right-side safe space.');
assert(taskItem.includes("personal: '个'") && taskItem.includes("external: '外'"), 'The source badge should use compact one-character labels in the trailing action cluster.');
assert(taskItem.indexOf('task-source-badge') > taskItem.indexOf('task-action-layer') && taskItem.indexOf('task-source-badge') < taskItem.indexOf('ReviewActionButton'), 'Trailing action order should be source, review, then delete from left to right.');
assert(!taskItem.includes('<span className="task-source-badge" data-source={taskSource} title={sourceTitles[taskSource]}>
                {sourceLabels[taskSource]}
              </span>'), 'The source badge should not sit inside the text row because it crowds the task title.');
assert(!globals.includes('.task-card:hover .task-delete-action'), 'Delete visibility should be controlled by the right-side hot zone, not whole-card hover.');
assert(globals.includes('position: absolute') && globals.includes('.task-action-layer'), 'Action buttons should be absolutely positioned outside text layout.');
assert(globals.includes('padding-right') && globals.includes('--task-action-safe-space'), 'Task card text layout should reserve a stable right-side safe space.');

console.log('Task list interactions verification passed');
