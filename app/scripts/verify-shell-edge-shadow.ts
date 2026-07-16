import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');
const watercolor = readFileSync(join(root, 'src/styles/watercolor-theme.css'), 'utf8').replace(/\r\n/g, '\n');

const globalMarker = '/* Window silhouette: keep host corners clean in every theme. */';
const watercolorMarker = '/* Window silhouette: watercolor must not restore an outer shell shadow. */';

assert.match(
  globals,
  new RegExp(`${globalMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?\\.app-shell\\s*\\{[\\s\\S]*?box-shadow:\\s*inset 0 1px 0 rgba\\(255, 255, 255, 0\\.82\\) !important;`),
  'The base shell must use only an inset highlight, never an external shadow that leaks beyond rounded corners.',
);
assert.match(
  globals,
  /\.dark \.app-shell\s*\{[\s\S]*?box-shadow:\s*inset 0 1px 0 rgba\(148, 163, 184, 0\.1\) !important;/,
  'The dark shell must use only an inset highlight, never an external shadow that leaks beyond rounded corners.',
);
assert.match(
  watercolor,
  new RegExp(`${watercolorMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?\\.theme-watercolor \\.app-shell\\s*\\{[\\s\\S]*?box-shadow:\\s*inset 0 1px 0 rgba\\(255, 255, 255, 0\\.82\\) !important;`),
  'The lazy watercolor stylesheet must not restore an outer shell shadow after global styles load.',
);

console.log('verify-shell-edge-shadow passed');
