import { strict as assert } from 'node:assert';
import { monthKey, monthRange, buildMonthlyMessages } from '../shared/aiReview/monthly';

assert.equal(monthKey('2026-06-07'), '2026-06');

const r = monthRange('2026-06');
assert.equal(r.first, '2026-06-01');
assert.equal(r.last, '2026-06-30', '6 月 30 天');
assert.equal(monthRange('2026-02').last, '2026-02-28', '2026 平年二月 28 天');
assert.equal(monthRange('2024-02').last, '2024-02-29', '2024 闰年二月 29 天');

const messages = buildMonthlyMessages({
  month: '2026-06',
  weeklyHighlights: ['第一周做了 A', '第二周做了 B'],
  stats: { start: '2026-06-01', end: '2026-06-30', activeDays: 10, totalCompleted: 20, totalTasks: 25, streak: 3 },
});
assert.equal(messages[0].role, 'system');
assert.ok(messages[1].content.includes('2026-06'));
assert.ok(messages[1].content.includes('第一周做了 A'));
assert.ok(messages[1].content.includes('20/25'));
assert.ok(messages[1].content.includes('活跃天数') && messages[1].content.includes('10'));
assert.ok(messages[0].content.includes('月报助手'), '默认 system prompt');

// systemPrompt 覆盖
const custom = buildMonthlyMessages({
  month: '2026-06', weeklyHighlights: [],
  stats: { start: '2026-06-01', end: '2026-06-30', activeDays: 0, totalCompleted: 0, totalTasks: 0, streak: 0 },
  systemPrompt: '我的月报格式：成果/复盘/规划',
});
assert.ok(custom[0].content.includes('我的月报格式'), '自定义月报模板覆盖');
assert.ok(!custom[0].content.includes('月报助手'), '覆盖后不含默认句');

console.log('Monthly verification passed');
