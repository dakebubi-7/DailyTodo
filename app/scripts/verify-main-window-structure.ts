import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const mainPath = path.join(process.cwd(), 'electron', 'main.ts');
const source = fs.readFileSync(mainPath, 'utf-8');
const minimizeRegistrations = source.match(/win\.on\('minimize'/g) || [];
const structuredMainLoad = /loadRenderer\(\s*win\s*,\s*\{\s*view:\s*'main'\s*\}\s*\)/.test(source);
const widgetLoad = /loadRenderer\(\s*widgetWindow\s*,\s*\{\s*view:\s*'widget'\s*\}\s*\)/.test(source);
const minimizeHandler = source.match(/win\.on\('minimize', \(\) => \{[\s\S]*?\n  \}\);/)?.[0] || '';

assert.equal(minimizeRegistrations.length, 1, 'main window should register minimize exactly once');
assert.equal(structuredMainLoad, true, 'main window should load the structured main view');
assert.equal(widgetLoad, true, 'widget window creation path should load the structured widget view');
assert.match(minimizeHandler, /diag\('evt: minimize'\)/, 'minimize handler should log the minimize event');
assert.match(minimizeHandler, /userHidden=\$\{userHidden\} windowMode=\$\{windowMode\} isVisible=\$\{win\.isVisible\(\)\}/, 'minimize handler should log state diagnostics');
assert.match(minimizeHandler, /needsDesktopGuard\(windowMode\)/, 'minimize handler should preserve desktop guard check');
assert.match(minimizeHandler, /win\.showInactive\(\)/, 'minimize handler should preserve desktop guard recovery');
assert.equal(source.includes("ipcMain.handle('window:minimize', hideMainWindow)"), true, 'window:minimize should use hideMainWindow');
assert.equal(source.includes("ipcMain.handle('window:close', hideMainWindow)"), true, 'window:close should use hideMainWindow');

console.log('main-window structure verification passed');
