import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appKeyboardShortcuts.ts');
const runtimeHookPath = join(root, 'src/app/useAppRuntimeEffects.ts');
const appPath = join(root, 'src/App.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App keyboard shortcuts helper module should exist.');
assert.ok(existsSync(runtimeHookPath), 'App runtime effects hook module should exist.');

const helper = readFileSync(helperPath, 'utf8');
const runtimeHook = readFileSync(runtimeHookPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export type AppKeyboardShortcutAction\b/, 'helper should export AppKeyboardShortcutAction.');
assert.match(helper, /export function getAppKeyboardShortcutAction\b/, 'helper should export getAppKeyboardShortcutAction.');
assert.match(helper, /export function applyAppKeyboardShortcutAction\b/, 'helper should export applyAppKeyboardShortcutAction.');
assert.match(helper, /export function registerAppKeyboardShortcutListener\b/, 'helper should export registerAppKeyboardShortcutListener.');
assert.doesNotMatch(helper, /event\.target as HTMLElement/, 'helper should narrow keyboard event targets with an HTMLElement guard instead of casting.');
assert.match(helper, /event\.target instanceof HTMLElement \? event\.target : null/, 'helper should guard keyboard event targets before reading tagName.');
assert.match(helper, /tagName === 'INPUT'/, 'helper should preserve INPUT typing detection.');
assert.match(helper, /tagName === 'TEXTAREA'/, 'helper should preserve TEXTAREA typing detection.');
assert.match(helper, /event\.ctrlKey && event\.key\.toLowerCase\(\) === 'k'/, 'helper should preserve Ctrl+K shortcut.');
assert.match(helper, /event\.ctrlKey && event\.key\.toLowerCase\(\) === 'o'/, 'helper should preserve Ctrl+O shortcut.');
assert.match(helper, /event\.key === '\['/, 'helper should preserve previous-day shortcut.');
assert.match(helper, /event\.key === '\]'/, 'helper should preserve next-day shortcut.');
assert.match(helper, /event\.preventDefault\(\);\s*setCompactMode\(\(prev\) => !prev\);/s, 'helper should apply compact-mode shortcut action.');
assert.match(helper, /event\.preventDefault\(\);\s*openSelectedDailyNote\(\);/s, 'helper should apply open-daily-note shortcut action.');
assert.match(helper, /setSelectedDate\(\(prev\) => shiftDateKey\(prev, action\.days\)\)/, 'helper should apply selected-date shift action.');

assert.match(app, /from '\.\/app\/useAppRuntimeEffects'/, 'App should import the runtime effects hook.');
assert.match(app, /useAppRuntimeEffects\(\{/, 'App should delegate runtime effects through the runtime hook.');
assert.match(runtimeHook, /from '\.\/appKeyboardShortcuts'/, 'runtime hook should import keyboard shortcut helpers.');
assert.match(runtimeHook, /registerAppKeyboardShortcutListener\(window, \{/, 'runtime hook should delegate keyboard shortcut listener registration to the helper.');
assert.doesNotMatch(app, /applyAppKeyboardShortcutAction\(event, action, \{/, 'App should not inline keyboard shortcut handler action application.');
assert.doesNotMatch(app, /window\.addEventListener\('keydown', handleKeyDown\)/, 'App should not inline keyboard shortcut listener registration.');
assert.doesNotMatch(app, /window\.removeEventListener\('keydown', handleKeyDown\)/, 'App should not inline keyboard shortcut listener cleanup.');
assert.doesNotMatch(app, /const isTyping = target\?\.tagName === 'INPUT' \|\| target\?\.tagName === 'TEXTAREA'/, 'App should not inline typing detection.');
assert.doesNotMatch(app, /event\.ctrlKey && event\.key\.toLowerCase\(\) === 'k'/, 'App should not inline Ctrl+K decision.');
assert.doesNotMatch(app, /event\.ctrlKey && event\.key\.toLowerCase\(\) === 'o'/, 'App should not inline Ctrl+O decision.');
assert.doesNotMatch(app, /if \(action\.kind === 'toggleCompactMode'\) \{\s*event\.preventDefault\(\);\s*setCompactMode\(\(prev\) => !prev\);\s*return;\s*\}/s, 'App should not inline compact shortcut application.');
assert.doesNotMatch(app, /if \(action\.kind === 'openSelectedDailyNote'\) \{\s*event\.preventDefault\(\);\s*openSelectedDailyNote\(\);\s*return;\s*\}/s, 'App should not inline open-note shortcut application.');
assert.doesNotMatch(app, /setSelectedDate\(\(prev\) => shiftDateKey\(prev, action\.days\)\)/, 'App should not inline selected-date shift application.');
assert.equal(scripts['verify:app-keyboard-shortcuts-module'], 'tsx scripts/verify-app-keyboard-shortcuts-module.ts', 'package.json should expose the focused keyboard shortcuts verifier.');
assertCleanupCoreIncludes('verify:app-keyboard-shortcuts-module', 'cleanup-core should include the focused keyboard shortcuts verifier.');

console.log('App keyboard shortcuts helper verification passed');
