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

assert.match(diagnostics, /export function startCrashDiagnostics\b/, 'diagnostics should continue to export the low-level crash diagnostics starter.');
assert.match(diagnostics, /export function startCrashDiagnosticsSafely\b/, 'diagnostics should export a safe startup wrapper for crash diagnostics.');
assert.match(diagnostics, /try \{\s*startCrashDiagnostics\(diag\);\s*\} catch \(error\) \{\s*diag\(`crash diagnostics startup failed: \$\{String\(error\)\}`\);\s*\}/, 'diagnostics safe starter should preserve the top-level startup failure guard.');
assert.match(diagnostics, /export function createMainDiagnostics\b/, 'diagnostics should expose the main-process diagnostics bootstrap helper that consumes the safe starter.');
assert.match(diagnostics, /startCrashDiagnosticsSafely\(diag\)/, 'main diagnostics bootstrap should start crash diagnostics through the safe starter.');

assert.match(main, /from '\.\/diagnostics'/, 'main should import diagnostics helpers.');
assert.match(main, /import \{ createMainDiagnostics \} from '\.\/diagnostics';/, 'main should initialize diagnostics through the higher-level bootstrap helper.');
assert.match(main, /const diag = createMainDiagnostics\(\);/, 'main should create its diagnostics logger through createMainDiagnostics().');
assert.doesNotMatch(main, /startCrashDiagnostics\(diag\)/, 'main should not call the low-level crash diagnostics starter directly after safe-start extraction.');
assert.doesNotMatch(main, /startCrashDiagnosticsSafely\(diag\)/, 'main should not call the safe crash diagnostics starter directly after diagnostics bootstrap extraction.');
assert.doesNotMatch(main, /crash diagnostics startup failed/, 'main should not own the crash diagnostics startup failure message after extraction.');
assert.doesNotMatch(main, /try \{\s*(?:\/\/[^\n]*\n\s*)?startCrashDiagnostics/, 'main should not wrap crash diagnostics startup in an inline try/catch after extraction.');

assert.equal(
  scripts['verify:electron-diagnostics-safe-start-module'],
  'tsx scripts/verify-electron-diagnostics-safe-start-module.ts',
  'package.json should expose the focused diagnostics safe-start verifier.',
);
assertCleanupCoreIncludes('verify:electron-diagnostics-safe-start-module', 'cleanup-core should include the focused diagnostics safe-start verifier.');

console.log('electron diagnostics safe-start module verification passed');
