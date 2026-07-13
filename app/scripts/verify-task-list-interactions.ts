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
import { selectTaskViewState } from '../src/hooks/taskSelectors';
import { reorderTasksWithinSourceForDate } from '../src/hooks/taskOrderingState';
import { clearCompletedTasks } from '../src/hooks/taskMutations';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'src')) ? cwd : join(cwd, 'app');
const taskPersistenceInitialization = readFileSync(join(root, 'src/hooks/taskPersistenceInitialization.ts'), 'utf8');

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
const taskListDnd = readFileSync(join(root, 'src/components/taskList/taskListDnd.ts'), 'utf8');
const sortableSourceSection = readFileSync(join(root, 'src/components/taskList/SortableSourceSection.tsx'), 'utf8');
const sortableTaskItem = readFileSync(join(root, 'src/components/taskList/SortableTaskItem.tsx'), 'utf8');
const taskListToolbarPath = join(root, 'src/components/taskList/TaskListToolbar.tsx');
assert(existsSync(taskListToolbarPath), 'TaskList toolbar component should exist.');
const taskListToolbar = readFileSync(taskListToolbarPath, 'utf8');
const taskListEmptyStatePath = join(root, 'src/components/taskList/TaskListEmptyState.tsx');
assert(existsSync(taskListEmptyStatePath), 'TaskList empty-state component should exist.');
const taskListEmptyState = readFileSync(taskListEmptyStatePath, 'utf8');
const taskListDerivationsPath = join(root, 'src/components/taskList/taskListDerivations.ts');
assert(existsSync(taskListDerivationsPath), 'TaskList derivation helper module should exist.');
const taskListDerivations = readFileSync(taskListDerivationsPath, 'utf8');
const taskListContentPath = join(root, 'src/components/taskList/TaskListContent.tsx');
assert(existsSync(taskListContentPath), 'TaskList content component should exist.');
const taskListContent = readFileSync(taskListContentPath, 'utf8');
const taskListDndSurfacePath = join(root, 'src/components/taskList/TaskListDndSurface.tsx');
assert(existsSync(taskListDndSurfacePath), 'TaskList lazy DnD surface component should exist.');
const taskListDndSurface = readFileSync(taskListDndSurfacePath, 'utf8');
const taskListRuntime = `${taskList}\n${taskListDndSurface}`;
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const subtasksViewport = readFileSync(join(root, 'src/components/taskItem/TaskSubtasksViewport.tsx'), 'utf8');
const taskItemPresentation = readFileSync(join(root, 'src/components/taskItem/taskItemPresentation.tsx'), 'utf8');
const taskItemControls = readFileSync(join(root, 'src/components/taskItem/taskItemControls.tsx'), 'utf8');
const taskItemActionControls = readFileSync(join(root, 'src/components/taskItem/taskItemActionControls.tsx'), 'utf8');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const useAppShellComposition = readFileSync(join(root, 'src/app/useAppShellComposition.ts'), 'utf8');
const appShellComposition = readFileSync(join(root, 'src/app/appShellComposition.tsx'), 'utf8');
const appShellMainContentComposition = readFileSync(join(root, 'src/app/appShellMainContentComposition.tsx'), 'utf8');
const appMainContent = readFileSync(join(root, 'src/components/AppMainContent.tsx'), 'utf8');
const appTaskView = readFileSync(join(root, 'src/app/appTaskView.ts'), 'utf8');
const appCompletionActions = readFileSync(join(root, 'src/app/appCompletionActions.ts'), 'utf8');
const addTaskInput = readFileSync(join(root, 'src/components/AddTaskInput.tsx'), 'utf8');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');
const useTasks = readFileSync(join(root, 'src/hooks/useTasks.ts'), 'utf8');
const taskActions = readFileSync(join(root, 'src/hooks/useTaskActions.ts'), 'utf8');
const taskTreeActions = readFileSync(join(root, 'src/hooks/taskTreeActions.ts'), 'utf8');
const taskPersistence = readFileSync(join(root, 'src/hooks/taskPersistence.ts'), 'utf8');
const taskSelectors = readFileSync(join(root, 'src/hooks/taskSelectors.ts'), 'utf8');
const taskOrderingState = readFileSync(join(root, 'src/hooks/taskOrderingState.ts'), 'utf8');
const packageJson = readFileSync(join(root, 'package.json'), 'utf8');

function getCssBlock(css: string, selector: string) {
  const start = css.indexOf(`${selector} {`);
  assert(start >= 0, `Missing CSS block: ${selector}`);
  const bodyStart = css.indexOf('{', start) + 1;
  const end = css.indexOf('\n}', bodyStart);
  assert(end > bodyStart, `Malformed CSS block: ${selector}`);
  return css.slice(bodyStart, end);
}

function getFunctionBlock(source: string, signature: string) {
  const start = source.indexOf(signature);
  assert(start >= 0, `Missing function: ${signature}`);
  const end = source.indexOf('\n  };', start);
  assert(end > start, `Malformed function: ${signature}`);
  return source.slice(start, end + '\n  };'.length);
}

const scheduledDateViewState = selectTaskViewState({
  allTasks: [
    task('normal-open'),
    task('scheduled-done', {
      completed: true,
      priority: 'high',
      taskDate: '2026-06-11',
      isToday: false,
      scheduledDates: ['2026-06-12'],
    }),
  ],
  activeTab: 'today',
  priorityFilter: 'all',
  currentDate: '2026-06-12',
  selectedDate: '2026-06-12',
  taskListOrderByDate: {},
});
assert(
  scheduledDateViewState.totalCount === 2 &&
    scheduledDateViewState.completedCount === 1 &&
    scheduledDateViewState.todayCount === 2 &&
    ids(scheduledDateViewState.selectedDateTaskCommands) === 'normal-open,scheduled-done',
  'Selected-day counts and commands should include tasks visible via scheduledDates.',
);
assert(taskSelectors.includes('let selectedDateTaskCount = 0;'), 'Task selectors should count selected-day tasks without retaining an unused task array.');
assert(taskSelectors.includes('for (const task of allTasks) {'), 'Task selectors should derive task view state from one shared task traversal.');
assert(!taskSelectors.includes('const selectedDateTasks = allTasks.filter'), 'Task selectors should not rescan all tasks to collect selected-day tasks.');
assert(!taskSelectors.includes('const selectedDateTasks: Task[] = [];'), 'Task selectors should not allocate an array when the selected-day tasks are only counted.');
assert(taskSelectors.includes('const taskDate = getTaskDate(task, currentDate);'), 'Task selectors should resolve each task date once during the shared traversal.');
assert(taskSelectors.includes('for (const scheduledDate of task.scheduledDates || [])'), 'Task selectors should check selected and current scheduled dates in one per-task loop.');
assert(!taskSelectors.includes('taskMatchesDate(task, selectedDate, currentDate)'), 'Task selectors should not rescan a task\'s scheduled dates for the selected date.');
assert(!taskSelectors.includes('taskMatchesDate(task, currentDate, currentDate)'), 'Task selectors should not rescan a task\'s scheduled dates for the current date.');
assert(taskSelectors.includes('const taskCommandBuckets: Task[][] = [[], [], [], [], [], []];'), 'Task selectors should bucket command tasks during the shared traversal.');
assert(!taskSelectors.includes('[...selectedDateTasks].sort'), 'Task selectors should not sort command tasks after the shared traversal.');
assert(!taskSelectors.includes('taskCommandBuckets.flat()'), 'Task selectors should append command buckets directly without a temporary flattened array.');
const clearCompletedScheduledDateTasks = clearCompletedTasks([
  task('scheduled-done-to-clear', {
    completed: true,
    taskDate: '2026-06-11',
    isToday: false,
    scheduledDates: ['2026-06-12'],
  }),
], '2026-06-12', '2026-06-12');
assert(clearCompletedScheduledDateTasks[0].cleared === true, 'Clearing completed tasks should include completed tasks visible via scheduledDates.');
assert(taskTreeActions.includes('clearCompletedTasks(previous, selectedDate, currentDate)'), 'Task-tree actions should delegate clearing completed tasks to the task mutation helper.');
assert(taskActions.includes('createTaskTreeActionHandlers'), 'Task action composition should expose the focused task-tree action handlers.');
assert(taskSelectors.includes('todayCount += 1;'), 'Today count should be accumulated during the shared task traversal.');
assert(!taskSelectors.includes('todayCount: allTasks.filter'), 'Task selectors should not rescan all tasks to calculate today count.');
assert(taskItem.includes('const canOpenReviewAction = task.completed || hasReview;'), 'Completed tasks without an existing review should still expose the completion-review backfill action.');
assert(taskItem.includes('const reviewActionLabel = getTaskReviewActionLabel(hasReview);') && taskItem.includes('reviewActionLabel={reviewActionLabel}'), 'TaskItem should pass a derived completion-review action label into TaskActionLayer.');
assert(taskItemPresentation.includes("hasReview ? '\\u67e5\\u770b\\u5b8c\\u6210\\u60c5\\u51b5' : '\\u8865\\u5199\\u5b8c\\u6210\\u60c5\\u51b5'"), 'Completion review action helper should distinguish viewing existing reviews from backfilling a missing one.');
assert(taskItem.includes('getTaskCardClassName({') && taskItem.includes('canOpenReviewAction,'), 'TaskItem should pass review-action availability into the task-card class helper.');
assert(taskItemPresentation.includes("canOpenReviewAction ? 'task-card-has-review-action' : 'task-card-no-review-action'"), 'Task layout should reserve review-action space for completed tasks that can backfill a review.');
assert(packageJson.includes('verify:task-list-interactions'), 'package.json should expose verify:task-list-interactions.');
assert(taskPersistenceInitialization.includes(TASK_LIST_ORDER_KEY) && useTasks.includes('taskListOrderByDate'), 'useTasks should load and save task list manual order state.');
assert(useTasks.includes('...taskActions'), 'useTasks should expose task action callbacks through its focused action hook.');
assert(taskActions.includes('reorderSourceGroups'), 'Task actions should expose source group reordering.');
assert(taskActions.includes('reorderTasksWithinSource'), 'Task actions should expose in-source task reordering.');
const reorderedBucketOrder = reorderTasksWithinSourceForDate(
  {
    '2026-06-12': {
      taskOrderBySource: { personal: ['open-a', 'open-b', 'done-a'] },
    },
  },
  [task('open-a'), task('open-b'), task('done-a', { completed: true })],
  {
    date: '2026-06-12',
    currentDate: '2026-06-12',
    source: 'personal',
    completed: false,
    activeId: 'open-b',
    overId: 'open-a',
  },
);
assert(
  reorderedBucketOrder['2026-06-12'].taskOrderBySource?.personal?.join(',') === 'open-b,open-a,done-a',
  'Reordering one completion bucket should preserve any saved order from the other completion bucket.',
);
assert(taskOrderingState.includes('preservedOtherBucketOrder'), 'Task ordering state helper should keep the other completion bucket order.');
assert(app.includes('useAppShellComposition'), 'App should delegate task-view derivation through the runtime shell composition hook.');
assert(useAppShellComposition.includes('createAppTaskView') && useAppShellComposition.includes('dragDisabled'), 'Runtime shell composition should derive and pass drag disabled state through the task-view helper.');
assert(appTaskView.includes('isTaskDragDisabled({ activeTab, searchQuery, showOpenOnly, priorityFilter })'), 'App task-view helper should compute drag disabled state from active filters.');
assert(taskList.includes("import('./taskList/TaskListDndSurface')") && taskListDndSurface.includes('DndContext') && taskListContent.includes('SortableContext'), 'TaskList should lazy-load the DndContext shell while TaskListContent owns sortable contexts.');
assert(taskList.includes("from './taskList/TaskListToolbar'"), 'TaskList should import TaskListToolbar from the taskList module folder.');
assert(taskList.includes('<TaskListToolbar') && taskList.includes('onClearFilters={clearFilters}'), 'TaskList should render TaskListToolbar with explicit filter/search callbacks.');
assert(!taskList.includes('const priorityFilterLabel'), 'TaskList should not own priority filter labels after the toolbar extraction.');
assert(!taskList.includes('className="task-toolbar"'), 'TaskList should not inline the task toolbar markup.');
assert(taskListToolbar.includes('export const TaskListToolbar = memo(function TaskListToolbar('), 'TaskListToolbar should export the memoized toolbar component.');
assert(taskListToolbar.includes('const priorityFilterLabel'), 'TaskListToolbar should own priority filter labels.');
assert(taskListToolbar.includes("import { memo } from 'react';"), 'TaskListToolbar should import memo to isolate stable filters from task-list updates.');
assert(taskListToolbar.includes('export const TaskListToolbar = memo(function TaskListToolbar('), 'TaskListToolbar should skip rerenders when task mutations leave filter props unchanged.');
assert(taskListToolbar.includes('task-toolbar') && taskListToolbar.includes('task-toolbar-row'), 'TaskListToolbar should own the toolbar shell markup.');
assert(taskListToolbar.includes('task-tool-icon') && taskListToolbar.includes('task-filter-button') && taskListToolbar.includes('task-filter-select'), 'TaskListToolbar should own search, open-only, and priority controls.');
assert(taskListToolbar.includes('task-clear-filter') && taskListToolbar.includes('task-search-input'), 'TaskListToolbar should own clear-filter and search-input controls.');
assert(taskListToolbar.includes('isPriorityFilter(event.target.value)'), 'TaskListToolbar should narrow priority select values with isPriorityFilter.');
assert(!taskListToolbar.includes('event.target.value as PriorityFilter'), 'TaskListToolbar should not cast priority select values as PriorityFilter.');
assert(taskListContent.includes("from './TaskListEmptyState'"), 'TaskListContent should import TaskListEmptyState from the taskList module folder.');
assert(taskListContent.includes('tasks.length === 0') && taskListContent.includes('<TaskListEmptyState />'), 'TaskListContent should render TaskListEmptyState for an empty task list.');
assert(!taskList.includes('className="empty-state"'), 'TaskList should not inline the empty-state markup.');
assert(taskListEmptyState.includes('export function TaskListEmptyState'), 'TaskListEmptyState should export the empty-state component.');
assert(taskListEmptyState.includes('motion.div') && taskListEmptyState.includes('initial={{ opacity: 0 }}') && taskListEmptyState.includes('animate={{ opacity: 1 }}'), 'TaskListEmptyState should preserve the empty-state fade-in motion.');
assert(taskListEmptyState.includes('className="empty-state"') && taskListEmptyState.includes('viewBox="0 0 24 24"'), 'TaskListEmptyState should own the empty-state shell and icon.');
assert(taskListEmptyState.includes('\\u8fd9\\u4e00\\u5929\\u8fd8\\u6ca1\\u6709\\u4efb\\u52a1') && taskListEmptyState.includes('\\u5199\\u4e0b\\u7b2c\\u4e00\\u4ef6\\u8981\\u63a8\\u8fdb\\u7684\\u5c0f\\u4e8b'), 'TaskListEmptyState should preserve the empty-list copy using Unicode escapes.');
assert(taskList.includes("from './taskList/taskListDerivations'"), 'TaskList should import derived-data helpers from the taskList module folder.');
assert(taskList.includes('useCallback') && taskList.includes('useMemo') && taskList.includes('useRef') && taskList.includes('useState'), 'TaskList should import hooks needed to stabilize toolbar-only actions and defer DnD loading.');
assert(taskList.includes('const clearFilters = useCallback(() => {') && taskList.includes('}, [onPriorityFilterChange, onSearchChange, onToggleOpenOnly, showOpenOnly]);'), 'TaskList should memoize clearFilters so unchanged filter controls can skip task-driven rerenders.');
assert(taskList.includes('getTaskListDerivations(tasks, sourceOrder)') && taskList.includes('{ allTags, sourceGroups, shouldGroupBySource }'), 'TaskList should derive tag history, source groups, and grouping visibility together.');
assert(!taskList.includes('new Set(tasks.flatMap') && !taskList.includes('const externalTasks = tasks.filter'), 'TaskList should not inline tag-history or external-source derivations.');
assert(taskListDerivations.includes('export interface TaskSourceGroup') && taskListDerivations.includes('export function getTaskTagHistory') && taskListDerivations.includes('export function getTaskSourceGroups') && taskListDerivations.includes('export function shouldShowSourceGroups') && taskListDerivations.includes('export function getTaskListDerivations'), 'TaskList derivation module should export tag/source grouping helpers.');
assert(taskListDerivations.includes('getTaskSource(task)') && taskListDerivations.includes('for (const source of sourceOrder)'), 'TaskList derivation module should preserve source fallback and saved source-order precedence.');
assert(taskListDerivations.includes('const sourceOrderSet = new Set(sourceOrder)') && taskListDerivations.includes('!sourceOrderSet.has(source)'), 'TaskList derivation module should use constant-time membership checks for discovered sources.');
assert(taskListDerivations.includes('const sourceTasks = grouped.get(source);') && taskListDerivations.includes('sourceTasks.push(task);'), 'Task source groups should append to existing source buckets without repeatedly copying them.');
assert(!taskListDerivations.includes('grouped.set(source, [...(grouped.get(source) || []), task]);'), 'Task source grouping should avoid quadratic bucket copying.');
assert(taskListDerivations.includes('countB - countA'), 'TaskList tag history should preserve frequency-first ordering.');
assert(taskListDndSurface.includes("from './TaskListContent'"), 'The lazy DnD surface should import TaskListContent from the taskList module folder.');
assert(taskListDndSurface.includes('<TaskListContent') && taskList.includes('sourceGroups,') && taskList.includes('shouldGroupBySource,'), 'TaskList should delegate sortable rendering to TaskListContent through the lazy DnD surface.');
assert(!taskList.includes('const renderTask =') && !taskList.includes('const renderTaskBucket =') && !taskList.includes('const renderSourceGroup ='), 'TaskList should not own task/source render helper implementations after the content extraction.');
assert(taskListContent.includes('export const TaskListContent = memo(function TaskListContent('), 'TaskListContent should export the memoized task-list content component.');
assert(taskListContent.includes('AnimatePresence') && taskListContent.includes('SortableContext') && taskListContent.includes('verticalListSortingStrategy'), 'TaskListContent should own animated sortable list composition.');
assert(taskListContent.includes('<TaskListEmptyState />') && taskListContent.includes('<SortableSourceSection') && taskListContent.includes('<SortableTaskItem'), 'TaskListContent should compose empty state, source sections, and sortable task items.');
assert(taskListContent.includes('items={bucketTasks.map(getTaskSortableId)}') && taskListContent.includes('items={sourceGroups.map((group) => getSourceSortableId(group.source))}'), 'TaskListContent should preserve task and source sortable contexts.');
assert(taskListContent.includes('let nextStartIndex = 0;'), 'TaskListContent should track grouped task indexes with one running total.');
assert(!taskListContent.includes('sourceGroups.slice(0, groupIndex).reduce'), 'TaskListContent should not rescan earlier source groups for every group index.');
assert(taskListContent.includes('for (const task of groupTasks)'), 'TaskListContent should bucket each source group in one task scan.');
assert(!taskListContent.includes('const openTasks = groupTasks.filter'), 'TaskListContent should not rescan source groups to build the open task bucket.');
assert(!taskListContent.includes('const doneTasks = groupTasks.filter'), 'TaskListContent should not rescan source groups to build the completed task bucket.');
assert(taskListContent.includes('editRequest && editRequest.id === task.id ? editRequest.nonce : undefined'), 'TaskListContent should preserve edit-trigger routing for individual tasks.');
assert(sortableSourceSection.includes('source-drag-handle') && taskItem.includes('DragHandleButton') && taskItemControls.includes('task-drag-handle'), 'TaskList/TaskItem should expose drag handles for tasks and source groups.');
assert(taskOrderingState.includes('taskMatchesDate(task, date, currentDate)'), 'Manual reorder should include tasks visible via scheduledDates on the selected date.');
assert(taskItem.includes('<TaskActionLayer') && taskItemActionControls.includes('task-delete-zone') && taskItemActionControls.includes('task-action-layer'), 'TaskItem should use the controls action layer with a stable right-side delete hot zone.');
assert(!taskItem.includes('initial={{ opacity: 0 }}\n              whileHover={{ scale: 1.06 }}\n              whileTap={{ scale: 0.94 }}\n              onClick={onDelete}'), 'Delete button visibility should be controlled by CSS hot-zone hover, not a permanent inline opacity of 0.');
assert(!taskItem.includes('setIsHovered') && !taskItem.includes('isHovered'), 'TaskItem delete visibility should not depend on whole-card hover state.');
assert(taskListDnd.includes("active.type === 'source'") && taskListDnd.includes("candidate.type === 'source'") && !taskListDnd.includes("candidate.type === 'source' || candidate.type === 'task'"), 'Source group dragging should only collide with source containers, not nested task cards.');
assert(taskListRuntime.includes('scopedCollisionDetection') && taskListDnd.includes('droppableContainers.filter'), 'Drag collision detection should filter out invalid droppable targets before dnd-kit computes over.');
assert(taskListDnd.includes('candidate.type === \'task\'') && taskListDnd.includes('candidate.source === active.source') && taskListDnd.includes('candidate.completed === active.completed'), 'Task dragging should only collide with tasks in the same source and completion bucket.');
assert(taskListDndSurface.includes('collisionDetection={scopedCollisionDetection}'), 'DndContext should use scoped collision detection to prevent invalid cross-group collisions.');
assert(taskListDndSurface.includes('setActiveSourceDrag(null);'), 'Drag end should always clear source drag state even when the drop target is invalid.');
assert(taskListDndSurface.includes('handleDragOver') && !taskListDndSurface.includes('setDraftSourceOrder'), 'Source group drag over should not reorder React state during drag; dnd-kit transforms should preview movement to avoid group flash.');
assert(taskListDndSurface.includes('onDragStart={handleDragStart}') && taskListDndSurface.includes('onDragCancel={handleDragCancel}'), 'DndContext should isolate drag lifecycle with start/cancel/end handlers.');
assert(sortableTaskItem.includes('task-sortable-shell') && sortableSourceSection.includes('task-source-group-shell'), 'Sortable items should keep stable shell elements to prevent container collapse while dragging.');
assert(sortableSourceSection.includes('task-source-group-title') && sortableSourceSection.includes('ref={setActivatorNodeRef}') && sortableSourceSection.includes('role="button"'), 'The whole source group title row should be the drag activator, not only the tiny handle.');
assert(taskListDndSurface.includes('handleDragOver') && taskListDndSurface.includes('dnd-kit previews'), 'Source drag over should keep React order stable and let dnd-kit preview movement.');
assert(taskListDnd.includes("active.type !== 'source'") && taskListDndSurface.includes('getSourceDragTarget'), 'Source group reorder should be committed once on drag end.');
assert(sortableTaskItem.includes('const activeSortableStyle') && sortableTaskItem.includes('x: transform?.x ?? 0') && sortableTaskItem.includes('y: transform?.y ?? 0'), 'Dragged item should use direct x/y values from dnd-kit so it follows the pointer immediately.');
assert(!taskList.includes('isDragging && transform\n    ? {\n        transform: CSS.Transform.toString(transform)'), 'Dragged item should not depend on transform string truthiness because it can freeze when transform is temporarily null.');
assert(sortableTaskItem.includes('useSpring') && sortableTaskItem.includes('useMotionValue') && sortableTaskItem.includes('transition: null') && sortableSourceSection.includes('useSpring') && sortableSourceSection.includes('useMotionValue') && sortableSourceSection.includes('transition: null'), 'Sortable displacement should use Framer Motion springs fed by dnd-kit transforms, not CSS-only transitions.');
assert(sortableTaskItem.includes('springX.jump(0)') && sortableTaskItem.includes('springY.jump(0)') && sortableTaskItem.includes('useLayoutEffect') && sortableSourceSection.includes('springX.jump(0)') && sortableSourceSection.includes('springY.jump(0)') && sortableSourceSection.includes('useLayoutEffect'), 'On drag end the displacement springs should jump to 0 before paint so released items do not double-offset and bounce.');
assert(sortableTaskItem.includes('if (isDragActive) return;') && sortableSourceSection.includes('if (isDragActive) return;') && taskListDndSurface.includes('isDragActive={isDragActive}'), 'A shared drag-active flag should drive the jump-to-rest so the settle is instant and bounce-free.');
assert(sortableTaskItem.includes('TASK_SORTABLE_MOTION') && sortableSourceSection.includes('SOURCE_GROUP_SORTABLE_MOTION') && taskListDnd.includes('TASK_SORTABLE_MOTION') && taskListDnd.includes('SOURCE_GROUP_SORTABLE_MOTION'), 'Task items and source groups should use separate spring presets so large groups can move slower than individual tasks.');
assert(taskListDnd.includes('SOURCE_GROUP_SORTABLE_MOTION') && taskListDnd.includes('stiffness: 55') && taskListDnd.includes('damping: 13') && taskListDnd.includes('mass: 1.8'), 'Source group sortable motion should be much slower/heavier than task item motion for large groups.');
assert(taskListDnd.includes('TASK_SORTABLE_MOTION') && taskListDnd.includes('stiffness: 95') && taskListDnd.includes('damping: 14') && taskListDnd.includes('mass: 1.35'), 'Task sortable motion should keep the currently approved group-internal speed.');
assert(!sortableTaskItem.includes('animate={{ opacity: isDragging ? 0.78 : 1, y: 0 }}'), 'Sortable transform node should not also animate y with Framer Motion because it suppresses dnd-kit live displacement.');
assert(!taskList.includes('IOS_BOUNCE_SORTABLE_TRANSITION') && !taskList.includes('cubic-bezier(0.18, 1.25, 0.28, 1)'), 'The overshoot fallback transition should be gone — it added a visible bounce when items settled on release.');
assert(!taskList.includes('layout="position"'), 'Source groups should not run a layout animation on drop because it fights the displacement spring and causes a release bounce.');
assert(addTaskInput.includes('source-toggle-button') && addTaskInput.includes('TaskSource'), 'AddTaskInput should keep the personal/external source toggle.');
assert(globals.includes('.task-subtask-row:hover .task-subtask-delete') && globals.includes('pointer-events: none'), 'Subtask delete should keep its slot but hide visually until row hover/focus.');
assert(globals.includes('.task-delete-zone') && globals.includes('height: 40px'), 'CSS should keep a tall delete hot zone while using a compact width so task text has room.');
assert(!globals.includes('.task-card:hover .task-delete-action'), 'Delete visibility should be controlled by the right-side hot zone, not whole-card hover.');
assert(globals.includes('position: absolute') && globals.includes('.task-action-layer'), 'Action buttons should be absolutely positioned outside text layout.');
assert(globals.includes('padding-right') && globals.includes('--task-action-safe-space'), 'Task card text layout should reserve a stable right-side safe space.');

assert(
  globals.includes('height: 1.22rem !important;') &&
    globals.includes('width: 1.22rem !important;') &&
    globals.includes('min-width: 1.22rem !important;'),
  'Main completion circle should stay compact across themes.',
);
assert(taskItemActionControls.includes('<svg width="9" height="9" viewBox="0 0 12 12" fill="none">'), 'Completion check icon should scale down with the smaller completion circle.');

assert(taskItem.includes('getTaskCardClassName({') && taskItemPresentation.includes('task-cluster-main-card') && taskItem.includes('aria-expanded={hasChildren ? !task.collapsed : undefined}'), 'Parent task card should be the accessible task-cluster toggle surface.');
assert(taskItem.includes('task-cluster-main-spacer') && taskItem.includes('aria-hidden="true"'), 'Main task rows should keep a leading spacer so completion/priority/text columns align without the old tree arrow.');
assert(taskItem.includes('stopClusterToggle') && taskItem.includes('onPointerDown={stopClusterToggle}'), 'Task card controls should isolate pointer/click events from parent cluster toggling.');
assert(taskItem.includes('<TaskSubtasksViewport') && taskItem.includes('onEditSubtask={onEditSubtask}') && taskItem.includes('onChangeSubtaskPriority={onChangeSubtaskPriority}'), 'TaskItem should pass expanded subtask interactions into TaskSubtasksViewport.');
assert(subtasksViewport.includes('<SubtaskCard') && subtasksViewport.includes('onToggleSubtask={onToggleSubtask}') && subtasksViewport.includes('onDeleteSubtask={onDeleteSubtask}') && subtasksViewport.includes('onViewSubtaskReview={onViewSubtaskReview}') && subtasksViewport.includes('onEditSubtask={onEditSubtask}') && subtasksViewport.includes('onChangeSubtaskPriority={onChangeSubtaskPriority}'), 'Expanded subtasks should keep complete, edit, priority, review, and delete interactions.');
assert(appCompletionActions.includes("changeSubtaskPriority: (id: string, priority: Task['priority']) => {") && appCompletionActions.includes('updateTask(id, { priority });'), 'Subtask priority changes should write through updateTask with the subtask id and selected priority.');
assert(useAppShellComposition.includes('completionActions,') && useAppShellComposition.includes('createAppShellComposition'), 'Runtime shell composition should pass completion actions into the shell composition helper.');
assert(appShellMainContentComposition.includes('onChangeSubtaskPriority: completionActions.changeSubtaskPriority'), 'Shell main-content composition should route subtask priority changes through the taskListProps boundary.');
assert(appMainContent.includes('<TaskList {...taskListProps} />'), 'AppMainContent should forward task list props into TaskList.');
assert(
  /updateTask\(id: string, updates: Partial<Task>\) \{[\s\S]*?mapTaskTree\(previous, id, \(task\) => updateTaskFields\(task, updates\)\)/.test(taskTreeActions),
  'Task-tree actions should update matching tasks through mapTaskTree so subtask priority changes persist recursively.',
);
assert(!taskItem.includes('renderSubtaskTree'), 'TaskItem should no longer render recursive tree subtasks.');
assert(!taskItem.includes('task-subtask-check'), 'Subtasks should reuse compact task completion controls instead of the old circular subtask check class.');
assert(globals.includes('.task-cluster') && globals.includes('.task-cluster-main-card'), 'CSS should define the task cluster wrapper and main-card layer.');
const taskClusterMainCardBlock = getCssBlock(globals, '.task-cluster-main-card');
const taskClusterMainCardSafeSpaceRule = getCssBlock(globals, '.task-cluster-main-card.task-cluster-main-card');
assert(!taskItem.includes('task-subtask-count-badge'), 'Collapsed cluster cards should not render a subtask count badge.');
assert(!globals.includes('.task-subtask-count-badge'), 'CSS should no longer define the removed subtask count badge block.');
assert(!taskClusterMainCardBlock.includes('--task-subtask-badge-safe-space'), 'The cluster main card should not reserve badge-only safe space once the count badge is removed.');
assert(taskClusterMainCardSafeSpaceRule.includes('padding-right: var(--task-action-safe-space'), 'Task text layout should reserve only the action-layer safe space once the count badge is removed.');
assert(globals.includes('.task-card-no-children {\n  grid-template-columns: auto auto auto auto minmax(0, 1fr) !important;'), 'No-child task rows should keep the same leading column structure as rows with children.');
assert(globals.includes('.task-subtask-action-layer {\n  top: 50% !important;\n  transform: translateY(-50%) !important;') && globals.includes('grid-template-columns: 1.38rem 1.38rem !important;'), 'Subtask review/delete controls should be vertically centered and aligned in equal slots.');
assert(globals.includes('.task-complete-action,\n.task-tree-toggle,\n.task-tree-spacer {\n  height: 1.12rem !important;') || globals.includes('.task-subtask-complete'), 'Completion controls should stay compact across themes.');
assert(sortableTaskItem.includes("import { memo, useEffect, useLayoutEffect } from 'react';"), 'Sortable task rows should import React memoization for unchanged task cards.');
assert(sortableTaskItem.includes('export const SortableTaskItem = memo(function SortableTaskItem('), 'Sortable task rows should skip rendering when task data and controls are unchanged.');
assert(taskListContent.includes('onToggle={onToggle}') && taskListContent.includes('onDelete={onDelete}') && taskListContent.includes('onEdit={onEdit}') && taskListContent.includes('onPriorityChange={onPriorityChange}'), 'TaskListContent should pass stable task action callbacks directly to memoized rows.');

const taskDisplayOrdering = readFileSync('src/utils/taskDisplayOrdering.ts', 'utf8');
assert(taskSelectors.includes('const sourceOrderForSelectedDate = getSourceOrderForDate(taskListOrderByDate, selectedDate);'), 'Task selectors should normalize the selected-date source order once per view derivation.');
assert(/sortTasksForDisplay\(\s*filteredTasks,\s*selectedDate,\s*taskListOrderByDate,\s*sourceOrderForSelectedDate,?\s*\)/.test(taskSelectors), 'Task selectors should reuse the normalized selected-date source order for display sorting.');
assert(taskSelectors.includes('sourceOrderForSelectedDate,'), 'Task selectors should return the same normalized source order used for display sorting.');
assert(taskDisplayOrdering.includes('sourceOrder = getSourceOrderForDate(orderByDate, selectedDate)'), 'Display sorting should support a caller-provided normalized source order while retaining its standalone fallback.');
assert(taskDisplayOrdering.includes("if (!dateOrder?.taskOrderBySource?.personal && tasks.every((task) => getTaskSource(task) === 'personal'))"), 'Display sorting should bypass source grouping for the common all-personal default-order path.');

console.log('Task list interactions verification passed');
