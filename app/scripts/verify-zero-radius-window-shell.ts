import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');

const narrowShellRule = globals.match(
  /@media \(max-width: 560px\) \{[\s\S]*?\.app-shell \{([\s\S]*?)\n  \}/,
);

assert.ok(narrowShellRule, 'The narrow-window app shell rule should remain present.');
assert.match(
  narrowShellRule[1],
  /border-radius:\s*var\(--shell-radius\);/,
  'The narrow-window app shell must respect a zero personalization radius.',
);

console.log('verify-zero-radius-window-shell passed');
