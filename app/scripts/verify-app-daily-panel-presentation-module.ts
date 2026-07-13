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
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App daily panel presentation helper module should exist.');
assert.ok(existsSync(shellCompositionHookPath), 'Runtime shell composition hook should exist for daily panel presentation verification.');
assert.ok(existsSync(topContentPath), 'App top content component should exist for daily panel presentation verification.');

const helper = readFileSync(helperPath, 'utf8');
const shellCompositionHook = readFileSync(shellCompositionHookPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const topContent = readFileSync(topContentPath, 'utf8');
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
assert.match(topContent, /className=\{getDailyPanelTabClassName\(hasDailyWorkContent, isDailyWorkOpen\)\}/, 'Daily work tab should use the extracted className helper in AppTopContent.');
assert.match(topContent, /className=\{getDailyPanelTabClassName\(hasDailyInspirationContent, isInspirationOpen\)\}/, 'Inspiration tab should use the extracted className helper in AppTopContent.');
assert.match(topContent, /title=\{getDailyPanelTabTitle\(shellText\.editDailyWork, hasDailyWorkContent\)\}/, 'Daily work tab should use the extracted title helper in AppTopContent.');
assert.match(topContent, /title=\{getDailyPanelTabTitle\(shellText\.editInspiration, hasDailyInspirationContent\)\}/, 'Inspiration tab should use the extracted title helper in AppTopContent.');
assert.match(topContent, /\{hasDailyWorkContent && <span className="daily-panel-dot" aria-hidden="true" \/>\}/, 'Daily work tab should use the derived content flag for the content dot in AppTopContent.');
assert.match(topContent, /\{hasDailyInspirationContent && <span className="daily-panel-dot" aria-hidden="true" \/>\}/, 'Inspiration tab should use the derived content flag for the content dot in AppTopContent.');
assert.doesNotMatch(app, /dailyWork\.trim\(\)/, 'App should not inline daily work trim checks in the daily panel tab presentation.');
assert.doesNotMatch(app, /dailyInspiration\.trim\(\)/, 'App should not inline inspiration trim checks in the daily panel tab presentation.');
assert.doesNotMatch(app, /`daily-panel-tab \$\{dailyWork\.trim\(\)/, 'App should not inline the daily work panel tab className composition.');
assert.doesNotMatch(app, /`daily-panel-tab \$\{dailyInspiration\.trim\(\)/, 'App should not inline the inspiration panel tab className composition.');
assert.equal(scripts['verify:app-daily-panel-presentation-module'], 'tsx scripts/verify-app-daily-panel-presentation-module.ts', 'package.json should expose the focused daily panel presentation verifier.');
assertCleanupCoreIncludes('verify:app-daily-panel-presentation-module', 'cleanup-core should include the focused daily panel presentation verifier.');

console.log('App daily panel presentation helper verification passed');
