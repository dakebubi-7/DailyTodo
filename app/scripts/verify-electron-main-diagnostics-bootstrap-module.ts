import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const diagnosticsPath = join(root, 'electron', 'diagnostics.ts');
const mainPath = join(root, 'electron', 'main.ts');
const packagePath = join(root, 'package.json');

const diagnostics = readFileSync(diagnosticsPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(
  diagnostics,
  /export function createMainDiagnostics\b/,
  'diagnostics should export a main-process diagnostics bootstrap helper.',
);
assert.match(
  diagnostics,
  /const diag = createDiagLogger\(\);\s*\n\s*startCrashDiagnosticsSafely\(diag\);\s*\n\s*diag\('=== app starting ==='\);\s*\n\s*return diag;/,
  'diagnostics bootstrap helper should create the logger, safely start crash diagnostics, log app startup, and return diag.',
);

assert.match(main, /import \{ createMainDiagnostics \} from '\.\/diagnostics';/, 'main should import only the main diagnostics bootstrap helper.');
assert.match(main, /const diag = createMainDiagnostics\(\);/, 'main should initialize diagnostics through createMainDiagnostics().');
assert.doesNotMatch(main, /createDiagLogger\(\)/, 'main should not create the diagnostics logger inline after bootstrap extraction.');
assert.doesNotMatch(main, /startCrashDiagnosticsSafely\(diag\)/, 'main should not start crash diagnostics inline after bootstrap extraction.');
assert.doesNotMatch(main, /diag\('=== app starting ==='\)/, 'main should not own the app-starting diagnostics message after bootstrap extraction.');

assert.equal(
  scripts['verify:electron-main-diagnostics-bootstrap-module'],
  'tsx scripts/verify-electron-main-diagnostics-bootstrap-module.ts',
  'package.json should expose the focused main diagnostics bootstrap verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-diagnostics-bootstrap-module', 'cleanup-core should include the focused main diagnostics bootstrap verifier.');

console.log('electron main diagnostics bootstrap module verification passed');
