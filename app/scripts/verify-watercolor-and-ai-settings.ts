import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');
const watercolor = readFileSync(join(root, 'src/styles/watercolor-theme.css'), 'utf8').replace(/\r\n/g, '\n');

assert.ok(globals.includes('/* 2026-06-19 AI settings consistent sizing */'), 'Globals should include AI settings sizing block.');
assert.ok(globals.includes('.settings-field :is(input, select, textarea)'), 'Settings fields should have shared sizing.');
assert.ok(globals.includes('min-height: 2.5rem;'), 'Settings inputs/buttons should use consistent touch-friendly height.');
assert.ok(watercolor.includes('/* 2026-06-19 watercolor dark blue surfaces */'), 'Watercolor should include dark blue surface block.');
for (const selector of ['.date-current', '.daily-work-panel', '.settings-panel', '.completion-dialog']) {
  assert.ok(watercolor.includes(selector), `Watercolor dark block should cover ${selector}.`);
}
assert.ok(watercolor.includes('--watercolor-dark-surface'), 'Watercolor dark should define deep blue surface token.');
assert.ok(watercolor.includes('--watercolor-dark-surface-soft'), 'Watercolor dark should define light blue surface token.');
const dailyWorkPanelRule = watercolor.match(
  /\.dark \.theme-watercolor :is\(\.daily-work-panel, \.daily-inspiration-panel, \.completion-dialog, \.settings-panel, \.settings-section, \.settings-preview-list\) \{([\s\S]*?)\n\}/,
);
const dailyInlinePanelRule = watercolor.match(
  /\.dark \.theme-watercolor \.daily-inline-panel \{([\s\S]*?)\n\}/,
);
const dailyInlineTextareaRule = watercolor.match(
  /\.dark \.theme-watercolor \.daily-inline-textarea \{([\s\S]*?)\n\}/,
);
assert.ok(
  dailyInlinePanelRule?.[1].includes('border-color: rgba(127, 163, 201, 0.68) !important;') &&
    dailyInlinePanelRule[1].includes('background: rgba(15, 23, 42, 0.92) !important;'),
  'Watercolor inline daily panels should use the original deep editor surface.',
);
assert.ok(
  dailyInlineTextareaRule?.[1].includes('background: rgb(45, 62, 88) !important;'),
  'Watercolor inline textareas should use the selected solid slate-blue surface.',
);
assert.ok(
  watercolor.includes('.theme-watercolor .app-main-scroll') &&
    watercolor.includes('linear-gradient(to bottom, rgba(var(--wc-paper-rgb), var(--panel-opacity, 0.8)), rgba(var(--wc-soft), var(--panel-opacity, 0.8))) !important;'),
  'Watercolor main task area should keep a painted background instead of exposing the transparent window surface.',
);

console.log('verify-watercolor-and-ai-settings passed');
