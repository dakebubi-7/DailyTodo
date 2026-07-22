import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTasksByDate } from '../src/components/dateNavigator/dateNavigatorUtils';
import type { Task } from '../src/types/task';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const navigatorPath = join(root, 'src/components/DateNavigator.tsx');
const calendarPath = join(root, 'src/components/dateNavigator/MonthCalendar.tsx');
const calendarHookPath = join(root, 'src/components/dateNavigator/useDateNavigatorCalendar.ts');
const helpersPath = join(root, 'src/components/dateNavigator/dateNavigatorUtils.ts');

assert.ok(existsSync(navigatorPath), 'DateNavigator should exist.');
assert.ok(existsSync(calendarPath), 'Month calendar should remain in a deferred module.');
assert.ok(existsSync(calendarHookPath), 'Calendar controller hook should exist.');
assert.ok(existsSync(helpersPath), 'Date navigator utilities should exist.');

const navigator = readFileSync(navigatorPath, 'utf8');
const calendar = readFileSync(calendarPath, 'utf8');
const calendarHook = readFileSync(calendarHookPath, 'utf8');
const helpers = readFileSync(helpersPath, 'utf8');

assert.match(navigator, /<CompactDayStrip\b/, 'DateNavigator should render the compact strip.');
assert.match(navigator, /className="compact-day-summary"/, 'DateNavigator should own the selected-day summary.');
assert.match(navigator, /isCalendarOpen && \([\s\S]*?<MonthCalendar\b/, 'Month calendar should remain lazy.');
assert.doesNotMatch(navigator, /date-stepper|date-today-button|date-current|date-calendar-button/);
assert.match(navigator, /const MonthCalendar = lazy\(\(\) => import\('\.\/dateNavigator\/MonthCalendar'\)/);
assert.doesNotMatch(calendar, /month-calendar-history/);
assert.match(calendar, /onDateChange\(cell\.key\);\s*onClose\(\);/);
assert.match(calendarHook, /export interface DateNavigatorCalendarController \{/);

for (const member of [
  'calendarRef',
  'closeCalendar',
  'isCalendarOpen',
  'toggleCalendar',
  'visibleMonth',
  'setVisibleMonth',
]) {
  assert.match(calendarHook, new RegExp(`\\b${member}\\b`), `Calendar controller should expose ${member}.`);
}

assert.match(calendarHook, /document\.addEventListener\('pointerdown', handlePointerDown\)/);
assert.match(calendarHook, /document\.removeEventListener\('pointerdown', handlePointerDown\)/);
assert.match(helpers, /export function buildTasksByDate\(tasks: Task\[\]\): Map<string, Task\[\]>/);

const calendarTask: Task = {
  id: 'calendar-visible',
  text: 'Visible task',
  completed: false,
  priority: 'medium',
  source: 'personal',
  createdAt: '2026-07-13T00:00:00.000Z',
  taskDate: '2026-07-13',
  isToday: true,
};

assert.deepEqual(
  buildTasksByDate([calendarTask, { ...calendarTask, id: 'calendar-cleared', cleared: true }])
    .get('2026-07-13')
    ?.map((task) => task.id),
  ['calendar-visible'],
  'Calendar buckets should exclude cleared tasks after receiving the complete task list on demand.',
);

console.log('date navigator module verification passed');
