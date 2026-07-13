import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const typesPath = join(root, 'src', 'app', 'appShellCompositionTypes.ts');
const inputsPath = join(root, 'src', 'app', 'appShellCompositionInputs.ts');
const compositionPath = join(root, 'src', 'app', 'appShellComposition.tsx');
const packagePath = join(root, 'package.json');

const types = readFileSync(typesPath, 'utf8');
const inputs = readFileSync(inputsPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(types, /export interface AppShellTitleBarCompositionInputs\b/, 'shell types should define title-bar inputs.');
assert.match(types, /export interface AppShellMainContentCompositionInputs\b/, 'shell types should define main-content inputs.');
assert.match(types, /export interface AppShellOverlayCompositionInputs\b/, 'shell types should define overlay inputs.');
assert.match(types, /export interface AppShellCompositionOptions \{[\s\S]*titleBar: AppShellTitleBarCompositionInputs;[\s\S]*mainContent: AppShellMainContentCompositionInputs;[\s\S]*overlay: AppShellOverlayCompositionInputs;[\s\S]*\}/, 'shell options should group inputs by rendered region.');
assert.match(inputs, /return \{[\s\S]*titleBar: \{[\s\S]*mainContent: \{[\s\S]*overlay: \{[\s\S]*\};/, 'input factory should return the three shell input groups.');
assert.match(inputs, /titleBar: \{[\s\S]*compactMode: appState\.compactMode,[\s\S]*language: taskState\.appSettings\.language,[\s\S]*appModalActions,[\s\S]*\}/, 'input factory should source title-bar inputs from existing state and actions.');
assert.match(inputs, /mainContent: \{[\s\S]*visibleTasks,[\s\S]*addTask: taskState\.addTask,[\s\S]*\}/, 'input factory should retain task-view and task-action inputs in the main-content group.');
assert.match(inputs, /overlay: \{[\s\S]*settingsOpen: appState\.settingsOpen,[\s\S]*companionOpen: appState\.companionOpen,[\s\S]*editingTemplateKind: appState\.editingTemplateKind,[\s\S]*\}/, 'input factory should retain overlay state in the overlay group.');
assert.match(composition, /export function createAppShellComposition\(\{\s*titleBar,\s*mainContent,\s*overlay,\s*\}: AppShellCompositionOptions\)/, 'shell composition should consume grouped inputs.');
assert.match(composition, /const mainContentProps = createAppShellMainContentComposition\(mainContent\);/, 'shell composition should delegate the main-content group unchanged.');
assert.match(composition, /const overlayStackProps = createAppShellOverlayComposition\(overlay\);/, 'shell composition should delegate the overlay group unchanged.');
assert.match(composition, /compactMode: titleBar\.compactMode,[\s\S]*language: titleBar\.language,[\s\S]*onToggleSettings: titleBar\.appModalActions\.toggleSettings,/, 'shell composition should assemble title-bar props from the title-bar group.');
assert.equal(scripts['verify:app-shell-composition-grouping'], 'tsx scripts/verify-app-shell-composition-grouping.ts', 'package.json should expose the focused shell grouping verifier.');
assertCleanupCoreIncludes('verify:app-shell-composition-grouping', 'cleanup-core should include the focused shell grouping verifier.');

console.log('App shell composition grouping verification passed');
