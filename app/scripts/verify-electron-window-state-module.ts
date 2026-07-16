import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const mainPath = join(root, 'electron/main.ts');
const windowStatePath = join(root, 'electron/windowState.ts');

const main = readFileSync(mainPath, 'utf8');

assert.ok(existsSync(windowStatePath), 'Electron window state module should exist.');

const windowState = readFileSync(windowStatePath, 'utf8');

for (const exportName of [
  'MIN_WINDOW_WIDTH',
  'DEFAULT_WINDOW_WIDTH',
  'DEFAULT_WINDOW_HEIGHT',
  'RESET_WINDOW_WIDTH',
  'RESET_WINDOW_HEIGHT',
  'getSettingsWindowWidth',
  'normalizeRestoredWindowState',
]) {
  assert.match(windowState, new RegExp(`export (const|function) ${exportName}\\b`), `windowState should export ${exportName}.`);
}

assert.match(windowState, /export type WindowState/, 'windowState should export the WindowState type.');
assert.match(windowState, /SETTINGS_WINDOW_WIDTH = 800/, 'windowState should own settings-mode width.');
assert.match(windowState, /width: DEFAULT_WINDOW_WIDTH/, 'windowState should normalize settings-sized windows back to widget width.');
assert.match(
  windowState,
  /from '\.\/unknownValueGuards'/,
  'windowState should reuse the shared object-record guard.',
);
assert.match(
  windowState,
  /isObjectRecord\(saved\)/,
  'normalizeRestoredWindowState should reject non-record store payloads with isObjectRecord.',
);
assert.doesNotMatch(
  windowState,
  /saved as WindowState/,
  'normalizeRestoredWindowState should not cast unknown store payloads as WindowState.',
);
assert.match(
  windowState,
  /function readFiniteNumber\b|const readFiniteNumber\b|typeof value === 'number' && Number\.isFinite\(value\)/,
  'normalizeRestoredWindowState should accept only finite numeric window bounds fields.',
);
assert.match(
  windowState,
  /readFiniteNumber\(record\.width\)|typeof record\.width === 'number' && Number\.isFinite\(record\.width\)/,
  'normalizeRestoredWindowState should narrow width from the unknown store record.',
);
assert.match(
  windowState,
  /readFiniteNumber\(record\.height\)|typeof record\.height === 'number' && Number\.isFinite\(record\.height\)/,
  'normalizeRestoredWindowState should narrow height from the unknown store record.',
);

assert.match(main, /from '\.\/windowState'/, 'main should import window state helpers from windowState.');
assert.doesNotMatch(main, /function getSettingsWindowWidth\b/, 'main should not define getSettingsWindowWidth inline.');
assert.doesNotMatch(main, /function normalizeRestoredWindowState\b/, 'main should not define normalizeRestoredWindowState inline.');
assert.doesNotMatch(main, /const SETTINGS_WINDOW_WIDTH\b/, 'main should not own settings window width after extraction.');

console.log('electron window state module verification passed');
