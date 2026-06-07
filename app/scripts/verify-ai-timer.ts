import { strict as assert } from 'node:assert';
import { getNextTimerDelay } from '../shared/aiReview/timer';

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

console.log('AI timer verification passed');
