import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appDailyPanelPresentation.ts');
const shellCompositionHookPath = join(root, 'src/app/useAppShellComposition.ts');
const appPath = join(root, 'src/App.tsx');
const topContentPath = join(root, 'src/components/AppTopContent.tsx');
const taskListPath = join(root, 'src/components/TaskList.tsx');
const toolbarPath = join(root, 'src/components/taskList/TaskListToolbar.tsx');
const stylesPath = join(root, 'src/styles/globals.css');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App daily panel presentation helper module should exist.');
assert.ok(existsSync(shellCompositionHookPath), 'Runtime shell composition hook should exist for daily panel presentation verification.');
assert.ok(existsSync(topContentPath), 'App top content component should exist for daily panel presentation verification.');
assert.ok(existsSync(taskListPath), 'TaskList should exist for daily panel presentation verification.');
assert.ok(existsSync(toolbarPath), 'TaskList toolbar should exist for daily panel presentation verification.');
assert.ok(existsSync(stylesPath), 'Global styles should exist for daily panel presentation verification.');

const helper = readFileSync(helperPath, 'utf8');
const shellCompositionHook = readFileSync(shellCompositionHookPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const topContent = readFileSync(topContentPath, 'utf8');
const taskList = readFileSync(taskListPath, 'utf8');
const toolbar = readFileSync(toolbarPath, 'utf8');
const styles = readFileSync(stylesPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function hasDailyPanelContent\b/, 'helper should export hasDailyPanelContent.');
assert.match(helper, /export function getDailyPanelTabClassName\b/, 'helper should export getDailyPanelTabClassName.');
assert.match(helper, /export function getDailyPanelTabTitle\b/, 'helper should export getDailyPanelTabTitle.');
assert.match(helper, /value\.trim\(\)\.length > 0/, 'helper should preserve trimmed daily-panel content detection.');
assert.match(helper, /daily-panel-has-content/, 'helper should preserve the daily-panel content class.');
assert.match(helper, /daily-panel-tab-active/, 'helper should preserve the active daily-panel class.');
assert.match(helper, /: has content/, 'helper should preserve the daily-panel has-content title suffix.');

assert.match(app, /useAppShellComposition\(\{/, 'App should delegate daily panel presentation wiring through the runtime composition hook.');
assert.match(shellCompositionHook, /from '\.\/appDailyPanelPresentation'/, 'Runtime shell composition hook should import the daily panel presentation helper.');
assert.match(shellCompositionHook, /const hasDailyWorkContent = hasDailyPanelContent\(taskState\.dailyWork\);/, 'Runtime shell composition hook should derive hasDailyWorkContent through the helper.');
assert.match(shellCompositionHook, /const hasDailyInspirationContent = hasDailyPanelContent\(taskState\.dailyInspiration\);/, 'Runtime shell composition hook should derive hasDailyInspirationContent through the helper.');
assert.match(toolbar, /getDailyPanelTabClassName\(hasDailyWorkContent, isDailyWorkOpen\)/, 'Daily work action should use the extracted className helper in TaskListToolbar.');
assert.match(toolbar, /getDailyPanelTabClassName\(hasDailyInspirationContent, isInspirationOpen\)/, 'Inspiration action should use the extracted className helper in TaskListToolbar.');
assert.match(toolbar, /getDailyPanelTabTitle\(text\.editDailyWork, hasDailyWorkContent\)/, 'Daily work action should use the extracted title helper in TaskListToolbar.');
assert.match(toolbar, /getDailyPanelTabTitle\(text\.editInspiration, hasDailyInspirationContent\)/, 'Inspiration action should use the extracted title helper in TaskListToolbar.');
assert.match(toolbar, /className="task-daily-actions"/, 'TaskListToolbar should render the daily action group.');
assert.match(toolbar, /\{hasDailyWorkContent && <span className="daily-panel-dot" aria-hidden="true" \/>\}/, 'Daily work action should use the derived content flag.');
assert.match(toolbar, /\{hasDailyInspirationContent && <span className="daily-panel-dot" aria-hidden="true" \/>\}/, 'Inspiration action should use the derived content flag.');
assert.doesNotMatch(topContent, /DailyWorkPanel|daily-panels|daily-panel-switch|daily-panel-entry-/, 'AppTopContent should not mount daily editors above the task toolbar.');
assert.match(taskList, /const DailyWorkPanel = lazy\(\(\) => import\('\.\/DailyWorkPanel'\)/, 'TaskList should lazy-load the daily editor panel.');
assert.match(taskList, /<TaskListToolbar[\s\S]*?\/>\s*<div className="task-daily-panels">[\s\S]*?isDailyWorkOpen && \([\s\S]*?<DailyWorkPanel\b[\s\S]*?isInspirationOpen && \([\s\S]*?<DailyWorkPanel\b[\s\S]*?<div\s+ref=\{scrollRef\}/, 'Daily editors should render below the task toolbar and above the scrollable task list.');
assert.doesNotMatch(app, /dailyWork\.trim\(\)/, 'App should not inline daily work trim checks in the daily panel tab presentation.');
assert.doesNotMatch(app, /dailyInspiration\.trim\(\)/, 'App should not inline inspiration trim checks in the daily panel tab presentation.');
assert.doesNotMatch(app, /`daily-panel-tab \$\{dailyWork\.trim\(\)/, 'App should not inline the daily work panel tab className composition.');
assert.doesNotMatch(app, /`daily-panel-tab \$\{dailyInspiration\.trim\(\)/, 'App should not inline the inspiration panel tab className composition.');
assert.equal(scripts['verify:app-daily-panel-presentation-module'], 'tsx scripts/verify-app-daily-panel-presentation-module.ts', 'package.json should expose the focused daily panel presentation verifier.');
assertCleanupCoreIncludes('verify:app-daily-panel-presentation-module', 'cleanup-core should include the focused daily panel presentation verifier.');

console.log('App daily panel presentation helper verification passed');
