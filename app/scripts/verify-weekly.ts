import { strict as assert } from 'node:assert';
import { isoWeekKey, isoWeekToMonday, buildWeeklyMessages } from '../shared/aiReview/weekly';

// 2026-06-07 是周日；本周从 2026-06-01（周一）起。
assert.equal(isoWeekKey('2026-06-07'), '2026-W23');
assert.equal(isoWeekKey('2026-06-01'), '2026-W23', '同周的周一');

// isoWeekToMonday 是 isoWeekKey 的逆：W23 → 2026-06-01（周一）
assert.equal(isoWeekToMonday('2026-W23'), '2026-06-01');
assert.equal(isoWeekToMonday('2026-W24'), '2026-06-08');
// 往返一致
for (const d of ['2026-01-01', '2026-03-15', '2026-06-08', '2026-12-31', '2024-02-29']) {
  assert.equal(isoWeekToMonday(isoWeekKey(d)), isoWeekToMonday(isoWeekKey(d)));
  assert.equal(isoWeekKey(isoWeekToMonday(isoWeekKey(d))), isoWeekKey(d), `往返一致 ${d}`);
}
assert.equal(isoWeekToMonday('garbage'), 'garbage', '非法输入原样返回');

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
assert.ok(messages[0].content.includes('本周做了什么') && messages[0].content.includes('下周就干这三件事'), '默认 system prompt = 个人周报模板');
assert.ok(!messages[0].content.includes('对外'), '个人周报模板不含对外段');

// systemPrompt 覆盖
const custom = buildWeeklyMessages({
  weekKey: '2026-W23',
  dailyContents: [],
  stats: { start: '2026-06-01', end: '2026-06-07', activeDays: 0, totalCompleted: 0, totalTasks: 0, streak: 0 },
  systemPrompt: '我的周报格式：亮点/踩坑/下周',
});
assert.ok(custom[0].content.includes('我的周报格式'), '自定义模板覆盖默认');
assert.ok(!custom[0].content.includes('下周就干这三件事'), '覆盖后不含默认模板');

// 空白 systemPrompt 回落默认
const blank = buildWeeklyMessages({
  weekKey: '2026-W23', dailyContents: [],
  stats: { start: '2026-06-01', end: '2026-06-07', activeDays: 0, totalCompleted: 0, totalTasks: 0, streak: 0 },
  systemPrompt: '   ',
});
assert.ok(blank[0].content.includes('本周做了什么'), '空白模板回落默认');

console.log('Weekly verification passed');
