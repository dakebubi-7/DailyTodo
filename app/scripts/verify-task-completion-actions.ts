import assert from 'node:assert/strict';
import { createTaskCompletionActionHandlers } from '../src/hooks/taskCompletionActions';
import type { Task } from '../src/types/task';

const task: Task = {
  id: 'task-1',
  text: 'Finish the extraction',
  completed: false,
  priority: 'medium',
  source: 'personal',
  createdAt: '2026-07-13T08:00:00.000Z',
  taskDate: '2026-07-13',
  isToday: true,
};
let tasks = [task];
let retainedReviews: unknown[] = [];
let persistedRetainedReviews: unknown;
let confirmationCount = 0;

const actions = createTaskCompletionActionHandlers({
  appSettings: {
    confirmBeforeDeletingReview: true,
    syncDeletedReviewsToObsidian: false,
  },
  setAllTasks(updater) {
    tasks = updater(tasks);
  },
  setRetainedReviews(updater) {
    retainedReviews = updater(retainedReviews);
  },
  persistRetainedReviews(value) {
    persistedRetainedReviews = value;
  },
  confirmDeleteReview() {
    confirmationCount += 1;
    return true;
  },
  createId() {
    return 'review-1';
  },
  getTimestamp() {
    return '2026-07-13T09:00:00.000Z';
  },
});

actions.completeTaskWithReview('task-1', {
  id: 'caller-provided-id',
  status: 'done',
  percent: 100,
  summary: 'Complete',
  unknowns: '',
  nextStep: '',
});
assert.equal(tasks[0].completed, true);
assert.equal(tasks[0].completionReview?.id, 'review-1');
assert.equal(tasks[0].completionReview?.reviewedAt, '2026-07-13T09:00:00.000Z');

actions.editTaskReview('task-1', 'review-1', { summary: 'Verified complete' });
assert.equal(tasks[0].completionReview?.summary, 'Verified complete');

actions.deleteTaskReview('task-1', 'review-1');
assert.equal(confirmationCount, 1, 'deleting a review should retain the existing confirmation behavior.');
assert.equal(tasks[0].completionReview, undefined);
assert.equal(retainedReviews.length, 1, 'locally deleted reviews should be retained for Obsidian sync.');
assert.deepEqual(persistedRetainedReviews, retainedReviews);

console.log('Task completion actions verification passed');
