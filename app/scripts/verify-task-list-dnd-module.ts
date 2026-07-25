import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Task, TaskSource } from '../src/types/task';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const taskListPath = join(root, 'src/components/TaskList.tsx');
const dndModulePath = join(root, 'src/components/taskList/taskListDnd.ts');
const modelModulePath = join(root, 'src/components/taskList/taskListModel.ts');
const derivationsModulePath = join(root, 'src/components/taskList/taskListDerivations.ts');
const contentPath = join(root, 'src/components/taskList/TaskListContent.tsx');
const staticContentPath = join(root, 'src/components/taskList/TaskListStaticContent.tsx');
const dndSurfacePath = join(root, 'src/components/taskList/TaskListDndSurface.tsx');
const sourceSectionPath = join(root, 'src/components/taskList/SortableSourceSection.tsx');
const sortableTaskItemPath = join(root, 'src/components/taskList/SortableTaskItem.tsx');
const taskItemControlsPath = join(root, 'src/components/taskItem/taskItemControls.tsx');

assert.ok(existsSync(dndModulePath), 'TaskList DnD helper module should exist.');
assert.ok(existsSync(modelModulePath), 'TaskList pure model helper module should exist.');
assert.ok(existsSync(derivationsModulePath), 'TaskList derivation helper module should exist.');
assert.ok(existsSync(contentPath), 'TaskList content component should exist.');
assert.ok(existsSync(staticContentPath), 'TaskList static content component should exist.');
assert.ok(existsSync(dndSurfacePath), 'TaskList lazy DnD surface component should exist.');
assert.ok(existsSync(sourceSectionPath), 'Sortable source section component should exist.');
assert.ok(existsSync(sortableTaskItemPath), 'Sortable task item component should exist.');
assert.ok(existsSync(taskItemControlsPath), 'Task item controls module should exist.');

const taskList = readFileSync(taskListPath, 'utf8');
const dndModule = readFileSync(dndModulePath, 'utf8');
const modelModule = readFileSync(modelModulePath, 'utf8');
const derivationsModule = readFileSync(derivationsModulePath, 'utf8');
const taskListContent = readFileSync(contentPath, 'utf8');
const staticContent = readFileSync(staticContentPath, 'utf8');
const dndSurface = readFileSync(dndSurfacePath, 'utf8');
const sourceSection = readFileSync(sourceSectionPath, 'utf8');
const sortableTaskItem = readFileSync(sortableTaskItemPath, 'utf8');
const taskItemControls = readFileSync(taskItemControlsPath, 'utf8');

assert.match(dndModule, /export const TASK_SORTABLE_MOTION\b/, 'TaskList DnD module should export task sortable spring settings.');
assert.match(dndModule, /export const SOURCE_GROUP_SORTABLE_MOTION\b/, 'TaskList DnD module should export source-group sortable spring settings.');
assert.match(dndModule, /export const REDUCED_SORTABLE_MOTION\b/, 'TaskList DnD module should export reduced-motion spring settings.');
assert.match(modelModule, /export function getTaskSource\b/, 'TaskList model module should export getTaskSource.');
assert.match(dndModule, /export function getSourceSortableId\b/, 'TaskList DnD module should export getSourceSortableId.');
assert.match(dndModule, /export function getTaskSortableId\b/, 'TaskList DnD module should export getTaskSortableId.');
assert.match(dndModule, /export function parseSortableId\b/, 'TaskList DnD module should export parseSortableId.');
assert.match(dndModule, /export const scopedCollisionDetection: CollisionDetection\b/, 'TaskList DnD module should export scopedCollisionDetection.');
assert.match(dndModule, /export function getSourceDragTarget\b/, 'TaskList DnD module should export getSourceDragTarget.');
assert.match(dndModule, /closestCenter\(\{ \.\.\.args, droppableContainers \}\)/, 'scopedCollisionDetection should delegate filtered containers to closestCenter.');
assert.match(dndModule, /candidate\.source === active\.source/, 'Task collision filtering should stay source-local.');
assert.match(dndModule, /candidate\.completed === active\.completed/, 'Task collision filtering should stay completion-bucket local.');
assert.match(dndModule, /candidate\.type === 'source'/, 'Source collision filtering should stay source-section only.');
assert.match(dndModule, /stiffness: 95[\s\S]*damping: 14[\s\S]*mass: 1\.35/, 'Task sortable motion should preserve the approved spring values.');
assert.match(dndModule, /stiffness: 55[\s\S]*damping: 13[\s\S]*mass: 1\.8/, 'Source group sortable motion should preserve the approved slower spring values.');
assert.match(dndModule, /stiffness: 1000[\s\S]*damping: 100[\s\S]*mass: 0\.1/, 'Reduced sortable motion should preserve the instant spring values.');
assert.match(derivationsModule, /export function getTaskTagHistory\b/, 'TaskList derivations should export tag-history helper.');
assert.match(derivationsModule, /export function getTaskSourceGroups\b/, 'TaskList derivations should export source-group helper.');
assert.match(derivationsModule, /export function shouldShowSourceGroups\b/, 'TaskList derivations should export source-group visibility helper.');
assert.match(derivationsModule, /export function getTaskListDerivations\b/, 'TaskList derivations should combine list-level scans in one helper.');
assert.match(derivationsModule, /from '\.\/taskListModel'/, 'TaskList derivations should use the pure task model helper.');
assert.match(derivationsModule, /getTaskSource\(task\)/, 'TaskList derivations should use the shared task-source fallback helper.');
assert.doesNotMatch(
  derivationsModule,
  /sourcesInTasks\.filter\(\(source\) => !sourceOrder\.includes\(source\)\)/,
  'TaskList source grouping should not repeatedly scan the saved source order for each discovered source.',
);
assert.match(
  derivationsModule,
  /const sourceOrderSet = new Set\(sourceOrder\)/,
  'TaskList source grouping should build one source-order membership set.',
);

assert.match(taskList, /lazy\(\(\) => import\('\.\/taskList\/TaskListDndSurface'\)/, 'TaskList should lazy-load the DnD surface.');
assert.match(taskList, /from '\.\/taskList\/TaskListStaticContent'/, 'TaskList should render static content before DnD is requested.');
assert.match(staticContent, /contentVisibility: 'auto'/, 'Static task rows should skip offscreen browser rendering work before DnD is requested.');
assert.match(staticContent, /containIntrinsicSize: 'auto 4rem'/, 'Static task rows should reserve a stable offscreen height while content visibility is deferred.');
assert.match(staticContent, /<div style=\{STATIC_TASK_CONTENT_VISIBILITY\}>[\s\S]*?<TaskItem/, 'Static task rendering should isolate each task card in its own content-visibility boundary.');
assert.doesNotMatch(taskList, /from '@dnd-kit\//, 'TaskList entrypoint should not statically import dnd-kit.');
assert.doesNotMatch(taskList, /from '\.\/taskList\/taskListDnd'/, 'TaskList entrypoint should not import DnD helpers.');
assert.match(taskList, /from '\.\/taskList\/taskListDerivations'/, 'TaskList should import pure derivation helpers from the taskList module folder.');
assert.match(taskList, /import \{[^}]*\bmemo\b[^}]*\buseMemo\b[^}]*\buseRef\b[^}]*\buseState\b[^}]*\} from 'react';/, 'TaskList should import memo to isolate the drag surface from unrelated app-shell updates.');
assert.match(taskList, /export const TaskList = memo\(function TaskList\(/, 'TaskList should memoize the drag surface when task-facing props are unchanged.');
assert.match(taskList, /getTaskListDerivations\(tasks, sourceOrder\)/, 'TaskList should derive tags and source groups together from one task scan.');
assert.doesNotMatch(taskList, /from '\.\/taskList\/TaskListContent'/, 'TaskList entrypoint should leave sortable content inside the lazy DnD surface.');
assert.match(taskListContent, /from '\.\/SortableSourceSection'/, 'TaskListContent should import the source section component from the taskList module folder.');
assert.match(taskListContent, /from '\.\/SortableTaskItem'/, 'TaskListContent should import the sortable task item component from the taskList module folder.');
assert.match(taskListContent, /import \{ memo \} from 'react'/, 'TaskListContent should import memo to isolate task-card rendering from toolbar-only state changes.');
assert.match(taskListContent, /export const TaskListContent = memo\(function TaskListContent\(/, 'TaskListContent should memoize task-card rendering when list data and action handlers are unchanged.');
assert.match(taskList, /onPointerEnter=\{requestDndSurface\}/, 'TaskList should request the DnD surface when the pointer enters the sortable region.');
assert.match(taskList, /onFocusCapture=\{requestDndSurface\}/, 'TaskList should request the DnD surface for keyboard access.');
assert.match(taskList, /const contentProps = \{[\s\S]*sourceGroups,[\s\S]*shouldGroupBySource,/, 'TaskList should prepare grouped data for static content before DnD loads.');
assert.match(taskList, /<TaskListStaticContent \{\.\.\.contentProps\}/, 'TaskList should render static content with the prepared grouped data before DnD loads.');
assert.match(dndSurface, /from '@dnd-kit\/core'/, 'Lazy DnD surface should own dnd-kit runtime imports.');
assert.match(dndSurface, /<DndContext\b/, 'Lazy DnD surface should own the DndContext.');
assert.match(dndSurface, /<TaskListContent \{\.\.\.contentProps\} dragDisabled=\{dragDisabled\} isDragActive=\{isDragActive\}/, 'Lazy DnD surface should pass grouped data and drag lifecycle state into DnD content.');
assert.match(staticContent, /from '\.\.\/TaskItem'/, 'Static content should render ordinary TaskItem cards without dnd-kit.');
assert.doesNotMatch(staticContent, /@dnd-kit\//, 'Static content should not import dnd-kit.');
assert.match(staticContent, /const StaticTaskItem = memo\(function StaticTaskItem\(/, 'Static content should memoize individual task rows so unchanged cards skip list-level rerenders.');
assert.match(staticContent, /<StaticTaskItem[\s\S]*?task=\{task\}[\s\S]*?onToggle=\{onToggle\}/, 'Static content should pass stable list callbacks into memoized task rows.');
assert.doesNotMatch(staticContent, /const renderTask = \(task: Task\) => \([\s\S]*?<TaskItem/, 'Static content should not recreate TaskItem callbacks directly in its list renderer.');
assert.match(taskListContent, /<SortableSourceSection[\s\S]*source=\{source\}[\s\S]*dragDisabled=\{dragDisabled \|\| sourceGroups\.length < 2\}[\s\S]*isDragActive=\{isDragActive\}/, 'TaskListContent should pass source, drag-disabled state, and drag lifecycle state into SortableSourceSection.');
assert.match(taskListContent, /<SortableTaskItem[\s\S]*task=\{task\}[\s\S]*index=\{index\}[\s\S]*dragDisabled=\{dragDisabled\}[\s\S]*isDragActive=\{isDragActive\}/, 'TaskListContent should pass task, index, drag-disabled state, and drag lifecycle state into SortableTaskItem.');
assert.match(dndSurface, /collisionDetection=\{scopedCollisionDetection\}/, 'Lazy DnD surface should keep using scoped collision detection.');
assert.match(dndSurface, /getSourceDragTarget\(String\(event\.active\.id\), String\(event\.over\.id\)\)/, 'Lazy DnD surface should delegate source drag target parsing to the DnD module.');
assert.match(taskListContent, /items=\{bucketTasks\.map\(getTaskSortableId\)\}/, 'TaskListContent should use the DnD module for task sortable ids.');
assert.match(taskListContent, /onToggle=\{onToggle\}[\s\S]*onDelete=\{onDelete\}[\s\S]*onEdit=\{onEdit\}[\s\S]*onPriorityChange=\{onPriorityChange\}/, 'TaskListContent should pass stable task action handlers through to memoized task rows.');
assert.doesNotMatch(taskListContent, /onToggle=\{\(\) => onToggle\(task\.id\)\}/, 'TaskListContent should not create a task toggle callback for every list render.');
assert.doesNotMatch(taskListContent, /onDelete=\{\(\) => onDelete\(task\.id\)\}/, 'TaskListContent should not create a task deletion callback for every list render.');
assert.doesNotMatch(taskListContent, /onEdit=\{\(text\) => onEdit\(task\.id, text\)\}/, 'TaskListContent should not create a task edit callback for every list render.');
assert.doesNotMatch(taskListContent, /onPriorityChange=\{\(priority\) => onPriorityChange\(task\.id, priority\)\}/, 'TaskListContent should not create a priority callback for every list render.');
assert.match(sourceSection, /getSourceSortableId\(source\)/, 'SortableSourceSection should use the DnD module for source sortable ids.');
assert.match(sortableTaskItem, /getTaskSortableId\(task\)/, 'SortableTaskItem should use the DnD module for task sortable ids.');
assert.doesNotMatch(taskList, /function parseSortableId\b/, 'TaskList should not inline sortable id parsing.');
assert.doesNotMatch(taskList, /function scopedCollisionDetection\b/, 'TaskList should not inline scoped collision filtering.');
assert.doesNotMatch(taskList, /function SortableSourceSection\b/, 'TaskList should not inline the sortable source section component.');
assert.doesNotMatch(taskList, /function SortableTaskItem\b/, 'TaskList should not inline the sortable task item component.');
assert.doesNotMatch(taskList, /function DragDotsIcon\b/, 'TaskList should reuse the shared drag dots icon instead of redefining it.');
assert.doesNotMatch(taskList, /const TASK_SORTABLE_MOTION = \{/, 'TaskList should not inline task sortable motion constants.');
assert.doesNotMatch(taskList, /const SOURCE_GROUP_SORTABLE_MOTION = \{/, 'TaskList should not inline source sortable motion constants.');

assert.match(sourceSection, /export function SortableSourceSection\b/, 'Sortable source section component should be exported.');
assert.match(sourceSection, /useSortable\(\{[\s\S]*id: sortableId,[\s\S]*disabled: dragDisabled,[\s\S]*transition: null,[\s\S]*\}\)/, 'SortableSourceSection should own source-group sortable registration.');
assert.match(sourceSection, /SOURCE_GROUP_SORTABLE_MOTION/, 'SortableSourceSection should use the source-group spring preset.');
assert.match(sourceSection, /REDUCED_SORTABLE_MOTION/, 'SortableSourceSection should use the reduced-motion spring preset.');
assert.match(sourceSection, /springX\.jump\(0\)[\s\S]*springY\.jump\(0\)/, 'SortableSourceSection should jump springs to rest after drag completion.');
assert.match(sourceSection, /className=\{`task-source-group task-source-group-shell \$\{isDragging \? 'task-source-group-dragging' : ''\}`\}/, 'SortableSourceSection should preserve source group shell classes.');
assert.match(sourceSection, /className=\{`task-source-group-title \$\{source === 'external' \? 'task-source-group-title-external' : ''\}`\}/, 'SortableSourceSection should preserve source group title classes.');
assert.match(sourceSection, /ref=\{setActivatorNodeRef\}/, 'SortableSourceSection should keep the title row as the drag activator.');
assert.match(sourceSection, /role="button"[\s\S]*tabIndex=\{dragDisabled \? -1 : 0\}[\s\S]*aria-disabled=\{dragDisabled\}/, 'SortableSourceSection should preserve source title accessibility behavior.');
assert.match(sourceSection, /source-drag-handle[\s\S]*<DragDotsIcon \/>/, 'SortableSourceSection should render the shared drag dots icon in the source handle.');

assert.match(sortableTaskItem, /export (?:function|const) SortableTaskItem\b/, 'Sortable task item component should be exported.');
assert.match(sortableTaskItem, /function areTaskItemPropsEqual\(/, 'Sortable task items should compare equal tag lists by content so unrelated task updates do not rerender every row.');
assert.match(sortableTaskItem, /function haveSameTags\(/, 'Sortable task item comparison should keep tag-list equality separate and readable.');
assert.match(sortableTaskItem, /export const SortableTaskItem = memo\(function SortableTaskItem\([\s\S]*?\}, areTaskItemPropsEqual\);/, 'Sortable task items should use the tag-aware memo comparator.');
assert.match(sortableTaskItem, /useSortable\(\{[\s\S]*id: getTaskSortableId\(task\),[\s\S]*disabled: dragDisabled,[\s\S]*transition: null,[\s\S]*\}\)/, 'SortableTaskItem should own task sortable registration.');
assert.match(sortableTaskItem, /TASK_SORTABLE_MOTION/, 'SortableTaskItem should use the task spring preset.');
assert.match(sortableTaskItem, /REDUCED_SORTABLE_MOTION/, 'SortableTaskItem should use the reduced-motion spring preset.');
assert.match(sortableTaskItem, /springX\.jump\(0\)[\s\S]*springY\.jump\(0\)/, 'SortableTaskItem should jump springs to rest after drag completion.');
assert.match(sortableTaskItem, /const dragHandleProps: TaskDragHandleProps = \{[\s\S]*setActivatorNodeRef,[\s\S]*disabled: dragDisabled,[\s\S]*\}/, 'SortableTaskItem should create TaskItem drag handle props from sortable activators.');
assert.doesNotMatch(sortableTaskItem, /ButtonHTMLAttributes/, 'SortableTaskItem should not import React button attributes only to cast dnd-kit activators.');
assert.doesNotMatch(sortableTaskItem, /attributes as ButtonHTMLAttributes<HTMLButtonElement>/, 'SortableTaskItem should pass dnd-kit attributes without a button-attribute cast.');
assert.doesNotMatch(sortableTaskItem, /listeners as ButtonHTMLAttributes<HTMLButtonElement>/, 'SortableTaskItem should pass dnd-kit listeners without a button-attribute cast.');
assert.match(taskItemControls, /import type \{ DraggableAttributes, DraggableSyntheticListeners \} from '@dnd-kit\/core'/, 'Task item controls should use dnd-kit activator types for drag handle props.');
assert.match(taskItemControls, /attributes: DraggableAttributes;/, 'TaskDragHandleProps should expose dnd-kit draggable attributes directly.');
assert.match(taskItemControls, /listeners\?: DraggableSyntheticListeners;/, 'TaskDragHandleProps should expose dnd-kit synthetic listeners directly.');
assert.match(sortableTaskItem, /className=\{`task-sortable-shell \$\{isDragging \? 'task-sortable-dragging' : ''\}`\}/, 'SortableTaskItem should preserve task sortable shell classes.');
assert.match(sortableTaskItem, /<TaskItem[\s\S]*dragHandleProps=\{dragHandleProps\}[\s\S]*editTrigger=\{editTrigger\}/, 'SortableTaskItem should render TaskItem with drag handle props and edit trigger wiring.');
assert.match(sortableTaskItem, /onToggle=\{\(\) => onToggle\(task\.id\)\}/, 'SortableTaskItem should bind its own task id for toggle actions.');
assert.match(sortableTaskItem, /onDelete=\{\(\) => onDelete\(task\.id\)\}/, 'SortableTaskItem should bind its own task id for delete actions.');
assert.match(sortableTaskItem, /onEdit=\{\(text\) => onEdit\(task\.id, text\)\}/, 'SortableTaskItem should bind its own task id for edit actions.');
assert.match(sortableTaskItem, /onPriorityChange=\{\(priority\) => onPriorityChange\(task\.id, priority\)\}/, 'SortableTaskItem should bind its own task id for priority actions.');

const dnd = await import(pathToFileURL(dndModulePath).href) as typeof import('../src/components/taskList/taskListDnd');
const model = await import(pathToFileURL(modelModulePath).href) as typeof import('../src/components/taskList/taskListModel');
const derivations = await import(pathToFileURL(derivationsModulePath).href) as typeof import('../src/components/taskList/taskListDerivations');

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    text: id,
    completed: false,
    priority: 'medium',
    source: 'personal',
    createdAt: '2026-07-07T00:00:00.000Z',
    taskDate: '2026-07-07',
    isToday: true,
    ...overrides,
  };
}

assert.equal(model.getTaskSource(task('missing-source', { source: undefined })), 'personal', 'Missing task source should default to personal.');
assert.equal(model.getTaskSource(task('external', { source: 'external' })), 'external', 'Explicit external source should be preserved.');
assert.equal(dnd.getSourceSortableId('personal'), 'source:personal', 'Source sortable id should preserve the source prefix.');
assert.equal(dnd.getTaskSortableId(task('a:b', { source: 'external', completed: true })), 'task:external:done:a:b', 'Task sortable id should preserve source, done bucket, and colon-containing task ids.');
assert.deepEqual(dnd.parseSortableId('source:external'), { type: 'source', source: 'external' }, 'parseSortableId should parse source ids.');
assert.deepEqual(dnd.parseSortableId('task:personal:open:task:with:colon'), { type: 'task', source: 'personal', completed: false, taskId: 'task:with:colon' }, 'parseSortableId should preserve colon-containing task ids.');
assert.deepEqual(dnd.parseSortableId('task:external:done:done-task'), { type: 'task', source: 'external', completed: true, taskId: 'done-task' }, 'parseSortableId should parse done task ids.');
assert.equal(dnd.parseSortableId('source:unknown'), null, 'parseSortableId should reject unknown sources.');
assert.equal(dnd.parseSortableId('task:personal:later:abc'), null, 'parseSortableId should reject unknown completion buckets.');
assert.deepEqual(dnd.getSourceDragTarget('source:external', 'source:personal'), { activeSource: 'external' as TaskSource, targetSource: 'personal' as TaskSource }, 'Source drag target should describe cross-source moves.');
assert.deepEqual(dnd.getSourceDragTarget('source:external', 'task:personal:open:a'), { activeSource: 'external' as TaskSource, targetSource: 'personal' as TaskSource }, 'Source drag target should tolerate a task-shaped over id.');
assert.equal(dnd.getSourceDragTarget('source:external', 'source:external'), null, 'Source drag target should ignore same-source drops.');
assert.equal(dnd.getSourceDragTarget('task:personal:open:a', 'source:external'), null, 'Source drag target should ignore non-source active ids.');

const tagHistory = derivations.getTaskTagHistory([
  task('tag-a', { tags: ['work', 'urgent'] }),
  task('tag-b', { tags: ['work'] }),
  task('tag-c', { tags: ['home'] }),
]);
assert.deepEqual(tagHistory, ['work', 'urgent', 'home'], 'Tag history should remain unique and frequency-first while preserving first-seen order for ties.');

const sourceGroups = derivations.getTaskSourceGroups(
  [
    task('missing-source', { source: undefined }),
    task('external-one', { source: 'external' }),
  ],
  ['external', 'personal'],
);
assert.deepEqual(sourceGroups.map((group) => group.source), ['external', 'personal'], 'Source groups should respect saved source order and include missing-source tasks as personal.');
assert.deepEqual(sourceGroups.map((group) => group.tasks.map((item) => item.id)), [['external-one'], ['missing-source']], 'Source groups should preserve source-local task order.');
assert.equal(derivations.shouldShowSourceGroups([task('personal-only')]), false, 'Source groups should stay hidden when no external tasks exist.');
assert.equal(derivations.shouldShowSourceGroups([task('external-visible', { source: 'external' })]), true, 'Source groups should show when external tasks exist.');

const sourceChangedParent = task('source-change-parent', {
  source: 'external',
  subtasks: [task('source-change-child', { source: 'personal', parentTaskId: 'source-change-parent' })],
});
const sourceChangedDerivations = derivations.getTaskListDerivations(
  [sourceChangedParent],
  ['personal', 'external'],
);
assert.deepEqual(
  sourceChangedDerivations.sourceGroups.find((group) => group.source === 'external')?.tasks,
  [sourceChangedParent],
  'Changing a parent task source should place the parent in its new source group.',
);

assert.deepEqual(
  derivations.getTaskListDerivations([
    task('personal-one', { tags: ['work', 'urgent'] }),
    task('external-one', { source: 'external', tags: ['work'] }),
    task('personal-two', { tags: ['home'] }),
  ], ['external', 'personal']),
  {
    allTags: ['work', 'urgent', 'home'],
    sourceGroups: [
      { source: 'external', tasks: [task('external-one', { source: 'external', tags: ['work'] })] },
      {
        source: 'personal',
        tasks: [
          task('personal-one', { tags: ['work', 'urgent'] }),
          task('personal-two', { tags: ['home'] }),
        ],
      },
    ],
    shouldGroupBySource: true,
  },
  'Combined task-list derivations should preserve tag history, source ordering, and external grouping visibility.',
);

assert.deepEqual(
  derivations.getTaskListDerivations([
    task('personal-one', { tags: ['work', 'urgent'] }),
    task('personal-two', { tags: ['work', 'home'] }),
  ], ['personal', 'external']),
  {
    allTags: ['work', 'urgent', 'home'],
    sourceGroups: [],
    shouldGroupBySource: false,
  },
  'Combined task-list derivations should skip unused source-group allocation when every visible task is personal.',
);

console.log('TaskList DnD module verification passed');
