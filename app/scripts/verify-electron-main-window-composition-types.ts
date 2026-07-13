import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const typesPath = join(root, 'electron', 'mainWindowCompositionTypes.ts');
const compositionPath = join(root, 'electron', 'mainWindowComposition.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(typesPath), 'main-window composition options should live in a dedicated type module.');

const types = readFileSync(typesPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(types, /export type CreateMainWindowCompositionOptions\b/, 'type module should own the full composition dependency contract.');
assert.match(types, /trayRefreshBridge: TrayRefreshBridge/, 'type module should retain tray refresh bridge typing.');
assert.match(types, /createMainWindowBootstrap/, 'type module should derive bootstrap dependency shape from createMainWindowBootstrap.');
assert.match(composition, /export type \{ CreateMainWindowCompositionOptions \} from '\.\/mainWindowCompositionTypes'/, 'composition module should retain the established type export path.');
assert.doesNotMatch(composition, /type CreateMainWindowCompositionOptions\b/, 'composition module should not keep the large dependency contract inline.');
assert.equal(
  scripts['verify:electron-main-window-composition-types'],
  'tsx scripts/verify-electron-main-window-composition-types.ts',
  'package.json should expose the focused main-window composition type verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-window-composition-types', 'cleanup-core should include the focused main-window composition type verifier.');

console.log('electron main-window composition types verification passed');
