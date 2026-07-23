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

assert.match(strip, /data-day-count=\{count\}/, 'The strip should expose its resolved 5/7 day count for stable grid styling.');
assert.doesNotMatch(strip, /data-compact=/, 'The strip must not switch to a three-day compact state.');
assert.match(strip, /selectedDate !== today/, 'The return-to-today action should appear only when the selected day is not today.');
assert.match(strip, /className="compact-day-strip-today"/, 'The compact strip should expose a dedicated return-to-today control.');
assert.match(strip, /onClick=\{\(\) => onDateChange\(today\)\}/, 'The return-to-today control should reuse the existing date callback.');
assert.match(strip, /title=\{text\.backToToday\}/, 'The return-to-today control should provide a localized title.');
assert.match(strip, /aria-label=\{text\.backToToday\}/, 'The return-to-today control should provide a localized accessible name.');
assert.match(strip, /className="compact-day-strip-today-icon"/, 'The return-to-today control should expose its icon hook.');
assert.match(strip, /className="compact-day-strip-today-label"/, 'The return-to-today control should expose its label hook.');
assert.match(stripUtils, /export type CompactDayStripCount = 5 \| 7;/, 'Compact strip widths must retain at least five days.');
assert.doesNotMatch(stripUtils, /return 3/, 'Strips must never resolve to three days.');
assert.match(stripUtils, /return containerWidth >= 440 \? 7 : 5;/, 'Wide strips should show seven days and medium strips should show five.');
assert.match(styles, /\.compact-day-strip-days\s*\{[\s\S]*?grid-template-columns:\s*repeat\(var\(--compact-day-count\),\s*minmax\(0,\s*1fr\)\)/, 'Day cells should use stable grid tracks keyed by the selected 5/7 count.');
assert.doesNotMatch(styles, /data-compact='true'/, 'Compact styling must not depend on a three-day data-compact hook.');
assert.doesNotMatch(styles, /data-day-count='3'/, 'There should be no three-day CSS day-count variable.');
assert.match(styles, /@media \(max-width:\s*320px\)\s*\{[\s\S]*?\.compact-day-strip\.compact-day-strip-has-today-action\s*\{[\s\S]*?grid-template-columns:\s*2rem minmax\(0, 1fr\)/, 'Narrow viewports should shrink the return-to-today column while keeping five days.');
assert.match(styles, /@media \(max-width:\s*320px\)\s*\{[\s\S]*?\.compact-day-strip-today-label\s*\{[\s\S]*?position:\s*absolute/, 'Narrow viewports should visually hide the today label while retaining accessible text.');
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
  /--compact-progress-track:\s*#2a2d31[\s\S]*?--compact-progress-fill:\s*#8aa0b8[\s\S]*?--compact-progress-ratio:\s*#e4e4e7/,
  'Dark date cards must override their local light progress tokens with muted slate-blue fill.',
);
assert.match(styles, /\.compact-day-strip-day\[data-status='overdue'\]/, 'Overdue day cells require their semantic status selector.');
assert.match(styles, /\.compact-day-summary\s*\{/, 'The selected-day summary should remain present.');
assert.match(styles, /\.compact-day-progress-track\s*\{/, 'The selected-day progress track should remain present.');
assert.match(
  styles,
  /\.app-shell\[data-theme='invisible'\] \.date-card[\s\S]*?--compact-progress-track:\s*rgba\(0,\s*0,\s*0,\s*0\.06\)/,
  'Invisible light compact progress must redeclare translucent track tokens on .date-card.',
);
assert.match(
  styles,
  /\.dark \.app-shell\[data-theme='invisible'\] \.date-card[\s\S]*?--compact-progress-track:\s*rgba\(255,\s*255,\s*255,\s*0\.10\)/,
  'Invisible dark compact progress must redeclare translucent track tokens on .date-card to beat solid dark date-card tokens.',
);
assert.match(
  styles,
  /\.dark \.app-shell\[data-theme='invisible'\] \.compact-day-summary\s*\{[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.06\) !important;/,
  'Invisible dark compact summary must paint a translucent surface, not solid black.',
);
assert.match(
  styles,
  /\.dark \.app-shell\[data-theme='invisible'\] \.compact-day-progress-track\s*\{[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.10\) !important;/,
  'Invisible dark compact progress track must paint a translucent surface, not solid black.',
);

assert.match(
  styles,
  /\.dark \.app-shell\[data-theme='invisible'\] \.date-card[\s\S]*?--compact-day-selected-surface:\s*rgba\(255,\s*255,\s*255,\s*0\.12\)/,
  'Invisible dark selected-day tokens must be translucent on .date-card.',
);
assert.match(
  styles,
  /\.dark \.app-shell\[data-theme='invisible'\] \.compact-day-strip-day\[aria-current='date'\]\s*\{[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.12\) !important;/,
  'Invisible dark selected day cell must paint translucent glass, not solid black.',
);
assert.match(
  styles,
  /\.app-shell\[data-theme='invisible'\] \.compact-day-summary\s*\{[\s\S]*?background:\s*rgba\(0,\s*0,\s*0,\s*0\.045\) !important;/,
  'Invisible light themes must retain a translucent summary progress surface instead of making it transparent.',
);
assert.match(
  styles,
  /\.app-shell\[data-theme='invisible'\] \.compact-day-progress-track\s*\{[\s\S]*?background:\s*rgba\(0,\s*0,\s*0,\s*0\.06\) !important;/,
  'Invisible light themes must retain a translucent progress-track surface instead of making it transparent.',
);
const invisibleDarkDateCardProgressBlock = (styles.match(/\.dark \.app-shell\[data-theme='invisible'\] \.date-card[\s\S]*?\n\}/g) ?? [])
  .find((block) => block.includes('--compact-progress-track')) ?? '';
assert.match(
  invisibleDarkDateCardProgressBlock,
  /--compact-progress-track:\s*rgba\(255,\s*255,\s*255,\s*0\.10\)/,
  'Invisible dark date-card progress block must define a translucent track token.',
);
assert.doesNotMatch(
  invisibleDarkDateCardProgressBlock,
  /--compact-progress-track:\s*#2a2d31/,
  'Invisible dark date-card progress block must not use the solid dark track token.',
);
assert.match(
  invisibleDarkDateCardProgressBlock,
  /--compact-progress-fill:\s*rgba\(255,\s*255,\s*255,\s*0\.58\)/,
  'Invisible dark date-card progress block must use neutral white glass fill.',
);
assert.match(
  styles,
  /\.app-shell\[data-theme='invisible'\] \.date-card[\s\S]*?--compact-progress-fill:\s*rgba\(28,\s*30,\s*34,\s*0\.42\)/,
  'Invisible light date-card progress block must use neutral charcoal glass fill.',
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
