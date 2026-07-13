import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTasksByDate } from '../src/components/dateNavigator/dateNavigatorUtils';
import type { Task } from '../src/types/task';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const componentPath = join(root, 'src/components/DateNavigator.tsx');
const helpersPath = join(root, 'src/components/dateNavigator/dateNavigatorUtils.ts');
const calendarPath = join(root, 'src/components/dateNavigator/MonthCalendar.tsx');
const calendarHookPath = join(root, 'src/components/dateNavigator/useDateNavigatorCalendar.ts');
const appPath = join(root, 'src/App.tsx');

const component = readFileSync(componentPath, 'utf8');
const app = readFileSync(appPath, 'utf8');

assert.ok(existsSync(helpersPath), 'Date navigator utility module should exist.');

const helpers = readFileSync(helpersPath, 'utf8');

for (const exportName of [
  'weekDays',
  'dateKey',
  'parseDateKey',
  'shiftMonth',
  'formatDisplayDate',
  'getTaskDate',
  'buildTasksByDate',
  'getDaySummary',
  'heatBackground',
  'buildMonthCells',
]) {
  assert.match(helpers, new RegExp(`export (const|function) ${exportName}\\b`), `dateNavigatorUtils should export ${exportName}.`);
}

for (const inlineName of ['dateKey', 'parseDateKey', 'shiftMonth', 'formatDisplayDate', 'getTaskDate', 'getDaySummary', 'heatBackground']) {
  assert.doesNotMatch(component, new RegExp(`function ${inlineName}\\b`), `DateNavigator should import ${inlineName} instead of defining it inline.`);
}

assert.match(
  component,
  /from '\.\/dateNavigator\/dateNavigatorUtils'/,
  'DateNavigator should import calendar helpers from dateNavigatorUtils.',
);
assert.ok(existsSync(calendarHookPath), 'DateNavigator calendar lifecycle should live in a focused hook.');
const calendarHook = readFileSync(calendarHookPath, 'utf8');
assert.match(component, /import \{ useDateNavigatorCalendar \} from '\.\/dateNavigator\/useDateNavigatorCalendar';/, 'DateNavigator should compose the calendar lifecycle hook.');
assert.match(component, /const \{ calendarRef, closeCalendar, isCalendarOpen, toggleCalendar, visibleMonth, setVisibleMonth \} = useDateNavigatorCalendar\(selectedDate\);/, 'DateNavigator should render with calendar hook state and actions.');
assert.doesNotMatch(component, /document\.addEventListener\('pointerdown', handlePointerDown\)/, 'DateNavigator should not retain an inline calendar outside-click listener.');
assert.match(calendarHook, /export function useDateNavigatorCalendar\b/, 'Calendar lifecycle hook should have a focused export.');
assert.match(calendarHook, /setVisibleMonth\(selectedDate\.slice\(0, 7\) \+ '-01'\)/, 'Calendar hook should keep the visible month synchronized with the selected date.');
assert.match(calendarHook, /event\.target instanceof Node/, 'Calendar hook should guard pointer event targets before containment checks.');
assert.match(calendarHook, /document\.addEventListener\('pointerdown', handlePointerDown\)/, 'Calendar hook should close from document pointer events.');
assert.match(calendarHook, /document\.removeEventListener\('pointerdown', handlePointerDown\)/, 'Calendar hook should clean up document pointer events.');
assert.match(component, /import \{ lazy, memo, Suspense \} from 'react';/, 'DateNavigator should import lazy and Suspense so the month calendar can stay out of the initial bundle.');
assert.match(component, /export const DateNavigator = memo\(function DateNavigator\(/, 'DateNavigator should memoize its stable navigation surface.');
assert.ok(existsSync(calendarPath), 'Month calendar should live in its own lazy-loaded module.');
const calendar = readFileSync(calendarPath, 'utf8');
assert.match(component, /const MonthCalendar = lazy\(\(\) => import\('\.\/dateNavigator\/MonthCalendar'\)\.then\(\(module\) => \(\{\s*default: module\.MonthCalendar,\s*\}\)\)\);/, 'DateNavigator should dynamically import the calendar-only surface.');
assert.match(component, /isCalendarOpen && \(\s*<Suspense fallback=\{null\}>\s*<MonthCalendar\b/, 'DateNavigator should request the calendar chunk only after the calendar opens.');
assert.doesNotMatch(component, /function MonthCalendar\(/, 'DateNavigator should not retain the calendar implementation in the initial module.');
assert.doesNotMatch(component, /event\.target as Node/, 'DateNavigator should narrow pointer event targets with a Node guard instead of casting.');
assert.match(helpers, /formatLocalDateKey/, 'dateNavigatorUtils should own the task date fallback helper.');
assert.match(helpers, /color-mix\(in srgb, var\(--color-priority-low\)/, 'dateNavigatorUtils should keep heat background calculation.');
assert.match(helpers, /export function buildTasksByDate\(tasks: Task\[\]\): Map<string, Task\[\]> \{[\s\S]*?const dateTasks = tasksByDate\.get\(key\);[\s\S]*?dateTasks\.push\(task\);[\s\S]*?tasksByDate\.set\(key, \[task\]\);[\s\S]*?\}/, 'Date navigator should build date buckets without repeatedly copying same-day task arrays.');
assert.match(helpers, /export function buildTasksByDate\(tasks: Task\[\]\): Map<string, Task\[\]> \{[\s\S]*?const fallbackDate = formatLocalDateKey\(\);[\s\S]*?getSharedTaskDate\(task, fallbackDate\)/, 'Date navigator should resolve the fallback date once per date-bucket build.');
assert.doesNotMatch(component, /map\.set\(key, \[\.\.\.\(map\.get\(key\) \|\| \[\]\), task\]\)/, 'DateNavigator should not copy the previous bucket for every task.');
assert.match(calendar, /export function MonthCalendar\(/, 'The calendar module should expose the deferred month calendar.');
assert.match(calendar, /const tasksByDate = useMemo\(\(\) => buildTasksByDate\(tasks\), \[tasks\]\);/, 'MonthCalendar should build task buckets only after the calendar opens.');
assert.match(calendar, /const monthCells = useMemo\(\(\) =>[\s\S]*?buildMonthCells\(visibleMonth, tasksByDate\)/, 'MonthCalendar should derive month cells only while mounted.');
assert.match(calendar, /const monthLabel = useMemo\(\(\) => new Intl\.DateTimeFormat\('zh-CN', \{[\s\S]*?\}\)\.format\(new Date\(`\$\{visibleMonth\}T00:00:00`\)\), \[visibleMonth\]\);/, 'MonthCalendar should only construct its localized month formatter when the visible month changes.');
assert.doesNotMatch(app, /const calendarTasks = useMemo\(\(\) => allTasks\.filter\(\(task\) => !task\.cleared\), \[allTasks\]\);/, 'App should not allocate calendar task copies while the month calendar is closed.');

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
