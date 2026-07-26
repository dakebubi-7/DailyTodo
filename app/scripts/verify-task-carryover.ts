import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

const subtaskSource = task('subtask-source', {
  text: 'Subtask source',
  subtasks: [
    task('completed-subtask', {
      completed: true,
      parentTaskId: 'subtask-source',
      completionReview: {
        status: 'done',
        percent: 100,
        summary: 'Done',
        unknowns: '',
        nextStep: '',
        reviewedAt: '2026-07-05T10:00:00.000Z',
      },
    }),
    task('open-subtask', { parentTaskId: 'subtask-source' }),
  ],
});
const subtaskCarryoverResult = applyBusinessDateCarryover({
  tasks: [subtaskSource],
  targetDate: '2026-07-06',
  ledger: {},
  settings,
});
const carriedSubtaskParent = subtaskCarryoverResult.tasks.find((candidate) => candidate.carriedFromTaskId === 'subtask-source');
assert.equal(carriedSubtaskParent?.text, 'Subtask source');
assert.deepEqual(carriedSubtaskParent?.subtaskCarryoverProgress, { total: 2, remaining: 1 });
assert.equal(carriedSubtaskParent?.subtasks?.length, 1);
assert.equal(carriedSubtaskParent?.subtasks?.[0]?.text, 'open-subtask');
assert.equal(carriedSubtaskParent?.subtasks?.[0]?.completed, false);
assert.equal(carriedSubtaskParent?.subtasks?.[0]?.parentTaskId, carriedSubtaskParent?.id);
assert.notEqual(carriedSubtaskParent?.subtasks?.[0]?.id, 'open-subtask');

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

const unorderedExistingCarryoverResult = applyBusinessDateCarryover({
  tasks: [
    task('unfinished-before-existing-carryover'),
    task('existing-carryover', {
      taskDate: '2026-07-06',
      isToday: true,
      carriedFromTaskId: 'unfinished-before-existing-carryover',
      carriedFromDate: '2026-07-05',
    }),
  ],
  targetDate: '2026-07-06',
  ledger: {},
  settings,
});

assert.equal(
  unorderedExistingCarryoverResult.tasks.filter((candidate) => candidate.carriedFromTaskId === 'unfinished-before-existing-carryover').length,
  1,
  'carryover should not duplicate an existing carryover when it appears later in stored task order',
);

const canonicalNoopTasks: Task[] = [{
  ...task('canonical-noop', {
    taskDate: '2026-07-06',
    isToday: true,
    scheduledDates: undefined,
    subtasks: undefined,
    completionReviews: undefined,
    completionReview: undefined,
  }),
}];
const canonicalNoopLedger = {};
const canonicalNoopResult = applyBusinessDateCarryover({
  tasks: canonicalNoopTasks,
  targetDate: '2026-07-06',
  ledger: canonicalNoopLedger,
  settings,
});
assert.equal(
  canonicalNoopResult.tasks,
  canonicalNoopTasks,
  'business-date carryover should retain the canonical task list reference when neither normalization nor carryover changes it',
);
assert.equal(
  canonicalNoopResult.ledger,
  canonicalNoopLedger,
  'business-date carryover should retain the ledger reference when no carryover is added',
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

const taskCarryoverSource = readFileSync('src/hooks/taskCarryover.ts', 'utf8');
assert.ok(
  taskCarryoverSource.includes('const carriedFromTaskIds = new Set<string>();'),
  'carryover should index existing target-date carryovers once before selecting candidates',
);
assert.ok(
  !taskCarryoverSource.includes('tasks.some((candidate) => candidate.taskDate === targetDate'),
  'carryover should not rescan the full task history for every candidate task',
);
assert.ok(
  taskCarryoverSource.includes('const candidateTasks: Task[] = [];'),
  'carryover should collect source-date candidates while indexing existing target-date carryovers.',
);
assert.ok(
  !taskCarryoverSource.includes('const inheritedTasks = tasks.filter((task) => ('),
  'carryover should not scan the full normalized task history a second time to find candidates.',
);
assert.ok(
  !taskCarryoverSource.includes('const inheritedTasks = candidateTasks.filter('),
  'carryover should avoid allocating a second inherited-task array after collecting candidates.',
);
assert.ok(
  taskCarryoverSource.includes('for (const task of candidateTasks) {'),
  'carryover should traverse collected candidates directly after its carryover index is complete.',
);
assert.ok(
  taskCarryoverSource.includes('if (carriedFromTaskIds.has(task.id)) continue;'),
  'carryover should skip candidates that already have a target-date carryover during direct construction.',
);
assert.ok(
  taskCarryoverSource.includes('const nextCarryovers: Task[] = [];') && taskCarryoverSource.includes('const nextCarriedIds: string[] = [];'),
  'carryover should build task copies and ledger ids in one candidate traversal.',
);
assert.ok(
  taskCarryoverSource.includes('function shouldCarryParentForward(task: Task)'),
  'carryover should include direct-child eligibility when deciding whether a parent needs continuation.',
);
assert.ok(
  taskCarryoverSource.includes('function buildCarryoverSubtasks(task: Task, parentTaskId: string, targetDate: string, createdAt: string)'),
  'carryover should construct fresh direct subtask copies in a focused helper.',
);
assert.ok(
  taskCarryoverSource.includes('text: task.text,'),
  'carryover should preserve a clean parent title rather than appending provenance into task text.',
);
assert.ok(
  !taskCarryoverSource.includes('const suffix ='),
  'carryover should not generate legacy inherited-from title suffixes for new tasks.',
);
assert.ok(
  !taskCarryoverSource.includes('const normalizedTasks = tasks.map((task) => normalizeTask(task, targetDate));'),
  'business-date carryover should not allocate a normalized task list before it knows a task changed.',
);
assert.ok(
  taskCarryoverSource.includes('let normalizedTasks = tasks;'),
  'business-date carryover should reuse the incoming task list until normalization changes a task.',
);
assert.ok(
  taskCarryoverSource.includes('tasks: carryoverResult.tasks,'),
  'business-date carryover should reuse the already-normalized task list after adding normalized carryovers',
);
assert.ok(
  !taskCarryoverSource.includes('tasks: carryoverResult.tasks.map((task) => normalizeTask(task, targetDate))'),
  'business-date carryover should not recursively normalize every task a second time after candidate selection',
);

console.log('task carryover verification passed');
