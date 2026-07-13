import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/mainWindowBootstrap.ts');
const ipcRegistrationPath = join(root, 'electron/mainWindowIpcRegistration.ts');
const startupPath = join(root, 'electron/mainWindowStartup.ts');
const compositionPath = join(root, 'electron/mainWindowComposition.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron main-window bootstrap module should exist.');
assert.ok(existsSync(ipcRegistrationPath), 'Electron main-window IPC registration module should exist.');
assert.ok(existsSync(startupPath), 'Electron main-window startup module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const ipcRegistration = readFileSync(ipcRegistrationPath, 'utf8');
const startup = readFileSync(startupPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function createMainWindowBootstrap\b/, 'mainWindowBootstrap should export createMainWindowBootstrap.');
assert.match(helper, /type CreateMainWindowBootstrapOptions\b/, 'mainWindowBootstrap should define explicit bootstrap dependencies.');
assert.match(helper, /llmResults\?: LlmResult\[\]/, 'mainWindowBootstrap should preserve the shared LLM diagnostic result contract.');
assert.match(helper, /SetupMainBrowserWindowOptions/, 'mainWindowBootstrap should return the factory bootstrap callback shape.');
assert.match(helper, /registerMainWindowEventHandlers\(\{/, 'mainWindowBootstrap should own main-window event wiring.');
assert.match(helper, /from '\.\/mainWindowIpcRegistration'/, 'mainWindowBootstrap should delegate IPC assembly through the focused registration helper.');
assert.match(helper, /\.\.\.createMainWindowIpcRegistrations\(/, 'mainWindowBootstrap should spread the IPC registration callbacks produced by the focused helper.');
assert.doesNotMatch(helper, /from '\.\/(?:windowIpc|settingsIpc|taskContextMenuIpc|companionIpc|aiReviewIpc|obsidianIpc)'/, 'mainWindowBootstrap should not import individual IPC registration modules.');
assert.match(ipcRegistration, /export function createMainWindowIpcRegistrations\b/, 'mainWindowIpcRegistration should export the IPC registration callback builder.');
assert.match(ipcRegistration, /from '\.\/windowIpc'/, 'mainWindowIpcRegistration should import window IPC registration.');
assert.match(ipcRegistration, /from '\.\/settingsIpc'/, 'mainWindowIpcRegistration should import settings IPC registration.');
assert.match(ipcRegistration, /from '\.\/taskContextMenuIpc'/, 'mainWindowIpcRegistration should import task context-menu IPC registration.');
assert.match(ipcRegistration, /from '\.\/companionIpc'/, 'mainWindowIpcRegistration should import companion IPC registration.');
assert.match(ipcRegistration, /from '\.\/aiReviewIpc'/, 'mainWindowIpcRegistration should import AI Review IPC registration.');
assert.match(ipcRegistration, /from '\.\/obsidianIpc'/, 'mainWindowIpcRegistration should import Obsidian IPC registration.');
assert.match(ipcRegistration, /registerWindowIpcHandlers\(\{/, 'mainWindowIpcRegistration should compose window IPC wiring.');
assert.match(ipcRegistration, /registerSettingsIpcHandlers\(\{/, 'mainWindowIpcRegistration should compose settings IPC wiring.');
assert.match(ipcRegistration, /registerTaskContextMenuIpcHandlers\(\{/, 'mainWindowIpcRegistration should compose task context-menu IPC wiring.');
assert.match(ipcRegistration, /defaultTaskMenuHeight:\s*TASK_MENU_HEIGHT,/, 'mainWindowIpcRegistration should preserve the task-menu height fallback.');
assert.match(ipcRegistration, /registerCompanionIpcHandlers\(\{/, 'mainWindowIpcRegistration should compose companion IPC wiring.');
assert.match(ipcRegistration, /registerAiReviewIpcHandlers\(\{/, 'mainWindowIpcRegistration should compose AI Review IPC wiring.');
assert.match(ipcRegistration, /registerObsidianIpcHandlers\(\{/, 'mainWindowIpcRegistration should compose Obsidian IPC wiring.');
assert.match(helper, /loadMainRenderer:\s*\(\)\s*=>\s*loadRenderer\(win,\s*\{\s*view:\s*'main'\s*\}\s*\)/, 'mainWindowBootstrap should own main renderer bootstrap wiring.');
assert.match(helper, /createTray:\s*\(\)\s*=>\s*\{[\s\S]*?createTray\(\);[\s\S]*?diag\('tray created'\);[\s\S]*?\}/, 'mainWindowBootstrap should preserve tray creation diagnostics.');

assert.match(composition, /from '\.\/mainWindowBootstrap'/, 'main-window composition should import the main-window bootstrap helper.');
assert.match(composition, /createBootstrap:\s*\(win\)\s*=>\s*createMainWindowBootstrap\(\{/, 'main-window composition should delegate bootstrap callback assembly through mainWindowBootstrap via the startup helper.');
assert.match(startup, /setupMainBrowserWindow\(win,\s*createBootstrap\(win\)\)/, 'mainWindowStartup should invoke the bootstrap builder through the factory helper.');
assert.doesNotMatch(composition, /registerMainWindowEventHandlers\(\{/, 'main-window composition should delegate event wiring through the bootstrap helper.');
assert.doesNotMatch(composition, /registerWindowIpcHandlers\(\{/, 'main-window composition should delegate window IPC through the bootstrap helper.');
assert.doesNotMatch(composition, /registerSettingsIpcHandlers\(\{/, 'main-window composition should delegate settings IPC through the bootstrap helper.');
assert.doesNotMatch(composition, /registerTaskContextMenuIpcHandlers\(\{/, 'main-window composition should delegate task context-menu IPC through the bootstrap helper.');
assert.doesNotMatch(composition, /registerCompanionIpcHandlers\(\{/, 'main-window composition should delegate companion IPC through the bootstrap helper.');
assert.doesNotMatch(composition, /registerAiReviewIpcHandlers\(\{/, 'main-window composition should delegate AI Review IPC through the bootstrap helper.');
assert.doesNotMatch(composition, /registerObsidianIpcHandlers\(\{/, 'main-window composition should delegate Obsidian IPC through the bootstrap helper.');

assert.equal(
  scripts['verify:electron-main-window-bootstrap-module'],
  'tsx scripts/verify-electron-main-window-bootstrap-module.ts',
  'package.json should expose the focused main-window bootstrap verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-window-bootstrap-module', 'cleanup-core should include the focused main-window bootstrap verifier.');

console.log('electron main-window bootstrap module verification passed');
