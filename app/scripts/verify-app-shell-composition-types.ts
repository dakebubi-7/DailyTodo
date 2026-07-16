import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const typesPath = join(root, 'src', 'app', 'appShellCompositionTypes.ts');
const compositionPath = join(root, 'src', 'app', 'appShellComposition.tsx');
const inputsPath = join(root, 'src', 'app', 'appShellCompositionInputs.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(typesPath), 'app shell composition options should live in a dedicated type module.');

const types = readFileSync(typesPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const inputs = readFileSync(inputsPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(types, /export interface AppShellTitleBarCompositionInputs\b/, 'type module should own title-bar input typing.');
assert.match(types, /export type AppShellMainContentCompositionInputs = AppShellMainContentCompositionOptions;/, 'type module should retain main-content input composition.');
assert.match(types, /export type AppShellOverlayCompositionInputs = AppShellOverlayCompositionOptions;/, 'type module should retain overlay input composition.');
assert.match(types, /export interface AppShellCompositionOptions \{[\s\S]*titleBar: AppShellTitleBarCompositionInputs;[\s\S]*mainContent: AppShellMainContentCompositionInputs;[\s\S]*overlay: AppShellOverlayCompositionInputs;[\s\S]*\}/, 'type module should group the full shell input contract.');
assert.match(composition, /export type \{ AppShellCompositionOptions \} from '\.\/appShellCompositionTypes';/, 'shell composition should retain the established type export path.');
assert.doesNotMatch(composition, /export interface AppShellCompositionOptions\b/, 'shell composition should not keep the large input contract inline.');
assert.match(inputs, /import type \{ AppShellCompositionOptions \} from '\.\/appShellComposition';/, 'input assembly should keep using the stable shell composition type export.');
assert.equal(
  scripts['verify:app-shell-composition-types'],
  'tsx scripts/verify-app-shell-composition-types.ts',
  'package.json should expose the focused shell composition type verifier.',
);
assertCleanupCoreIncludes('verify:app-shell-composition-types', 'cleanup-core should include the focused shell composition type verifier.');

console.log('app shell composition types verification passed');
