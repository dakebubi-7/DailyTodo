import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildReviewDateGroups } from '../src/components/reviewView/reviewGrouping';
import type { Task } from '../src/types/task';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'src')) ? cwd : join(cwd, 'app');
const source = readFileSync(join(root, 'src/components/reviewView/reviewGrouping.ts'), 'utf8');

function task(id: string, reviewedAt: string): Task {
  return {
    id,
    text: id,
    completed: true,
    priority: 'medium',
    source: 'personal',
    createdAt: '2026-06-12T08:00:00.000Z',
    taskDate: '2026-06-12',
    isToday: true,
    completionReviews: [{
      id: `${id}-${reviewedAt}`,
      status: 'done',
      percent: 100,
      reviewedAt,
    }],
  };
}

const groups = buildReviewDateGroups([
  task('older', '2026-06-11T08:00:00.000Z'),
  task('latest', '2026-06-12T10:00:00.000Z'),
  task('same-task', '2026-06-12T09:00:00.000Z'),
  task('same-task', '2026-06-12T11:00:00.000Z'),
]);

assert.deepEqual(
  groups.map(({ date, taskGroups }) => [date, taskGroups.map(({ task: groupTask, records }) => [groupTask.id, records.map((record) => record.timestamp)])]),
  [
    ['2026-06-12', [['same-task', ['2026-06-12T11:00:00.000Z', '2026-06-12T09:00:00.000Z']], ['latest', ['2026-06-12T10:00:00.000Z']]]],
    ['2026-06-11', [['older', ['2026-06-11T08:00:00.000Z']]]],
  ],
  'Review groups should keep dates, task groups, and each task record ordered newest first.',
);

assert.match(
  source,
  /const dateTaskGroups = new Map<string, Map<string, ReviewRecord\[\]>>\(\);/,
  'Review grouping should place records directly into date/task buckets.',
);
assert.doesNotMatch(
  source,
  /const dayRecords = byDate\.get\(date\)!\.sort/,
  'Review grouping should not sort each date record list before creating task buckets.',
);

console.log('review grouping state verified');
