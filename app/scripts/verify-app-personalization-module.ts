import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';
import {
  createAppPersonalizationActions,
} from '../src/app/appPersonalization';
import {
  mergeLoadedThemeOverrides,
  mergeStoredThemeOverrides,
  normalizeLoadedPersonalization,
  seedThemeOverridesFromPersonalization,
} from '../src/app/personalizationSettings';
import { DEFAULT_PERSONALIZATION, extractOpacityOverride } from '../src/types/personalization';
import { THEME_PRESETS } from '../src/types/themePresets';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appPersonalization.ts');
const settingsPath = join(root, 'src/app/personalizationSettings.ts');
const loadSettingsPath = join(root, 'src/app/personalizationLoadSettings.ts');
const personalizationPath = join(root, 'src/types/personalization.ts');
const shellHelperPath = join(root, 'src/app/appShellComposition.tsx');
const mainContentCompositionPath = join(root, 'src/app/appShellMainContentComposition.tsx');
const overlayHelperPath = join(root, 'src/app/appShellOverlayComposition.ts');
const shellCompositionHookPath = join(root, 'src/app/useAppShellComposition.ts');
const shellInputsPath = join(root, 'src/app/appShellCompositionInputs.ts');
const appPath = join(root, 'src/App.tsx');
const topContentPath = join(root, 'src/components/AppTopContent.tsx');
const uiStatePersistencePath = join(root, 'src/app/appUiStatePersistence.ts');
const uiStateLoadSnapshotPath = join(root, 'src/app/appUiStateLoadSnapshot.ts');
const shellEffectsPath = join(root, 'src/app/appShellEffects.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App personalization helper module should exist.');
assert.ok(existsSync(settingsPath), 'Pure personalization settings module should exist.');
assert.ok(existsSync(loadSettingsPath), 'Personalization load-settings module should exist.');
assert.ok(existsSync(personalizationPath), 'Personalization types module should exist.');
assert.ok(existsSync(shellHelperPath), 'App shell composition helper should exist for personalization wiring verification.');
assert.ok(existsSync(mainContentCompositionPath), 'App shell main-content composition helper should exist for Header personalization wiring verification.');
assert.ok(existsSync(overlayHelperPath), 'App shell overlay composition helper should exist for SettingsPanel personalization wiring verification.');
assert.ok(existsSync(shellCompositionHookPath), 'App shell composition hook should exist for personalization wiring verification.');
assert.ok(existsSync(shellInputsPath), 'Pure shell-inputs helper should exist for personalization wiring verification.');
assert.ok(existsSync(topContentPath), 'App top content component should exist for Header personalization wiring.');

const helper = readFileSync(helperPath, 'utf8');
const settings = readFileSync(settingsPath, 'utf8');
const loadSettings = readFileSync(loadSettingsPath, 'utf8');
const personalizationSource = readFileSync(personalizationPath, 'utf8');
const shellHelper = readFileSync(shellHelperPath, 'utf8');
const mainContentComposition = readFileSync(mainContentCompositionPath, 'utf8');
const overlayHelper = readFileSync(overlayHelperPath, 'utf8');
const shellCompositionHook = readFileSync(shellCompositionHookPath, 'utf8');
const shellInputs = readFileSync(shellInputsPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const topContent = readFileSync(topContentPath, 'utf8');
const uiStatePersistence = existsSync(uiStatePersistencePath) ? readFileSync(uiStatePersistencePath, 'utf8') : '';
const uiStateLoadSnapshot = existsSync(uiStateLoadSnapshotPath) ? readFileSync(uiStateLoadSnapshotPath, 'utf8') : '';
const shellEffects = existsSync(shellEffectsPath) ? readFileSync(shellEffectsPath, 'utf8') : '';
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /from '\.\/personalizationSettings'/, 'action helper should import pure personalization settings logic.');
assert.match(settings, /export const PERSONALIZATION_KEY = 'personalizationSettings'/, 'settings module should export the personalization store key.');
assert.match(settings, /export const THEME_OVERRIDES_KEY = 'themeOpacityOverrides'/, 'settings module should export the theme override store key.');
assert.match(settings, /export function clampFontScale\b/, 'settings module should export clampFontScale.');
assert.match(loadSettings, /import \{ isObjectRecord \} from '..\/..\/shared\/unknownValueGuards';/, 'personalization load-settings should reuse the shared object-record guard.');
assert.doesNotMatch(settings, /function isRecord\(/, 'personalization settings should not duplicate the shared object-record guard.');
assert.match(settings, /Math\.min\(130, Math\.max\(80, value \?\? 100\)\)/, 'settings module should clamp font scale to the previous 80..130 range with 100 fallback.');
assert.match(settings, /export function arePersonalizationSettingsEqual\b/, 'settings module should expose complete personalization equality.');
assert.match(settings, /from '\.\/personalizationLoadSettings'/, 'settings module should compose the focused load-settings module.');
assert.match(settings, /export \{[\s\S]*normalizeLoadedPersonalization,[\s\S]*parseStoredThemeOpacityOverrides,[\s\S]*\} from '\.\/personalizationLoadSettings';/, 'settings module should retain compatibility exports for load helpers.');
assert.match(loadSettings, /export function normalizeLoadedPersonalization\b/, 'load-settings module should export normalizeLoadedPersonalization.');
assert.match(loadSettings, /DEFAULT_PERSONALIZATION/, 'load-settings module should preserve default personalization merging.');
assert.match(loadSettings, /matchThemePreset\(loaded\)/, 'load-settings module should preserve theme matching for old settings without themeId.');
assert.match(loadSettings, /THEME_PRESETS\.some\(\(preset\) => preset\.id === loaded\.themeId\)/, 'load-settings module should reject removed/unknown theme ids.');
assert.doesNotMatch(
  loadSettings,
  /value as Partial<PersonalizationSettings>/,
  'normalizeLoadedPersonalization should not cast unknown store values as Partial personalization settings.',
);
assert.doesNotMatch(
  settings,
  /stored as Record<string, ThemeOpacityOverride>/,
  'mergeStoredThemeOverrides should not cast unknown store values as theme override records.',
);
assert.match(settings, /export function seedThemeOverridesFromPersonalization\b/, 'settings module should export theme override seeding.');
assert.match(
  settings,
  /\[themeId\]: extractOpacityOverride\(settings\),\s*\.\.\.previous/s,
  'helper should preserve seeded override precedence without casting themeId.',
);
assert.match(settings, /export function mergeStoredThemeOverrides\b/, 'settings module should export stored override merging.');
assert.match(
  settings,
  /parseStoredThemeOpacityOverrides\(stored\)/,
  'mergeStoredThemeOverrides should parse stored theme opacity overrides before merging.',
);
assert.match(settings, /export function createPersonalizationForThemePreset\b/, 'settings module should export preset application helper.');
assert.match(settings, /remembered \? \{ \.\.\.preset\.settings, \.\.\.remembered \} : preset\.settings/, 'settings module should preserve remembered override application.');
assert.match(settings, /export function getThemeDefaultsReset\b/, 'settings module should export reset helper.');
assert.match(settings, /delete next\[preset\.id\]/, 'settings module should preserve reset override deletion.');
assert.match(settings, /export function rememberThemeOverride\b/, 'settings module should export personalization-change override helper.');
assert.match(
  settings,
  /\[themeId\]: extractOpacityOverride\(next\)/,
  'helper should preserve opacity override memory on personalization change without casting themeId.',
);
assert.match(helper, /export function createAppPersonalizationActions\b/, 'helper should export App personalization action factory.');
assert.doesNotMatch(helper, /function normalizeLoadedPersonalization\b/, 'action helper should not own stored personalization normalization.');
assert.doesNotMatch(helper, /function parseStoredThemeOpacityOverrides\b/, 'action helper should not own stored theme override parsing.');
assert.doesNotMatch(
  personalizationSource,
  /value as never/,
  'theme appearance override extraction should not cast dynamic personalization values through never.',
);
assert.match(
  personalizationSource,
  /function setThemeAppearanceOverride<K extends ThemeAppearanceKey>/,
  'theme appearance override extraction should use a typed key/value helper for dynamic assignment.',
);
assert.match(helper, /applyThemePreset: \(preset(?:: [^)]+)?\) => \{\s*const nextPersonalization = createPersonalizationForThemePreset\(preset, themeOverrides\);\s*if \(arePersonalizationSettingsEqual\(personalization, nextPersonalization\)\) return;\s*setPersonalization\(nextPersonalization\);\s*\}/s, 'action factory should preserve theme preset application while skipping equivalent state.');
assert.match(helper, /resetCurrentThemeDefaults: \(\) => \{\s*const reset = getThemeDefaultsReset\(personalization, activeThemeId, themeOverrides\);\s*if \(!reset\) return;\s*if \(\s*arePersonalizationSettingsEqual\(personalization, reset\.nextPersonalization\)\s*&& areThemeOpacityOverridesEqual\(themeOverrides, reset\.nextThemeOverrides\)\s*\) return;\s*setThemeOverrides\(reset\.nextThemeOverrides\);\s*setPersonalization\(reset\.nextPersonalization\);\s*\}/s, 'action factory should preserve theme reset behavior while skipping already-default state.');
assert.match(helper, /changePersonalization: \(next(?:: [^)]+)?\) => \{\s*if \(arePersonalizationSettingsEqual\(personalization, next\)\) return;\s*setPersonalization\(next\);\s*setThemeOverrides\(\(prev\) => rememberThemeOverride\(prev, next\)\);\s*\}/s, 'action factory should skip equal personalization before preserving override memory for real changes.');
assert.match(helper, /toggleDarkModeAction: \(\) => toggleDarkMode\(\)/, 'action factory should expose dark mode toggle forwarding.');

assert.match(uiStatePersistence, /from '\.\/appPersonalization'/, 'App UI-state persistence should retain personalization Store keys.');
assert.match(uiStatePersistence, /from '\.\/appUiStateLoadSnapshot'/, 'App UI-state persistence should compose the focused load snapshot.');
assert.match(uiStateLoadSnapshot, /normalizeLoadedPersonalization\(storedState\.personalizationSettings\)/, 'App startup load snapshot should delegate loaded personalization normalization.');
assert.match(uiStateLoadSnapshot, /mergeLoadedThemeOverrides\(previous, snapshot\.loadedPersonalization, snapshot\.storedThemeOverrides\)/, 'App startup load snapshot should merge loaded personalization and stored theme overrides in one state update.');
assert.match(shellEffects, /clampFontScale\(fontScale\)|clampFontScale\(personalization\.fontScale\)/, 'App shell font scaling should delegate font-scale clamping.');
assert.match(helper, /createPersonalizationForThemePreset\(preset, themeOverrides\)/, 'personalization action factory should delegate theme preset application.');
assert.match(helper, /getThemeDefaultsReset\(personalization, activeThemeId, themeOverrides\)/, 'personalization action factory should delegate theme reset calculation.');
assert.match(helper, /rememberThemeOverride\(prev, next\)/, 'personalization action factory should delegate personalization override memory.');
assert.match(shellCompositionHook, /createAppPersonalizationActions\(\{/, 'Runtime shell composition hook should create personalization actions through the helper.');
assert.match(
  shellCompositionHook,
  /const appPersonalizationActions = useMemo\(\(\) => createAppPersonalizationActions\(\{[\s\S]*personalization:[\s\S]*activeThemeId: themeState\.activeThemeId,[\s\S]*themeOverrides:[\s\S]*toggleDarkMode:[\s\S]*\}\), \[appState\.personalization, themeState\.activeThemeId, appState\.themeOverrides, taskState\.toggleDarkMode\]\);/,
  'Runtime shell composition hook should preserve personalization action references until their inputs change.',
);
assert.match(app, /useAppShellComposition\(\{/, 'App should delegate personalization shell wiring through the runtime composition hook.');
assert.match(shellInputs, /appPersonalizationActions,/, 'Pure shell-inputs helper should pass personalization actions into the shell composition helper.');
assert.match(overlayHelper, /const settingsPanelProps = \{[\s\S]*onApplyTheme: appPersonalizationActions\.applyThemePreset,[\s\S]*onResetTheme: appPersonalizationActions\.resetCurrentThemeDefaults,[\s\S]*onChange: appPersonalizationActions\.changePersonalization,[\s\S]*\};/, 'SettingsPanel personalization actions should flow through the shell overlay composition prop bag.');
assert.match(
  shellInputs,
  /mainContent: \{[\s\S]*toggleDarkModeAction: appPersonalizationActions\.toggleDarkModeAction,[\s\S]*\},/,
  'Shell input composition should place the dark-mode toggle action in the main-content group.',
);
assert.match(
  shellHelper,
  /const mainContentProps = createAppShellMainContentComposition\(mainContent\);/,
  'Shell composition should delegate grouped main-content inputs unchanged to the main-content composition helper.',
);
assert.match(mainContentComposition, /const headerProps = \{[\s\S]*onToggleDark: toggleDarkModeAction,[\s\S]*\};/, 'Header dark-mode toggle should flow through the main-content composition header prop bag.');
assert.match(topContent, /<Header \{\.\.\.headerProps\} \/>/, 'AppTopContent should forward Header props.');
assert.doesNotMatch(app, /const settingsPanelProps = \{/, 'App should not inline SettingsPanel props once shell composition owns them.');
assert.doesNotMatch(app, /const headerProps = \{/, 'App should not inline Header props once shell composition owns them.');
assert.doesNotMatch(app, /function clamp\(value: number, min: number, max: number\)/, 'App should not keep the generic clamp helper just for personalization.');
assert.doesNotMatch(app, /const loaded = \{ \.\.\.DEFAULT_PERSONALIZATION/, 'App should not inline loaded personalization normalization.');
assert.doesNotMatch(app, /matchThemePreset\(loaded\)/, 'App should not inline old-theme matching for loaded settings.');
assert.doesNotMatch(app, /extractOpacityOverride\(loaded\)/, 'App should not inline loaded override seeding.');
assert.doesNotMatch(app, /const applyThemePreset = \(preset(?:: [^)]+)?\) => \{/,'App should not inline theme preset action.');
assert.doesNotMatch(app, /const resetCurrentThemeDefaults = \(\) => \{/, 'App should not inline theme reset action.');
assert.doesNotMatch(app, /const handlePersonalizationChange = \(next(?:: [^)]+)?\) => \{/, 'App should not inline personalization change action.');
assert.doesNotMatch(app, /const handleToggleDarkMode = \(\) => \{/, 'App should not inline dark-mode toggle wrapper.');
assert.equal(scripts['verify:app-personalization-module'], 'tsx scripts/verify-app-personalization-module.ts', 'package.json should expose the focused personalization verifier.');
assertCleanupCoreIncludes('verify:app-personalization-module', 'cleanup-core should include the focused personalization verifier.');

const normalized = normalizeLoadedPersonalization({
  windowOpacity: 55,
  panelOpacity: 'bad',
  accentColor: '#111111',
  layoutDensity: 'compact',
  texture: 1,
  animations: false,
  themeId: 'minimal',
  fontScale: 140,
  alwaysOnTop: 'yes',
});
assert.ok(normalized, 'normalizeLoadedPersonalization should accept object store payloads.');
assert.equal(normalized?.windowOpacity, 55);
assert.equal(normalized?.panelOpacity, DEFAULT_PERSONALIZATION.panelOpacity);
assert.equal(normalized?.accentColor, '#111111');
assert.equal(normalized?.layoutDensity, 'compact');
assert.equal(normalized?.texture, DEFAULT_PERSONALIZATION.texture);
assert.equal(normalized?.animations, false);
assert.equal(normalized?.themeId, 'minimal');
assert.equal(normalized?.fontScale, 140);
assert.equal(normalized?.alwaysOnTop, undefined);
assert.equal(normalizeLoadedPersonalization(null), null);
assert.equal(normalizeLoadedPersonalization('nope'), null);

const seeded = seedThemeOverridesFromPersonalization({}, {
  ...DEFAULT_PERSONALIZATION,
  themeId: 'minimal',
  windowOpacity: 42,
});
assert.equal(seeded.minimal?.windowOpacity, 42);

const merged = mergeStoredThemeOverrides(
  { minimal: { windowOpacity: 10 } },
  {
    watercolor: { windowOpacity: 20, panelOpacity: 'bad', cardOpacity: 30 },
    badTheme: 'nope',
    empty: {},
  },
);
assert.deepEqual(merged, {
  minimal: { windowOpacity: 10 },
  watercolor: { windowOpacity: 20, cardOpacity: 30 },
});

const existingThemeOverrides = { minimal: { windowOpacity: 70 } };
assert.strictEqual(
  mergeLoadedThemeOverrides(existingThemeOverrides, null, {}),
  existingThemeOverrides,
  'loading no theme overrides should preserve the existing override state reference.',
);
const loadedMinimalPersonalization = { ...DEFAULT_PERSONALIZATION, themeId: 'minimal', windowOpacity: 44 };
assert.deepEqual(
  mergeLoadedThemeOverrides({}, loadedMinimalPersonalization, {}),
  { minimal: extractOpacityOverride(loadedMinimalPersonalization) },
  'loading personalization should seed its remembered opacity override.',
);

let personalizationUpdateCount = 0;
let themeOverrideUpdateCount = 0;
const personalizationActions = createAppPersonalizationActions({
  personalization: { ...DEFAULT_PERSONALIZATION, themeId: 'minimal' },
  activeThemeId: 'minimal',
  themeOverrides: { minimal: { windowOpacity: DEFAULT_PERSONALIZATION.windowOpacity } },
  setPersonalization: () => { personalizationUpdateCount += 1; },
  setThemeOverrides: () => { themeOverrideUpdateCount += 1; },
  toggleDarkMode: () => {},
});

personalizationActions.changePersonalization({ ...DEFAULT_PERSONALIZATION, themeId: 'minimal' });
assert.equal(personalizationUpdateCount, 0, 'equivalent personalization should preserve renderer state identity.');
assert.equal(themeOverrideUpdateCount, 0, 'equivalent personalization should not rebuild theme overrides.');

personalizationActions.changePersonalization({ ...DEFAULT_PERSONALIZATION, themeId: 'minimal', windowOpacity: 65 });
assert.equal(personalizationUpdateCount, 1, 'changed personalization should update renderer state.');
assert.equal(themeOverrideUpdateCount, 1, 'changed personalization should update the remembered theme override.');

let presetPersonalizationUpdateCount = 0;
let presetThemeOverrideUpdateCount = 0;
const minimalPreset = THEME_PRESETS.find((preset) => preset.id === 'minimal');
assert.ok(minimalPreset, 'minimal theme preset should exist for action behavior coverage.');
const presetActions = createAppPersonalizationActions({
  personalization: minimalPreset.settings,
  activeThemeId: 'minimal',
  themeOverrides: {},
  setPersonalization: () => { presetPersonalizationUpdateCount += 1; },
  setThemeOverrides: () => { presetThemeOverrideUpdateCount += 1; },
  toggleDarkMode: () => {},
});

presetActions.applyThemePreset(minimalPreset);
assert.equal(presetPersonalizationUpdateCount, 0, 'reapplying the active preset should preserve personalization state identity.');

presetActions.resetCurrentThemeDefaults();
assert.equal(presetPersonalizationUpdateCount, 0, 'resetting already-default theme settings should preserve personalization state identity.');
assert.equal(presetThemeOverrideUpdateCount, 0, 'resetting a theme without an override should preserve override state identity.');

let resetPersonalizationUpdateCount = 0;
let resetThemeOverrideUpdateCount = 0;
const resetActions = createAppPersonalizationActions({
  personalization: { ...minimalPreset.settings, windowOpacity: 65 },
  activeThemeId: 'minimal',
  themeOverrides: { minimal: { windowOpacity: 65 } },
  setPersonalization: () => { resetPersonalizationUpdateCount += 1; },
  setThemeOverrides: () => { resetThemeOverrideUpdateCount += 1; },
  toggleDarkMode: () => {},
});

resetActions.resetCurrentThemeDefaults();
assert.equal(resetPersonalizationUpdateCount, 1, 'resetting customized theme settings should restore the preset.');
assert.equal(resetThemeOverrideUpdateCount, 1, 'resetting customized theme settings should clear its override.');

console.log('App personalization helper verification passed');
