import {
  readObsidianSyncInput,
  type ObsidianSyncTask,
} from './obsidianSyncValidation';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const tasks: ObsidianSyncTask[] = [{
  id: 'task-1',
  text: 'Sync this task',
  completed: false,
  priority: 'medium',
  createdAt: '2026-07-13T08:00:00.000Z',
}];

const valid = readObsidianSyncInput(tasks, '2026-07-13', 'Work note', 'Inspiration');
assert(valid.ok, 'a valid sync payload should be accepted.');
if (valid.ok) {
  assert(valid.value.tasks === tasks, 'a valid task array should retain its narrowed value.');
  assert(valid.value.date === '2026-07-13', 'a valid date should retain its value.');
}

const invalidTasks = readObsidianSyncInput('not-an-array', undefined, '', '');
assert(!invalidTasks.ok && invalidTasks.error === 'Obsidian sync tasks input must be an array.', 'non-array tasks should have a stable validation error.');

const invalidDate = readObsidianSyncInput(tasks, 13, '', '');
assert(!invalidDate.ok && invalidDate.error === 'Obsidian sync selected date input must be a string.', 'non-string dates should have a stable validation error.');

const invalidNotes = readObsidianSyncInput(tasks, undefined, 42, '');
assert(!invalidNotes.ok && invalidNotes.error === 'Obsidian sync dailyWork and inspiration inputs must be strings.', 'non-string note fields should have a stable validation error.');

console.log('obsidianSyncValidation.verify: all assertions passed');
