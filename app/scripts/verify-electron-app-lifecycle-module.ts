import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/appLifecycle.ts');
const mainPath = join(root, 'electron/main.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron app lifecycle module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function registerAppLifecycleHandlers\b/, 'appLifecycle should export registerAppLifecycleHandlers.');
assert.match(helper, /type RegisterAppLifecycleHandlersOptions\b/, 'appLifecycle should define explicit lifecycle-registration dependencies.');
assert.match(helper, /app\.whenReady\(\)\.then\(/, 'appLifecycle should own whenReady bootstrap handling.');
assert.match(helper, /createWindow\(\)/, 'appLifecycle should create the main window during ready/activate handling.');
assert.match(helper, /app\.on\('child-process-gone'/, 'appLifecycle should own child-process-gone diagnostics.');
assert.match(helper, /details\.type === 'GPU'/, 'appLifecycle should preserve the GPU child-process guard.');
assert.match(helper, /app\.on\('before-quit'/, 'appLifecycle should own before-quit behavior.');
assert.match(helper, /markQuitting\(\)/, 'appLifecycle should preserve quit-state marking.');
assert.match(helper, /clearDesktopOwner\(mainWindow\)/, 'appLifecycle should preserve desktop owner cleanup before quit.');
assert.match(helper, /app\.on\('will-quit'/, 'appLifecycle should own will-quit diagnostics.');
assert.match(helper, /app\.on\('quit'/, 'appLifecycle should own quit diagnostics.');
assert.match(helper, /app\.on\('window-all-closed'/, 'appLifecycle should own window-all-closed handling.');
assert.match(helper, /clearMainWindow\(\)/, 'appLifecycle should clear main-window ownership when all windows close.');
assert.match(helper, /process\.platform !== 'darwin'/, 'appLifecycle should preserve the non-darwin quit guard.');
assert.match(helper, /app\.on\('activate'/, 'appLifecycle should own activate re-open behavior.');
assert.match(helper, /BrowserWindow\.getAllWindows\(\)\.length === 0/, 'appLifecycle should preserve activate re-open guard.');

assert.match(main, /from '\.\/appLifecycle'/, 'main should import lifecycle helpers from appLifecycle.');
assert.match(main, /registerAppLifecycleHandlers\(\{/, 'main should delegate lifecycle registration to appLifecycle.');
assert.doesNotMatch(main, /app\.whenReady\(\)\.then\(/, 'main should not keep whenReady bootstrap inline after extraction.');
assert.doesNotMatch(main, /app\.on\('child-process-gone'/, 'main should not keep child-process-gone inline after extraction.');
assert.doesNotMatch(main, /app\.on\('before-quit'/, 'main should not keep before-quit inline after extraction.');
assert.doesNotMatch(main, /app\.on\('will-quit'/, 'main should not keep will-quit inline after extraction.');
assert.doesNotMatch(main, /app\.on\('quit'/, 'main should not keep quit inline after extraction.');
assert.doesNotMatch(main, /app\.on\('window-all-closed'/, 'main should not keep window-all-closed inline after extraction.');
assert.doesNotMatch(main, /app\.on\('activate'/, 'main should not keep activate inline after extraction.');

assert.equal(
  scripts['verify:electron-app-lifecycle-module'],
  'tsx scripts/verify-electron-app-lifecycle-module.ts',
  'package.json should expose the focused app lifecycle verifier.',
);
assertCleanupCoreIncludes('verify:electron-app-lifecycle-module', 'cleanup-core should include the focused app lifecycle verifier.');

console.log('electron app lifecycle module verification passed');
