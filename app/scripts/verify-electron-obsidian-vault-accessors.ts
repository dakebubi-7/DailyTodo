import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const vaultAccessorsPath = join(root, 'electron/obsidianVaultAccessors.ts');
const appStateAccessorsPath = join(root, 'electron/appStateAccessors.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(vaultAccessorsPath), 'Electron Obsidian vault-accessors module should exist.');

const { createObsidianVaultAccessors } = await import('../electron/obsidianVaultAccessors');
const vaultAccessors = readFile(vaultAccessorsPath);
const appStateAccessors = readFile(appStateAccessorsPath);
const packageJson = JSON.parse(readFile(packagePath));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(vaultAccessors, /export function createObsidianVaultAccessors\b/, 'Vault-accessors module should export a focused factory.');
assert.match(vaultAccessors, /function getDefaultVaultPath\b/, 'Vault-accessors module should own development default-path policy.');
assert.match(vaultAccessors, /function getVaultStatus\b/, 'Vault-accessors module should own filesystem vault validation.');
assert.match(appStateAccessors, /from '\.\/obsidianVaultAccessors'/, 'App state accessors should compose the focused vault-accessors factory.');
assert.doesNotMatch(appStateAccessors, /function getVaultStatus\b/, 'App state accessors should not keep vault-status filesystem policy inline.');

const temporaryRoot = mkdtempSync(join(tmpdir(), 'dailytodo-vault-accessors-'));
const filePath = join(temporaryRoot, 'not-a-directory');
writeFileSync(filePath, 'file', 'utf8');
const fileBackedAccessors = createObsidianVaultAccessors({
  store: { get: () => filePath, set: () => {} },
  isDevelopmentBuild: () => false,
  devObsidianPath: '',
  zh: (text: string) => `localized: ${text}`,
});
assert.equal(fileBackedAccessors.getVaultStatus().ok, false, 'Vault accessors should reject stored paths that point to files.');

const malformedAccessors = createObsidianVaultAccessors({
  store: { get: () => ({ invalid: true }), set: () => {} },
  isDevelopmentBuild: () => false,
  devObsidianPath: '',
  zh: (text: string) => text,
});
assert.equal(malformedAccessors.getVaultPath(), '', 'Vault accessors should ignore malformed non-string store values.');
assert.equal(malformedAccessors.getVaultStatus().ok, false, 'Malformed stored vault paths should have unavailable status.');

assert.equal(
  scripts['verify:electron-obsidian-vault-accessors'],
  'tsx scripts/verify-electron-obsidian-vault-accessors.ts',
  'package.json should expose the focused Obsidian vault-accessors verifier.',
);
assertCleanupCoreIncludes('verify:electron-obsidian-vault-accessors', 'cleanup-core should include the focused Obsidian vault-accessors verifier.');

console.log('electron Obsidian vault-accessors verification passed');

function readFile(filePath: string) {
  return readFileSync(filePath, 'utf8');
}
