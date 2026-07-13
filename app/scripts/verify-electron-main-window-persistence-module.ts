import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'mainWindowPersistence.ts');
const mainPath = join(root, 'electron', 'main.ts');
const compositionPath = join(root, 'electron', 'mainWindowComposition.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron main-window persistence module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function createMainWindowPersistence\b/, 'mainWindowPersistence should export createMainWindowPersistence.');
assert.match(helper, /type CreateMainWindowPersistenceOptions\b/, 'mainWindowPersistence should define explicit persistence dependencies.');
assert.match(helper, /export type PersistWindowStateOptions\b/, 'mainWindowPersistence should export PersistWindowStateOptions.');
assert.match(helper, /let persistTimer: NodeJS\.Timeout \| null = null;/, 'mainWindowPersistence should own the debounced persist timer state.');
assert.match(helper, /function getInitialBounds\b/, 'mainWindowPersistence should own initial bounds calculation.');
assert.match(helper, /function persistWindowState\b/, 'mainWindowPersistence should own debounced window-state persistence.');
assert.match(helper, /function getStoredWindowMode\b/, 'mainWindowPersistence should own stored window-mode resolution.');
assert.match(helper, /screen\.getPrimaryDisplay\(\)/, 'mainWindowPersistence should own display work-area lookup.');
assert.match(helper, /normalizeRestoredWindowState\(/, 'mainWindowPersistence should normalize restored window bounds.');
assert.match(helper, /resolveWindowMode\(/, 'mainWindowPersistence should resolve legacy window-mode storage.');
assert.doesNotMatch(
  helper,
  /store\.get\(windowStateKey\) as WindowState/,
  'mainWindowPersistence should pass unknown persisted window-state values through the normalizer instead of casting them.',
);
assert.match(
  helper,
  /const stored = store\.get\(windowStateKey\);[\s\S]*normalizeRestoredWindowState\(stored\)/,
  'mainWindowPersistence initial bounds should normalize raw persisted window-state values.',
);
assert.match(
  helper,
  /normalizeRestoredWindowState\(store\.get\(windowStateKey\)\)/,
  'mainWindowPersistence compact-size preservation should normalize raw previous window-state values.',
);
assert.match(helper, /options\.persistSize === false/, 'mainWindowPersistence should preserve compact-width persistence bypass behavior.');
assert.match(
  helper,
  /function areWindowStatesEqual\b/,
  'mainWindowPersistence should compare normalized window states before persisting them.',
);
assert.match(
  helper,
  /if \(areWindowStatesEqual\(previous, nextState\)\) return;/,
  'mainWindowPersistence should skip store writes when the next window state matches the persisted state.',
);
assert.match(helper, /store\.set\(windowStateKey,/, 'mainWindowPersistence should persist bounds through the injected store.');

assert.match(composition, /from '\.\/mainWindowPersistence'/, 'main-window composition should import main-window persistence helpers from mainWindowPersistence.');
assert.match(composition, /const\s*\{\s*getInitialBounds,\s*persistWindowState,\s*getStoredWindowMode,\s*\}\s*=\s*createMainWindowPersistence\(\{/, 'main-window composition should create the main-window persistence helper set.');
assert.match(composition, /windowStateKey,/, 'main-window composition should inject the window-state key into the persistence helper.');
assert.match(composition, /windowModeKey,/, 'main-window composition should inject the window-mode key into the persistence helper.');
assert.match(composition, /legacyAlwaysOnTopKey,/, 'main-window composition should inject the legacy always-on-top key into the persistence helper.');
assert.doesNotMatch(main, /function getInitialBounds\(\) \{/, 'main should not define getInitialBounds inline after extraction.');
assert.doesNotMatch(main, /function persistWindowState\(/, 'main should not define persistWindowState inline after extraction.');
assert.doesNotMatch(main, /function getStoredWindowMode\(\)/, 'main should not define getStoredWindowMode inline after extraction.');

assert.equal(
  scripts['verify:electron-main-window-persistence-module'],
  'tsx scripts/verify-electron-main-window-persistence-module.ts',
  'package.json should expose the focused main-window persistence verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-window-persistence-module', 'cleanup-core should include the focused main-window persistence verifier.');

console.log('electron main-window persistence module verification passed');
