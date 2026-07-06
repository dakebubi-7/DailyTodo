import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const mainPath = join(root, 'electron/main.ts');
const iconsPath = join(root, 'electron/appIcons.ts');

const main = readFileSync(mainPath, 'utf8');

assert.ok(existsSync(iconsPath), 'Electron app icon module should exist.');

const icons = readFileSync(iconsPath, 'utf8');

assert.match(icons, /export function resolveIconPath\b/, 'appIcons should export resolveIconPath.');
assert.match(icons, /export function createAppIcon\b/, 'appIcons should export createAppIcon.');
assert.match(icons, /export function createTrayIcon\b/, 'appIcons should export createTrayIcon.');
assert.match(icons, /APP_ICON_PNG_BASE64/, 'appIcons should own the fallback icon data.');
assert.match(icons, /nativeImage\.createFromPath/, 'appIcons should create Electron native images from resource files.');
assert.match(icons, /resize\(\{ width: 16, height: 16 \}\)/, 'Tray icon should keep the compact tray size.');

assert.match(main, /from '\.\/appIcons'/, 'main should import icon helpers from appIcons.');
assert.doesNotMatch(main, /const APP_ICON_PNG_BASE64/, 'main should not inline fallback icon data.');
assert.doesNotMatch(main, /function resolveIconPath\b/, 'main should not define resolveIconPath inline.');
assert.doesNotMatch(main, /function createAppIcon\b/, 'main should not define createAppIcon inline.');
assert.doesNotMatch(main, /function createTrayIcon\b/, 'main should not define createTrayIcon inline.');
assert.doesNotMatch(main.split('\n')[0], /nativeImage/, 'main electron import should not include nativeImage after icon extraction.');

console.log('electron main modules verification passed');
