import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function read(relativePath: string): string {
  const path = join(root, relativePath);
  assert.ok(existsSync(path), `${relativePath} should exist.`);
  return readFileSync(path, 'utf8');
}

const styles = read('src/styles/globals.css');
const strip = read('src/components/CompactDayStrip.tsx');
const stripUtils = read('src/components/compactDayStrip/compactDayStripUtils.ts');
const navigator = read('src/components/DateNavigator.tsx');
const header = read('src/components/Header.tsx');
const toolbar = read('src/components/taskList/TaskListToolbar.tsx');
const taskViewSelector = read('src/components/taskList/TaskViewSelector.tsx');

assert.match(strip, /data-day-count=\{count\}/, 'The strip should expose its resolved 5/7 day count for stable grid styling.');
assert.match(strip, /selectedDate !== today/, 'The return-to-today action should appear only when the selected day is not today.');
assert.match(strip, /className="compact-day-strip-today"/, 'The compact strip should expose a dedicated return-to-today control.');
assert.match(strip, /onClick=\{\(\) => onDateChange\(today\)\}/, 'The return-to-today control should reuse the existing date callback.');
assert.match(strip, /title=\{text\.backToToday\}/, 'The return-to-today control should use localized text.');
assert.match(stripUtils, /export type CompactDayStripCount = 5 \| 7;/, 'Compact strip widths must support only five or seven days.');
assert.match(stripUtils, /return containerWidth >= 440 \? 7 : 5;/, 'Wide strips should show seven days and every narrower strip should show five.');
assert.doesNotMatch(stripUtils, /\b3\b\s*\|\s*5\s*\|\s*7|return 3|count:\s*3/, 'Compact strip source must not restore a three-day layout.');
assert.match(styles, /\.compact-day-strip-days\s*\{[\s\S]*?grid-template-columns:\s*repeat\(var\(--compact-day-count\),\s*minmax\(0,\s*1fr\)\)/, 'Day cells should use stable grid tracks keyed by the selected 5/7 count.');
assert.match(styles, /\.compact-day-strip\[data-day-count='5'\]\s*\{[\s\S]*?--compact-day-count:\s*5/, 'Five-day strips should set the CSS day-count variable.');
assert.match(styles, /\.compact-day-strip\[data-day-count='7'\]\s*\{[\s\S]*?--compact-day-count:\s*7/, 'Seven-day strips should set the CSS day-count variable.');
assert.match(styles, /--compact-day-empty-text:/, 'Compact strip should define light status tokens.');
assert.match(styles, /--compact-day-overdue-dot:/, 'Compact strip should define the overdue status token.');
assert.match(styles, /\.dark\s+\.app-shell\s*\{[\s\S]*?--compact-day-empty-text:\s*#777c83/, 'Dark compact strip should retain the approved restrained status tokens.');
assert.match(styles, /\.compact-day-strip-day\[data-status='overdue'\]/, 'Overdue day cells require their semantic status selector.');
assert.match(styles, /\.compact-day-summary\s*\{[\s\S]*?height:\s*34px/, 'The selected-day summary must stay 34px high.');
assert.match(styles, /\.compact-day-progress-track\s*\{[\s\S]*?height:\s*24px/, 'The selected-day progress track must stay 24px high.');
assert.match(styles, /\.compact-day-progress-fill\s*\{[\s\S]*?background:\s*#f3f4f5/, 'The proportional fill should remain white inside the single progress track.');
assert.match(navigator, /compact-day-progress-ratio/, 'The completion ratio must remain inside the progress track.');
assert.doesNotMatch(header, /dateContextLabel|header-progress-row/, 'Header should not restore date context or a duplicate progress row.');
assert.match(toolbar, /className="task-daily-actions"/, 'Daily Work and Inspiration should remain grouped in the task toolbar.');
assert.match(styles, /\.task-toolbar-row\s*\{[\s\S]*?flex-wrap:\s*nowrap/, 'Primary toolbar controls must stay on one line.');
assert.match(toolbar, /from '\.\/TaskViewSelector'/, 'The toolbar should use the shared compact task-view selector.');
assert.match(toolbar, /<TaskViewSelector text=\{text\} activeTab=\{activeTab\} onTabChange=\{onTabChange\} \/>/, 'The toolbar should expose the active task view from one compact launcher.');
assert.match(taskViewSelector, /className=\{`task-view-launcher/, 'The shared task view selector should provide the compact launcher.');
assert.match(taskViewSelector, /role="menu"/, 'The task view selector should use a menu popover.');
assert.match(taskViewSelector, /role="menuitemradio"/, 'The task view selector should expose exclusive choices to assistive technology.');
assert.match(taskViewSelector, /onTabChange\(option\.value\)/, 'The task view selector should reuse the existing tab state callback.');
assert.match(styles, /\.task-view-menu-popover\s*\{[\s\S]*?position:\s*absolute/, 'The selector popover should not consume a second toolbar row.');
assert.match(styles, /\.task-daily-actions\s*\{[\s\S]*?margin-left:\s*auto/, 'Daily task actions should stay right-aligned on the toolbar row.');
assert.match(styles, /\.task-daily-action\s*\{[\s\S]*?height:\s*2\.2rem/, 'Daily task actions should remain larger than icon tools.');
assert.match(styles, /\.task-filter-controls\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1/, 'Expanded filters should live below the primary toolbar row.');

assertCleanupCoreIncludes('verify:compact-day-strip', 'cleanup-core should include the compact day strip verifier.');

console.log('compact day strip verification passed');
