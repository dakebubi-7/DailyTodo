import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'singleInstance.ts');
const mainPath = join(root, 'electron', 'main.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron single-instance module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function registerSingleInstancePolicy\b/, 'singleInstance should export registerSingleInstancePolicy.');
assert.match(helper, /type RegisterSingleInstancePolicyOptions\b/, 'singleInstance should define explicit boot-policy dependencies.');
assert.match(helper, /requestSingleInstanceLock\(\)/, 'singleInstance should own single-instance lock acquisition.');
assert.match(helper, /diag\(`singleInstanceLock gotLock=\$\{gotLock\}`\)/, 'singleInstance should preserve lock diagnostics.');
assert.match(helper, /diag\('duplicate instance .*quit'\)/, 'singleInstance should preserve duplicate-instance quit diagnostics.');
assert.match(helper, /app\.quit\(\)/, 'singleInstance should quit duplicate instances.');
assert.match(helper, /app\.on\('second-instance',/, 'singleInstance should own second-instance handling.');
assert.match(helper, /mainWindow\.isMinimized\(\)/, 'singleInstance should preserve minimized-window restore behavior.');
assert.match(helper, /mainWindow\.restore\(\)/, 'singleInstance should preserve restore-on-second-instance behavior.');
assert.match(helper, /mainWindow\.show\(\)/, 'singleInstance should preserve show-on-second-instance behavior.');
assert.match(helper, /mainWindow\.focus\(\)/, 'singleInstance should preserve focus-on-second-instance behavior.');
assert.match(helper, /return gotLock;/, 'singleInstance should return the lock result.');

assert.match(main, /from '\.\/singleInstance'/, 'main should import the single-instance helper.');
assert.match(main, /from '\.\/mainRuntimeState'/, 'main should import runtime state for single-instance main-window reads.');
assert.match(main, /registerSingleInstancePolicy\(\{\s*app,\s*diag,\s*getMainWindow: runtimeState\.getMainWindow,\s*\}\)/, 'main should delegate single-instance boot policy through the helper and runtime state.');
assert.doesNotMatch(main, /const gotLock = app\.requestSingleInstanceLock\(\);/, 'main should not acquire the single-instance lock inline after extraction.');
assert.doesNotMatch(main, /diag\(`singleInstanceLock gotLock=\$\{gotLock\}`\)/, 'main should not log single-instance lock results inline after extraction.');
assert.doesNotMatch(main, /app\.on\('second-instance',/, 'main should not register second-instance inline after extraction.');
assert.doesNotMatch(main, /diag\('duplicate instance .*quit'\)/, 'main should not keep duplicate-instance quit diagnostics inline after extraction.');

assert.equal(
  scripts['verify:electron-single-instance-module'],
  'tsx scripts/verify-electron-single-instance-module.ts',
  'package.json should expose the focused single-instance verifier.',
);
assertCleanupCoreIncludes('verify:electron-single-instance-module', 'cleanup-core should include the focused single-instance verifier.');

console.log('electron single-instance module verification passed');
