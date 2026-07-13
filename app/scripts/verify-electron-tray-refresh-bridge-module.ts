import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'trayRefreshBridge.ts');
const compositionPath = join(root, 'electron', 'mainWindowComposition.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron tray refresh bridge module should exist.');

const bridge = readFileSync(modulePath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(bridge, /export type TrayRefreshBridge\b/, 'tray refresh bridge should export its bridge contract.');
assert.match(bridge, /refreshTrayMenu:\s*\(\)\s*=>\s*void/, 'tray refresh bridge contract should expose a stable refresh callback.');
assert.match(bridge, /setRefreshTrayMenu:\s*\(refreshTrayMenu:\s*\(\)\s*=>\s*void\)\s*=>\s*void/, 'tray refresh bridge contract should expose a delayed setter.');
assert.match(bridge, /export function createTrayRefreshBridge\b/, 'tray refresh bridge should export createTrayRefreshBridge.');
assert.match(bridge, /let refreshTrayMenuImpl:\s*\(\(\)\s*=>\s*void\)\s*\|\s*null\s*=\s*null;/, 'tray refresh bridge should own the nullable delayed tray refresh callback.');
assert.match(bridge, /refreshTrayMenu:\s*\(\)\s*=>\s*\{\s*refreshTrayMenuImpl\?\.\(\);\s*\}/, 'tray refresh bridge should preserve optional refresh-call semantics before shell setup.');
assert.match(bridge, /setRefreshTrayMenu:\s*\(refreshTrayMenu(?::\s*\(\)\s*=>\s*void)?\)\s*=>\s*\{\s*refreshTrayMenuImpl\s*=\s*refreshTrayMenu;\s*\}/, 'tray refresh bridge should store the real shell refresh callback.');

assert.match(composition, /refreshTrayMenu:\s*trayRefreshBridge\.refreshTrayMenu,/, 'main-window composition should inject the bridge callback into the mode controller.');
assert.match(composition, /trayRefreshBridge\.setRefreshTrayMenu\(refreshTrayMenu\)/, 'main-window composition should set the real shell tray refresh callback after shell controller creation.');
assert.ok(
  composition.indexOf('createMainWindowModeController({') < composition.indexOf('createMainShellController({'),
  'main-window composition should create the mode controller before the shell controller provides its refresh callback.',
);
assert.ok(
  composition.indexOf('createMainShellController({') < composition.indexOf('trayRefreshBridge.setRefreshTrayMenu(refreshTrayMenu)'),
  'main-window composition should set the real tray refresh callback after the shell controller creates it.',
);
assert.doesNotMatch(composition, /let refreshTrayMenuImpl:/, 'main-window composition should not keep the nullable tray refresh callback inline after extraction.');
assert.doesNotMatch(composition, /refreshTrayMenuImpl\?\.\(\)/, 'main-window composition should not own the optional tray refresh invocation after extraction.');

assert.equal(
  scripts['verify:electron-tray-refresh-bridge-module'],
  'tsx scripts/verify-electron-tray-refresh-bridge-module.ts',
  'package.json should expose the focused tray refresh bridge verifier.',
);
assertCleanupCoreIncludes('verify:electron-tray-refresh-bridge-module', 'cleanup-core should include the focused tray refresh bridge verifier.');

console.log('electron tray refresh bridge module verification passed');
