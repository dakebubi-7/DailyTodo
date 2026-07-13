import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appShellEffects.ts');
const runtimeHookPath = join(root, 'src/app/useAppRuntimeEffects.ts');
const appPath = join(root, 'src/App.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App shell effects helper module should exist.');
assert.ok(existsSync(runtimeHookPath), 'App runtime effects hook module should exist.');

const helper = readFileSync(helperPath, 'utf8');
const runtimeHook = readFileSync(runtimeHookPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function syncSettingsMode\b/, 'helper should export syncSettingsMode.');
assert.match(helper, /setSettingsMode\?\.\(settingsOpen\)/, 'helper should preserve optional settings-mode IPC call.');
assert.match(helper, /export function syncDocumentThemeClasses\b/, 'helper should export syncDocumentThemeClasses.');
assert.match(helper, /document\.documentElement\.classList\.toggle\('dark', isDark\)/, 'helper should preserve dark class toggle.');
assert.match(helper, /document\.documentElement\.classList\.toggle\('texture-disabled', !textureEnabled\)/, 'helper should preserve texture-disabled class toggle.');
assert.match(helper, /export function syncDocumentFontScale\b/, 'helper should export syncDocumentFontScale.');
assert.match(helper, /clampFontScale\(fontScale\)/, 'helper should preserve font-scale clamping through appPersonalization.');
assert.match(helper, /document\.documentElement\.style\.fontSize = `\$\{\(14 \* scale\) \/ 100\}px`/, 'helper should preserve rem base font-size formula.');
assert.match(helper, /export function syncAlwaysOnTopPreference\b/, 'helper should export syncAlwaysOnTopPreference.');
assert.match(helper, /setWindowMode\?\.\(alwaysOnTop \? 'onTop' : 'normal'\)/, 'helper should explicitly synchronize the preferred window mode.');
assert.doesNotMatch(helper, /toggleAlwaysOnTop\?\.\(\)/, 'preference sync should not invert the current window mode.');

assert.match(app, /from '\.\/app\/useAppRuntimeEffects'/, 'App should import the runtime effects hook.');
assert.match(app, /useAppRuntimeEffects\(\{/, 'App should delegate runtime effects through the runtime hook.');
assert.match(runtimeHook, /from '\.\/appShellEffects'/, 'runtime hook should import shell effect helpers.');
assert.match(runtimeHook, /syncSettingsMode\(appState\.settingsOpen\)/, 'runtime hook should delegate settings-mode effect.');
assert.match(runtimeHook, /syncDocumentThemeClasses\(taskEffects\.isDark, appState\.personalization\.texture\)/, 'runtime hook should delegate document theme class effect.');
assert.match(runtimeHook, /syncDocumentFontScale\(appState\.personalization\.fontScale\)/, 'runtime hook should delegate document font-scale effect.');
assert.match(runtimeHook, /syncAlwaysOnTopPreference\(appState\.personalization\.alwaysOnTop\)/, 'runtime hook should delegate always-on-top effect.');
assert.match(runtimeHook, /\[appState\.personalization\.alwaysOnTop\]/, 'runtime hook should resync window mode when the always-on-top preference changes.');
assert.doesNotMatch(app, /document\.documentElement\.classList\.toggle\('dark', isDark\)/, 'App should not inline dark class toggling.');
assert.doesNotMatch(app, /document\.documentElement\.style\.fontSize = `\$\{\(14 \* scale\) \/ 100\}px`/, 'App should not inline font-size formula.');
assert.equal(scripts['verify:app-shell-effects-module'], 'tsx scripts/verify-app-shell-effects-module.ts', 'package.json should expose the focused shell effects verifier.');
assertCleanupCoreIncludes('verify:app-shell-effects-module', 'cleanup-core should include the focused shell effects verifier.');

console.log('App shell effects helper verification passed');
