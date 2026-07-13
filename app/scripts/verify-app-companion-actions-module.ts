import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';
import {
  readCompanionMobileImportResult,
  readCompanionSyncPlan,
  readCompanionWriteResult,
} from '../shared/obsidianCompanion';
import { createDefaultCompanionSettings } from '../shared/obsidianCompanionDefaults';
import { createCompanionSettingsUpdater } from '../src/app/appCompanionActions';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appCompanionActions.ts');
const shellCompositionHookPath = join(root, 'src/app/useAppShellComposition.ts');
const shellCompositionInputsPath = join(root, 'src/app/appShellCompositionInputs.ts');
const appPath = join(root, 'src/App.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App Companion actions helper module should exist.');
assert.ok(existsSync(shellCompositionHookPath), 'Runtime shell composition hook should exist for Companion action wiring verification.');
assert.ok(existsSync(shellCompositionInputsPath), 'Shell composition inputs module should exist for Companion action mapping verification.');

const helper = readFileSync(helperPath, 'utf8');
const shellCompositionHook = readFileSync(shellCompositionHookPath, 'utf8');
const shellCompositionInputs = readFileSync(shellCompositionInputsPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export interface AppCompanionActionDependencies\b/, 'helper should export dependency interface.');
assert.match(helper, /export function createAppCompanionActions\b/, 'helper should export action factory.');
assert.match(helper, /export function createCompanionSettingsUpdater\b/, 'helper should export settings updater factory.');
assert.match(helper, /areCompanionSettingsEqual/, 'settings updater should compare Companion settings before updating state.');
assert.match(helper, /if \(areCompanionSettingsEqual\(getCompanionSettings\(\), next\)\) return;/, 'settings updater should skip equal settings before state work or IPC.');
assert.match(helper, /setCompanionSettingsState\(next\)/, 'settings updater should update local Companion settings state first.');
assert.match(helper, /await setCompanionSettings\(next\)/, 'settings updater should persist Companion settings after updating local state.');
assert.match(helper, /chooseObsidianFolder\bis not a typo|chooseObsidianFolder/, 'helper should receive the vault chooser dependency.');
assert.match(helper, /updateCompanionSettings\bea|updateCompanionSettings/, 'helper should receive the settings update dependency.');
assert.match(helper, /previewCompanionSync/, 'helper should receive previewCompanionSync dependency.');
assert.match(helper, /writeCompanionSync/, 'helper should receive writeCompanionSync dependency.');
assert.match(helper, /importMobileInbox/, 'helper should receive importMobileInbox dependency.');
assert.match(helper, /getCurrentCaptureItems/, 'helper should preserve lazy capture item lookup.');
assert.match(helper, /readCompanionSyncPlan/, 'helper should parse Companion preview results before writing plan state.');
assert.match(helper, /readCompanionWriteResult/, 'helper should parse Companion write results before status updates.');
assert.match(helper, /readCompanionMobileImportResult/, 'helper should parse mobile inbox import results before merging items.');
assert.match(helper, /readCompanionSyncPlan\(await previewCompanionSync/, 'helper should revalidate preview IPC returns at the action boundary.');
assert.match(helper, /readCompanionWriteResult\(await writeCompanionSync/, 'helper should revalidate write IPC returns at the action boundary.');
assert.match(helper, /readCompanionMobileImportResult\(await importMobileInbox/, 'helper should revalidate import IPC returns at the action boundary.');
assert.match(helper, /if \(!plan\)/, 'helper should guard malformed preview results before setCompanionPlan.');
assert.match(helper, /if \(!result\)/, 'helper should guard malformed write/import results before side effects.');
assert.match(helper, /setCompanionPlan\(plan\)/, 'helper should only write a validated Companion plan.');
assert.match(helper, /getCompanionPreviewStatus\(plan\)/, 'helper should preserve preview status mapping for valid plans.');
assert.match(helper, /getCompanionSyncStatus\(result\)/, 'helper should preserve sync status mapping for valid write results.');
assert.match(helper, /mergeImportedMobileCaptureItems\(existing, result\.items\)/, 'helper should preserve mobile inbox merge helper usage for valid imports.');
assert.match(helper, /getCompanionMobileImportStatus\(result\)/, 'helper should preserve mobile import status mapping for valid imports.');
assert.match(helper, /Promise<unknown>/, 'Companion action dependencies should accept unknown IPC result contracts.');
assert.match(helper, /if \(!vaultPath\) return/, 'helper should preserve cancelled vault chooser guard.');
assert.match(helper, /\{ \.\.\.companionSettings, vaultPath \}/, 'helper should preserve vault-path merge behavior.');

assert.match(app, /useAppShellComposition\(\{/, 'App should delegate Companion action wiring through the runtime composition hook.');
assert.match(shellCompositionHook, /createAppCompanionActions, createCompanionSettingsUpdater/, 'Runtime shell composition hook should import both Companion helper factories.');
assert.match(
  shellCompositionHook,
  /const updateCompanionSettings = useMemo\(\(\) => createCompanionSettingsUpdater\(\{\s*getCompanionSettings: \(\) => appState\.companionSettings,\s*setCompanionSettingsState: appState\.setCompanionSettingsState,\s*setCompanionSettings,\s*\}\), \[appState\.companionSettings\]\);/s,
  'Runtime shell composition hook should preserve the Companion settings updater reference across unrelated renders.',
);
assert.match(
  shellCompositionHook,
  /const companionActions = useMemo\(\(\) => createAppCompanionActions\(\{[\s\S]*companionSettings: appState\.companionSettings,[\s\S]*chooseObsidianFolder: taskState\.chooseObsidianFolder,[\s\S]*updateCompanionSettings,[\s\S]*getCurrentCaptureItems,[\s\S]*\}\), \[appState\.companionSettings, taskState\.chooseObsidianFolder, updateCompanionSettings, getCurrentCaptureItems\]\);/,
  'Runtime shell composition hook should preserve Companion action references until their actual inputs change.',
);
assert.match(shellCompositionInputs, /chooseCompanionVault: companionActions\.chooseCompanionVault,[\s\S]*previewCompanion: companionActions\.previewCompanion,[\s\S]*syncCompanion: companionActions\.syncCompanion,[\s\S]*importCompanionMobileInbox: companionActions\.importCompanionMobileInbox,/, 'Shell composition inputs should pass Companion actions into shell composition.');
assert.doesNotMatch(app, /const updateCompanionSettings = async \(next: CompanionSettings\) => \{\s*setCompanionSettingsState\(next\);\s*await setCompanionSettings\(next\);\s*\};/s, 'App should not inline Companion settings state-plus-persistence updates.');
assert.doesNotMatch(app, /const chooseCompanionVault = async \(\) => \{\s*const vaultPath = await chooseObsidianFolder\(\)/s, 'App should not inline vault chooser action.');
assert.doesNotMatch(app, /const previewCompanion = async \(\) => \{\s*const plan = await previewCompanionSync/s, 'App should not inline Companion preview action.');
assert.doesNotMatch(app, /const syncCompanion = async \(\) => \{\s*const result = await writeCompanionSync/s, 'App should not inline Companion sync action.');
assert.doesNotMatch(app, /const importCompanionMobileInbox = async \(\) => \{\s*const result = await importMobileInbox/s, 'App should not inline mobile inbox import action.');
assert.equal(scripts['verify:app-companion-actions-module'], 'tsx scripts/verify-app-companion-actions-module.ts', 'package.json should expose the focused Companion actions verifier.');
assertCleanupCoreIncludes('verify:app-companion-actions-module', 'cleanup-core should include the focused Companion actions verifier.');

const validCaptureItem = {
  id: 'cap-1',
  type: 'note',
  content: 'hello',
  tags: ['inbox'],
  source: 'mobile-inbox',
  status: 'new',
  createdAt: '2026-07-12T00:00:00.000Z',
};

assert.deepEqual(
  readCompanionSyncPlan({
    ok: true,
    vaultPath: 'C:/vault',
    changes: [
      {
        filePath: 'C:/vault/note.md',
        action: 'create-file',
        mode: 'append',
        content: 'body',
        itemIds: ['cap-1'],
        ruleId: 'rule-1',
      },
    ],
    unmatchedItems: [validCaptureItem],
    errors: [],
  }),
  {
    ok: true,
    vaultPath: 'C:/vault',
    changes: [
      {
        filePath: 'C:/vault/note.md',
        action: 'create-file',
        mode: 'append',
        content: 'body',
        itemIds: ['cap-1'],
        ruleId: 'rule-1',
      },
    ],
    unmatchedItems: [validCaptureItem],
    errors: [],
  },
);
assert.equal(readCompanionSyncPlan({ ok: true, changes: 'nope', unmatchedItems: [], errors: [] }), undefined);
assert.equal(readCompanionSyncPlan(null), undefined);
assert.deepEqual(readCompanionWriteResult({ ok: false, errors: ['blocked'] }), { ok: false, errors: ['blocked'] });
assert.equal(readCompanionWriteResult({ ok: true, errors: [1] }), undefined);
assert.deepEqual(readCompanionMobileImportResult({ ok: true, items: [validCaptureItem], errors: [] }), {
  ok: true,
  items: [validCaptureItem],
  errors: [],
});
assert.equal(readCompanionMobileImportResult({ ok: true, items: [{ id: 1 }], errors: [] }), undefined);

const originalCompanionSettings = createDefaultCompanionSettings('C:/vault');
let stateUpdateCount = 0;
let persistCount = 0;
const updateCompanionSettings = createCompanionSettingsUpdater({
  getCompanionSettings: () => originalCompanionSettings,
  setCompanionSettingsState: () => { stateUpdateCount += 1; },
  setCompanionSettings: async () => { persistCount += 1; },
});

await updateCompanionSettings({
  ...originalCompanionSettings,
  rules: originalCompanionSettings.rules.map((rule) => ({ ...rule })),
  templates: originalCompanionSettings.templates.map((template) => ({ ...template })),
});
assert.equal(stateUpdateCount, 0, 'equivalent Companion settings should preserve renderer state identity.');
assert.equal(persistCount, 0, 'equivalent Companion settings should not cross the IPC boundary.');

await updateCompanionSettings({ ...originalCompanionSettings, vaultPath: 'D:/other-vault' });
assert.equal(stateUpdateCount, 1, 'changed Companion settings should update renderer state.');
assert.equal(persistCount, 1, 'changed Companion settings should persist once.');

const companionSource = readFileSync(new URL('../shared/obsidianCompanion.ts', import.meta.url), 'utf8');
const companionValidationSource = readFileSync(new URL('../shared/obsidianCompanionValidation.ts', import.meta.url), 'utf8');
const companionDefaultsSource = readFileSync(new URL('../shared/obsidianCompanionDefaults.ts', import.meta.url), 'utf8');
assert.match(companionSource, /from '\.\/obsidianCompanionValidation';/, 'Companion facade should re-export its focused payload validation module.');
assert.match(companionValidationSource, /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/, 'Companion payload guards should reuse the shared object-record guard.');
assert.doesNotMatch(companionValidationSource, /function isObject\(value: unknown\)/, 'Companion payload guards should not redeclare the shared object-record guard.');
assert.match(companionDefaultsSource, /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/, 'Companion defaults should reuse the shared object-record guard.');
assert.doesNotMatch(companionDefaultsSource, /function isRecord\(value: unknown\)/, 'Companion defaults should not redeclare an object-record guard.');
assert.doesNotMatch(companionDefaultsSource, /right as Record<string, unknown>/, 'Companion settings equality should not narrow object values with a Record assertion.');
assert.match(companionDefaultsSource, /Object\.getOwnPropertyDescriptor\(right, key\)\?\.value/, 'Companion settings equality should read matching own-property values without an assertion.');

console.log('App Companion actions helper verification passed');
