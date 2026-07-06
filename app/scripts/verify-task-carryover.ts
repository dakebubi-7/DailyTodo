import assert from 'node:assert/strict';
import { createDefaultAppSettings } from '../shared/appSettings';
import { applyBusinessDateCarryover } from '../src/hooks/taskCarryover';
import type { Task } from '../src/types/task';

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    text: id,
    completed: false,
    priority: 'medium',
    source: 'personal',
    createdAt: '2026-07-05T01:00:00.000Z',
    taskDate: '2026-07-05',
    isToday: false,
    ...overrides,
  };
}

const settings = {
  ...createDefaultAppSettings(),
  autoCarryForward: true,
};

const rolloverResult = applyBusinessDateCarryover({
  tasks: [
    task('unfinished-yesterday'),
    task('partial-yesterday', {
      completed: true,
      completionReview: {
        status: 'partial',
        percent: 80,
        summary: 'Almost there',
        unknowns: '',
        nextStep: 'Finish it',
        reviewedAt: '2026-07-05T09:00:00.000Z',
      },
    }),
    task('done-yesterday', {
      completed: true,
      completionReview: {
        status: 'done',
        percent: 100,
        summary: 'Done',
        unknowns: '',
        nextStep: '',
        reviewedAt: '2026-07-05T10:00:00.000Z',
      },
    }),
    task('legacy-created-at-only', {
      taskDate: undefined,
      createdAt: '2026-07-06T01:00:00.000Z',
      isToday: false,
    }),
  ],
  targetDate: '2026-07-06',
  ledger: {},
  settings,
});

assert.deepEqual(rolloverResult.ledger['2026-07-06'], ['unfinished-yesterday', 'partial-yesterday']);

const carriedFromYesterday = rolloverResult.tasks.filter((candidate) => candidate.carriedFromDate === '2026-07-05');
assert.equal(carriedFromYesterday.length, 2);
assert.deepEqual(
  carriedFromYesterday.map((candidate) => candidate.carriedFromTaskId).sort(),
  ['partial-yesterday', 'unfinished-yesterday'],
);
assert.equal(carriedFromYesterday.every((candidate) => candidate.taskDate === '2026-07-06'), true);
assert.equal(carriedFromYesterday.every((candidate) => candidate.completed === false), true);
assert.equal(carriedFromYesterday.every((candidate) => candidate.isToday === true), true);

assert.equal(
  rolloverResult.tasks.find((candidate) => candidate.id === 'legacy-created-at-only')?.taskDate,
  '2026-07-06',
);
assert.equal(
  rolloverResult.tasks.find((candidate) => candidate.id === 'legacy-created-at-only')?.isToday,
  true,
);

const repeatedResult = applyBusinessDateCarryover({
  tasks: rolloverResult.tasks,
  targetDate: '2026-07-06',
  ledger: rolloverResult.ledger,
  settings,
});

assert.equal(
  repeatedResult.tasks.filter((candidate) => candidate.carriedFromTaskId === 'unfinished-yesterday').length,
  1,
);

const disabledResult = applyBusinessDateCarryover({
  tasks: [task('disabled-yesterday')],
  targetDate: '2026-07-06',
  ledger: {},
  settings: {
    ...settings,
    autoCarryForward: false,
  },
});

assert.deepEqual(disabledResult.ledger, {});
assert.equal(disabledResult.tasks.length, 1);
assert.equal(disabledResult.tasks[0].isToday, false);

console.log('task carryover verification passed');
