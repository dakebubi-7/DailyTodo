import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeDailyStats, computeRangeStats, StatTask } from '../shared/aiReview/stats';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const statsSource = readFileSync(join(root, 'shared/aiReview/stats.ts'), 'utf8');

assert.match(statsSource, /import \{ getTaskDate, shiftDateKey \} from ['"]\.\.\/taskRollover['"];/, 'AI stats should reuse the shared task-date resolver.');
assert.doesNotMatch(
  statsSource,
  /task\.taskDate \|\| task\.createdAt\?\.slice\(0,\s*10\) \|\|/,
  'AI stats should not keep a local task-date fallback chain.',
);
assert.match(
  statsSource,
  /for \(const task of tasks\)/,
  'AI stats should aggregate daily and range values during a single task traversal.',
);
assert.doesNotMatch(
  statsSource,
  /const ofDay = tasks\.filter|const inRange = tasks\.filter/,
  'AI stats should not allocate filtered task arrays before aggregating report statistics.',
);

const tasks: StatTask[] = [
  { completed: true, taskDate: '2026-06-07' },
  { completed: false, taskDate: '2026-06-07' },
  { completed: true, taskDate: '2026-06-06' },
];

const day = computeDailyStats(tasks, '2026-06-07');
assert.equal(day.total, 2);
assert.equal(day.completed, 1);
assert.equal(day.completionRate, 50);

// 范围统计：活跃天数 = 有任务的不同日期数；连续天数 = 截至 endDate 的连续活跃
const range = computeRangeStats(tasks, '2026-06-01', '2026-06-07');
assert.equal(range.activeDays, 2);
assert.equal(range.totalCompleted, 2);
assert.equal(range.streak, 2, '06-06 与 06-07 连续');

// 空数据不崩
const empty = computeDailyStats([], '2026-06-07');
assert.equal(empty.total, 0);
assert.equal(empty.completionRate, 0);

console.log('AI stats verification passed');
