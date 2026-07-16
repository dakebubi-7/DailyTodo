import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');
const marker = '/* Invisible theme glass convergence: native Acrylic supplies desktop blur; opacity is continuous; CSS only tints the foreground. */';
const start = globals.indexOf(marker);
const end = globals.indexOf('/* End invisible theme glass convergence. */', start);

assert.notEqual(start, -1, 'Invisible glass convergence block should exist.');
assert.notEqual(end, -1, 'Invisible glass convergence block should have an end marker.');

const convergence = globals.slice(start, end);

assert.match(
  convergence,
  /\.app-shell\[data-theme='invisible'\]\s*\{[\s\S]*?border-radius:\s*var\(--shell-radius\)\s*!important;[\s\S]*?clip-path:\s*inset\(0 round var\(--shell-radius\)\)\s*!important;/,
  'Invisible desktop shell must retain the configured rounded window silhouette.',
);

console.log('verify-invisible-shell-corners passed');
