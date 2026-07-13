import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/companionIpc.ts');
const companionPath = join(root, 'electron/obsidianCompanion.ts');
const planningPath = join(root, 'electron/obsidianCompanionPlanning.ts');
const templateRulesPath = join(root, 'electron/obsidianCompanionTemplateRules.ts');
const mobileInboxPath = join(root, 'electron/obsidianCompanionMobileInbox.ts');
const bootstrapPath = join(root, 'electron/mainWindowBootstrap.ts');
const ipcRegistrationPath = join(root, 'electron/mainWindowIpcRegistration.ts');
const mainPath = join(root, 'electron/main.ts');
const preloadPath = join(root, 'electron/preload.ts');
const viteEnvPath = join(root, 'src/vite-env.d.ts');
const appStateAccessorsPath = join(root, 'electron/appStateAccessors.ts');

assert.ok(existsSync(modulePath), 'Electron Companion IPC module should exist.');
assert.ok(existsSync(companionPath), 'Electron Obsidian Companion module should exist.');
assert.ok(existsSync(planningPath), 'Electron Companion planning module should exist.');
assert.ok(existsSync(templateRulesPath), 'Electron Companion template/rule policy module should exist.');
assert.ok(existsSync(mobileInboxPath), 'Electron Companion mobile inbox module should exist.');
assert.ok(existsSync(bootstrapPath), 'Electron main-window bootstrap module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const companion = readFileSync(companionPath, 'utf8');
const planning = readFileSync(planningPath, 'utf8');
const templateRules = readFileSync(templateRulesPath, 'utf8');
const mobileInbox = readFileSync(mobileInboxPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const ipcRegistration = readFileSync(ipcRegistrationPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const preload = readFileSync(preloadPath, 'utf8');
const viteEnv = readFileSync(viteEnvPath, 'utf8');
const appStateAccessors = readFileSync(appStateAccessorsPath, 'utf8');

assert.match(helper, /import \{ ipcMain \} from 'electron'/, 'Companion IPC module should own ipcMain registration.');
assert.match(helper, /buildSyncPlan/, 'Companion IPC module should build Companion sync plans.');
assert.match(helper, /writeSyncPlan/, 'Companion IPC module should write Companion sync plans.');
assert.match(helper, /importMobileInbox/, 'Companion IPC module should import mobile inbox items.');
assert.match(helper, /export function registerCompanionIpcHandlers\b/, 'Companion IPC module should export registerCompanionIpcHandlers.');
assert.match(mobileInbox, /function isAlreadyExistsError\(error: unknown\)/, 'Companion mobile inbox should keep a local EEXIST guard.');
assert.match(mobileInbox, /isObjectRecord\(error\) && error\.code === 'EEXIST'/, 'Companion mobile inbox EEXIST guard should read error codes after an object guard.');
assert.doesNotMatch(mobileInbox, /error as \{ code\?: unknown \}/, 'Companion mobile inbox EEXIST guard should not cast error objects before reading code.');
assert.match(
  templateRules,
  /export function matchesRule\(\s*item: CaptureItem,\s*rule: CompanionRule,\s*normalizedTags\?: ReadonlySet<string>,\s*normalizedContent\?: string,\s*\)/,
  'Companion rule matching should accept pre-normalized item values for batch planning.',
);
assert.match(
  planning,
  /for \(const item of items\) \{\s*const normalizedTags = new Set\(item\.tags\.map\(\(tag\) => tag\.replace\(\/\^#\/, ''\)\.toLowerCase\(\)\)\);/,
  'Companion batch planning should normalize each capture item tags once before matching rules.',
);
assert.match(
  planning,
  /if \(!matchesRule\(item, rule, normalizedTags, normalizedContent\)\) continue;/,
  'Companion batch planning should reuse normalized item values for every rule.',
);
assert.match(
  companion,
  /if \(next !== existing\) \{\s*writeTextFileAtomic\(change\.filePath, next\);\s*\}/,
  'Companion sync should skip physical file writes when generated content is unchanged.',
);
assert.match(helper, /getCompanionSettings\(\)/, 'Companion IPC module should receive Companion settings getter.');
assert.match(helper, /setCompanionSettings\(settings\)/, 'Companion IPC module should receive Companion settings setter.');
assert.match(helper, /ipcMain\.handle\('companion:getSettings'/, 'Companion IPC module should register getSettings.');
assert.match(helper, /ipcMain\.handle\('companion:setSettings'/, 'Companion IPC module should register setSettings.');
assert.match(helper, /ipcMain\.handle\('companion:previewSync'/, 'Companion IPC module should register previewSync.');
assert.match(helper, /ipcMain\.handle\('companion:writeSync'/, 'Companion IPC module should register writeSync.');
assert.match(helper, /ipcMain\.handle\('companion:importMobileInbox'/, 'Companion IPC module should register importMobileInbox.');
assert.doesNotMatch(
  helper,
  /buildSyncPlan\(settings, items \|\| \[\]\)/,
  'Companion IPC should not coerce falsy malformed items to an empty array before runtime validation.',
);
assert.match(
  helper,
  /buildSyncPlan\(getCompanionSettings\(\), items === undefined \? \[\] : items\)/,
  'Companion preview IPC should plan from configured settings and default only omitted items.',
);
assert.match(
  helper,
  /const plan = buildSyncPlan\(configured, items === undefined \? \[\] : items\)/,
  'Companion writeSync IPC should plan from configured settings and default only omitted items.',
);
assert.match(
  helper,
  /writeSyncPlan\(plan, configured\.vaultPath\)/,
  'Companion writeSync IPC should re-bind write vault to configured companion settings.',
);
assert.doesNotMatch(
  helper,
  /buildSyncPlan\(settings,/,
  'Companion IPC must ignore renderer-supplied settings when building sync plans.',
);
for (const handlerName of ['previewSync', 'writeSync']) {
  assert.match(
    helper,
    new RegExp(
      `ipcMain\\.handle\\('companion:${handlerName}',\\s*\\(_event,\\s*settings:\\s*unknown,\\s*items:\\s*unknown\\)\\s*=>`,
    ),
    `Companion ${handlerName} IPC handler should receive unknown runtime payloads.`,
  );
}
assert.match(
  helper,
  /type RegisterCompanionIpcHandlersOptions = \{[\s\S]*?setCompanionSettings\(settings:\s*unknown\):\s*void;[\s\S]*?\};/,
  'Companion IPC registration dependencies should preserve the unknown settings boundary.',
);
assert.match(
  bootstrap,
  /setCompanionSettings\(settings:\s*unknown\):\s*void;/,
  'mainWindowBootstrap should inject the Companion settings setter as an unknown runtime boundary.',
);
for (const apiName of ['previewCompanionSync', 'writeCompanionSync']) {
  assert.match(
    viteEnv,
    new RegExp(
      `${apiName}:\\s*\\([\\s\\S]*?settings:\\s*unknown[\\s\\S]*?items:\\s*unknown[\\s\\S]*?\\)\\s*=>\\s*Promise`,
    ),
    `vite-env should expose ${apiName} settings and items as unknown runtime data at the preload boundary.`,
  );
}
assert.doesNotMatch(
  viteEnv,
  /(previewCompanionSync|writeCompanionSync):\s*\([\s\S]*?items:\s*unknown\[\]/,
  'vite-env should not claim Companion sync items are already arrays at the preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /(previewCompanionSync|writeCompanionSync):\s*\([\s\S]*?settings:\s*import\('\.\.\/shared\/obsidianCompanion'\)\.CompanionSettings[\s\S]*?items:\s*import\('\.\.\/shared\/obsidianCompanion'\)\.CaptureItem\[\]/,
  'vite-env should not claim Companion sync inputs are trusted settings and capture items.',
);
assert.match(
  preload,
  /previewCompanionSync:\s*\(\s*settings:\s*unknown,\s*items:\s*unknown\)/,
  'preload should forward Companion preview settings and items as unknown runtime data.',
);
assert.match(
  preload,
  /writeCompanionSync:\s*\(\s*settings:\s*unknown,\s*items:\s*unknown\)/,
  'preload should forward Companion write settings and items as unknown runtime data.',
);
assert.match(
  preload,
  /setCompanionSettings:\s*\(\s*settings:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('companion:setSettings',\s*settings\)/,
  'preload should forward Companion settings setter input as unknown runtime data.',
);
assert.match(
  viteEnv,
  /setCompanionSettings:\s*\(settings:\s*unknown\)\s*=>\s*Promise<unknown>/,
  'ambient Companion settings setter should expose unknown inputs and return values at the preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /setCompanionSettings:\s*\(settings:\s*unknown\)\s*=>\s*Promise<\{\s*ok:\s*boolean\s*\}>/,
  'ambient Companion settings setter should not claim trusted write-result objects.',
);
assert.doesNotMatch(
  viteEnv,
  /setCompanionSettings:\s*\(settings:\s*import\('\.\.\/shared\/obsidianCompanion'\)\.CompanionSettings\)/,
  'ambient Companion settings setter should not claim trusted CompanionSettings input.',
);
assert.match(
  helper,
  /setCompanionSettings\(settings:\s*unknown\):\s*void/,
  'Companion IPC module should accept unknown settings setter input from IPC.',
);
assert.match(
  helper,
  /ipcMain\.handle\('companion:setSettings',\s*\(_event,\s*settings:\s*unknown\)\s*=>/,
  'Companion setSettings IPC handler should receive unknown runtime data.',
);
assert.match(
  appStateAccessors,
  /function setCompanionSettings\(value:\s*unknown\)/,
  'app state Companion settings setter should normalize unknown runtime data before persistence.',
);
assert.match(
  helper,
  /ipcMain\.handle\('companion:importMobileInbox',\s*\(_event,\s*inboxPath:\s*unknown\)\s*=>/,
  'Companion importMobileInbox IPC handler should receive unknown runtime data.',
);
assert.match(
  preload,
  /importMobileInbox:\s*\(\s*inboxPath:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('companion:importMobileInbox',\s*inboxPath\)/,
  'preload should forward mobile inbox path input as unknown runtime data.',
);
assert.match(
  viteEnv,
  /importMobileInbox:\s*\(inboxPath:\s*unknown\)\s*=>\s*Promise<unknown>/,
  'ambient mobile inbox import should expose unknown return values at the preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /importMobileInbox:\s*\(inboxPath:\s*string\)/,
  'ambient mobile inbox import should not claim a trusted string path input.',
);
assert.doesNotMatch(
  viteEnv,
  /importMobileInbox:\s*\(inboxPath:\s*unknown\)\s*=>\s*Promise<\{\s*ok:\s*boolean;\s*items:/,
  'ambient mobile inbox import should not claim a trusted structured import result.',
);
assert.match(
  viteEnv,
  /previewCompanionSync:\s*\(\s*settings:\s*unknown,\s*items:\s*unknown\s*\)\s*=>\s*Promise<unknown>/,
  'ambient Companion preview should expose unknown return values at the preload boundary.',
);
assert.match(
  viteEnv,
  /writeCompanionSync:\s*\(\s*settings:\s*unknown,\s*items:\s*unknown\s*\)\s*=>\s*Promise<unknown>/,
  'ambient Companion write should expose unknown return values at the preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /previewCompanionSync:[\s\S]*?Promise<import\('\.\.\/shared\/obsidianCompanion'\)\.SyncPlan>/,
  'ambient Companion preview should not claim a trusted SyncPlan return.',
);
assert.doesNotMatch(
  viteEnv,
  /writeCompanionSync:[\s\S]*?Promise<\{\s*ok:\s*boolean;\s*errors:\s*string\[\]\s*\}>/,
  'ambient Companion write should not claim a trusted write-result return.',
);

assert.match(main, /from '\.\/mainWindowComposition'/, 'main should delegate Companion IPC wiring through main-window composition.');
assert.match(bootstrap, /from '\.\/mainWindowIpcRegistration'/, 'mainWindowBootstrap should delegate Companion IPC composition through the focused helper.');
assert.match(ipcRegistration, /registerCompanionIpcHandlers\(\{/, 'mainWindowIpcRegistration should delegate Companion IPC registration to the helper.');
assert.match(ipcRegistration, /getCompanionSettings,\s*\n\s*setCompanionSettings,/, 'mainWindowIpcRegistration should pass Companion settings accessors to the helper.');
assert.doesNotMatch(main, /ipcMain\.handle\('companion:getSettings'/, 'main should not inline companion:getSettings handler.');
assert.doesNotMatch(main, /ipcMain\.handle\('companion:setSettings'/, 'main should not inline companion:setSettings handler.');
assert.doesNotMatch(main, /ipcMain\.handle\('companion:previewSync'/, 'main should not inline companion:previewSync handler.');
assert.doesNotMatch(main, /ipcMain\.handle\('companion:writeSync'/, 'main should not inline companion:writeSync handler.');
assert.doesNotMatch(main, /ipcMain\.handle\('companion:importMobileInbox'/, 'main should not inline companion:importMobileInbox handler.');
assert.doesNotMatch(main, /import \{ buildSyncPlan, importMobileInbox, writeSyncPlan \} from '\.\/obsidianCompanion'/, 'main should not import Companion sync implementation directly.');


assert.match(
  viteEnv,
  /getCompanionSettings:\s*\(\)\s*=>\s*Promise<unknown>/,
  'ambient Companion settings getter should expose unknown at the preload boundary.'
);
assert.doesNotMatch(
  viteEnv,
  /getCompanionSettings:\s*\(\)\s*=>\s*Promise<import\('\.\.\/shared\/obsidianCompanion'\)\.CompanionSettings>/,
  'ambient Companion settings getter should not claim trusted CompanionSettings return values.'
);

console.log('electron Companion IPC module verification passed');
