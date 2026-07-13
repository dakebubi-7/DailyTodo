import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const presets = readFileSync(join(root, 'src/types/themePresets.ts'), 'utf8');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const taskItemContextMenu = readFileSync(join(root, 'src/components/taskItem/taskItemContextMenu.ts'), 'utf8');
const contextMenu = readFileSync(join(root, 'src/styles/context-menu.css'), 'utf8').replace(/\r\n/g, '\n');

const forbiddenPresetValues = ['#8B9DC3', '#6E7F92', '#3b82f6', '#2563eb', '#60a5fa'];
for (const value of forbiddenPresetValues) {
  assert.ok(!presets.includes(value), `Non-watercolor theme presets should not include blue value ${value}.`);
}

assert.ok(globals.includes('/* 2026-06-19 non-watercolor neutral theme isolation */'), 'Globals should include final neutral theme isolation block.');
for (const theme of ['minimal', 'neumorphism', 'invisible']) {
  assert.ok(globals.includes(`.app-shell[data-theme='${theme}']`), `${theme} should have scoped neutral rules.`);
  assert.ok(globals.includes(`.dark .app-shell[data-theme='${theme}']`), `${theme} dark mode should have scoped neutral rules.`);
}
assert.ok(globals.includes(".app-shell[data-theme='watercolor']"), 'Watercolor should keep its own scoped rules.');
assert.ok(contextMenu.includes('--menu-accent: var(--context-menu-accent'), 'Context menu accent should be tokenized instead of hardcoded blue.');
assert.ok(taskItem.includes('const themeStyle = shell ? getComputedStyle(shell) : null;'), 'Task context menu should read color tokens from the themed app shell.');
assert.ok(taskItem.includes('createTaskContextMenuOpenPayload'), 'Task context menu should delegate popup token mapping to its helper.');
assert.ok(taskItemContextMenu.includes("accent: themeStyle?.getPropertyValue('--personal-accent')"), 'Task context menu accent should use app shell theme token.');
assert.ok(globals.includes(".app-shell:not([data-theme='watercolor'])"), 'Non-watercolor context/menu accents should be neutralized by theme scope.');

console.log('verify-theme-no-blue passed');
