import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  addSubtaskToTask,
  appendCompletionReviewToTask,
  changeTaskPriority,
  clearCompletedTasks,
  createTask,
  deleteReviewFromTask,
  editTaskText,
  findTaskReview,
  getDeleteTaskReviewConfirmationMessage,
  markTaskDoneWithoutReview,
  retainDeletedTaskReviewForObsidian,
  toggleTaskCompletion,
  toggleTaskCollapseState,
  updateTaskFields,
  updateTaskReview,
} from '../src/hooks/taskMutations';
import { mapTaskTree, removeTaskFromTree } from '../src/hooks/taskTree';
import type { Task } from '../src/types/task';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const baseTask: Task = {
  id: 'task-1',
  text: 'Write plan',
  completed: false,
  priority: 'medium',
  source: 'external',
  createdAt: '2026-07-05T01:00:00.000Z',
  taskDate: '2026-07-05',
  isToday: true,
};

const created = createTask({
  id: 'task-new',
  text: 'Capture idea',
  priority: 'high',
  source: 'personal',
  createdAt: '2026-07-05T02:00:00.000Z',
  taskDate: '2026-07-05',
  currentDate: '2026-07-05',
});
assert.deepEqual(created, {
  id: 'task-new',
  text: 'Capture idea',
  completed: false,
  priority: 'high',
  source: 'personal',
  createdAt: '2026-07-05T02:00:00.000Z',
  taskDate: '2026-07-05',
  isToday: true,
});

const toggledDone = toggleTaskCompletion(baseTask, '2026-07-05T03:00:00.000Z');
assert.equal(toggledDone.completed, true);
assert.equal(toggledDone.completedAt, '2026-07-05T03:00:00.000Z');

const toggledOpen = toggleTaskCompletion(toggledDone, '2026-07-05T04:00:00.000Z');
assert.equal(toggledOpen.completed, false);
assert.equal(toggledOpen.completedAt, undefined);

const reviewed = appendCompletionReviewToTask(baseTask, {
  review: {
    status: 'partial',
    percent: 60,
    summary: 'Started',
    unknowns: '',
    nextStep: 'Finish draft',
  },
  id: 'review-1',
  reviewedAt: '2026-07-05T05:00:00.000Z',
});
assert.equal(reviewed.completed, true);
assert.equal(reviewed.completedAt, '2026-07-05T05:00:00.000Z');
assert.equal(reviewed.completionReview?.id, 'review-1');
assert.equal(reviewed.completionReviews?.length, 1);

const editedReview = updateTaskReview(reviewed, 'review-1', { percent: 100, status: 'done' });
assert.equal(editedReview.completionReviews?.[0].percent, 100);
assert.equal(editedReview.completionReview?.status, 'done');
assert.strictEqual(
  updateTaskReview(reviewed, 'review-1', {}),
  reviewed,
  'Empty review updates should preserve the original task reference.',
);
assert.strictEqual(
  updateTaskReview(reviewed, 'review-1', {
    status: reviewed.completionReview?.status,
    percent: reviewed.completionReview?.percent,
  }),
  reviewed,
  'Review updates with identical values should preserve the original task reference.',
);

const outOfOrderReviewTask: Task = {
  ...baseTask,
  completed: true,
  completedAt: '2026-07-05T10:00:00.000Z',
  completionReviews: [
    {
      id: 'review-newest',
      status: 'done',
      percent: 100,
      summary: 'Newest review',
      unknowns: '',
      nextStep: '',
      reviewedAt: '2026-07-05T10:00:00.000Z',
    },
    {
      id: 'review-oldest',
      status: 'partial',
      percent: 40,
      summary: 'Oldest review',
      unknowns: '',
      nextStep: 'Keep going',
      reviewedAt: '2026-07-05T08:00:00.000Z',
    },
    {
      id: 'review-middle',
      status: 'partial',
      percent: 70,
      summary: 'Middle review',
      unknowns: '',
      nextStep: 'Wrap up',
      reviewedAt: '2026-07-05T09:00:00.000Z',
    },
  ],
  completionReview: {
    id: 'review-middle',
    status: 'partial',
    percent: 70,
    summary: 'Middle review',
    unknowns: '',
    nextStep: 'Wrap up',
    reviewedAt: '2026-07-05T09:00:00.000Z',
  },
};

const editedOutOfOrderReview = updateTaskReview(outOfOrderReviewTask, 'review-oldest', { summary: 'Still oldest' });
assert.equal(
  editedOutOfOrderReview.completionReview?.id,
  'review-newest',
  'Updating a non-latest review should preserve the latest completionReview by reviewedAt',
);

assert.equal(findTaskReview(reviewed, 'review-1')?.summary, 'Started');
assert.equal(findTaskReview(reviewed, 'missing-review'), undefined);

const legacyReviewTask: Task = {
  ...baseTask,
  completionReview: {
    status: 'done',
    percent: 100,
    summary: 'Legacy review',
    unknowns: '',
    nextStep: '',
    reviewedAt: '2026-07-05T05:30:00.000Z',
  },
};
assert.equal(findTaskReview(legacyReviewTask, '2026-07-05T05:30:00.000Z')?.summary, 'Legacy review');

const legacyReviewWithExplicitEmptyArray: Task = {
  ...legacyReviewTask,
  completionReviews: [],
};
assert.equal(
  findTaskReview(legacyReviewWithExplicitEmptyArray, '2026-07-05T05:30:00.000Z')?.summary,
  'Legacy review',
  'Explicit empty completionReviews should still fall back to legacy completionReview',
);

const appendedFromLegacyFallback = appendCompletionReviewToTask(legacyReviewWithExplicitEmptyArray, {
  review: {
    status: 'partial',
    percent: 80,
    summary: 'Follow-up',
    unknowns: '',
    nextStep: 'Close out',
  },
  id: 'review-2',
  reviewedAt: '2026-07-05T05:45:00.000Z',
});
assert.deepEqual(
  appendedFromLegacyFallback.completionReviews?.map((review) => review.id || review.reviewedAt),
  ['2026-07-05T05:30:00.000Z', 'review-2'],
  'Appending should preserve the legacy review before adding the new one',
);

const deletedLegacyFallback = deleteReviewFromTask(
  legacyReviewWithExplicitEmptyArray,
  '2026-07-05T05:30:00.000Z',
);
assert.equal(deletedLegacyFallback.completed, false);
assert.equal(deletedLegacyFallback.completionReview, undefined);
assert.equal(deletedLegacyFallback.completionReviews, undefined);

const retainedReview = retainDeletedTaskReviewForObsidian([], reviewed, 'review-1', false, '2026-07-05T06:00:00.000Z');
assert.equal(retainedReview.length, 1);
assert.equal(retainedReview[0].task.id, 'task-1');
assert.equal(retainedReview[0].review.id, 'review-1');
assert.equal(retainedReview[0].deletedAt, '2026-07-05T06:00:00.000Z');
assert.equal(retainDeletedTaskReviewForObsidian(retainedReview, reviewed, 'review-1', false).length, 1);
assert.strictEqual(retainDeletedTaskReviewForObsidian(retainedReview, reviewed, 'missing-review', false), retainedReview);
assert.strictEqual(retainDeletedTaskReviewForObsidian(retainedReview, reviewed, 'review-1', true), retainedReview);

assert.equal(
  getDeleteTaskReviewConfirmationMessage(false),
  '将删除本地完成记录。继续吗？',
);
assert.equal(
  getDeleteTaskReviewConfirmationMessage(true),
  '将删除本地完成记录。因为已开启删除同步，下一次 Obsidian 同步会从 DailyTodo 管理区块中移除这条记录。继续吗？',
);

const deletedReview = deleteReviewFromTask(reviewed, 'review-1');
assert.equal(deletedReview.completed, false);
assert.equal(deletedReview.completedAt, undefined);
assert.equal(deletedReview.completionReviews, undefined);
assert.equal(deletedReview.completionReview, undefined);
assert.strictEqual(
  deleteReviewFromTask(reviewed, 'missing-review'),
  reviewed,
  'Deleting a missing review should preserve the existing task reference and completion state.',
);

const deletedOlderOutOfOrderReview = deleteReviewFromTask(outOfOrderReviewTask, 'review-oldest');
assert.equal(
  deletedOlderOutOfOrderReview.completionReview?.id,
  'review-newest',
  'Deleting a non-latest older review should keep the newest completionReview by reviewedAt',
);
assert.deepEqual(
  deletedOlderOutOfOrderReview.completionReviews?.map((review) => review.id),
  ['review-newest', 'review-middle'],
  'Deleting a review should preserve the remaining review order while finding the latest review.',
);
const taskReviewMutationsSource = readFileSync(join(root, 'src/hooks/taskReviewMutations.ts'), 'utf8');
assert.doesNotMatch(
  taskReviewMutationsSource,
  /const reviews = existingReviews\.filter\([\s\S]*?const latestReview = reviews\.length \? getLatestTaskReview\(reviews\) : undefined;/,
  'Deleting a review should build the remaining records and latest record in one traversal.',
);
assert.doesNotMatch(
  taskReviewMutationsSource,
  /function getLatestTaskReview\(reviews: TaskCompletionReview\[\]\) \{\s*return reviews\.reduce\(/s,
  'Updating a review should select its latest sibling without reduce callback overhead.',
);

const subtaskParent = addSubtaskToTask(baseTask, {
  id: 'subtask-1',
  text: 'Draft outline',
  createdAt: '2026-07-05T06:00:00.000Z',
});
assert.equal(subtaskParent.collapsed, false);
assert.deepEqual(subtaskParent.subtasks?.[0], {
  id: 'subtask-1',
  text: 'Draft outline',
  completed: false,
  priority: 'medium',
  source: 'external',
  createdAt: '2026-07-05T06:00:00.000Z',
  taskDate: '2026-07-05',
  isToday: true,
  parentTaskId: 'task-1',
});

const doneWithoutReview = markTaskDoneWithoutReview(baseTask, '2026-07-05T07:00:00.000Z');
assert.equal(doneWithoutReview.completed, true);
assert.equal(doneWithoutReview.completedAt, '2026-07-05T07:00:00.000Z');

const clearedTasks = clearCompletedTasks([
  {
    ...baseTask,
    id: 'completed-selected-date',
    completed: true,
  },
  {
    ...baseTask,
    id: 'completed-scheduled-date',
    completed: true,
    taskDate: '2026-07-04',
    scheduledDates: ['2026-07-05'],
  },
  {
    ...baseTask,
    id: 'incomplete-selected-date',
  },
  {
    ...baseTask,
    id: 'completed-other-date',
    completed: true,
    taskDate: '2026-07-04',
    isToday: false,
  },
  {
    ...baseTask,
    id: 'already-cleared',
    completed: true,
    cleared: true,
  },
], '2026-07-05', '2026-07-05');

assert.equal(clearedTasks.find((task) => task.id === 'completed-selected-date')?.cleared, true);
assert.equal(clearedTasks.find((task) => task.id === 'completed-scheduled-date')?.cleared, true);
assert.equal(clearedTasks.find((task) => task.id === 'incomplete-selected-date')?.cleared, undefined);
assert.equal(clearedTasks.find((task) => task.id === 'completed-other-date')?.cleared, undefined);
assert.equal(clearedTasks.find((task) => task.id === 'already-cleared')?.cleared, true);

const alreadyClearedTasks = [
  baseTask,
  {
    ...baseTask,
    id: 'already-cleared-only',
    completed: true,
    cleared: true,
  },
];
const unchangedAfterClear = clearCompletedTasks(alreadyClearedTasks, '2026-07-05', '2026-07-05');
assert.strictEqual(
  unchangedAfterClear,
  alreadyClearedTasks,
  'Clearing should preserve the original list when no visible completed task changes.',
);

const priorityChangedTasks = changeTaskPriority([
  baseTask,
  {
    ...baseTask,
    id: 'task-2',
    priority: 'low',
  },
], 'task-2', 'high');

assert.equal(priorityChangedTasks.find((task) => task.id === 'task-1')?.priority, 'medium');
assert.equal(priorityChangedTasks.find((task) => task.id === 'task-2')?.priority, 'high');

const unchangedPriorityTasks = [baseTask];
assert.strictEqual(
  changeTaskPriority(unchangedPriorityTasks, 'task-1', 'medium'),
  unchangedPriorityTasks,
  'Priority updates should preserve the original list when the priority is unchanged.',
);
assert.strictEqual(
  changeTaskPriority(unchangedPriorityTasks, 'missing-task', 'high'),
  unchangedPriorityTasks,
  'Priority updates should preserve the original list when the task is missing.',
);

const editedText = editTaskText(baseTask, 'Write implementation');
assert.equal(editedText.text, 'Write implementation');
assert.equal(editedText.priority, 'medium');
assert.strictEqual(
  editTaskText(baseTask, baseTask.text),
  baseTask,
  'Editing with identical text should preserve the original task.',
);

const updatedFields = updateTaskFields(baseTask, {
  priority: 'high',
  tags: ['cleanup'],
});
assert.equal(updatedFields.priority, 'high');
assert.deepEqual(updatedFields.tags, ['cleanup']);
assert.equal(updatedFields.text, 'Write plan');
assert.strictEqual(
  updateTaskFields(baseTask, { priority: 'medium' }),
  baseTask,
  'Field updates should preserve the original task when every provided value is unchanged.',
);
assert.strictEqual(
  updateTaskFields(baseTask, {}),
  baseTask,
  'Empty field updates should preserve the original task.',
);
const taskWithCollections: Task = {
  ...baseTask,
  tags: ['focus', 'release'],
  scheduledDates: ['2026-07-06', '2026-07-08'],
};
assert.strictEqual(
  updateTaskFields(taskWithCollections, {
    tags: ['focus', 'release'],
    scheduledDates: ['2026-07-06', '2026-07-08'],
  }),
  taskWithCollections,
  'Equivalent tag and scheduled-date arrays should preserve the original task.',
);

assert.equal(toggleTaskCollapseState({ ...baseTask, collapsed: false }).collapsed, true);
assert.equal(toggleTaskCollapseState({ ...baseTask, collapsed: true }).collapsed, false);
assert.equal(toggleTaskCollapseState(baseTask).collapsed, true);

const taskTree = [
  {
    ...baseTask,
    id: 'parent',
    subtasks: [
      { ...baseTask, id: 'nested-target', parentTaskId: 'parent' },
    ],
  },
  { ...baseTask, id: 'unchanged-sibling' },
];
const unchangedTree = mapTaskTree(taskTree, 'missing', (task) => ({ ...task, completed: true }));
assert.strictEqual(unchangedTree, taskTree, 'Tree updates should preserve the original array when no task matches.');
const updatedTree = mapTaskTree(taskTree, 'nested-target', (task) => ({ ...task, completed: true }));
assert.notStrictEqual(updatedTree, taskTree, 'Tree updates should allocate a new root array when a nested task changes.');
assert.notStrictEqual(updatedTree[0], taskTree[0], 'Tree updates should copy ancestors of a changed nested task.');
assert.strictEqual(updatedTree[1], taskTree[1], 'Tree updates should preserve untouched sibling task references.');
const unchangedRemoval = removeTaskFromTree(taskTree, 'missing');
assert.strictEqual(unchangedRemoval, taskTree, 'Tree deletion should preserve the original array when no task matches.');
const removedTree = removeTaskFromTree(taskTree, 'nested-target');
assert.strictEqual(removedTree[1], taskTree[1], 'Tree deletion should preserve untouched sibling task references.');
const duplicateRemoval = removeTaskFromTree([
  { ...baseTask, id: 'duplicate' },
  {
    ...baseTask,
    id: 'duplicate-parent',
    subtasks: [{ ...baseTask, id: 'duplicate', parentTaskId: 'duplicate-parent' }],
  },
], 'duplicate');
assert.deepEqual(duplicateRemoval.map((task) => task.id), ['duplicate-parent'], 'Tree deletion should remove every matching task id, including nested duplicates.');
assert.deepEqual(duplicateRemoval[0].subtasks, [], 'Tree deletion should remove nested duplicate task ids.');

const taskTransformsSource = readFileSync(join(root, 'src/hooks/taskTransforms.ts'), 'utf8');
const taskTreeSource = readFileSync(join(root, 'src/hooks/taskTree.ts'), 'utf8');
assert.doesNotMatch(
  taskTransformsSource,
  /export function (?:mapTaskTree|removeTaskFromTree)\(/,
  'Persisted-task transforms should not own recursive task-tree mutations.',
);
assert.match(
  taskTreeSource,
  /export function mapTaskTree\([\s\S]*?export function removeTaskFromTree\(/,
  'Focused task-tree utilities should own recursive update and removal operations.',
);
assert.doesNotMatch(
  taskTreeSource,
  /\? \(\(\) => \{\s*const nextSubtasks = (?:mapTaskTree|removeTaskFromTree)/,
  'Recursive task-tree transforms should not allocate an IIFE for every task with subtasks.',
);

console.log('task mutation verification passed');
