import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const componentPath = join(root, 'src/components/DateNavigator.tsx');
const helpersPath = join(root, 'src/components/dateNavigator/dateNavigatorUtils.ts');

const component = readFileSync(componentPath, 'utf8');

assert.ok(existsSync(helpersPath), 'Date navigator utility module should exist.');

const helpers = readFileSync(helpersPath, 'utf8');

for (const exportName of [
  'weekDays',
  'dateKey',
  'parseDateKey',
  'shiftMonth',
  'formatDisplayDate',
  'getTaskDate',
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
assert.match(helpers, /formatLocalDateKey/, 'dateNavigatorUtils should own the task date fallback helper.');
assert.match(helpers, /color-mix\(in srgb, var\(--color-priority-low\)/, 'dateNavigatorUtils should keep heat background calculation.');

console.log('date navigator module verification passed');
