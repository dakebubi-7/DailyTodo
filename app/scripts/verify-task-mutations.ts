import assert from 'node:assert/strict';
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
import type { Task } from '../src/types/task';

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

const editedText = editTaskText(baseTask, 'Write implementation');
assert.equal(editedText.text, 'Write implementation');
assert.equal(editedText.priority, 'medium');

const updatedFields = updateTaskFields(baseTask, {
  priority: 'high',
  tags: ['cleanup'],
});
assert.equal(updatedFields.priority, 'high');
assert.deepEqual(updatedFields.tags, ['cleanup']);
assert.equal(updatedFields.text, 'Write plan');

assert.equal(toggleTaskCollapseState({ ...baseTask, collapsed: false }).collapsed, true);
assert.equal(toggleTaskCollapseState({ ...baseTask, collapsed: true }).collapsed, false);
assert.equal(toggleTaskCollapseState(baseTask).collapsed, true);

console.log('task mutation verification passed');
