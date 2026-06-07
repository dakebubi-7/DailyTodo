import { strict as assert } from 'node:assert';
import { isoWeekKey, buildWeeklyMessages } from '../shared/aiReview/weekly';

// 2026-06-07 是周日；本周从 2026-06-01（周一）起。
assert.equal(isoWeekKey('2026-06-07'), '2026-W23');
assert.equal(isoWeekKey('2026-06-01'), '2026-W23', '同周的周一');

const messages = buildWeeklyMessages({
  weekKey: '2026-W23',
  dailyContents: [
    { date: '2026-06-01', content: '周一做了 A' },
    { date: '2026-06-07', content: '周日做了 B' },
  ],
  stats: { start: '2026-06-01', end: '2026-06-07', activeDays: 2, totalCompleted: 5, totalTasks: 8, streak: 1 },
});
assert.equal(messages[0].role, 'system');
assert.equal(messages[1].role, 'user');
assert.ok(messages[1].content.includes('2026-W23'));
assert.ok(messages[1].content.includes('周一做了 A'));
assert.ok(messages[1].content.includes('活跃天数') && messages[1].content.includes('2'));
assert.ok(messages[1].content.includes('5/8'), '完成任务统计注入');

console.log('Weekly verification passed');
