import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'mainWindowStartup.ts');
const compositionPath = join(root, 'electron', 'mainWindowComposition.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron main-window startup module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function createMainWindowStarter\b/, 'mainWindowStartup should export createMainWindowStarter.');
assert.match(helper, /type CreateMainWindowStarterOptions\b/, 'mainWindowStartup should define explicit startup dependencies.');
assert.match(helper, /from '\.\/mainWindowFactory'/, 'mainWindowStartup should depend on mainWindowFactory for BrowserWindow creation and bootstrap order.');
assert.doesNotMatch(
  helper,
  /if \(!store\.get\(obsidianPathKey\) && getDefaultVaultPath\(\)\)/,
  'mainWindowStartup should not treat malformed truthy stored vault paths as valid seeded paths.',
);
assert.match(
  helper,
  /const storedVaultPath = store\.get\(obsidianPathKey\);[\s\S]*const defaultVaultPath = getDefaultVaultPath\(\);[\s\S]*typeof storedVaultPath !== 'string'[\s\S]*store\.set\(obsidianPathKey,\s*defaultVaultPath\)/,
  'mainWindowStartup should seed the default vault path when the stored value is not a string.',
);
assert.match(helper, /const bounds = getInitialBounds\(\)/, 'mainWindowStartup should resolve initial window bounds.');
assert.match(helper, /const initialMode = getStoredWindowMode\(\)/, 'mainWindowStartup should resolve the stored initial window mode.');
assert.match(helper, /const win = createMainBrowserWindow\(\{/, 'mainWindowStartup should own main BrowserWindow creation orchestration.');
assert.match(helper, /setMainWindow\(win\)/, 'mainWindowStartup should preserve mainWindow state assignment through injection.');
assert.match(helper, /diag\('BrowserWindow created'\)/, 'mainWindowStartup should preserve BrowserWindow creation diagnostics.');
assert.match(helper, /applyWindowMode\(win,\s*initialMode\)/, 'mainWindowStartup should preserve initial window-mode application.');
assert.match(helper, /setupMainBrowserWindow\(win,\s*createBootstrap\(win\)\)/, 'mainWindowStartup should preserve fixed bootstrap setup ordering through the injected bootstrap builder.');

assert.match(composition, /from '\.\/mainWindowStartup'/, 'main-window composition should import the main-window startup helper.');
assert.match(composition, /const createWindow = createMainWindowStarter\(\{/, 'main-window composition should create the createWindow callback through mainWindowStartup.');
assert.match(composition, /setMainWindow:\s*runtimeState\.setMainWindow/, 'main-window composition should inject runtimeState.setMainWindow into startup.');
assert.doesNotMatch(composition, /function createWindow\(\) \{/, 'main-window composition should not keep createWindow inline after startup extraction.');
assert.doesNotMatch(composition, /diag\('BrowserWindow created'\)/, 'main-window composition should not log BrowserWindow creation inline after startup extraction.');
assert.doesNotMatch(composition, /setupMainBrowserWindow\(win,\s*createMainWindowBootstrap\(\{/, 'main-window composition should not bootstrap the main window inline after startup extraction.');

assert.equal(
  scripts['verify:electron-main-window-startup-module'],
  'tsx scripts/verify-electron-main-window-startup-module.ts',
  'package.json should expose the focused main-window startup verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-window-startup-module', 'cleanup-core should include the focused main-window startup verifier.');

console.log('electron main-window startup module verification passed');
