import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const mainPath = path.join(process.cwd(), 'electron', 'main.ts');
const source = fs.readFileSync(mainPath, 'utf-8');
const minimizeRegistrations = source.match(/win\.on\('minimize'/g) || [];
const structuredMainLoad = /loadRenderer\(\s*win\s*,\s*\{\s*view:\s*'main'\s*\}\s*\)/.test(source);
const minimizeHandler = source.match(/win\.on\('minimize', \(\) => \{[\s\S]*?\n  \}\);/)?.[0] || '';

assert.equal(minimizeRegistrations.length, 1, 'main window should register minimize exactly once');
assert.equal(structuredMainLoad, true, 'main window should load the structured main view');
assert.match(minimizeHandler, /diag\('evt: minimize'\)/, 'minimize handler should log the minimize event');
assert.match(minimizeHandler, /userHidden=\$\{userHidden\} windowMode=\$\{windowMode\} isVisible=\$\{win\.isVisible\(\)\}/, 'minimize handler should log state diagnostics');
assert.match(minimizeHandler, /needsDesktopGuard\(windowMode\)/, 'minimize handler should preserve desktop guard check');
assert.match(minimizeHandler, /win\.showInactive\(\)/, 'minimize handler should preserve desktop guard recovery');
assert.equal(source.includes("ipcMain.handle('window:minimize', hideMainWindow)"), true, 'window:minimize should use hideMainWindow');
assert.equal(source.includes("ipcMain.handle('window:close', hideMainWindow)"), true, 'window:close should use hideMainWindow');

// 独立桌面小组件窗口已移除；主窗口「钉在桌面」仍保留。
assert.equal(source.includes("label: zh('打开桌面组件')"), false, 'tray should not include a separate widget entry');
assert.equal(source.includes('showDesktopWidgetWindow'), false, 'separate widget window helper should be removed');
assert.equal(source.includes('createDesktopWidgetWindow'), false, 'separate widget window creation should be removed');
assert.equal(source.includes('DESKTOP_WIDGET_WINDOW_STATE_KEY'), false, 'separate widget bounds key should be removed');
assert.equal(source.includes('widgetDesktopGuardTimer'), false, 'separate widget desktop guard should be removed');
assert.equal(source.includes('startWidgetDesktopPin'), false, 'separate widget pin helper should be removed');
assert.equal(source.includes('applyWidgetDesktopOwner'), false, 'separate widget desktop owner helper should be removed');
assert.equal(source.includes('raiseWidget'), false, 'separate widget raise helper should be removed');
assert.equal(source.includes('sinkWidget'), false, 'separate widget sink helper should be removed');
assert.equal(source.includes("label: zh('钉在桌面（组件模式）')"), true, 'tray desktop pin entry should remain');
assert.equal(source.includes('startDesktopGuard'), true, 'main-window desktop guard should remain');
assert.equal(source.includes('applyDesktopWidgetState'), true, 'main-window desktop state machine should remain');

// The abandoned SetParent-into-wallpaper experiment must stay removed.
assert.equal(source.includes('embedIntoWallpaper'), false, 'wallpaper SetParent experiment must be removed');
assert.equal(source.includes('toggleWidgetWallpaperEmbed'), false, 'wallpaper embed tray toggle must be removed');

console.log('main-window structure verification passed');
