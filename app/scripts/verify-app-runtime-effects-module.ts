import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const appPath = join(root, 'src/App.tsx');
const localStatePath = join(root, 'src/app/useAppLocalState.ts');
const runtimeEffectsPath = join(root, 'src/app/useAppRuntimeEffects.ts');
const shellCompositionPath = join(root, 'src/app/useAppShellComposition.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(localStatePath), 'App local state hook module should exist.');
assert.ok(existsSync(runtimeEffectsPath), 'App runtime effects hook module should exist.');
assert.ok(existsSync(shellCompositionPath), 'App shell composition hook module should exist.');

const app = readFileSync(appPath, 'utf8');
const localState = readFileSync(localStatePath, 'utf8');
const runtimeEffects = readFileSync(runtimeEffectsPath, 'utf8');
const shellComposition = readFileSync(shellCompositionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;
const appLineCount = app.split(/\r?\n/).length;

assert.ok(appLineCount < 300, `App.tsx should stay below 300 lines after runtime extraction; found ${appLineCount}.`);

assert.match(localState, /export function useAppLocalState\b/, 'local state hook should export useAppLocalState.');
assert.match(localState, /useState\(false\)/, 'local state hook should preserve boolean defaults.');
assert.match(localState, /useState<PriorityFilter>\('all'\)/, 'local state hook should preserve the priority filter default.');
assert.match(localState, /useState<PersonalizationSettings>\(DEFAULT_PERSONALIZATION\)/, 'local state hook should preserve the personalization default.');
assert.match(localState, /createDefaultCompanionSettings\(\)/, 'local state hook should preserve Companion settings defaults.');
assert.match(localState, /createDefaultObsidianTemplateSettings\(\)/, 'local state hook should preserve Obsidian template defaults.');
assert.match(app, /const appState = useAppLocalState\(\)/, 'App should create local state through the dedicated hook.');
assert.doesNotMatch(app, /useState<PriorityFilter>\('all'\)/, 'App should not inline priority-filter local state.');
assert.doesNotMatch(app, /useState<PersonalizationSettings>\(DEFAULT_PERSONALIZATION\)/, 'App should not inline personalization local state.');
assert.doesNotMatch(app, /createDefaultCompanionSettings\(\)/, 'App should not inline Companion settings defaults.');
assert.doesNotMatch(app, /createDefaultObsidianTemplateSettings\(\)/, 'App should not inline template settings defaults.');

assert.match(runtimeEffects, /export function useAppRuntimeEffects\b/, 'runtime effects hook should export useAppRuntimeEffects.');
assert.match(runtimeEffects, /syncSettingsMode\(appState\.settingsOpen\)/, 'runtime effects hook should preserve settings-mode sync.');
assert.match(runtimeEffects, /syncDocumentThemeClasses\(taskEffects\.isDark, appState\.personalization\.texture\)/, 'runtime effects hook should preserve document theme-class sync.');
assert.match(runtimeEffects, /syncDocumentFontScale\(appState\.personalization\.fontScale\)/, 'runtime effects hook should preserve document font-scale sync.');
assert.match(runtimeEffects, /syncAlwaysOnTopPreference\(appState\.personalization\.alwaysOnTop\)/, 'runtime effects hook should preserve always-on-top sync.');
assert.match(runtimeEffects, /\[appState\.personalization\.alwaysOnTop\]/, 'runtime effects hook should rerun always-on-top sync when the preference changes.');
assert.match(runtimeEffects, /loadAppStartupState\(\{/, 'runtime effects hook should preserve startup loading orchestration.');
assert.match(runtimeEffects, /const allTasksRef = useRef\(taskEffects\.allTasks\)/, 'runtime effects hook should preserve lazy allTasks ref ownership.');
assert.match(runtimeEffects, /registerAiReviewLifecycle\(\{/, 'runtime effects hook should preserve AI review lifecycle registration.');
assert.match(runtimeEffects, /requestAiReviewOnboarding\(\{/, 'runtime effects hook should preserve AI onboarding request.');
assert.match(runtimeEffects, /persistAppUiState\(\{/, 'runtime effects hook should preserve UI-state persistence.');
assert.match(runtimeEffects, /registerAppKeyboardShortcutListener\(window, \{/, 'runtime effects hook should preserve keyboard listener registration.');
assert.match(runtimeEffects, /registerTaskMenuActionListener\(window\.electronAPI, \{/, 'runtime effects hook should preserve task-menu listener registration.');
assert.match(runtimeEffects, /import\('\.\.\/styles\/watercolor-theme\.css'\)/, 'runtime effects hook should preserve lazy watercolor stylesheet loading.');
assert.match(app, /useAppRuntimeEffects\(\{/, 'App should delegate runtime side effects to useAppRuntimeEffects.');
assert.doesNotMatch(app, /loadAppStartupState\(\{/, 'App should not inline startup loading effects.');
assert.doesNotMatch(app, /persistAppUiState\(\{/, 'App should not inline UI-state persistence effects.');
assert.doesNotMatch(app, /registerAiReviewLifecycle\(\{/, 'App should not inline AI lifecycle effects.');
assert.doesNotMatch(app, /registerTaskMenuActionListener\(window\.electronAPI, \{/, 'App should not inline task-menu listener registration.');
assert.doesNotMatch(app, /registerAppKeyboardShortcutListener\(window, \{/, 'App should not inline keyboard listener registration.');
assert.doesNotMatch(app, /import\('\.\/styles\/watercolor-theme\.css'\)/, 'App should not inline lazy watercolor stylesheet loading.');

assert.match(shellComposition, /export function useAppShellComposition\b/, 'shell composition hook should export useAppShellComposition.');
assert.match(shellComposition, /createAppTaskView\(\{/, 'shell composition hook should derive the task view.');
assert.match(shellComposition, /createAppReviewDialogState\(\{/, 'shell composition hook should derive review dialog state.');
assert.match(shellComposition, /createAppCompletionActions\(\{/, 'shell composition hook should create completion actions.');
assert.match(shellComposition, /createAppCompanionActions\(\{/, 'shell composition hook should create Companion actions.');
assert.match(shellComposition, /createAppObsidianTemplateActions\(\{/, 'shell composition hook should create Obsidian template actions.');
assert.match(shellComposition, /createAppModalActions\(\{/, 'shell composition hook should create modal actions.');
assert.match(shellComposition, /createAppShellComposition\(createAppShellCompositionInputs\(\{/, 'shell composition hook should delegate final prop assembly through the pure input factory.');
assert.match(app, /useAppShellComposition\(\{/, 'App should delegate shell prop composition to the hook.');
assert.doesNotMatch(app, /createAppShellComposition\(\{/, 'App should not inline the full shell-composition input object.');

assert.equal(
  scripts['verify:app-runtime-effects-module'],
  'tsx scripts/verify-app-runtime-effects-module.ts',
  'package.json should expose the focused App runtime extraction verifier.',
);
assertCleanupCoreIncludes('verify:app-runtime-effects-module', 'cleanup-core should include the focused App runtime extraction verifier.');

console.log('App runtime effects extraction verification passed');
