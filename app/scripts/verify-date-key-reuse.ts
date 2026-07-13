import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTaskDate } from '../shared/taskRollover';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const taskRollover = readFileSync(join(root, 'shared/taskRollover.ts'), 'utf8');
const taskTransforms = readFileSync(join(root, 'src/hooks/taskTransforms.ts'), 'utf8');
const dateNavigatorUtils = readFileSync(join(root, 'src/components/dateNavigator/dateNavigatorUtils.ts'), 'utf8');
const obsidianTemplates = readFileSync(join(root, 'shared/obsidianTemplates.ts'), 'utf8');
const obsidianTemplateTaskLines = readFileSync(join(root, 'shared/obsidianTemplateTaskLines.ts'), 'utf8');
const obsidianTemplateTaskVisibility = readFileSync(join(root, 'shared/obsidianTemplateTaskVisibility.ts'), 'utf8');
const electronTaskDateHelpers = readFileSync(join(root, 'electron/taskDateHelpers.ts'), 'utf8');

assert.equal(
  getTaskDate({ taskDate: '2026-07-10', createdAt: '2026-07-01T08:00:00.000Z' }, '2026-07-12'),
  '2026-07-10',
  'shared task-date resolution should prefer an explicit task date.',
);
assert.equal(
  getTaskDate({ createdAt: '2026-07-01T08:00:00.000Z' }, '2026-07-12'),
  '2026-07-01',
  'shared task-date resolution should use the creation date when taskDate is absent.',
);
assert.equal(
  getTaskDate({ createdAt: '' }, '2026-07-12'),
  '2026-07-12',
  'shared task-date resolution should preserve the caller-provided fallback.',
);
assert.match(taskRollover, /export function getTaskDate\(task: TaskDateSource, fallbackDate: string\)/, 'taskRollover should expose the shared task-date resolver with an explicit fallback.');

for (const [name, source] of [
  ['taskTransforms', taskTransforms],
  ['dateNavigatorUtils', dateNavigatorUtils],
  ['taskDateHelpers', electronTaskDateHelpers],
] as const) {
  assert.match(source, /from ['"].*taskRollover['"]/, `${name} should reuse shared task-date resolution.`);
  assert.doesNotMatch(
    source,
    /task\.taskDate \|\| task\.createdAt\?\.slice\(0,\s*10\) \|\|/,
    `${name} should not keep a local task-date fallback chain.`,
  );
}

assert.match(obsidianTemplateTaskVisibility, /from ['"].*taskRollover['"]/, 'obsidianTemplateTaskVisibility should reuse shared task-date resolution.');
assert.match(obsidianTemplateTaskLines, /from ['"].*obsidianTemplateTaskVisibility['"]/, 'obsidianTemplateTaskLines should reuse the visibility collector that resolves task dates.');
assert.match(obsidianTemplateTaskLines, /taskDates\.get\(task\)/, 'obsidianTemplateTaskLines should reuse the visibility collector task-date map.');
assert.doesNotMatch(
  obsidianTemplateTaskLines,
  /task\.taskDate \|\| task\.createdAt\?\.slice\(0,\s*10\) \|\|/,
  'obsidianTemplateTaskLines should not keep a local task-date fallback chain.',
);

assert.match(
  obsidianTemplates,
  /from ['"].*obsidianTemplateTaskLines['"]/,
  'obsidianTemplates should delegate task rendering to the extracted task-line helper.',
);

const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const keyboardShortcuts = readFileSync(join(root, 'src/app/appKeyboardShortcuts.ts'), 'utf8');
const dateNavigator = readFileSync(join(root, 'src/components/DateNavigator.tsx'), 'utf8');
const stats = readFileSync(join(root, 'shared/aiReview/stats.ts'), 'utf8');

assert.ok(
  keyboardShortcuts.includes("import { shiftDateKey } from '../../shared/taskRollover';"),
  'Keyboard shortcut helper should reuse shared shiftDateKey.'
);
assert.doesNotMatch(app, /function shiftDate\(/, 'App should not define a local date shifting helper.');
assert.doesNotMatch(keyboardShortcuts, /function shiftDate\(/, 'Keyboard shortcut helper should not define a local date shifting helper.');
assert.ok(keyboardShortcuts.includes('shiftDateKey(prev, action.days)'), 'Keyboard shortcut helper should use shared shiftDateKey.');

assert.ok(
  dateNavigator.includes("import { formatLocalDateKey, shiftDateKey } from '../../shared/taskRollover';"),
  'DateNavigator should reuse shared date key helpers.'
);
assert.doesNotMatch(
  dateNavigator,
  /function getLocalDateKey\(/,
  'DateNavigator should not define a local date key formatter.'
);
assert.doesNotMatch(
  dateNavigator,
  /function shiftDate\(/,
  'DateNavigator should not define a local date shifting helper.'
);
assert.ok(
  dateNavigator.includes('onDateChange(shiftDateKey(selectedDate, -1))'),
  'DateNavigator previous-day control should use shared shiftDateKey.'
);
assert.ok(
  dateNavigator.includes('onDateChange(shiftDateKey(selectedDate, 1))'),
  'DateNavigator next-day control should use shared shiftDateKey.'
);

assert.ok(
  stats.includes("import { getTaskDate, shiftDateKey } from '../taskRollover';"),
  'AI stats should reuse shared task-date and date-shift helpers.'
);
assert.doesNotMatch(stats, /function shiftDate\(/, 'AI stats should not define a local date shifting helper.');
assert.doesNotMatch(stats, /task\.taskDate \|\| task\.createdAt\?\.slice\(0,\s*10\) \|\|/, 'AI stats should not define a local task-date fallback chain.');
assert.ok(stats.includes('cursor = shiftDateKey(cursor, -1);'), 'AI stats streak cursor should use shared shiftDateKey.');

console.log('verify-date-key-reuse passed');
