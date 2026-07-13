import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const root = process.cwd();
const controllerPath = join(root, 'electron', 'desktopWindowMode.ts');
const applierPath = join(root, 'electron', 'desktopWidgetStateApplier.ts');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

assert.ok(existsSync(applierPath), 'Desktop widget state application should live in a focused module.');

const controller = readFileSync(controllerPath, 'utf8');
const applier = readFileSync(applierPath, 'utf8');

assert.match(
  controller,
  /from '\.\/desktopWidgetStateApplier'/,
  'desktopWindowMode should delegate window state application to the focused applier.',
);
assert.match(
  controller,
  /const desktopWidgetStateApplier = createDesktopWidgetStateApplier\(/,
  'desktopWindowMode should compose the focused desktop widget state applier.',
);
assert.match(
  controller,
  /desktopWidgetStateApplier\.apply\(win, nextState, shouldForceAppBackground\)/,
  'desktopWindowMode should delegate resolved state changes to the focused applier.',
);
assert.doesNotMatch(
  controller,
  /function applyDesktopWidgetState\b/,
  'desktopWindowMode should not retain inline desktop widget state application.',
);

assert.match(applier, /export function createDesktopWidgetStateApplier\b/, 'The focused applier should export its factory.');
assert.match(applier, /nextState === 'desktop-visible'/, 'The focused applier should own desktop-visible state application.');
assert.match(applier, /nextState === 'dt-active'/, 'The focused applier should own active desktop state application.');
assert.match(applier, /win32\.sendToBottom\(handle\)/, 'The focused applier should preserve app-background sink behavior.');
assert.match(applier, /desktopOwner\.applyDesktopOwner\(win\)/, 'The focused applier should preserve desktop owner attachment.');
assert.match(applier, /desktopOwner\.clearDesktopOwner\(win\)/, 'The focused applier should preserve desktop owner cleanup.');

assert.equal(
  packageJson.scripts['verify:electron-desktop-widget-state-applier-module'],
  'tsx scripts/verify-electron-desktop-widget-state-applier-module.ts',
  'package.json should expose the focused desktop widget state-applier verifier.',
);
assertCleanupCoreIncludes(
  'verify:electron-desktop-widget-state-applier-module',
  'cleanup-core should include the focused desktop widget state-applier verifier.',
);

console.log('verify-electron-desktop-widget-state-applier-module passed');
