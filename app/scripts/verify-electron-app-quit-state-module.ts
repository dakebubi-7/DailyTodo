import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'appQuitState.ts');
const mainPath = join(root, 'electron', 'main.ts');
const bootstrapPath = join(root, 'electron', 'mainWindowBootstrap.ts');
const bootstrapTypesPath = join(root, 'electron', 'mainWindowBootstrapTypes.ts');
const lifecyclePath = join(root, 'electron', 'appLifecycle.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron app quit-state module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const bootstrapTypes = readFileSync(bootstrapTypesPath, 'utf8');
const lifecycle = readFileSync(lifecyclePath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export type AppQuitState\b/, 'appQuitState should export the shared AppQuitState type.');
assert.match(helper, /export function createAppQuitState\b/, 'appQuitState should export createAppQuitState.');
assert.match(helper, /let quitting = false;/, 'appQuitState should own the quit-state truth source.');
assert.match(helper, /isQuitting:\s*\(\)\s*=>\s*quitting/, 'appQuitState should expose quit-state reads.');
assert.match(helper, /markQuitting:\s*\(\)\s*=>\s*\{\s*quitting = true;\s*\}/, 'appQuitState should expose quit-state writes.');

assert.match(main, /from '\.\/appQuitState'/, 'main should import app quit-state helpers.');
assert.match(main, /const appQuitState = createAppQuitState\(\)/, 'main should create the shared app quit-state helper.');
assert.doesNotMatch(main, /let isQuitting = false;/, 'main should not keep isQuitting as a bare boolean after extraction.');
assert.doesNotMatch(main, /isQuitting = true;/, 'main should not write quit state inline after extraction.');
assert.match(main, /appQuitState\.markQuitting\(\);\s*\n\s*app\.quit\(\);/, 'main shell quit path should mark quit state through the helper before quitting.');
assert.match(main, /isQuitting: appQuitState\.isQuitting/, 'main should pass appQuitState.isQuitting into bootstrap/lifecycle boundaries.');
assert.match(main, /markQuitting: appQuitState\.markQuitting/, 'main should pass appQuitState.markQuitting into bootstrap/lifecycle boundaries.');

assert.match(bootstrap, /from '\.\/mainWindowBootstrapTypes'/, 'mainWindowBootstrap should depend on its focused dependency contract.');
assert.match(bootstrapTypes, /isQuitting\(\):\s*boolean;/, 'mainWindowBootstrapTypes should continue to define the quit-state reader callback.');
assert.match(bootstrapTypes, /markQuitting\(\):\s*void;/, 'mainWindowBootstrapTypes should continue to define the quit-state writer callback.');
assert.match(lifecycle, /markQuitting\(\):\s*void;/, 'appLifecycle should continue to depend on a quit-state writer callback.');
assert.match(lifecycle, /isQuitting\(\):\s*boolean;/, 'appLifecycle should continue to depend on a quit-state reader callback.');

assert.equal(
  scripts['verify:electron-app-quit-state-module'],
  'tsx scripts/verify-electron-app-quit-state-module.ts',
  'package.json should expose the focused app quit-state verifier.',
);
assertCleanupCoreIncludes('verify:electron-app-quit-state-module', 'cleanup-core should include the focused app quit-state verifier.');

console.log('electron app quit-state module verification passed');
