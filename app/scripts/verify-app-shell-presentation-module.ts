import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appShellPresentation.ts');
const appPath = join(root, 'src/App.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App shell presentation helper module should exist.');

const helper = readFileSync(helperPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export interface AppShellClassNameOptions\b/, 'helper should export AppShellClassNameOptions.');
assert.match(helper, /export function getAppShellClassName\b/, 'helper should export getAppShellClassName.');
assert.match(helper, /export function getAppShellLowOpacityFlag\b/, 'helper should export getAppShellLowOpacityFlag.');
assert.match(helper, /export function getAppViewportClassName\b/, 'helper should export getAppViewportClassName.');
assert.match(helper, /export function getAppShellThemeValue\b/, 'helper should export getAppShellThemeValue.');
assert.match(helper, /density-\$\{layoutDensity\}/, 'helper should preserve density class selection.');
assert.match(helper, /texture-on.*texture-off/s, 'helper should preserve texture class selection.');
assert.match(helper, /motion-on.*motion-off/s, 'helper should preserve motion class selection.');
assert.match(helper, /task-priority-mode/, 'helper should preserve compact-mode shell class selection.');
assert.match(helper, /windowOpacity <= 40/, 'helper should preserve low-opacity threshold behavior.');
assert.match(helper, /isInvisibleTheme \? 'true' : undefined|isInvisibleTheme \|\| windowOpacity <= 40 \? 'true' : undefined/, 'helper should preserve low-opacity flag behavior.');
assert.match(helper, /opacity-100.*opacity-0/s, 'helper should preserve loaded viewport opacity classes.');
assert.match(helper, /activeThemeId \|\| 'custom'/, 'helper should preserve shell data-theme fallback behavior.');

assert.match(app, /from '\.\/app\/appShellPresentation'/, 'App should import the shell presentation helper.');
assert.match(app, /className=\{getAppShellClassName\(\{[\s\S]*themeClass: themeState\.themeClass,[\s\S]*layoutDensity: appState\.personalization\.layoutDensity,[\s\S]*texture: appState\.personalization\.texture,[\s\S]*animations: appState\.personalization\.animations,[\s\S]*compactMode: appState\.compactMode,[\s\S]*\}\)\}/, 'App should delegate shell className composition to the helper.');
assert.match(app, /className=\{getAppViewportClassName\(taskState\.isLoaded\)\}/, 'App should delegate viewport loaded className to the helper.');
assert.match(app, /data-theme=\{getAppShellThemeValue\(themeState\.activeThemeId\)\}/, 'App should delegate shell data-theme fallback to the helper.');
assert.match(app, /data-low-opacity=\{getAppShellLowOpacityFlag\(themeState\.isInvisibleTheme, appState\.personalization\.windowOpacity\)\}/, 'App should delegate shell low-opacity flag to the helper.');
assert.doesNotMatch(app, /className=\{`app-shell \$\{themeState\.themeClass\}/, 'App should not inline the app shell className template.');
assert.doesNotMatch(app, /data-low-opacity=\{themeState\.isInvisibleTheme \|\| personalization\.windowOpacity <= 40 \? 'true' : undefined\}/, 'App should not inline the shell low-opacity ternary.');
assert.equal(scripts['verify:app-shell-presentation-module'], 'tsx scripts/verify-app-shell-presentation-module.ts', 'package.json should expose the focused app shell presentation verifier.');
assertCleanupCoreIncludes('verify:app-shell-presentation-module', 'cleanup-core should include the focused app shell presentation verifier.');

console.log('App shell presentation helper verification passed');
