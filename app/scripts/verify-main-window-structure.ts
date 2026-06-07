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

assert.equal(source.includes("const DESKTOP_WIDGET_WINDOW_STATE_KEY = 'desktopWidgetWindowState'"), true, 'widget should use a separate bounds key');
assert.equal(source.includes("label: zh('打开桌面组件')"), true, 'tray should include a widget entry');
assert.equal(source.includes('showDesktopWidgetWindow'), true, 'tray entry should use showDesktopWidgetWindow helper');
assert.equal(/function getInitialDesktopWidgetBounds\(\)/.test(source), true, 'widget should have dedicated initial bounds helper');
assert.equal(/function persistDesktopWidgetWindowState\(win: BrowserWindow\)/.test(source), true, 'widget should persist its own bounds');
assert.equal(/resizable:\s*true/.test(source), true, 'widget window should be resizable');

// Widget desktop pin must be event-driven (focus/blur), not a foreground poll.
assert.equal(/widgetWindow\.on\('focus'/.test(source), true, 'widget should react to its own focus event');
assert.equal(/widgetWindow\.on\('blur'/.test(source), true, 'widget should react to its own blur event');
assert.equal(source.includes('startWidgetDesktopPin'), true, 'widget should use the event-driven pin start');
assert.equal(source.includes('widgetDesktopGuardTimer'), false, 'widget must not run a setInterval poll');
assert.equal(source.includes('applyWidgetDesktopTopmost'), false, 'widget foreground-polling guard must be removed');

// The abandoned SetParent-into-wallpaper experiment must stay removed.
assert.equal(source.includes('embedIntoWallpaper'), false, 'wallpaper SetParent experiment must be removed');
assert.equal(source.includes('toggleWidgetWallpaperEmbed'), false, 'wallpaper embed tray toggle must be removed');

console.log('main-window structure verification passed');
