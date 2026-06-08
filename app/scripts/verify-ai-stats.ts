import { strict as assert } from 'node:assert';
import { computeDailyStats, computeRangeStats, StatTask } from '../shared/aiReview/stats';

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
