import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appUiStatePersistence.ts');
const snapshotPath = join(root, 'src/app/appUiStatePersistenceSnapshot.ts');
const loadSnapshotPath = join(root, 'src/app/appUiStateLoadSnapshot.ts');
const runtimeHookPath = join(root, 'src/app/useAppRuntimeEffects.ts');
const appPath = join(root, 'src/App.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App UI state persistence helper module should exist.');
assert.ok(existsSync(snapshotPath), 'App UI state persistence snapshot module should exist.');
assert.ok(existsSync(loadSnapshotPath), 'App UI-state load snapshot module should exist.');
assert.ok(existsSync(runtimeHookPath), 'App runtime effects hook module should exist.');

const helper = readFileSync(helperPath, 'utf8');
const snapshot = readFileSync(snapshotPath, 'utf8');
const loadSnapshot = readFileSync(loadSnapshotPath, 'utf8');
const runtimeHook = readFileSync(runtimeHookPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export interface AppUiStateLoadHandlers\b/, 'helper should export AppUiStateLoadHandlers.');
assert.match(helper, /export interface AppUiStatePersistOptions\b/, 'helper should export AppUiStatePersistOptions.');
assert.match(helper, /export function loadAppUiState\b/, 'helper should export loadAppUiState.');
assert.match(helper, /export function persistAppUiState\b/, 'helper should export persistAppUiState.');
assert.match(helper, /export function primeAppUiStatePersistence\b/, 'helper should expose a loaded UI-state persistence baseline.');
assert.match(
  loadSnapshot,
  /import \{ isObjectRecord \} from '\.\.\/\.\.\/shared\/unknownValueGuards';/,
  'load snapshot should reuse the shared object-record guard for IPC store state.',
);
assert.match(helper, /getWindowCompactMode\(\)/, 'helper should preserve compact-mode loading.');
assert.match(helper, /lastPersistedCompactMode = value === true/, 'loaded compact mode should become the persistence baseline.');
assert.match(helper, /if \(!pendingLoadedAppUiState \|\| lastPersistedCompactMode === undefined\) return;/, 'persistence should remain locked until both compact mode and Store UI state have hydrated.');
assert.match(helper, /getStoreMany\(\[/, 'helper should batch UI-state loading through one IPC request.');
assert.match(helper, /'dailyWorkOpen'/, 'helper should preserve daily work panel loading key.');
assert.match(helper, /'dailyInspirationOpen'/, 'helper should preserve inspiration panel loading key.');
assert.match(helper, /'taskSearchQuery'/, 'helper should preserve task search query loading key.');
assert.match(
  helper,
  /const snapshot = createAppUiStateLoadSnapshot\(value\);[\s\S]*?handlers\.setSearchQuery\(snapshot\.searchQuery\);/,
  'helper should hydrate the parsed search query from the focused load snapshot.',
);
assert.doesNotMatch(
  helper,
  /value as string/,
  'helper should not cast UI store values with `as string`.',
);
assert.doesNotMatch(
  helper,
  /value as Record<string, unknown>/,
  'helper should not cast unknown IPC store state to a record without runtime validation.',
);
assert.match(
  loadSnapshot,
  /isDailyWorkOpen: storedState\.dailyWorkOpen === true/,
  'load snapshot should treat only strict true as daily-work open.',
);
assert.match(
  loadSnapshot,
  /isInspirationOpen: storedState\.dailyInspirationOpen === true/,
  'load snapshot should treat only strict true as inspiration open.',
);
assert.match(
  loadSnapshot,
  /searchOpen: storedState\.taskSearchOpen === true/,
  'load snapshot should treat only strict true as search open.',
);
assert.match(
  loadSnapshot,
  /showOpenOnly: storedState\.taskOpenOnly === true/,
  'load snapshot should treat only strict true as open-only filter.',
);
assert.doesNotMatch(
  helper,
  /Boolean\(value\)/,
  'helper should not coerce malformed truthy UI store values with Boolean(...).',
);
assert.match(helper, /'taskPriorityFilter'/, 'helper should preserve priority filter loading key.');
assert.match(loadSnapshot, /isPriorityFilter\(storedState\.taskPriorityFilter\)/, 'load snapshot should validate priority filter values with isPriorityFilter.');
assert.doesNotMatch(helper, /value === 'all' \|\| value === 'high' \|\| value === 'medium' \|\| value === 'low'/, 'helper should not inline priority filter validation once isPriorityFilter exists.');
assert.match(loadSnapshot, /normalizeLoadedPersonalization\(storedState\.personalizationSettings\)/, 'load snapshot should preserve personalization normalization.');
assert.match(loadSnapshot, /mergeLoadedThemeOverrides\(\{\}, loadedPersonalization, storedState\.themeOpacityOverrides\)/, 'load snapshot should calculate the hydrated override baseline from loaded personalization and stored overrides.');
assert.match(helper, /setThemeOverrides\(\(prev\) => mergeAppUiStateLoadThemeOverrides\(prev, snapshot\)\)/, 'helper should apply loaded theme override state in one renderer update.');
assert.match(helper, /'isDark'/, 'helper should preserve dark-mode loading key.');
assert.match(
  helper,
  /pendingLoadedAppUiState = \{[\s\S]*?personalizationReady: true,[\s\S]*?\};[\s\S]*?completeAppUiStateHydration\(\);/,
  'hydrated UI state should become the persistence baseline before its React effects run.',
);
assert.match(helper, /setWindowCompactMode\(compactMode\)/, 'helper should preserve compact-mode persistence.');
assert.match(helper, /let lastPersistedCompactMode: boolean \| undefined;/, 'helper should remember the last compact mode sent to the main process.');
assert.match(helper, /if \(lastPersistedCompactMode !== compactMode\) \{\s*lastPersistedCompactMode = compactMode;\s*window\.electronAPI\?\.setWindowCompactMode\(compactMode\);\s*\}/, 'helper should only persist compact mode when it changes.');
assert.match(helper, /const UI_STATE_PERSIST_DELAY_MS = 150/, 'helper should define a short UI-state persistence debounce window.');
assert.match(helper, /window\.clearTimeout\(uiStatePersistTimer\)/, 'helper should coalesce pending UI-state persistence writes.');
assert.match(helper, /uiStatePersistTimer = window\.setTimeout\(\(\) => \{[\s\S]*?setStoreMany\(storeEntries\)[\s\S]*?\}, UI_STATE_PERSIST_DELAY_MS\)/, 'helper should delay batched UI-state writes until rapid state changes settle.');
assert.match(helper, /let lastPersistedStoreEntries: Record<string, unknown> \| undefined;/, 'helper should retain the last persisted UI-state snapshot.');
assert.match(helper, /lastPersistedStoreEntries = createAppUiStateStoreEntries\(input\);/, 'priming should use the same serialized snapshot shape as normal persistence.');
assert.match(helper, /let pendingStoreEntries: Record<string, unknown> \| undefined;/, 'helper should retain a pending snapshot so returning to persisted state cancels stale writes.');
assert.match(helper, /from '\.\/appUiStatePersistenceSnapshot'/, 'helper should compose the focused UI-state snapshot module.');
assert.match(snapshot, /export function areAppUiStateStoreEntriesEqual\(left: Record<string, unknown>, right: Record<string, unknown>\): boolean/, 'snapshot module should compare UI-state snapshots before scheduling another IPC write.');
assert.doesNotMatch(
  snapshot,
  /function areStoreValuesEqual[\s\S]*?Object\.entries\(left\)/,
  'UI-state persistence equality should avoid allocating entry arrays for each snapshot comparison.',
);
assert.match(
  snapshot,
  /for \(const key in left\) \{[\s\S]*?Object\.prototype\.hasOwnProperty\.call\(left, key\)[\s\S]*?Object\.prototype\.hasOwnProperty\.call\(right, key\)/,
  'UI-state persistence equality should traverse only own keys without entry-array allocation.',
);
assert.match(helper, /if \(lastPersistedStoreEntries && areAppUiStateStoreEntriesEqual\(lastPersistedStoreEntries, storeEntries\)\) \{[\s\S]*?pendingStoreEntries = undefined;[\s\S]*?return;[\s\S]*?\}/, 'helper should cancel stale writes when UI state returns to the persisted values.');
assert.match(helper, /if \(pendingStoreEntries && areAppUiStateStoreEntriesEqual\(pendingStoreEntries, storeEntries\)\) return;/, 'helper should not reschedule an already pending UI-state snapshot.');
assert.match(helper, /setStoreMany\(storeEntries\)/, 'helper should batch UI-state persistence through one IPC request.');
assert.match(snapshot, /dailyWorkOpen: isDailyWorkOpen/, 'snapshot module should preserve daily work persistence key.');
assert.match(snapshot, /taskPriorityFilter: priorityFilter/, 'snapshot module should preserve priority filter persistence key.');
assert.match(snapshot, /if \(personalizationReady\)/, 'snapshot module should preserve personalization-ready persistence guard.');
assert.match(snapshot, /storeEntries\[PERSONALIZATION_KEY\] = personalization/, 'snapshot module should preserve personalization persistence key.');
assert.match(snapshot, /storeEntries\[THEME_OVERRIDES_KEY\] = themeOverrides/, 'snapshot module should preserve theme override persistence key.');
assert.match(snapshot, /isDark/, 'snapshot module should preserve dark-mode persistence key.');

assert.match(app, /from '\.\/app\/useAppRuntimeEffects'/, 'App should import the runtime effects hook.');
assert.match(app, /useAppRuntimeEffects\(\{/, 'App should delegate runtime effects through the runtime hook.');
assert.match(runtimeHook, /from '\.\/appUiStatePersistence'/, 'runtime hook should import UI state persistence helpers.');
assert.match(runtimeHook, /persistAppUiState\(\{/, 'runtime hook should delegate UI state persistence.');
assert.doesNotMatch(app, /loadAppUiState\(\{/, 'App startup effect should use the startup orchestrator instead of calling UI state loading directly.');
assert.doesNotMatch(app, /getStore\('dailyWorkOpen'\)/, 'App should not inline daily work loading key.');
assert.doesNotMatch(app, /setStore\('taskPriorityFilter', priorityFilter\)/, 'App should not inline priority filter persistence key.');
assert.equal(scripts['verify:app-ui-state-persistence-module'], 'tsx scripts/verify-app-ui-state-persistence-module.ts', 'package.json should expose the focused UI state persistence verifier.');
assertCleanupCoreIncludes('verify:app-ui-state-persistence-module', 'cleanup-core should include the focused UI state persistence verifier.');

console.log('App UI state persistence helper verification passed');
