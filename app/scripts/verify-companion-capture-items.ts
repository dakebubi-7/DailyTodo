import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCaptureItems } from '../src/store/taskStore';
import type { Task } from '../src/types/task';

const task = (id: string, taskDate: string): Task => ({
  id,
  text: id,
  completed: false,
  priority: 'medium',
  source: 'personal',
  createdAt: '2026-07-05T01:00:00.000Z',
  taskDate,
  isToday: taskDate === '2026-07-05',
});

const items = buildCaptureItems(
  [task('selected-first', '2026-07-05'), task('other-date', '2026-07-04'), task('selected-last', '2026-07-05')],
  '2026-07-05',
  'Work note',
  'Inspiration note',
);

assert.deepEqual(items.map((item) => item.id), [
  'task-selected-first',
  'task-selected-last',
  'work-2026-07-05',
  'inspiration-2026-07-05',
]);

const companionCaptureItems = readFileSync('src/store/companionCaptureItems.ts', 'utf8');
assert.ok(
  !companionCaptureItems.includes('.filter((task) => getTaskDate(task, \'\') === selectedDate)\n    .map<CaptureItem>'),
  'buildCaptureItems should build matching task capture items in one pass without an intermediate filtered task array',
);

console.log('Companion capture-item verification passed');
