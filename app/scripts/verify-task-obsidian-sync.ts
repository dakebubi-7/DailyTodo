import assert from 'node:assert/strict';
import {
  buildObsidianSyncTasks,
  buildSelectedDailyNoteSyncInput,
} from '../src/hooks/taskObsidianSync';
import type { Task } from '../src/types/task';

const task: Task = {
  id: 'task-1',
  text: 'Write sync helper',
  completed: false,
  priority: 'medium',
  source: 'personal',
  createdAt: '2026-07-05T01:00:00.000Z',
  taskDate: '2026-07-05',
  isToday: true,
};

const syncInput = buildSelectedDailyNoteSyncInput({
  tasks: [task],
  selectedDate: '2026-07-05',
  dailyWorkNotes: {
    '2026-07-05': 'Focused implementation',
    '2026-07-04': 'Previous note',
  },
  dailyInspirationNotes: {},
});

assert.deepEqual(syncInput, {
  tasks: [task],
  selectedDate: '2026-07-05',
  dailyWork: 'Focused implementation',
  dailyInspiration: '',
});

const retainedReviewTasks = buildObsidianSyncTasks({
  allTasks: [task],
  retainedObsidianReviews: [
    {
      task,
      review: {
        id: 'review-1',
        status: 'done',
        percent: 100,
        summary: 'Done',
        unknowns: '',
        nextStep: '',
        reviewedAt: '2026-07-05T02:00:00.000Z',
      },
      deletedAt: '2026-07-05T03:00:00.000Z',
    },
  ],
  syncDeletedReviewsToObsidian: false,
});

assert.equal(retainedReviewTasks[0].completionReviews?.[0].id, 'review-1');

console.log('task obsidian sync verification passed');
