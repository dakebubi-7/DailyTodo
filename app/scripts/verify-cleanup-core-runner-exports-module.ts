import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const runnerPath = join(root, 'scripts', 'verify-cleanup-core.ts');
const helperPath = join(root, 'scripts', 'verifyCleanupCore.ts');
const packagePath = join(root, 'package.json');

const runner = readFileSync(runnerPath, 'utf8');
const helper = readFileSync(helperPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(
  runner,
  /export const cleanupCoreCommands = \[/,
  'cleanup-core runner should export the command list so verifiers can consume the same source of truth.',
);
assert.match(
  runner,
  /export function runCleanupCore\b/,
  'cleanup-core runner should export runCleanupCore for script execution and focused testing.',
);
assert.match(
  runner,
  /if \(fileURLToPath\(import\.meta\.url\) === process\.argv\[1\]\) \{\s*runCleanupCore\(\);\s*\}/,
  'cleanup-core runner should execute only when invoked as the entrypoint, not when imported by verifiers.',
);
assert.match(
  helper,
  /import \{ cleanupCoreCommands \} from '\.\/verify-cleanup-core';/,
  'verifyCleanupCore should import the cleanup-core command list instead of parsing runner source text.',
);
assert.doesNotMatch(helper, /readFileSync\(runnerPath/, 'verifyCleanupCore should not read the runner file to parse commands after runner exports exist.');
assert.equal(
  scripts['verify:cleanup-core-runner-exports-module'],
  'tsx scripts/verify-cleanup-core-runner-exports-module.ts',
  'package.json should expose the cleanup-core runner exports verifier.',
);
assertCleanupCoreIncludes(
  'verify:cleanup-core-runner-exports-module',
  'cleanup-core should include the focused cleanup-core runner exports verifier.',
);

console.log('cleanup-core runner exports verification passed');
