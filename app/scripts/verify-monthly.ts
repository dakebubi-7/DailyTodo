import { strict as assert } from 'node:assert';
import { monthKey, monthRange, buildMonthlyMessages, selectMonthlySources } from '../shared/aiReview/monthly';

assert.equal(monthKey('2026-06-07'), '2026-06');

const r = monthRange('2026-06');
assert.equal(r.first, '2026-06-01');
assert.equal(r.last, '2026-06-30', '6 月 30 天');
assert.equal(monthRange('2026-02').last, '2026-02-28', '2026 平年二月 28 天');
assert.equal(monthRange('2024-02').last, '2024-02-29', '2024 闰年二月 29 天');

const messages = buildMonthlyMessages({
  month: '2026-06',
  sources: [
    { label: '2026-W23 周报', content: '第一周做了 A' },
    { label: '2026-W24 周报', content: '第二周做了 B' },
  ],
  stats: { start: '2026-06-01', end: '2026-06-30', activeDays: 10, totalCompleted: 20, totalTasks: 25, streak: 3 },
});
assert.equal(messages[0].role, 'system');
assert.ok(messages[1].content.includes('2026-06'));
assert.ok(messages[1].content.includes('第一周做了 A'));
assert.ok(messages[1].content.includes('2026-W23 周报'), '来源 label 进入 prompt');
assert.ok(messages[1].content.includes('20/25'));
assert.ok(messages[1].content.includes('活跃天数') && messages[1].content.includes('10'));
assert.ok(messages[0].content.includes('这个月在忙什么') && messages[0].content.includes('下月核心目标'), '默认 system prompt = 个人月报模板');
assert.ok(!messages[0].content.includes('对外'), '个人月报模板不含对外段');

// systemPrompt 覆盖
const custom = buildMonthlyMessages({
  month: '2026-06', sources: [],
  stats: { start: '2026-06-01', end: '2026-06-30', activeDays: 0, totalCompleted: 0, totalTasks: 0, streak: 0 },
  systemPrompt: '我的月报格式：成果/复盘/规划',
});
assert.ok(custom[0].content.includes('我的月报格式'), '自定义月报模板覆盖');
assert.ok(!custom[0].content.includes('下月核心目标'), '覆盖后不含默认模板');

// === 月报输入选择：周报优先，回落日报 ===
const weekly = [{ label: 'W23 周报', content: '周报内容' }];
const daily = [{ label: '06-01 日报', content: '日报内容' }];
assert.deepEqual(selectMonthlySources(weekly, daily), weekly, '有周报 → 只用周报');
assert.deepEqual(selectMonthlySources([], daily), daily, '没周报 → 回落日报');
assert.deepEqual(
  selectMonthlySources([{ label: 'W', content: '   ' }], daily),
  daily,
  '周报全是空白 → 回落日报',
);
assert.deepEqual(selectMonthlySources([], []), [], '都没有 → 空');

console.log('Monthly verification passed');
