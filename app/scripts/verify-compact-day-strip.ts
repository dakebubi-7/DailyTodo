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
const compactDateCardStyles = (styles.match(/\.date-card\s*\{[\s\S]*?\n\}/g) ?? [])
  .find((block) => block.includes('z-index: 70')) ?? '';

assert.match(strip, /data-day-count=\{count\}/, 'The strip should expose its resolved 3/5/7 day count for stable grid styling.');
assert.match(strip, /data-compact=\{count === 3 \? 'true' : undefined\}/, 'The strip should expose compact mode when ResizeObserver resolves a three-day window.');
assert.match(strip, /selectedDate !== today/, 'The return-to-today action should appear only when the selected day is not today.');
assert.match(strip, /className="compact-day-strip-today"/, 'The compact strip should expose a dedicated return-to-today control.');
assert.match(strip, /onClick=\{\(\) => onDateChange\(today\)\}/, 'The return-to-today control should reuse the existing date callback.');
assert.match(strip, /title=\{text\.backToToday\}/, 'The return-to-today control should provide a localized title.');
assert.match(strip, /aria-label=\{text\.backToToday\}/, 'The return-to-today control should provide a localized accessible name.');
assert.match(strip, /className="compact-day-strip-today-icon"/, 'The return-to-today control should expose its icon hook.');
assert.match(strip, /className="compact-day-strip-today-label"/, 'The return-to-today control should expose its label hook.');
assert.match(stripUtils, /export type CompactDayStripCount = 3 \| 5 \| 7;/, 'Compact strip widths must support three, five, and seven days.');
assert.match(stripUtils, /if \(containerWidth < 320\) return 3;/, 'Strips narrower than 320px should show three days.');
assert.match(stripUtils, /return containerWidth >= 440 \? 7 : 5;/, 'Wide strips should show seven days and medium strips should show five.');
assert.match(styles, /\.compact-day-strip-days\s*\{[\s\S]*?grid-template-columns:\s*repeat\(var\(--compact-day-count\),\s*minmax\(0,\s*1fr\)\)/, 'Day cells should use stable grid tracks keyed by the selected 3/5/7 count.');
assert.match(styles, /\.compact-day-strip\[data-compact='true'\]/, 'Three-day strips should have a CSS hook synchronized with the resolved container width.');
assert.match(styles, /\.compact-day-strip\[data-day-count='3'\]\s*\{[\s\S]*?--compact-day-count:\s*3/, 'Three-day strips should set the CSS day-count variable.');
assert.match(styles, /\.compact-day-strip\[data-day-count='5'\]\s*\{[\s\S]*?--compact-day-count:\s*5/, 'Five-day strips should set the CSS day-count variable.');
assert.match(styles, /\.compact-day-strip\[data-day-count='7'\]\s*\{[\s\S]*?--compact-day-count:\s*7/, 'Seven-day strips should set the CSS day-count variable.');
assert.match(styles, /--compact-day-empty-text:/, 'Compact strip should define light status tokens.');
assert.match(styles, /--compact-day-overdue-dot:/, 'Compact strip should define the overdue status token.');
assert.match(compactDateCardStyles, /--compact-progress-track:\s*#e8eaed/, 'Light progress tokens must be scoped to the shared date-card ancestor.');
assert.match(styles, /\.dark\s+\.app-shell\s*\{[\s\S]*?--compact-day-empty-text:\s*#777c83/, 'Dark compact strip should retain the approved restrained status tokens.');
const darkCompactDateCardStyles = (styles.match(/\.dark\s+\.date-card\s*\{[\s\S]*?\n\}/g) ?? [])
  .find((block) => block.includes('--compact-progress-track')) ?? '';
assert.match(
  darkCompactDateCardStyles,
  /--compact-progress-track:\s*#17191d[\s\S]*?--compact-progress-fill:\s*#eceef1[\s\S]*?--compact-progress-ratio:\s*#f4f5f6/,
  'Dark date cards must override their local light progress tokens.',
);
assert.match(styles, /\.compact-day-strip-day\[data-status='overdue'\]/, 'Overdue day cells require their semantic status selector.');
assert.match(styles, /\.compact-day-summary\s*\{/, 'The selected-day summary should remain present.');
assert.match(styles, /\.compact-day-progress-track\s*\{/, 'The selected-day progress track should remain present.');
assert.match(
  styles,
  /\.app-shell\[data-theme='invisible'\] \.compact-day-summary\s*\{\s*background:\s*var\(--compact-progress-track\) !important;/,
  'Invisible themes must retain the summary progress surface instead of making it transparent.',
);
assert.match(
  styles,
  /\.app-shell\[data-theme='invisible'\] \.compact-day-progress-track\s*\{\s*background:\s*var\(--compact-progress-track\) !important;/,
  'Invisible themes must retain the progress-track surface instead of making it transparent.',
);
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
assert.match(styles, /\.task-toolbar\s*\{[\s\S]*?container-type:\s*inline-size/, 'Toolbar controls should respond to their available container width.');
assert.match(
  styles,
  /@container \(max-width:\s*280px\)\s*\{[\s\S]*?\.task-toolbar \.daily-panel-tab\s*\{[\s\S]*?height:\s*1\.72rem !important/,
  'Daily editor buttons must override their fixed panel-tab height when their toolbar is compact.',
);
assert.match(styles, /\.task-filter-controls\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1/, 'Expanded filters should live below the primary toolbar row.');

assertCleanupCoreIncludes('verify:compact-day-strip', 'cleanup-core should include the compact day strip verifier.');

console.log('compact day strip verification passed');
