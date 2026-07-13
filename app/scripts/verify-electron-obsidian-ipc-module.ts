import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/obsidianIpc.ts');
const syncPath = join(root, 'electron/obsidianSync.ts');
const preloadPath = join(root, 'electron/preload.ts');
const viteEnvPath = join(root, 'src/vite-env.d.ts');
const bootstrapPath = join(root, 'electron/mainWindowBootstrap.ts');
const ipcRegistrationPath = join(root, 'electron/mainWindowIpcRegistration.ts');
const mainPath = join(root, 'electron/main.ts');
const packagePath = join(root, 'package.json');
const taskStorePath = join(root, 'src/store/taskStore.ts');
const templateCenterPath = join(root, 'src/components/ObsidianTemplateCenter.tsx');
const templateCenterStatePath = join(root, 'src/components/useObsidianTemplateCenterState.ts');
const templateRecognitionPath = join(root, 'shared/obsidianTemplateRecognition.ts');

assert.ok(existsSync(modulePath), 'Electron Obsidian IPC module should exist.');
assert.ok(existsSync(bootstrapPath), 'Electron main-window bootstrap module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const sync = readFileSync(syncPath, 'utf8');
const preload = readFileSync(preloadPath, 'utf8');
const viteEnv = readFileSync(viteEnvPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const ipcRegistration = readFileSync(ipcRegistrationPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const taskStore = readFileSync(taskStorePath, 'utf8');
const templateCenter = readFileSync(templateCenterPath, 'utf8');
const templateCenterState = readFileSync(templateCenterStatePath, 'utf8');
const templateRecognition = readFileSync(templateRecognitionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /import \{[^}]*app[^}]*dialog[^}]*ipcMain[^}]*shell[^}]*\} from 'electron'/, 'Obsidian IPC module should own Electron dialog, shell, and ipcMain registration.');
assert.match(helper, /export function registerObsidianIpcHandlers\b/, 'Obsidian IPC module should export registerObsidianIpcHandlers.');
assert.match(helper, /type RegisterObsidianIpcHandlersOptions\b/, 'Obsidian IPC module should define explicit registration dependencies.');
assert.match(helper, /buildRecognizeObsidianTemplateMessages/, 'Obsidian IPC module should own template-recognition prompt wiring.');
assert.match(helper, /parseRecognizedObsidianTemplateDraft/, 'Obsidian IPC module should own template-recognition draft parsing.');
assert.match(helper, /validateObsidianTemplateRecognitionInput/, 'Obsidian IPC module should own template-recognition input validation.');
assert.match(
  helper,
  /obsidianTemplate:recognize'[\s\S]*validateObsidianTemplateRecognitionInput\(rawTemplate\)[\s\S]*getAiReviewSettings\(\)/,
  'Obsidian template recognition should validate rawTemplate before checking AI settings or API keys.',
);
assert.match(
  helper,
  /obsidianTemplate:recognize', async \(_event, rawTemplate: unknown\)/,
  'Obsidian template recognition IPC should expose rawTemplate as unknown before validation.',
);
assert.match(
  preload,
  /recognize: \(rawTemplate: unknown\) => ipcRenderer\.invoke\('obsidianTemplate:recognize', rawTemplate\)/,
  'Obsidian template recognition preload API should forward unknown runtime template input.',
);
assert.match(
  viteEnv,
  /obsidianTemplate:\s*\{[\s\S]*recognize: \(rawTemplate: unknown\) => Promise<unknown>/,
  'Obsidian template recognition ambient preload type should expose rawTemplate and return as unknown.',
);
assert.doesNotMatch(
  viteEnv,
  /obsidianTemplate:\s*\{[\s\S]*recognize: \(rawTemplate: unknown\) => Promise<\s*\|?\s*\{ ok: true; draft:/,
  'Obsidian template recognition ambient preload type should not claim a trusted structured recognition result.',
);
assert.match(
  viteEnv,
  /obsidianTemplate:\s*\{[\s\S]*pickTemplateFile: \(\) => Promise<unknown>/,
  'Obsidian template picker ambient preload type should expose unknown returns.',
);
assert.doesNotMatch(
  viteEnv,
  /obsidianTemplate:\s*\{[\s\S]*pickTemplateFile: \(\) => Promise<\{ ok: boolean; text\?: string; fileName\?: string; error\?: string; canceled\?: boolean \}>/,
  'Obsidian template picker ambient preload type should not claim trusted picker result returns.',
);
assert.match(
  templateRecognition,
  /readObsidianTemplateRecognitionResult/,
  'shared Obsidian template recognition module should export a runtime reader for recognition results.',
);
assert.match(
  templateRecognition,
  /readTemplatePickerResult/,
  'shared Obsidian template recognition module should export a runtime reader for template picker results.',
);
assert.match(
  templateCenterState,
  /readObsidianTemplateRecognitionResult/,
  'ObsidianTemplateCenter state hook should import the recognition-result reader.',
);
assert.match(
  templateCenterState,
  /readTemplatePickerResult/,
  'ObsidianTemplateCenter state hook should import the template-picker reader.',
);
assert.match(
  templateCenterState,
  /const result = readTemplatePickerResult\(\s*await window\.electronAPI\?\.obsidianTemplate\.pickTemplateFile\(\)\s*\)/,
  'ObsidianTemplateCenter state hook should parse template-picker IPC returns before reading result fields.',
);
assert.match(
  templateCenterState,
  /const result = readObsidianTemplateRecognitionResult\(\s*await window\.electronAPI\?\.obsidianTemplate\.recognize\(draftText\)\s*\)/,
  'ObsidianTemplateCenter state hook should parse recognition IPC returns before reading result fields.',
);
assert.match(
  templateCenter,
  /useObsidianTemplateCenterState/,
  'ObsidianTemplateCenter should compose its extracted state hook.',
);
assert.match(helper, /resolveActiveProfile/, 'Obsidian IPC module should preserve AI Review profile gating for template recognition.');
assert.match(helper, /getLlmCaller\(\): \(messages: ChatMessage\[\]\) => Promise<LlmResult>/, 'Obsidian IPC should expose the shared LLM result contract.');
assert.match(helper, /dialog\.showOpenDialog/, 'Obsidian IPC module should own Obsidian picker dialogs.');
assert.match(helper, /syncTasksToObsidian\(/, 'Obsidian IPC module should delegate task sync through injected syncTasksToObsidian.');
assert.match(helper, /previewTasksToObsidian\(/, 'Obsidian IPC module should delegate preview through injected previewTasksToObsidian.');
assert.match(helper, /buildDailyTemplate\(/, 'Obsidian IPC module should preserve daily-note bootstrap behavior.');
assert.match(helper, /triggerOverviewUpdate\(/, 'Obsidian IPC module should preserve overview refresh behavior after opening daily notes.');
assert.match(helper, /shell\.openPath\(/, 'Obsidian IPC module should preserve opening the daily note through the shell.');
assert.match(
  helper,
  /const filePath = result\.filePaths\[0\];[\s\S]*typeof filePath !== 'string'[\s\S]*path\.basename\(filePath\)/,
  'Obsidian template picker should reject malformed non-string runtime paths before deriving the file name.',
);
assert.match(
  helper,
  /statSync\(filePath\)\.isFile\(\)[\s\S]*readFileSync\(filePath, 'utf-8'\)/,
  'Template file picker should verify the selected path is a real file before reading it.',
);
assert.match(
  helper,
  /statSync\(filePath\)\.isFile\(\)/,
  'Obsidian openDailyNote should reject existing daily note targets that are not files before shell.openPath.',
);
assert.match(
  helper,
  /obsidian:openDailyNote'[\s\S]*date !== undefined && typeof date !== 'string'[\s\S]*getDateKey\(date\)/,
  'Obsidian openDailyNote should reject non-string runtime date input before deriving daily note paths.',
);
assert.match(
  helper,
  /obsidian:openDailyNote', async \(_event, date\?: unknown\)/,
  'Obsidian openDailyNote IPC should expose date as unknown before runtime narrowing.',
);
assert.match(
  preload,
  /openDailyNote: \(date\?: unknown\) => ipcRenderer\.invoke\('obsidian:openDailyNote', date\)/,
  'Obsidian openDailyNote preload API should forward unknown runtime date input.',
);
assert.match(
  viteEnv,
  /openDailyNote: \(date\?: unknown\) => Promise<unknown>/,
  'Obsidian openDailyNote ambient preload type should expose date and return as unknown.',
);
assert.doesNotMatch(
  viteEnv,
  /openDailyNote: \(date\?: unknown\) => Promise<\{ ok: boolean; filePath\?: string; reason\?: string \}>/,
  'Obsidian openDailyNote ambient preload type should not claim a trusted structured result.',
);
assert.doesNotMatch(
  helper,
  /store\.set\(obsidianPathKey, result\.filePaths\[0\]\)/,
  'Obsidian choosePath should not persist raw runtime dialog path values without narrowing.',
);
assert.match(
  helper,
  /obsidian:choosePath'[\s\S]*const filePath = result\.filePaths\[0\];[\s\S]*typeof filePath !== 'string'[\s\S]*store\.set\(obsidianPathKey, filePath\)/,
  'Obsidian choosePath should reject malformed non-string runtime paths before writing to the store.',
);
assert.doesNotMatch(
  helper,
  /store\.get\(obsidianPathKey\) \|\| getDefaultVaultPath\(\)/,
  'Obsidian path IPC should not return malformed truthy stored path values directly.',
);
assert.match(
  helper,
  /const getStoredObsidianPath = \(\) => \{[\s\S]*const storedPath = store\.get\(obsidianPathKey\);[\s\S]*typeof storedPath === 'string' \? storedPath : getDefaultVaultPath\(\);[\s\S]*\}/,
  'Obsidian path IPC should normalize stored path reads to string values or the default vault path.',
);
assert.match(
  helper,
  /obsidian:getPath'[\s\S]*getStoredObsidianPath\(\)/,
  'Obsidian getPath should use the normalized stored path accessor.',
);
assert.doesNotMatch(
  helper,
  /syncTasksToObsidian\(tasks, date, dailyWork \|\| '', inspiration \|\| '', beforeTasks\)/,
  'Obsidian sync IPC should not coerce falsy malformed daily section values to empty strings before runtime validation.',
);
assert.doesNotMatch(
  helper,
  /previewTasksToObsidian\(tasks, date, dailyWork \|\| '', inspiration \|\| '', beforeTasks\)/,
  'Obsidian preview IPC should not coerce falsy malformed daily section values to empty strings before runtime validation.',
);
assert.match(
  helper,
  /syncTasksToObsidian\(\s*tasks,\s*date,\s*dailyWork === undefined \? '' : dailyWork,\s*inspiration === undefined \? '' : inspiration,\s*beforeTasks,\s*\)/,
  'Obsidian sync IPC should default only omitted daily section values while preserving malformed runtime values for validation.',
);
assert.match(
  helper,
  /previewTasksToObsidian\(\s*tasks,\s*date,\s*dailyWork === undefined \? '' : dailyWork,\s*inspiration === undefined \? '' : inspiration,\s*beforeTasks,\s*\)/,
  'Obsidian preview IPC should default only omitted daily section values while preserving malformed runtime values for validation.',
);
assert.match(
  helper,
  /syncTasksToObsidian\(tasks: unknown, date\?: unknown, dailyWork\?: unknown, inspiration\?: unknown, beforeTasks\?: unknown\): unknown;/,
  'Obsidian sync IPC dependencies should receive runtime payloads as unknown before sync validation.',
);
assert.match(
  helper,
  /previewTasksToObsidian\(tasks: unknown, date\?: unknown, dailyWork\?: unknown, inspiration\?: unknown, beforeTasks\?: unknown\): unknown;/,
  'Obsidian preview IPC dependencies should receive runtime payloads as unknown before preview validation.',
);
assert.match(
  helper,
  /obsidian:syncTasks', \(_event, tasks: unknown, date\?: unknown, dailyWork\?: unknown, inspiration\?: unknown, beforeTasks\?: unknown\)/,
  'Obsidian sync IPC should expose all runtime payloads as unknown before validation.',
);
assert.match(
  helper,
  /obsidian:previewTasks', \(_event, tasks: unknown, date\?: unknown, dailyWork\?: unknown, inspiration\?: unknown, beforeTasks\?: unknown\)/,
  'Obsidian preview IPC should expose all runtime payloads as unknown before validation.',
);
assert.match(
  sync,
  /function syncTasksToObsidian\(\s*tasks: unknown,\s*date\?: unknown,\s*dailyWork: unknown = '',\s*inspiration: unknown = '',\s*beforeTasks\?: unknown,\s*\)/,
  'Obsidian sync helper should validate unknown runtime payloads at its entry point.',
);
assert.match(
  sync,
  /function previewTasksToObsidian\(\s*tasks: unknown,\s*date\?: unknown,\s*dailyWork: unknown = '',\s*inspiration: unknown = '',\s*beforeTasks\?: unknown,\s*\)/,
  'Obsidian preview helper should validate unknown runtime payloads at its entry point.',
);
assert.match(
  preload,
  /syncTasksToObsidian: \(tasks: unknown, selectedDate\?: unknown, dailyWork\?: unknown, dailyInspiration\?: unknown, beforeTasks\?: unknown\) => ipcRenderer\.invoke\('obsidian:syncTasks', tasks, selectedDate, dailyWork, dailyInspiration, beforeTasks\)/,
  'Obsidian sync preload API should forward runtime payloads as unknown.',
);
assert.match(
  preload,
  /previewTasksToObsidian: \(tasks: unknown, selectedDate\?: unknown, dailyWork\?: unknown, dailyInspiration\?: unknown, beforeTasks\?: unknown\) => ipcRenderer\.invoke\('obsidian:previewTasks', tasks, selectedDate, dailyWork, dailyInspiration, beforeTasks\)/,
  'Obsidian preview preload API should forward runtime payloads as unknown.',
);
assert.match(
  viteEnv,
  /syncTasksToObsidian: \(\s*tasks: unknown,\s*selectedDate\?: unknown,\s*dailyWork\?: unknown,\s*dailyInspiration\?: unknown,\s*beforeTasks\?: unknown\s*\) => Promise<unknown>/,
  'Obsidian sync ambient preload type should expose runtime payloads and return as unknown.',
);
assert.doesNotMatch(
  viteEnv,
  /syncTasksToObsidian:[\s\S]*?Promise<\{\s*ok: boolean;\s*filePath\?: string;\s*reason\?: string \}>/,
  'Obsidian sync ambient preload type should not claim a trusted structured result.',
);
assert.match(
  taskStore,
  /readObsidianActionResult/,
  'taskStore should parse Obsidian sync/open results with a browser-safe reader.',
);
assert.match(
  taskStore,
  /return readObsidianActionResult\(\s*await electronAPI\.syncTasksToObsidian/,
  'syncTasksToObsidian wrapper should parse unknown IPC returns before exposing them to hooks.',
);
assert.match(
  taskStore,
  /return readObsidianActionResult\(await electronAPI\.openDailyNote\(date\)\)/,
  'openDailyNote wrapper should parse unknown IPC returns before exposing them to hooks.',
);
assert.match(
  viteEnv,
  /previewTasksToObsidian: \(\s*tasks: unknown,\s*selectedDate\?: unknown,\s*dailyWork\?: unknown,\s*dailyInspiration\?: unknown,\s*beforeTasks\?: unknown\s*\) => Promise/,
  'Obsidian preview ambient preload type should expose runtime payloads as unknown.',
);
assert.match(
  viteEnv,
  /previewTasksToObsidian: \(\s*tasks: unknown,\s*selectedDate\?: unknown,\s*dailyWork\?: unknown,\s*dailyInspiration\?: unknown,\s*beforeTasks\?: unknown\s*\) => Promise<unknown>/,
  'ambient Obsidian preview should expose unknown return values at the preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /previewTasksToObsidian:[\s\S]*?Promise<import\('\.\.\/shared\/obsidianTemplates'\)\.SyncPreview>/,
  'ambient Obsidian preview should not claim a trusted SyncPreview return.',
);

for (const channel of [
  'obsidianTemplate:recognize',
  'obsidianTemplate:pickTemplateFile',
  'obsidian:getPath',
  'obsidian:choosePath',
  'obsidian:syncTasks',
  'obsidian:previewTasks',
  'obsidian:openDailyNote',
]) {
  const registrationPattern = new RegExp("ipcMain\\.handle\\('" + channel + "'");
  assert.match(helper, registrationPattern, `Obsidian IPC module should register ${channel}.`);
  assert.doesNotMatch(main, registrationPattern, `main should not register ${channel} inline.`);
}

assert.match(main, /from '\.\/mainWindowComposition'/, 'main should delegate Obsidian IPC wiring through main-window composition.');
assert.match(bootstrap, /from '\.\/mainWindowIpcRegistration'/, 'mainWindowBootstrap should delegate Obsidian IPC composition through the focused helper.');
assert.match(ipcRegistration, /from '\.\/obsidianIpc'/, 'mainWindowIpcRegistration should import Obsidian IPC registration from obsidianIpc.');
assert.match(ipcRegistration, /registerObsidianIpcHandlers\(\{/, 'mainWindowIpcRegistration should delegate Obsidian IPC registration to the helper.');
assert.match(ipcRegistration, /obsidianPathKey,/, 'mainWindowIpcRegistration should pass the Obsidian path key to the helper.');
assert.match(ipcRegistration, /getDefaultVaultPath,/, 'mainWindowIpcRegistration should pass the default vault resolver to the helper.');
assert.match(ipcRegistration, /getVaultPath,/, 'mainWindowIpcRegistration should pass the vault-path resolver to the helper.');
assert.match(ipcRegistration, /getVaultStatus,/, 'mainWindowIpcRegistration should pass vault-status validation to the helper.');
assert.match(ipcRegistration, /getAiReviewSettings,/, 'mainWindowIpcRegistration should pass AI Review settings access to the helper for template recognition gating.');
assert.match(ipcRegistration, /getLlmCaller,/, 'mainWindowIpcRegistration should pass the shared LLM caller to the helper for template recognition.');
assert.match(ipcRegistration, /syncTasksToObsidian,/, 'mainWindowIpcRegistration should pass task-sync behavior to the helper.');
assert.match(ipcRegistration, /previewTasksToObsidian,/, 'mainWindowIpcRegistration should pass task-preview behavior to the helper.');
assert.match(ipcRegistration, /getDailyFilePath,/, 'mainWindowIpcRegistration should pass daily note path resolution to the helper.');
assert.match(ipcRegistration, /buildDailyTemplate,/, 'mainWindowIpcRegistration should pass daily note bootstrap generation to the helper.');
assert.match(ipcRegistration, /triggerOverviewUpdate,/, 'mainWindowIpcRegistration should pass overview refresh behavior to the helper.');
assert.match(ipcRegistration, /zh,/, 'mainWindowIpcRegistration should pass localization through the helper for dialog copy.');

assert.doesNotMatch(main, /buildRecognizeObsidianTemplateMessages/, 'main should not keep direct template-recognition prompt imports after Obsidian IPC extraction.');
assert.doesNotMatch(main, /parseRecognizedObsidianTemplateDraft/, 'main should not keep direct template-recognition draft parsing after Obsidian IPC extraction.');
assert.doesNotMatch(main, /validateObsidianTemplateRecognitionInput/, 'main should not keep direct template-recognition input validation after Obsidian IPC extraction.');

assert.equal(scripts['verify:electron-obsidian-ipc-module'], 'tsx scripts/verify-electron-obsidian-ipc-module.ts', 'package.json should expose the focused Obsidian IPC verifier.');
assertCleanupCoreIncludes('verify:electron-obsidian-ipc-module', 'cleanup-core should include the focused Obsidian IPC verifier.');

console.log('electron Obsidian IPC module verification passed');
