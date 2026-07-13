import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const typesPath = join(root, 'electron', 'mainWindowBootstrapTypes.ts');
const bootstrapPath = join(root, 'electron', 'mainWindowBootstrap.ts');
const ipcRegistrationPath = join(root, 'electron', 'mainWindowIpcRegistration.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(typesPath), 'main-window bootstrap options should live in a dedicated type module.');

const types = readFileSync(typesPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const ipcRegistration = readFileSync(ipcRegistrationPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(types, /export type CreateMainWindowBootstrapOptions\b/, 'type module should own the full bootstrap dependency contract.');
assert.match(types, /export type EnsureReportLlmAvailableResult\b/, 'type module should own the report LLM availability result contract.');
assert.match(types, /llmResults\?: LlmResult\[\]/, 'type module should retain the shared LLM diagnostic result typing.');
assert.match(types, /ensureReportLlmAvailable\(reportKind: AiReviewReportKind\): EnsureReportLlmAvailableResult/, 'type module should retain report LLM preflight typing.');
assert.match(bootstrap, /export type \{[\s\S]*CreateMainWindowBootstrapOptions[\s\S]*\} from '\.\/mainWindowBootstrapTypes'/, 'bootstrap module should retain the established type export path.');
assert.doesNotMatch(bootstrap, /export type CreateMainWindowBootstrapOptions\b/, 'bootstrap module should not keep the large dependency contract inline.');
assert.match(ipcRegistration, /import type \{ CreateMainWindowBootstrapOptions \} from '\.\/mainWindowBootstrap'/, 'IPC registration should keep using the stable bootstrap type export.');

assert.equal(
  scripts['verify:electron-main-window-bootstrap-types'],
  'tsx scripts/verify-electron-main-window-bootstrap-types.ts',
  'package.json should expose the focused main-window bootstrap type verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-window-bootstrap-types', 'cleanup-core should include the focused main-window bootstrap type verifier.');

console.log('electron main-window bootstrap types verification passed');
