import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const mainPath = join(root, 'electron/main.ts');
const iconsPath = join(root, 'electron/appIcons.ts');
const obsidianServicesPath = join(root, 'electron/mainObsidianServices.ts');
const aiReviewServicesPath = join(root, 'electron/mainAiReviewServices.ts');

const main = readFileSync(mainPath, 'utf8');
const mainLines = main.split(/\r?\n/).length;

assert.ok(existsSync(iconsPath), 'Electron app icon module should exist.');
assert.ok(existsSync(obsidianServicesPath), 'Electron main Obsidian services module should exist.');
assert.ok(existsSync(aiReviewServicesPath), 'Electron main AI review services module should exist.');

const icons = readFileSync(iconsPath, 'utf8');
const obsidianServices = readFileSync(obsidianServicesPath, 'utf8');
const aiReviewServices = readFileSync(aiReviewServicesPath, 'utf8');

assert.match(icons, /export function resolveIconPath\b/, 'appIcons should export resolveIconPath.');
assert.match(icons, /export function createAppIcon\b/, 'appIcons should export createAppIcon.');
assert.match(icons, /export function createTrayIcon\b/, 'appIcons should export createTrayIcon.');
assert.match(icons, /APP_ICON_PNG_BASE64/, 'appIcons should own the fallback icon data.');
assert.match(icons, /nativeImage\.createFromPath/, 'appIcons should create Electron native images from resource files.');
assert.match(icons, /statSync\(candidate\)\.isFile\(\)/, 'resolveIconPath should ignore existing directories and return only real icon files.');
assert.match(icons, /resize\(\{ width: 16, height: 16 \}\)/, 'Tray icon should keep the compact tray size.');

assert.match(main, /from '\.\/appIcons'/, 'main should import icon helpers from appIcons.');
assert.doesNotMatch(main, /const APP_ICON_PNG_BASE64/, 'main should not inline fallback icon data.');
assert.doesNotMatch(main, /function resolveIconPath\b/, 'main should not define resolveIconPath inline.');
assert.doesNotMatch(main, /function createAppIcon\b/, 'main should not define createAppIcon inline.');
assert.doesNotMatch(main, /function createTrayIcon\b/, 'main should not define createTrayIcon inline.');
assert.doesNotMatch(main.split('\n')[0], /nativeImage/, 'main electron import should not include nativeImage after icon extraction.');

assert.match(obsidianServices, /export function createMainObsidianServices\b/, 'mainObsidianServices should export createMainObsidianServices.');
assert.match(obsidianServices, /createObsidianDailyNoteContentHelpers\(\{/, 'mainObsidianServices should compose daily-note content helpers.');
assert.match(obsidianServices, /createObsidianSyncHelpers\(\{/, 'mainObsidianServices should compose Obsidian sync helpers.');
assert.match(obsidianServices, /getDateKey,/, 'mainObsidianServices should own date-key helper injection.');
assert.match(obsidianServices, /getTaskDate,/, 'mainObsidianServices should own task-date helper injection.');
assert.match(obsidianServices, /getReviewDate,/, 'mainObsidianServices should own review-date helper injection.');
assert.match(obsidianServices, /runReviewForDate,/, 'mainObsidianServices should preserve AI review bridge injection.');
assert.match(obsidianServices, /localBlogDraftDir,/, 'mainObsidianServices should preserve blog-draft directory injection.');

assert.match(aiReviewServices, /from '\.\/mainObsidianServices'/, 'AI review services should compose the Obsidian services helper.');
assert.match(aiReviewServices, /createMainObsidianServices\(\{/, 'AI review services should create Obsidian services through the composition helper.');
assert.match(main, /from '\.\/mainAiReviewServices'/, 'main should import the focused AI review services composition helper.');
assert.match(main, /createMainAiReviewServices\(\{/, 'main should create AI review and Obsidian services through the composition helper.');
assert.doesNotMatch(main, /from '\.\/mainObsidianServices'/, 'main should not import Obsidian services directly after AI review services extraction.');
assert.doesNotMatch(main, /from '\.\/obsidianDailyNoteContent'/, 'main should not import daily-note content helpers directly after services extraction.');
assert.doesNotMatch(main, /from '\.\/obsidianSync'/, 'main should not import Obsidian sync helpers directly after services extraction.');
assert.ok(mainLines < 300, `electron/main.ts should stay below 300 lines after Obsidian services extraction; got ${mainLines}`);

console.log('electron main modules verification passed');
