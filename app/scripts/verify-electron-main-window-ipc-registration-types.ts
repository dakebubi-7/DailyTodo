import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const typesPath = join(root, 'electron', 'mainWindowIpcRegistrationTypes.ts');
const registrationPath = join(root, 'electron', 'mainWindowIpcRegistration.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(typesPath), 'main-window IPC registration options should live in a dedicated type module.');

const types = readFileSync(typesPath, 'utf8');
const registration = readFileSync(registrationPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(types, /export type MainWindowIpcRegistrationOptions\b/, 'type module should own the IPC registration dependency contract.');
assert.match(types, /export type MainWindowIpcRegistrations\b/, 'type module should own the IPC registration callback contract.');
assert.match(types, /'registerObsidianIpc'/, 'type module should retain all IPC registration callbacks.');
assert.match(registration, /export type \{[\s\S]*MainWindowIpcRegistrationOptions[\s\S]*\} from '\.\/mainWindowIpcRegistrationTypes'/, 'registration module should retain the established type export path.');
assert.doesNotMatch(registration, /^type MainWindowIpcRegistrationOptions\b/m, 'registration module should not keep the large dependency contract inline.');
assert.doesNotMatch(registration, /^type MainWindowIpcRegistrations\b/m, 'registration module should not keep the callback contract inline.');
assert.match(registration, /registerAiReviewIpcHandlers\(\{/, 'registration module should retain AI Review IPC runtime composition.');
assert.match(registration, /registerObsidianIpcHandlers\(\{/, 'registration module should retain Obsidian IPC runtime composition.');
assert.equal(
  scripts['verify:electron-main-window-ipc-registration-types'],
  'tsx scripts/verify-electron-main-window-ipc-registration-types.ts',
  'package.json should expose the focused IPC registration type verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-window-ipc-registration-types', 'cleanup-core should include the focused IPC registration type verifier.');

console.log('electron main-window IPC registration types verification passed');
