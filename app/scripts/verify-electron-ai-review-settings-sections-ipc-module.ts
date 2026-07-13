import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewSettingsSectionsIpc.ts');
const parentPath = join(root, 'electron', 'aiReviewIpc.ts');
const packagePath = join(root, 'package.json');
const preloadPath = join(root, 'electron', 'preload.ts');
const viteEnvPath = join(root, 'src', 'vite-env.d.ts');

assert.ok(existsSync(modulePath), 'Electron AI Review settings/sections IPC module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const parent = readFileSync(parentPath, 'utf8');
const preload = readFileSync(preloadPath, 'utf8');
const viteEnv = readFileSync(viteEnvPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /import \{[^}]*ipcMain[^}]*\} from 'electron'/, 'settings/sections IPC module should own ipcMain registration.');
assert.match(moduleSource, /export type RegisterAiReviewSettingsSectionsIpcHandlersOptions\b/, 'settings/sections IPC module should export explicit registration dependencies.');
assert.match(moduleSource, /export function registerAiReviewSettingsSectionsIpcHandlers\b/, 'settings/sections IPC module should export its registration function.');

for (const channel of [
  'aiReview:getSettings',
  'aiReview:setSettings',
  'aiReview:getSections',
  'aiReview:setSections',
]) {
  assert.match(moduleSource, new RegExp(`ipcMain\\.handle\\('${channel}'`), `settings/sections IPC module should register ${channel}.`);
}

assert.match(moduleSource, /ipcMain\.handle\('aiReview:getSettings', \(\) => maskAiReviewSettingsSecretsForRenderer\(getAiReviewSettings\(\)\)\)/, 'settings/sections IPC module should mask secrets on settings getter.');
assert.match(moduleSource, /const next = setAiReviewSettings\(withSecrets\)/, 'settings/sections IPC module should preserve settings setter return value after secret merge.');
assert.match(moduleSource, /scheduleAiTimers\(\)/, 'settings/sections IPC module should reschedule AI timers after settings updates.');
assert.match(moduleSource, /if \(!areStoreValuesEqual\(current, next\)\) \{\s*scheduleAiTimers\(\);\s*\}/, 'settings/sections IPC module should skip timer rescheduling when normalized settings are unchanged.');
assert.match(moduleSource, /return maskAiReviewSettingsSecretsForRenderer\(next\)/, 'settings/sections IPC module should return masked AI Review settings after updates.');
assert.match(moduleSource, /ipcMain\.handle\('aiReview:getSections', \(\) => getReviewSections\(\)\)/, 'settings/sections IPC module should preserve review-sections getter handler.');
assert.match(moduleSource, /return setReviewSections\(value\)/, 'settings/sections IPC module should preserve review-sections setter return value.');
assert.match(
  preload,
  /setSettings:\s*\(v:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('aiReview:setSettings',\s*v\)/,
  'preload should forward AI Review settings as unknown runtime data.'
);
assert.match(
  preload,
  /setSections:\s*\(v:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('aiReview:setSections',\s*v\)/,
  'preload should forward AI Review sections as unknown runtime data.'
);
assert.match(
  viteEnv,
  /setSettings:\s*\(settings:\s*unknown\)\s*=>\s*Promise<unknown>/,
  'ambient AI Review settings setter should expose unknown input and unknown return at the preload boundary.'
);
assert.doesNotMatch(
  viteEnv,
  /setSettings:\s*\(settings:\s*unknown\)\s*=>\s*Promise<import\('\.\.\/shared\/aiReview\/aiReviewSettings'\)\.AiReviewSettings>/,
  'ambient AI Review settings setter should not claim trusted AiReviewSettings return values.'
);
assert.match(
  viteEnv,
  /setSections:\s*\(sections:\s*unknown\)\s*=>\s*Promise<unknown>/,
  'ambient AI Review sections setter should expose unknown input and unknown return at the preload boundary.'
);
assert.doesNotMatch(
  viteEnv,
  /setSections:\s*\(sections:\s*unknown\)\s*=>\s*Promise<import\('\.\.\/shared\/aiReview\/sectionConfig'\)\.SectionConfig\[\]>/,
  'ambient AI Review sections setter should not claim trusted SectionConfig[] return values.'
);
assert.doesNotMatch(
  viteEnv,
  /setSettings:\s*\(settings:\s*import\('\.\.\/shared\/aiReview\/aiReviewSettings'\)\.AiReviewSettings\)/,
  'ambient AI Review settings setter should not claim trusted AiReviewSettings input.'
);
assert.doesNotMatch(
  viteEnv,
  /setSections:\s*\(sections:\s*import\('\.\.\/shared\/aiReview\/sectionConfig'\)\.SectionConfig\[\]\)/,
  'ambient AI Review sections setter should not claim trusted SectionConfig[] input.'
);

assert.match(
  viteEnv,
  /getSettings:\s*\(\)\s*=>\s*Promise<unknown>/,
  'ambient AI Review settings getter should expose unknown at the preload boundary.'
);
assert.match(
  viteEnv,
  /getSections:\s*\(\)\s*=>\s*Promise<unknown>/,
  'ambient AI Review sections getter should expose unknown at the preload boundary.'
);
assert.doesNotMatch(
  viteEnv,
  /getSettings:\s*\(\)\s*=>\s*Promise<import\('\.\.\/shared\/aiReview\/aiReviewSettings'\)\.AiReviewSettings>/,
  'ambient AI Review settings getter should not claim trusted return values.'
);
assert.doesNotMatch(
  viteEnv,
  /getSections:\s*\(\)\s*=>\s*Promise<import\('\.\.\/shared\/aiReview\/sectionConfig'\)\.SectionConfig\[\]>/,
  'ambient AI Review sections getter should not claim trusted return values.'
);


assert.match(parent, /from '\.\/aiReviewSettingsSectionsIpc'/, 'parent AI Review IPC module should import the settings/sections IPC module.');
assert.match(parent, /registerAiReviewSettingsSectionsIpcHandlers\(\{/, 'parent AI Review IPC module should delegate settings/sections handler registration.');
for (const dependency of [
  'getAiReviewSettings',
  'setAiReviewSettings',
  'getReviewSections',
  'setReviewSections',
  'scheduleAiTimers',
]) {
  assert.match(parent, new RegExp(`\\b${dependency},`), `parent AI Review IPC module should pass ${dependency} to the settings/sections IPC module.`);
}

for (const channel of [
  'aiReview:getSettings',
  'aiReview:setSettings',
  'aiReview:getSections',
  'aiReview:setSections',
]) {
  assert.doesNotMatch(parent, new RegExp(`ipcMain\\.handle\\('${channel}'`), `parent AI Review IPC module should not register ${channel} inline after extraction.`);
}
assert.doesNotMatch(parent, /setAiReviewSettings\(value\)/, 'parent AI Review IPC module should not call setAiReviewSettings inline after extraction.');
assert.doesNotMatch(parent, /setReviewSections\(value\)/, 'parent AI Review IPC module should not call setReviewSections inline after extraction.');
assert.doesNotMatch(parent, /scheduleAiTimers\(\);/, 'parent AI Review IPC module should not reschedule AI timers inline after extraction.');

assert.equal(
  scripts['verify:electron-ai-review-settings-sections-ipc-module'],
  'tsx scripts/verify-electron-ai-review-settings-sections-ipc-module.ts',
  'package.json should expose the focused AI Review settings/sections IPC verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-settings-sections-ipc-module', 'cleanup-core should include the focused AI Review settings/sections IPC verifier.');

assert.match(moduleSource, /mergeAiReviewSettingsSecretsFromRenderer/, 'settings/sections IPC module should restore secrets from main-process storage on set.');
assert.match(moduleSource, /normalizeAiReviewSettings\(value\)/, 'settings/sections IPC module should normalize incoming settings before secret merge.');
console.log('electron AI Review settings/sections IPC module verification passed');
