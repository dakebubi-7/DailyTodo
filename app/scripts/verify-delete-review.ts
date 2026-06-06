import assert from 'node:assert/strict';
import { deleteReviewFromTask } from '../src/hooks/useTasks';
import type { Task } from '../src/types/task';

const baseTask: Task = {
  id: 'task-1',
  text: 'Codex 接入 Minimax',
  completed: true,
  completedAt: '2026-05-26T09:53:30.124Z',
  priority: 'low',
  createdAt: '2026-05-26T08:44:06.228Z',
  taskDate: '2026-05-26',
  isToday: false,
  completionReview: {
    status: 'done',
    percent: 100,
    summary: 'done',
    unknowns: 'none',
    nextStep: 'next',
    id: 'review-1',
    reviewedAt: '2026-05-26T09:53:30.124Z',
  },
  completionReviews: [
    {
      status: 'done',
      percent: 100,
      summary: 'done',
      unknowns: 'none',
      nextStep: 'next',
      id: 'review-1',
      reviewedAt: '2026-05-26T09:53:30.124Z',
    },
  ],
};

const cleanedTask = deleteReviewFromTask(baseTask, 'review-1');

assert.equal(cleanedTask.completed, false);
assert.equal(cleanedTask.completedAt, undefined);
assert.equal(cleanedTask.completionReview, undefined);
assert.equal(cleanedTask.completionReviews, undefined);

const taskWithTwoReviews = deleteReviewFromTask(
  {
    ...baseTask,
    completionReviews: [
      baseTask.completionReviews![0],
      {
        ...baseTask.completionReviews![0],
        id: 'review-2',
        reviewedAt: '2026-05-26T10:00:00.000Z',
      },
    ],
  },
  'review-1',
);

assert.equal(taskWithTwoReviews.completed, true);
assert.equal(taskWithTwoReviews.completedAt, '2026-05-26T09:53:30.124Z');
assert.equal(taskWithTwoReviews.completionReview?.id, 'review-2');
assert.deepEqual(taskWithTwoReviews.completionReviews?.map((review) => review.id), ['review-2']);

console.log('delete review behavior verified');
