import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const root = process.cwd();
const controllerPath = join(root, 'electron', 'desktopWindowMode.ts');
const hostPath = join(root, 'electron', 'desktopWindowHost.ts');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

assert.ok(existsSync(hostPath), 'Desktop window hosting should live in a focused module.');

const controller = readFileSync(controllerPath, 'utf8');
const host = readFileSync(hostPath, 'utf8');

assert.match(
  controller,
  /from '\.\/desktopWindowHost'/,
  'desktopWindowMode should delegate Explorer hosting to the focused controller.',
);
assert.match(
  controller,
  /const desktopHost = createDesktopWindowHost\(/,
  'desktopWindowMode should compose the focused desktop host controller.',
);
assert.match(
  controller,
  /desktopHost\.ensureAttached\(win\)/,
  'desktopWindowMode should delegate host recovery to the focused controller.',
);
assert.doesNotMatch(
  controller,
  /sendToBottom/,
  'desktopWindowMode should not retain application-background sinking.',
);

assert.match(host, /export function createDesktopWindowHost\b/, 'The focused host should export its factory.');
assert.match(host, /win32\.attachToDesktop\(handle\)/, 'The focused host should attach the window to Explorer.');
assert.match(host, /win32\.isAttachedToDesktop\(handle\)/, 'The focused host should detect Explorer replacement.');
assert.match(host, /detachFromDesktop/, 'The focused host should restore independent windows on exit.');

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
