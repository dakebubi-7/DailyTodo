import assert from 'node:assert/strict';
import {
  buildWidgetSummary,
  getTodayDateKey,
  normalizeQuickAddText,
  shiftWidgetDate,
} from '../src/widgetModel';
import { Task } from '../src/types/task';

const tasks: Task[] = [
  { id: '1', text: 'Write report', completed: false, priority: 'high', createdAt: '2026-06-07T08:00:00.000Z', taskDate: '2026-06-07', isToday: true },
  { id: '2', text: 'Review widget design', completed: false, priority: 'medium', createdAt: '2026-06-07T09:00:00.000Z', taskDate: '2026-06-07', isToday: true },
  { id: '3', text: 'Plan tomorrow', completed: false, priority: 'low', createdAt: '2026-06-07T10:00:00.000Z', taskDate: '2026-06-07', isToday: true },
  { id: '4', text: 'Read notes', completed: false, priority: 'medium', createdAt: '2026-06-07T11:00:00.000Z', taskDate: '2026-06-07', isToday: true },
  { id: '5', text: 'Done task', completed: true, priority: 'medium', createdAt: '2026-06-07T12:00:00.000Z', taskDate: '2026-06-07', isToday: true },
  { id: '6', text: 'Yesterday task', completed: false, priority: 'medium', createdAt: '2026-06-06T12:00:00.000Z', taskDate: '2026-06-06', isToday: false },
  { id: '7', text: 'Cleared task', completed: false, priority: 'medium', createdAt: '2026-06-07T13:00:00.000Z', taskDate: '2026-06-07', isToday: true, cleared: true },
];

const summary = buildWidgetSummary(tasks, '2026-06-07');
assert.equal(summary.totalCount, 5);
assert.equal(summary.completedCount, 1);
assert.equal(summary.percent, 20);
assert.deepEqual(summary.visibleTasks.map((task) => task.id), ['1', '2', '3']);
assert.equal(summary.remainingUnfinishedCount, 1);

const emptySummary = buildWidgetSummary(tasks, '2026-06-08');
assert.equal(emptySummary.totalCount, 0);
assert.equal(emptySummary.completedCount, 0);
assert.equal(emptySummary.percent, 0);
assert.equal(emptySummary.visibleTasks.length, 0);
assert.equal(emptySummary.remainingUnfinishedCount, 0);

assert.equal(shiftWidgetDate('2026-06-07', -1), '2026-06-06');
assert.equal(shiftWidgetDate('2026-06-07', 1), '2026-06-08');
assert.equal(normalizeQuickAddText('  ship widget  '), 'ship widget');
assert.equal(normalizeQuickAddText('   '), '');
assert.match(getTodayDateKey(), /^\d{4}-\d{2}-\d{2}$/);

console.log('widget-model verification passed');
