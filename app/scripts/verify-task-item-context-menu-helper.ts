import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/components/taskItem/taskItemContextMenu.ts');
const taskItemPath = join(root, 'src/components/TaskItem.tsx');

assert.ok(existsSync(helperPath), 'TaskItem context menu helper module should exist.');

const helper = readFileSync(helperPath, 'utf8');
const taskItem = readFileSync(taskItemPath, 'utf8');

assert.match(helper, /export type TaskContextMenuTheme\b/, 'helper should export TaskContextMenuTheme.');
assert.match(helper, /export type TaskContextMenuPayload\b/, 'helper should export TaskContextMenuPayload.');
assert.match(helper, /export function parseCssNumber\b/, 'helper should export parseCssNumber.');
assert.match(helper, /export function getThemeIdFromClassList\b/, 'helper should export getThemeIdFromClassList.');
assert.match(helper, /export function createTaskContextMenuTheme\b/, 'helper should export createTaskContextMenuTheme.');
assert.match(helper, /export function createTaskContextMenuPayload\b/, 'helper should export createTaskContextMenuPayload.');
assert.match(helper, /export function createTaskContextMenuOpenPayload\b/, 'helper should export createTaskContextMenuOpenPayload.');
assert.match(helper, /Number\.isFinite\(parsed\)/, 'helper should preserve finite-number CSS parsing fallback.');
assert.match(helper, /Math\.min\(max, Math\.max\(min, parsed\)\)/, 'helper should clamp parsed CSS numbers to safe bounds.');
assert.match(helper, /parseCssNumber\(viewportStyle\.getPropertyValue\('--menu-opacity'\), 0\.96, 0\.3, 1\)/, 'helper should clamp menu opacity to a safe visual range.');
assert.match(helper, /parseCssNumber\(viewportStyle\.getPropertyValue\('--blur-strength'\), 18, 0, 40\)/, 'helper should clamp menu blur strength to a safe visual range.');
assert.match(helper, /parseCssNumber\(viewportStyle\.getPropertyValue\('--card-radius'\), 12, 0, 32\)/, 'helper should clamp menu card radius to a safe visual range.');
assert.match(helper, /function normalizeScreenCoordinate\(value: number\): number/, 'helper should define a popup coordinate normalizer.');
assert.match(helper, /typeof value === 'number' && Number\.isFinite\(value\) \? value : 0/, 'popup coordinate normalizer should reject non-finite runtime coordinates.');
assert.match(helper, /startsWith\('theme-'\)/, 'helper should preserve theme-* class detection.');
assert.match(helper, /'--personal-accent'/, 'helper should read the active personal accent CSS variable.');
assert.match(helper, /'--personal-secondary'/, 'helper should read the active secondary CSS variable.');
assert.match(helper, /'--menu-opacity'/, 'helper should read menu opacity from viewport CSS variables.');
assert.match(helper, /'--blur-strength'/, 'helper should read blur strength from viewport CSS variables.');
assert.match(helper, /'--card-radius'/, 'helper should read card radius from viewport CSS variables.');
assert.match(helper, /'#52525b'/, 'helper should preserve the default accent fallback.');
assert.match(helper, /'#a1a1aa'/, 'helper should preserve the default secondary fallback.');
assert.match(helper, /0\.96/, 'helper should preserve the default menu opacity fallback.');
assert.match(helper, /18/, 'helper should preserve the default blur fallback.');
assert.match(helper, /12/, 'helper should preserve the default card radius fallback.');
assert.match(helper, /createTaskContextMenuTheme\(\{[\s\S]*shellClassList[\s\S]*themeStyle[\s\S]*viewportStyle[\s\S]*\}\)/, 'open-payload helper should compose the current theme from shell and viewport styles.');
assert.match(helper, /screenX: normalizeScreenCoordinate\(options\.screenX\)/, 'popup payload helper should normalize screenX before IPC.');
assert.match(helper, /screenY: normalizeScreenCoordinate\(options\.screenY\)/, 'popup payload helper should normalize screenY before IPC.');
assert.match(helper, /createTaskContextMenuPayload\(\{[\s\S]*task:[\s\S]*allTags:[\s\S]*screenX:[\s\S]*screenY:[\s\S]*isDark:[\s\S]*theme,[\s\S]*\}\)/, 'open-payload helper should compose the popup payload with task data, coordinates, dark mode, and theme.');

assert.match(taskItem, /from '\.\/taskItem\/taskItemContextMenu'/, 'TaskItem should import context menu helpers.');
assert.match(taskItem, /createTaskContextMenuOpenPayload\(/, 'TaskItem should delegate popup open-payload construction to the helper.');
assert.doesNotMatch(taskItem, /createTaskContextMenuPayload\(/, 'TaskItem should not directly compose the popup payload after the open-payload helper extraction.');
assert.doesNotMatch(taskItem, /createTaskContextMenuTheme\(/, 'TaskItem should not directly compose the popup theme after the open-payload helper extraction.');
assert.doesNotMatch(taskItem, /const num = \(value: string, fallback: number\)/, 'TaskItem should not inline CSS numeric parsing.');
assert.doesNotMatch(taskItem, /startsWith\('theme-'\)/, 'TaskItem should not inline theme class detection.');
assert.doesNotMatch(taskItem, /theme:\s*\{\s*themeId,/s, 'TaskItem should not inline the task-menu theme object.');

console.log('TaskItem context menu helper verification passed');
