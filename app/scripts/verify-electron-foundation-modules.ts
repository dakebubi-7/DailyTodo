import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const mainPath = join(root, 'electron/main.ts');
const safeStorePath = join(root, 'electron/safeStore.ts');
const diagnosticsPath = join(root, 'electron/diagnostics.ts');

const main = readFileSync(mainPath, 'utf8');

assert.ok(existsSync(safeStorePath), 'Electron safe store module should exist.');
assert.ok(existsSync(diagnosticsPath), 'Electron diagnostics module should exist.');

const safeStore = readFileSync(safeStorePath, 'utf8');
const diagnostics = readFileSync(diagnosticsPath, 'utf8');

assert.match(safeStore, /export function getStoreConfigPath\b/, 'safeStore should export getStoreConfigPath.');
assert.match(safeStore, /export function createSafeStore\b/, 'safeStore should export createSafeStore.');
assert.match(safeStore, /config\.corrupt-/, 'safeStore should keep corrupt config backup behavior.');
assert.match(
  safeStore,
  /fs\.statSync\(configPath\)\.isFile\(\)/,
  'safeStore should only back up and overwrite config.json when the path is a real file.',
);
assert.match(safeStore, /new Store\(/, 'safeStore should own electron-store creation.');

assert.match(diagnostics, /export function getDiagnosticLogPath\b/, 'diagnostics should export getDiagnosticLogPath.');
assert.match(diagnostics, /export function createDiagLogger\b/, 'diagnostics should export createDiagLogger.');
assert.match(diagnostics, /export function startCrashDiagnostics\b/, 'diagnostics should export startCrashDiagnostics.');
assert.match(diagnostics, /crashReporter\.start/, 'diagnostics should own crash reporter startup.');
assert.match(diagnostics, /process\.on\('uncaughtException'/, 'diagnostics should register uncaughtException logging.');
assert.match(diagnostics, /process\.on\('unhandledRejection'/, 'diagnostics should register unhandledRejection logging.');

assert.match(main, /from '\.\/safeStore'/, 'main should import safe store helpers.');
assert.match(main, /from '\.\/diagnostics'/, 'main should import diagnostics helpers.');
assert.doesNotMatch(main, /import Store from 'electron-store'/, 'main should not import electron-store directly.');
assert.doesNotMatch(main, /crashReporter/, 'main should not import or start crashReporter directly.');
assert.doesNotMatch(main, /function getStoreConfigPath\b/, 'main should not define getStoreConfigPath inline.');
assert.doesNotMatch(main, /function createSafeStore\b/, 'main should not define createSafeStore inline.');
assert.doesNotMatch(main, /const DIAG_LOG\b/, 'main should not own diagnostic log path construction.');
assert.doesNotMatch(main, /function diag\b/, 'main should not define diag inline.');

console.log('electron foundation modules verification passed');
