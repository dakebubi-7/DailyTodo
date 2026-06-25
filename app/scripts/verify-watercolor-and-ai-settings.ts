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

console.log('verify-watercolor-and-ai-settings passed');
