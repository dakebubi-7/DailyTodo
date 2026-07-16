import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'settingsModeState.ts');
const mainPath = join(root, 'electron', 'main.ts');
const bootstrapPath = join(root, 'electron', 'mainWindowBootstrap.ts');
const bootstrapTypesPath = join(root, 'electron', 'mainWindowBootstrapTypes.ts');
const windowIpcPath = join(root, 'electron', 'windowIpc.ts');
const mainWindowEventsPath = join(root, 'electron', 'mainWindowEvents.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron settings-mode state module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const bootstrapTypes = readFileSync(bootstrapTypesPath, 'utf8');
const windowIpc = readFileSync(windowIpcPath, 'utf8');
const mainWindowEvents = readFileSync(mainWindowEventsPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export type SettingsModeState\b/, 'settingsModeState should export the shared SettingsModeState type.');
assert.match(helper, /export function createSettingsModeState\b/, 'settingsModeState should export createSettingsModeState.');
assert.match(helper, /type CreateSettingsModeStateOptions\b/, 'settingsModeState should define explicit creation dependencies.');
assert.match(helper, /let open = false;/, 'settingsModeState should own the open-state truth source.');
assert.match(helper, /let restoreWidth = initialRestoreWidth;/, 'settingsModeState should own restore-width state.');
assert.match(helper, /isOpen:\s*\(\)\s*=>\s*open/, 'settingsModeState should expose open-state reads.');
assert.match(helper, /setOpen:\s*\(nextOpen\)\s*=>\s*\{\s*open = nextOpen;\s*\}/, 'settingsModeState should expose open-state writes.');
assert.match(helper, /getRestoreWidth:\s*\(\)\s*=>\s*restoreWidth/, 'settingsModeState should expose restore-width reads.');
assert.match(helper, /setRestoreWidth:\s*\(width\)\s*=>\s*\{\s*restoreWidth = width;\s*\}/, 'settingsModeState should expose restore-width writes.');

assert.match(main, /from '\.\/settingsModeState'/, 'main should import settings-mode state helpers from settingsModeState.');
assert.match(main, /const settingsMode = createSettingsModeState\(\{ initialRestoreWidth: RESET_WINDOW_WIDTH \}\)/, 'main should create shared settings-mode state through the helper.');
assert.doesNotMatch(main, /let settingsModeOpen = false;/, 'main should not keep settingsModeOpen inline after extraction.');
assert.doesNotMatch(main, /let settingsModeRestoreWidth = RESET_WINDOW_WIDTH;/, 'main should not keep settingsModeRestoreWidth inline after extraction.');
assert.doesNotMatch(main, /settingsMode:\s*\{\s*isOpen:/, 'main should not rebuild the settings-mode state object inline after extraction.');

assert.match(bootstrapTypes, /from '\.\/settingsModeState'/, 'mainWindowBootstrapTypes should import the shared SettingsModeState type.');
assert.match(bootstrapTypes, /settingsMode:\s*SettingsModeState;/, 'mainWindowBootstrapTypes should depend on the shared SettingsModeState type.');
assert.match(bootstrap, /from '\.\/mainWindowBootstrapTypes'/, 'mainWindowBootstrap should depend on its focused dependency contract.');
assert.doesNotMatch(bootstrap, /getSettingsModeOpen:\s*\(\)\s*=>/, 'mainWindowBootstrap should not require a separate settings-mode getter callback after extraction.');

assert.match(windowIpc, /from '\.\/settingsModeState'/, 'windowIpc should import the shared SettingsModeState type.');
assert.match(windowIpc, /settingsMode:\s*SettingsModeState;/, 'windowIpc should use the shared SettingsModeState type.');
assert.doesNotMatch(windowIpc, /type SettingsModeState = \{/, 'windowIpc should not redefine SettingsModeState inline.');

assert.match(mainWindowEvents, /from '\.\/settingsModeState'/, 'mainWindowEvents should import the shared settings-mode type.');
assert.match(mainWindowEvents, /settingsMode:\s*Pick<SettingsModeState,\s*'isOpen'>;/, 'mainWindowEvents should depend only on the shared settings-mode read surface.');
assert.match(mainWindowEvents, /persistWindowState\(win,\s*\{\s*persistSize:\s*!settingsMode\.isOpen\(\)\s*\}\)/, 'mainWindowEvents should read settings-mode openness through the shared state object.');
assert.doesNotMatch(mainWindowEvents, /getSettingsModeOpen\(\)/, 'mainWindowEvents should not keep a separate settings-mode getter after extraction.');

assert.equal(
  scripts['verify:electron-settings-mode-state-module'],
  'tsx scripts/verify-electron-settings-mode-state-module.ts',
  'package.json should expose the focused settings-mode state verifier.',
);
assertCleanupCoreIncludes('verify:electron-settings-mode-state-module', 'cleanup-core should include the focused settings-mode state verifier.');

console.log('electron settings-mode state module verification passed');
