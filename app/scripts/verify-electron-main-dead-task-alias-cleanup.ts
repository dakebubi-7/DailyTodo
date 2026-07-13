import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const mainPath = join(root, 'electron', 'main.ts');
const sharedTypesPath = join(root, 'electron', 'sharedTypes.ts');
const packagePath = join(root, 'package.json');

const main = readFileSync(mainPath, 'utf8');
const sharedTypes = readFileSync(sharedTypesPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(sharedTypes, /export type ElectronTask\b/, 'sharedTypes should continue to own the ElectronTask definition for real consumers.');

assert.doesNotMatch(main, /import type \{ ElectronTask \} from '\.\/sharedTypes';/, 'main should not import ElectronTask when it only fed a dead local alias.');
assert.doesNotMatch(main, /type Task = ElectronTask;/, 'main should not keep the dead Task alias after downstream modules own task typing.');
assert.doesNotMatch(main, /\bTask\b/, 'main should not reference the dead local Task alias after cleanup.');

assert.equal(
  scripts['verify:electron-main-dead-task-alias-cleanup'],
  'tsx scripts/verify-electron-main-dead-task-alias-cleanup.ts',
  'package.json should expose the focused dead Task alias cleanup verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-dead-task-alias-cleanup', 'cleanup-core should include the focused dead Task alias cleanup verifier.');

console.log('electron main dead Task alias cleanup verification passed');
