import { strict as assert } from 'node:assert';
import { getNextTimerDelay, getNextWeeklyDelay, getNextMonthlyDelay } from '../shared/aiReview/timer';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const now = new Date('2026-06-07T22:00:00');
const delay = getNextTimerDelay(now, '23:00');
assert.equal(delay, 60 * 60 * 1000, '22:00 → 23:00 是 1 小时');

const pastNoon = new Date('2026-06-07T23:30:00');
const nextDay = getNextTimerDelay(pastNoon, '23:00');
assert.ok(nextDay > 23 * 60 * 60 * 1000, '已过点 → 顺延到次日');

// 非法时间回落 23:00
const badTime = getNextTimerDelay(new Date('2026-06-07T22:00:00'), '99:99');
assert.equal(badTime, 60 * 60 * 1000, '非法时间 → 默认 23:00');

// 永远返回正值（最小 1 秒）
assert.ok(getNextTimerDelay(new Date('2026-06-07T23:00:00'), '23:00') >= 1000, '恰好到点 → 顺延次日，正值');

// === 周报定时 ===
// 2026-06-07 是周日(getDay=0)。下一个周一(1) 09:00。
const sun = new Date('2026-06-07T10:00:00');
assert.equal(getNextWeeklyDelay(sun, 1, '09:00'), 23 * HOUR, '周日10点 → 次日(周一)09点 = 23 小时');
// 当天就是目标星期几但已过点 → 顺延下周
const monLate = new Date('2026-06-08T10:00:00'); // 周一
assert.equal(getNextWeeklyDelay(monLate, 1, '09:00'), 7 * DAY - HOUR, '周一已过点 → 下周一');
// 当天是目标星期几且未到点 → 当天
const monEarly = new Date('2026-06-08T08:00:00');
assert.equal(getNextWeeklyDelay(monEarly, 1, '09:00'), HOUR, '周一未到点 → 当天09点');

// === 月报定时 ===
// 6/7 → 下个 1 号(7/1) 09:00
const midMonth = new Date('2026-06-07T10:00:00');
const toJul1 = getNextMonthlyDelay(midMonth, 1, '09:00');
assert.equal(new Date(midMonth.getTime() + toJul1).getDate(), 1, '落在 1 号');
assert.equal(new Date(midMonth.getTime() + toJul1).getMonth(), 6, '落在 7 月(月份索引6)');
// 当月 1 号未到点 → 当天
const firstEarly = new Date('2026-06-01T08:00:00');
assert.equal(getNextMonthlyDelay(firstEarly, 1, '09:00'), HOUR, '1号未到点 → 当天');
// 31 号在 2 月不存在 → 落到当月最后一天
const feb = new Date('2026-02-10T10:00:00');
const toEnd = getNextMonthlyDelay(feb, 31, '09:00');
assert.equal(new Date(feb.getTime() + toEnd).getDate(), 28, '2026年2月无31号 → 落到28号');

console.log('AI timer verification passed');
