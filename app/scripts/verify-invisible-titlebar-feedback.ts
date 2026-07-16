import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');

assert.ok(
  globals.includes(".app-shell[data-theme='invisible'] :is(.titlebar-icon-button, .titlebar-mode):active {"),
  'Invisible light titlebar controls should define a clear pressed state.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='invisible'] :is(.titlebar-icon-button, .titlebar-mode):active {"),
  'Invisible dark titlebar controls should define a clear pressed state.',
);
assert.ok(
  globals.includes('transform: translateY(1px) scale(0.94) !important;'),
  'Invisible titlebar pressed controls should visibly depress without changing layout.',
);

console.log('Invisible titlebar feedback verification passed');
