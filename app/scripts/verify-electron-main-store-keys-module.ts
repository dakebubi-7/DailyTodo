import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'mainStoreKeys.ts');
const mainPath = join(root, 'electron', 'main.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron main store-keys module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

for (const key of [
  'OBSIDIAN_PATH_KEY',
  'WINDOW_STATE_KEY',
  'COMPACT_MODE_KEY',
  'AUTO_START_KEY',
]) {
  assert.match(helper, new RegExp(`export const ${key} =`), `mainStoreKeys should export ${key}.`);
}

assert.match(helper, /export const OBSIDIAN_PATH_KEY = 'obsidianVaultPath';/, 'mainStoreKeys should preserve the Obsidian vault path storage key.');
assert.match(helper, /export const WINDOW_STATE_KEY = 'windowState';/, 'mainStoreKeys should preserve the window state storage key.');
assert.match(helper, /export const COMPACT_MODE_KEY = 'compactMode';/, 'mainStoreKeys should preserve the compact-mode storage key.');
assert.match(helper, /export const AUTO_START_KEY = 'autoStart';/, 'mainStoreKeys should preserve the auto-start storage key.');

assert.match(main, /from '\.\/mainStoreKeys'/, 'main should import store key constants from mainStoreKeys.');
assert.doesNotMatch(main, /const OBSIDIAN_PATH_KEY = 'obsidianVaultPath';/, 'main should not define OBSIDIAN_PATH_KEY inline after extraction.');
assert.doesNotMatch(main, /const WINDOW_STATE_KEY = 'windowState';/, 'main should not define WINDOW_STATE_KEY inline after extraction.');
assert.doesNotMatch(main, /const COMPACT_MODE_KEY = 'compactMode';/, 'main should not define COMPACT_MODE_KEY inline after extraction.');
assert.doesNotMatch(main, /const AUTO_START_KEY = 'autoStart';/, 'main should not define AUTO_START_KEY inline after extraction.');
assert.match(main, /obsidianPathKey: OBSIDIAN_PATH_KEY/, 'main should continue injecting OBSIDIAN_PATH_KEY into startup/bootstrap composition.');
assert.match(main, /windowStateKey: WINDOW_STATE_KEY/, 'main should continue injecting WINDOW_STATE_KEY into persistence composition.');
assert.match(main, /compactModeKey: COMPACT_MODE_KEY/, 'main should continue injecting COMPACT_MODE_KEY into bootstrap composition.');
assert.match(main, /autoStartKey: AUTO_START_KEY/, 'main should continue injecting AUTO_START_KEY into bootstrap composition.');

assert.equal(
  scripts['verify:electron-main-store-keys-module'],
  'tsx scripts/verify-electron-main-store-keys-module.ts',
  'package.json should expose the focused main store-keys verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-store-keys-module', 'cleanup-core should include the focused main store-keys verifier.');

console.log('electron main store-keys module verification passed');
