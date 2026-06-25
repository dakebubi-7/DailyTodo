import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');
const settingsPanel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');

assert.ok(settingsPanel.includes('onResetTheme'), 'SettingsPanel should expose a reset-current-theme action.');
assert.ok(settingsPanel.includes('恢复当前主题默认设置'), 'Appearance panel should render reset-current-theme copy.');
assert.ok(app.includes('resetCurrentThemeDefaults'), 'App should reset the active theme preset and clear remembered overrides.');
assert.ok(app.includes('delete next[preset.id]'), 'Theme reset should clear per-theme opacity override memory.');

assert.ok(
  globals.includes(".app-shell[data-theme='invisible'] .titlebar-icon-active") &&
    globals.includes('box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.22) !important;'),
  'Invisible titlebar active pinned/locked controls should be visibly active on light desktops.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='invisible']") && globals.includes('color: #fff !important;'),
  'Invisible dark mode should force primary UI text to white.',
);
assert.ok(
  globals.includes("html:not(.dark) .app-shell[data-theme='invisible']") && globals.includes('color: #111827 !important;'),
  'Invisible light mode should force primary UI text to black.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='invisible'] .completion-dialog") && globals.includes('rgba(18, 18, 20, var(--dialog-opacity))'),
  'Invisible dark completion dialog should use a neutral black-gray readable surface.',
);
assert.ok(
  globals.includes(".app-shell[data-theme='invisible'] .task-complete-action-complete") && globals.includes('linear-gradient(135deg, #e5e7eb, #71717a)'),
  'Invisible completed circles should use a neutral gray completion color, not amber or blue.',
);

assert.ok(
  globals.includes(".dark .app-shell[data-theme='minimal']") && globals.includes('--personal-accent: #e5e7eb'),
  'Minimal dark should neutralize blue accents.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='minimal'] :is") && globals.includes('color: #fff !important;'),
  'Minimal dark should use white text instead of gray/blue text.',
);

assert.ok(
  globals.includes(".app-shell[data-theme='neumorphism'] .task-source-group-shell") && globals.includes('box-shadow: 8px 8px 18px color-mix(in srgb, var(--neu-d)'),
  'Neumorphism source groups should be raised owning containers.',
);
assert.ok(
  globals.includes(".app-shell[data-theme='neumorphism'] .task-card") && globals.includes('box-shadow: inset 3px 3px 6px color-mix(in srgb, var(--neu-d)'),
  'Neumorphism task cards should sit inset inside the source group container.',
);
assert.ok(
  globals.includes(".app-shell[data-theme='neumorphism'] .add-task") && globals.includes('-8px -8px 18px color-mix(in srgb, var(--neu-l)'),
  'Neumorphism bottom add-task bar should be raised, not a dark inset trench.',
);

assert.ok(
  globals.includes(".app-shell[data-theme='watercolor'] .priority-dot-button") && globals.includes('width: 1.08rem !important;'),
  'Watercolor priority dot button should be smaller than before.',
);
assert.ok(
  globals.includes(".app-shell[data-theme='watercolor'] .priority-dot-button span") && globals.includes('width: 0.48rem !important;'),
  'Watercolor inner priority dot should be compact.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='watercolor']") && globals.includes('color: #fff !important;'),
  'Watercolor dark mode should force readable white text.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='watercolor'] :is(.settings-field input, .settings-field select") && globals.includes('background: rgba(15, 23, 42, 0.92) !important;'),
  'Watercolor dark settings inputs/selects should have strong contrast.',
);

console.log('verify-theme-visual-isolation passed');
