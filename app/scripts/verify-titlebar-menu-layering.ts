import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');

assert.match(
  globals,
  /\.titlebar \{\n  position: relative;\n  z-index: 45;\n/,
  'Titlebar must establish a layer above animated main content so its more-menu stays visible in every theme.',
);
assert.match(
  globals,
  /\.titlebar-menu \{[\s\S]*?z-index: 400;/,
  'More-menu should retain its local stacking order inside the titlebar layer.',
);

console.log('Titlebar menu layering verification passed');
