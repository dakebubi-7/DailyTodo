import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isDateKey } from '../shared/taskRollover';
import {
  getTaskDate,
  getTaskVisibleDates,
  normalizeScheduledDates,
  normalizeTask,
  parseStoredTasks,
  taskAppliesToDate,
  taskMatchesDate,
} from '../src/hooks/taskTransforms';
import { clearCompletedTasks } from '../src/hooks/taskMutations';
import type { Task } from '../src/types/task';

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    text: id,
    completed: false,
    priority: 'medium',
    source: 'personal',
    createdAt: '2026-07-01T01:00:00.000Z',
    taskDate: '2026-07-01',
    isToday: false,
    ...overrides,
  };
}

assert.equal(isDateKey('2026-07-03'), true);
assert.equal(isDateKey('2026-7-3'), false);
assert.equal(isDateKey('2026-02-30'), false);
assert.equal(isDateKey('not-a-date'), false);

assert.deepEqual(
  normalizeScheduledDates(['2026-07-03', 'bad', '2026-07-01', '2026-07-03', '2026-02-30'], '2026-07-01'),
  ['2026-07-03'],
  'scheduledDates should normalize to valid, unique, sorted extra dates and exclude the primary task date.',
);
assert.equal(normalizeScheduledDates(undefined, '2026-07-01'), undefined);
assert.equal(normalizeScheduledDates([], '2026-07-01'), undefined);

const visible = task('visible', {
  taskDate: '2026-07-01',
  scheduledDates: ['2026-07-03', '2026-07-02', '2026-07-03', 'bad'],
});
assert.deepEqual(
  getTaskVisibleDates(visible, '2026-07-09'),
  ['2026-07-01', '2026-07-02', '2026-07-03'],
  'getTaskVisibleDates should include the primary date plus normalized scheduled dates.',
);
assert.equal(taskAppliesToDate(visible, '2026-07-01', '2026-07-09'), true);
assert.equal(taskAppliesToDate(visible, '2026-07-02', '2026-07-09'), true);
assert.equal(taskAppliesToDate(visible, '2026-07-04', '2026-07-09'), false);
assert.equal(taskMatchesDate(visible, '2026-07-02', '2026-07-09'), true);
assert.equal(
  taskAppliesToDate({ ...visible, scheduledDates: ['invalid-date', '2026-07-01'] }, 'invalid-date', '2026-07-09'),
  false,
  'date matching should continue ignoring malformed scheduled dates',
);

const normalized = normalizeTask(task('normalize', {
  taskDate: '2026-07-01',
  scheduledDates: ['2026-07-03', '2026-07-01', 'bad', '2026-07-02', '2026-07-03'],
  subtasks: [task('normalize-subtask', {
    taskDate: '2026-07-01',
    scheduledDates: ['2026-07-02', 'bad', '2026-07-01', '2026-07-02'],
  })],
}), '2026-07-02');
assert.deepEqual(normalized.scheduledDates, ['2026-07-02', '2026-07-03']);
assert.deepEqual(normalized.subtasks?.[0]?.scheduledDates, ['2026-07-02']);
assert.equal(normalized.taskDate, '2026-07-01');
assert.equal(normalized.isToday, false, 'isToday should remain based on the primary task date, not scheduled visibility.');

const parsed = parseStoredTasks([
  task('stored', {
    taskDate: '2026-07-01',
    scheduledDates: ['2026-07-03', 'bad', '2026-07-03', '2026-07-01'],
  }),
]);
assert.deepEqual(parsed[0]?.scheduledDates, ['2026-07-03']);

const cleared = clearCompletedTasks([
  task('completed-scheduled', {
    completed: true,
    taskDate: '2026-07-01',
    scheduledDates: ['2026-07-04'],
  }),
], '2026-07-04', '2026-07-04');
assert.equal(cleared[0]?.cleared, true, 'clearCompleted remains task-level and hides the whole task when cleared on a scheduled date.');

const taskTypes = readFileSync(join(process.cwd(), 'src/types/task.ts'), 'utf8');
const taskTransforms = readFileSync(join(process.cwd(), 'src/hooks/taskTransforms.ts'), 'utf8');
const taskRollover = readFileSync(join(process.cwd(), 'shared/taskRollover.ts'), 'utf8');

assert(taskTypes.includes('scheduledDates?: string[];'), 'Task should keep optional scheduledDates for backward compatibility.');
assert(taskTypes.includes('extra visible/planned dates'), 'Task type should document scheduledDates as extra dates, not instances.');
assert(taskTransforms.includes('export function getTaskVisibleDates'), 'taskTransforms should export getTaskVisibleDates.');
assert(taskTransforms.includes('export function taskAppliesToDate'), 'taskTransforms should export taskAppliesToDate.');
assert(
  !taskTransforms.includes('return getTaskVisibleDates(task, fallbackDate).includes(date);'),
  'date matching should avoid allocating and sorting a visible-date list for every lookup',
);
assert.match(
  taskTransforms,
  /export\s*\{[^}]*normalizeScheduledDates[^}]*\}/s,
  'taskTransforms should retain normalizeScheduledDates as a compatibility export.',
);
assert(taskTransforms.includes('taskMatchesDate'), 'taskMatchesDate should remain as a compatibility alias for existing consumers.');
assert(taskRollover.includes('export function isDateKey'), 'taskRollover should provide a shared date-key validator.');
assert.equal(getTaskDate(task('date'), '2026-07-09'), '2026-07-01');

const taskSelectors = readFileSync(join(process.cwd(), 'src/hooks/taskSelectors.ts'), 'utf8');
const taskCarryover = readFileSync(join(process.cwd(), 'src/hooks/taskCarryover.ts'), 'utf8');
assert(
  !taskSelectors.includes('getTaskVisibleDates'),
  'This first batch should not modify taskSelectors.ts without explicit scope approval.',
);
assert(
  !taskCarryover.includes('taskAppliesToDate'),
  'This first batch should not modify taskCarryover.ts without explicit scope approval.',
);

console.log('task scheduledDates contract verification passed');
