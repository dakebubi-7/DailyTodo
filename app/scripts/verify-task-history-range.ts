import assert from 'node:assert/strict';
import { createDefaultAppSettings } from '../shared/appSettings';
import { buildReviewDateGroups } from '../src/components/reviewView/reviewGrouping';
import {
  getHistoryRangeStart,
  reviewIsInHistoryRange,
  taskIsInHistoryRange,
} from '../src/hooks/taskHistoryRange';
import { selectTaskViewState } from '../src/hooks/taskSelectors';
import type { Task } from '../src/types/task';

const today = '2026-07-26';
const settings = createDefaultAppSettings();

assert.equal(getHistoryRangeStart('three-months', today), '2026-05-01');
assert.equal(getHistoryRangeStart('two-months', today), '2026-06-01');
assert.equal(getHistoryRangeStart('six-months', today), '2026-02-01');
assert.equal(getHistoryRangeStart('all', today), undefined);
assert.equal(getHistoryRangeStart('custom', today, '2026-04-15'), '2026-04-15');
assert.equal(getHistoryRangeStart('custom', today, '2026-02-30'), undefined);

assert.equal(
  taskIsInHistoryRange({ taskDate: '2026-04-30' }, settings, today),
  false,
  'tasks before the three-month boundary should be hidden from All',
);
assert.equal(
  taskIsInHistoryRange({ taskDate: '2026-05-01' }, settings, today),
  true,
  'the three-month boundary should be inclusive',
);
assert.equal(
  reviewIsInHistoryRange('2026-04-30T00:00:00.000Z', settings, today),
  false,
  'reviews before the three-month boundary should be hidden',
);
assert.equal(
  reviewIsInHistoryRange('2026-05-01T00:00:00.000Z', settings, today),
  true,
  'the review boundary should be inclusive',
);

const oldTask: Task = {
  id: 'old-task',
  text: 'Old task',
  completed: true,
  priority: 'medium',
  createdAt: '2026-04-30T09:00:00.000Z',
  taskDate: '2026-04-30',
  isToday: false,
  completionReview: {
    id: 'old-review',
    status: 'done',
    percent: 100,
    summary: '',
    unknowns: '',
    nextStep: '',
    reviewedAt: '2026-04-30T09:00:00.000Z',
  },
};
const boundaryTask: Task = {
  ...oldTask,
  id: 'boundary-task',
  text: 'Boundary task',
  createdAt: '2026-05-01T09:00:00.000Z',
  taskDate: '2026-05-01',
  completionReview: {
    ...oldTask.completionReview!,
    id: 'boundary-review',
    reviewedAt: '2026-05-01T09:00:00.000Z',
  },
};

const allView = selectTaskViewState({
  allTasks: [oldTask, boundaryTask],
  activeTab: 'all',
  appSettings: settings,
  priorityFilter: 'all',
  currentDate: today,
  selectedDate: today,
  taskListOrderByDate: {},
});
assert.deepEqual(
  allView.sortedTasks.map((task) => task.id),
  ['boundary-task'],
  'All should only include tasks inside the configured history range',
);

const reviewGroups = buildReviewDateGroups(
  [oldTask, boundaryTask],
  (timestamp) => reviewIsInHistoryRange(timestamp, settings, today),
);
assert.deepEqual(
  reviewGroups.map((group) => group.date),
  ['2026-05-01'],
  'Review should only group records inside the configured history range',
);

console.log('task history range verification passed');
