import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';
import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';
import { createDefaultCompanionSettings } from '../shared/obsidianCompanionDefaults';
import { loadAppStartupSettings } from '../src/app/appStartupSettings';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appStartupSettings.ts');
const runtimeHookPath = join(root, 'src/app/useAppRuntimeEffects.ts');
const appPath = join(root, 'src/App.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App startup settings helper module should exist.');
assert.ok(existsSync(runtimeHookPath), 'App runtime effects hook module should exist.');

const helper = readFileSync(helperPath, 'utf8');
const runtimeHook = readFileSync(runtimeHookPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function loadAppStartupSettings\b/, 'helper should export loadAppStartupSettings.');
assert.match(helper, /export function loadAppStartupState\b/, 'helper should export loadAppStartupState.');
assert.match(helper, /loadAppUiState\(uiState\)/, 'startup helper should orchestrate UI state loading first.');
assert.match(helper, /loadAppStartupSettings\(startupSettings\)/, 'startup helper should orchestrate Companion/template settings loading.');
assert.match(helper, /const setCompanionSettingsIfChanged = \(next: CompanionSettings\) => \{[\s\S]*areCompanionSettingsEqual\(previous, next\) \? previous : next/, 'helper should retain Companion settings state when a loaded value is equivalent.');
assert.match(helper, /getCompanionSettings\(\)\s*\.then\(setCompanionSettingsIfChanged\)/, 'helper should preserve Companion settings load success path.');
assert.match(helper, /\.catch\(\(\) => setCompanionSettingsIfChanged\(createDefaultCompanionSettings\(\)\)\)/, 'helper should preserve Companion settings fallback.');
assert.match(helper, /const setObsidianTemplatesIfChanged = \(next: ObsidianTemplateSettings\) => \{[\s\S]*areObsidianTemplateSettingsEqual\(previous, next\) \? previous : next/, 'helper should retain template settings state when a loaded value is equivalent.');
assert.match(helper, /getObsidianTemplateSettings\(\)\s*\.then\(setObsidianTemplatesIfChanged\)/, 'helper should preserve Obsidian template settings load success path.');
assert.match(helper, /\.catch\(\(\) => setObsidianTemplatesIfChanged\(createDefaultObsidianTemplateSettings\(\)\)\)/, 'helper should preserve Obsidian template settings fallback.');
assert.match(helper, /import \{[^}]*createDefaultCompanionSettings[^}]*\} from '..\/..\/shared\/obsidianCompanionDefaults'/, 'helper should own Companion default fallback import.');
assert.match(helper, /import \{[^}]*createDefaultObsidianTemplateSettings[^}]*\} from '..\/..\/shared\/appSettings'/, 'helper should own Obsidian template default fallback import.');

assert.match(app, /from '\.\/app\/useAppRuntimeEffects'/, 'App should import the runtime effects hook.');
assert.match(app, /useAppRuntimeEffects\(\{/, 'App should delegate runtime effects through the runtime hook.');
assert.match(runtimeHook, /from '\.\/appStartupSettings'/, 'runtime hook should import startup settings helper.');
assert.match(runtimeHook, /loadAppStartupState\(\{/, 'runtime hook should delegate startup UI and settings loading through one orchestrator.');
assert.doesNotMatch(app, /loadAppStartupSettings\(\{/, 'App should not directly call the lower-level startup settings loader.');
assert.doesNotMatch(app, /loadAppUiState\(\{/, 'App should not directly call the lower-level UI state loader during startup.');
assert.match(runtimeHook, /setCompanionSettingsState: appState\.setCompanionSettingsState/, 'runtime hook should pass Companion settings state setter.');
assert.match(runtimeHook, /setObsidianTemplatesState: appState\.setObsidianTemplatesState/, 'runtime hook should pass Obsidian template state setter.');
assert.doesNotMatch(app, /getCompanionSettings\(\)\s*\.then\(\(settings\) => setCompanionSettingsState\(settings\)\)/, 'App should not inline Companion settings loading.');
assert.doesNotMatch(app, /getObsidianTemplateSettings\(\)\s*\.then\(\(settings\) => \{\s*if \(settings\) setObsidianTemplatesState\(settings\);\s*\}\)/, 'App should not inline Obsidian template settings loading.');
assert.equal(scripts['verify:app-startup-settings-module'], 'tsx scripts/verify-app-startup-settings-module.ts', 'package.json should expose the focused startup settings verifier.');
assertCleanupCoreIncludes('verify:app-startup-settings-module', 'cleanup-core should include the focused startup settings verifier.');

type StateSetter<T> = (next: T | ((previous: T) => T)) => void;

function createStateSetter<T>(initial: T): { getValue: () => T; setValue: StateSetter<T> } {
  let value = initial;
  return {
    getValue: () => value,
    setValue: (next) => {
      value = typeof next === 'function'
        ? (next as (previous: T) => T)(value)
        : next;
    },
  };
}

const initialCompanion = createDefaultCompanionSettings();
const initialTemplates = createDefaultObsidianTemplateSettings();
const companionState = createStateSetter(initialCompanion);
const templateState = createStateSetter(initialTemplates);

loadAppStartupSettings({
  getCompanionSettings: async () => structuredClone(initialCompanion),
  getObsidianTemplateSettings: async () => structuredClone(initialTemplates),
  setCompanionSettingsState: companionState.setValue,
  setObsidianTemplatesState: templateState.setValue,
});

await Promise.resolve();

assert.equal(
  companionState.getValue(),
  initialCompanion,
  'equivalent loaded Companion settings should retain the initial state reference.',
);
assert.equal(
  templateState.getValue(),
  initialTemplates,
  'equivalent loaded template settings should retain the initial state reference.',
);

console.log('App startup settings helper verification passed');
