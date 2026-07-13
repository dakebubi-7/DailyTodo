import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const mainPath = join(root, 'electron/main.ts');
const bootstrapPath = join(root, 'electron/mainWindowBootstrap.ts');
const ipcRegistrationPath = join(root, 'electron/mainWindowIpcRegistration.ts');
const settingsIpcPath = join(root, 'electron/settingsIpc.ts');
const storeValueEqualityPath = join(root, 'electron/storeValueEquality.ts');
const preloadPath = join(root, 'electron/preload.ts');
const viteEnvPath = join(root, 'src/vite-env.d.ts');

const main = readFileSync(mainPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const ipcRegistration = readFileSync(ipcRegistrationPath, 'utf8');
const preload = readFileSync(preloadPath, 'utf8');
const viteEnv = readFileSync(viteEnvPath, 'utf8');

assert.ok(existsSync(settingsIpcPath), 'Electron settings IPC module should exist.');
assert.ok(existsSync(storeValueEqualityPath), 'Electron store value equality helper should exist.');

const settingsIpc = readFileSync(settingsIpcPath, 'utf8');
const storeValueEquality = readFileSync(storeValueEqualityPath, 'utf8');

assert.match(settingsIpc, /export function registerSettingsIpcHandlers\b/, 'settingsIpc should export registerSettingsIpcHandlers.');
assert.match(settingsIpc, /type RegisterSettingsIpcHandlersOptions\b/, 'settingsIpc should define explicit registration dependencies.');
assert.match(settingsIpc, /BrowserWindow\.getAllWindows/, 'settingsIpc should preserve task broadcast behavior for store:set.');
assert.match(settingsIpc, /createDefaultObsidianTemplateSettings/, 'settingsIpc should preserve Obsidian template reset behavior.');
assert.match(settingsIpc, /OBSIDIAN_TEMPLATE_SETTINGS_KEY/, 'settingsIpc should preserve the template settings storage key.');
assert.match(settingsIpc, /ElectronStoreLike/, 'settingsIpc should use a small store interface instead of owning store creation.');
assert.match(settingsIpc, /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/, 'settingsIpc should reuse the Electron object-record guard for batched IPC entries.');
assert.doesNotMatch(settingsIpc, /entries as Record<string, unknown>/, 'settingsIpc should not narrow batched IPC entries with a Record assertion.');
assert.match(settingsIpc, /from '\.\/storeValueEquality'/, 'settingsIpc should reuse the store-value equality helper before writing.');
assert.match(settingsIpc, /if \(areStoreValuesEqual\(store\.get\(key\), value\)\) return false;/, 'settings IPC should skip writes whose persisted value has not changed.');
assert.match(settingsIpc, /for \(const \[key, value\] of Object\.entries\(entries\)\) \{[\s\S]*?if \(setStoreValueIfChanged\(key, value\) && key === 'tasks'\) \{[\s\S]*?tasksChanged = true;/, 'batched writes should process every entry and broadcast task updates only when the task value changed.');
assert.match(storeValueEquality, /export function areStoreValuesEqual\(left: unknown, right: unknown\): boolean/, 'store value equality helper should expose structural comparison.');
assert.match(
  settingsIpc,
  /ipcMain\.handle\('store:get', \(_, key: unknown\) => \{[\s\S]*?if \(typeof key !== 'string'\) return undefined;[\s\S]*?return store\.get\(key\);[\s\S]*?\}\);/,
  'store:get should expose unknown runtime keys and read only after string narrowing.'
);
assert.match(
  settingsIpc,
  /ipcMain\.handle\('store:set', \(event, key: unknown, value: unknown\) => \{[\s\S]*?if \(typeof key !== 'string'\) return;[\s\S]*?const didChange = setStoreValueIfChanged\(key, value\);/,
  'store:set should expose unknown runtime keys and skip redundant values after string narrowing.'
);
assert.match(
  settingsIpc,
  /ipcMain\.handle\('store:getMany', \(_, keys: unknown\) => \{[\s\S]*?Array\.isArray\(keys\)[\s\S]*?\.filter\(\(key\): key is string => typeof key === 'string'\)/,
  'store:getMany should narrow untrusted keys before reading them.',
);
assert.match(
  settingsIpc,
  /ipcMain\.handle\('store:setMany', \(event, entries: unknown\) => \{[\s\S]*?for \(const \[key, value\] of Object\.entries\(entries\)\)[\s\S]*?setStoreValueIfChanged\(key, value\)/,
  'store:setMany should evaluate each untrusted entry only after validating the entry container.',
);
assert.match(
  preload,
  /getStore:\s*\(key:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('store:get', key\)/,
  'preload should forward store:get keys as unknown runtime data.'
);
assert.match(
  preload,
  /setStore:\s*\(key:\s*unknown,\s*value:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('store:set', key, value\)/,
  'preload should forward store:set keys as unknown runtime data.'
);
assert.match(
  preload,
  /getStoreMany:\s*\(keys:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('store:getMany', keys\)/,
  'preload should expose batched store reads.'
);
assert.match(
  preload,
  /setStoreMany:\s*\(entries:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('store:setMany', entries\)/,
  'preload should expose batched store writes.'
);
assert.match(
  preload,
  /setAppSettings:\s*\(settings:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('settings:setApp',\s*settings\)/,
  'preload should forward app settings as unknown runtime data.'
);
assert.match(
  preload,
  /setObsidianTemplateSettings:\s*\(settings:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('settings:setObsidianTemplates',\s*settings\)/,
  'preload should forward Obsidian template settings as unknown runtime data.'
);
assert.match(
  viteEnv,
  /getStore:\s*\(key:\s*unknown\)\s*=>\s*Promise<unknown>/,
  'ambient store getter should expose unknown keys at the preload boundary.'
);
assert.match(
  viteEnv,
  /setStore:\s*\(key:\s*unknown,\s*value:\s*unknown\)\s*=>\s*Promise<void>/,
  'ambient store setter should expose unknown keys at the preload boundary.'
);
assert.match(
  viteEnv,
  /getStoreMany:\s*\(keys:\s*unknown\)\s*=>\s*Promise<unknown>/,
  'ambient batched store getter should expose unknown keys at the preload boundary.'
);
assert.match(
  viteEnv,
  /setStoreMany:\s*\(entries:\s*unknown\)\s*=>\s*Promise<void>/,
  'ambient batched store setter should expose unknown entries at the preload boundary.'
);
assert.match(
  viteEnv,
  /setAppSettings:\s*\(settings:\s*unknown\)\s*=>\s*Promise<unknown>/,
  'ambient app settings setter should expose unknown inputs and return values at the preload boundary.'
);
assert.match(
  viteEnv,
  /setObsidianTemplateSettings:\s*\(settings:\s*unknown\)\s*=>\s*Promise<unknown>/,
  'ambient Obsidian template settings setter should expose unknown inputs and return values at the preload boundary.'
);
assert.doesNotMatch(
  viteEnv,
  /setAppSettings:\s*\(settings:\s*unknown\)\s*=>\s*Promise<\{\s*ok:\s*boolean\s*\}>/,
  'ambient app settings setter should not claim trusted write-result objects.'
);
assert.doesNotMatch(
  viteEnv,
  /setObsidianTemplateSettings:\s*\(settings:\s*unknown\)\s*=>\s*Promise<\{\s*ok:\s*boolean\s*\}>/,
  'ambient Obsidian template settings setter should not claim trusted write-result objects.'
);
assert.doesNotMatch(
  viteEnv,
  /getStore:\s*\(key:\s*string\)/,
  'ambient store getter should not claim trusted string keys.'
);
assert.doesNotMatch(
  viteEnv,
  /setStore:\s*\(key:\s*string,/,
  'ambient store setter should not claim trusted string keys.'
);
assert.doesNotMatch(
  viteEnv,
  /setAppSettings:\s*\(settings:\s*import\('\.\.\/shared\/appSettings'\)\.AppBehaviorSettings\)/,
  'ambient app settings setter should not claim trusted AppBehaviorSettings input.'
);
assert.doesNotMatch(
  viteEnv,
  /setObsidianTemplateSettings:\s*\(settings:\s*import\('\.\.\/shared\/appSettings'\)\.ObsidianTemplateSettings\)/,
  'ambient Obsidian template settings setter should not claim trusted ObsidianTemplateSettings input.'
);

assert.match(
  viteEnv,
  /getAppSettings:\s*\(\)\s*=>\s*Promise<unknown>/,
  'ambient app settings getter should expose unknown at the preload boundary.'
);
assert.match(
  viteEnv,
  /getObsidianTemplateSettings:\s*\(\)\s*=>\s*Promise<unknown>/,
  'ambient Obsidian template settings getter should expose unknown at the preload boundary.'
);
assert.match(
  viteEnv,
  /resetObsidianTemplateSettings:\s*\(\)\s*=>\s*Promise<unknown>/,
  'ambient Obsidian template settings reset should expose unknown at the preload boundary.'
);
assert.doesNotMatch(
  viteEnv,
  /getAppSettings:\s*\(\)\s*=>\s*Promise<import\('\.\.\/shared\/appSettings'\)\.AppBehaviorSettings>/,
  'ambient app settings getter should not claim trusted AppBehaviorSettings return values.'
);
assert.doesNotMatch(
  viteEnv,
  /getObsidianTemplateSettings:\s*\(\)\s*=>\s*Promise<import\('\.\.\/shared\/appSettings'\)\.ObsidianTemplateSettings>/,
  'ambient Obsidian template settings getter should not claim trusted return values.'
);


for (const channel of [
  'store:get',
  'store:set',
  'store:getMany',
  'store:setMany',
  'settings:getApp',
  'settings:setApp',
  'settings:getObsidianTemplates',
  'settings:setObsidianTemplates',
  'settings:resetObsidianTemplates',
]) {
  const registrationPattern = new RegExp("ipcMain\\.handle\\('" + channel + "'");
  assert.match(settingsIpc, registrationPattern, `settingsIpc should register ${channel}.`);
  assert.doesNotMatch(main, registrationPattern, `main should not register ${channel} inline.`);
}

assert.match(main, /from '\.\/mainWindowComposition'/, 'main should delegate settings IPC wiring through main-window composition.');
assert.match(bootstrap, /from '\.\/mainWindowIpcRegistration'/, 'mainWindowBootstrap should delegate settings IPC registration through the focused IPC composition helper.');
assert.match(ipcRegistration, /from '\.\/settingsIpc'/, 'mainWindowIpcRegistration should import settings IPC registration from settingsIpc.');
assert.match(ipcRegistration, /registerSettingsIpcHandlers\(/, 'mainWindowIpcRegistration should call registerSettingsIpcHandlers.');
assert.doesNotMatch(settingsIpc, /createSafeStore|new Store\(/, 'settingsIpc should not create or own Electron Store.');

console.log('electron settings IPC module verification passed');
