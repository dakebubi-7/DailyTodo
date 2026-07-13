import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/rendererLoader.ts');
const mainPath = join(root, 'electron/main.ts');
const bootstrapPath = join(root, 'electron/mainWindowBootstrap.ts');
const shellControllerPath = join(root, 'electron/mainShellController.ts');
const taskMenuWindowPath = join(root, 'electron/taskMenuWindow.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron renderer loader module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const shellController = readFileSync(shellControllerPath, 'utf8');
const taskMenuWindow = readFileSync(taskMenuWindowPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function createRendererLoader\b/, 'rendererLoader should export createRendererLoader.');
assert.match(helper, /type CreateRendererLoaderOptions\b/, 'rendererLoader should define explicit loader dependencies.');
assert.match(helper, /from '\.\.\/shared\/rendererRoute'/, 'rendererLoader should depend on shared renderer-route helpers.');
assert.match(helper, /process\.env\.ELECTRON_RENDERER_URL \|\| process\.env\.VITE_DEV_SERVER_URL/, 'rendererLoader should own the dev renderer URL resolution.');
assert.match(helper, /buildDevRendererUrl\(/, 'rendererLoader should own the dev renderer URL builder usage.');
assert.match(helper, /buildRendererQuery\(/, 'rendererLoader should own the file-mode renderer query builder usage.');
assert.match(helper, /diag\(`loadURL \$\{url\}`\)/, 'rendererLoader should preserve dev URL diagnostics.');
assert.match(helper, /diag\(`loadFile dist\/index\.html \$\{JSON\.stringify\(query\)\}`\)/, 'rendererLoader should preserve file-mode diagnostics.');
assert.match(helper, /win\.loadURL\(url\)/, 'rendererLoader should load the dev renderer URL.');
assert.match(helper, /win\.loadFile\(path\.join\(__dirname,\s*'\.\.\/dist\/index\.html'\),\s*\{\s*query\s*\}\)/, 'rendererLoader should load the packaged renderer file with route query params.');

assert.match(main, /from '\.\/rendererLoader'/, 'main should import the renderer loader helper.');
assert.match(main, /const loadRenderer = createRendererLoader\(\{\s*diag,\s*\}\)/, 'main should create the shared renderer loader through createRendererLoader.');
assert.doesNotMatch(main, /function loadRenderer\(win: BrowserWindow, route: RendererRoute\)/, 'main should not define loadRenderer inline after extraction.');
assert.match(bootstrap, /loadMainRenderer:\s*\(\)\s*=>\s*loadRenderer\(win,\s*\{\s*view:\s*'main'\s*\}\s*\)/, 'mainWindowBootstrap should continue using the injected shared renderer loader for the main view.');
assert.match(shellController, /createTaskMenuWindow\(payload,\s*\{[\s\S]*?loadRenderer,/, 'mainShellController should continue threading the shared renderer loader into task-menu popup creation.');
assert.match(taskMenuWindow, /loadRenderer\(menu,\s*\{\s*view:\s*'task-menu'/, 'taskMenuWindow should continue using the shared renderer loader for the task-menu view.');

assert.equal(
  scripts['verify:electron-renderer-loader-module'],
  'tsx scripts/verify-electron-renderer-loader-module.ts',
  'package.json should expose the focused renderer loader verifier.',
);
assertCleanupCoreIncludes('verify:electron-renderer-loader-module', 'cleanup-core should include the focused renderer loader verifier.');

console.log('electron renderer loader module verification passed');
