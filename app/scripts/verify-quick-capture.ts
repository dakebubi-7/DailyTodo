import assert from 'node:assert/strict';
import { parseQuickCapture } from '../shared/quickCapture';

const first = parseQuickCapture('明天 写周报 !高 #工作');
assert.equal(first.title, '写周报');
assert.equal(first.dateIntent?.kind, 'tomorrow');
assert.equal(first.priority, 'high');
assert.equal(first.sourceLabel, '工作');
assert.deepEqual(first.tags, []);
assert.deepEqual(first.warnings, []);

const second = parseQuickCapture('今天 整理 DailyTodo !中');
assert.equal(second.title, '整理 DailyTodo');
assert.equal(second.dateIntent?.kind, 'today');
assert.equal(second.priority, 'medium');
assert.equal(second.sourceLabel, undefined);

const third = parseQuickCapture('写点东西 !高 !低');
assert.equal(third.title, '写点东西');
assert.equal(third.priority, 'low');
assert.deepEqual(third.warnings, []);

const fourth = parseQuickCapture('#工作 !高');
assert.equal(fourth.title, '');
assert.equal(fourth.priority, 'high');
assert.equal(fourth.sourceLabel, '工作');
assert.deepEqual(fourth.warnings, ['请输入任务内容']);

const fifth = parseQuickCapture('周五 20:00 复盘 @AI');
assert.equal(fifth.title, '复盘');
assert.equal(fifth.dateIntent?.kind, 'weekday');
assert.equal(fifth.dateIntent?.weekday, 5);
assert.equal(fifth.timeIntent, '20:00');
assert.deepEqual(fifth.tags, ['AI']);

console.log('verify-quick-capture passed');
