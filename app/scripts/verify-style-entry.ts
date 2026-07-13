import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const mainTsx = readFileSync(join(root, 'src/main.tsx'), 'utf8');
const appTsx = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const styleEntryPath = join(root, 'src/styles/index.css');

assert.ok(existsSync(styleEntryPath), 'Style entry file should exist.');

const styleEntry = readFileSync(styleEntryPath, 'utf8');

assert.match(appTsx, /import '\.\/styles\/index\.css';/, 'Main app route should import the single style entry.');
assert.doesNotMatch(mainTsx, /import '\.\/styles\/(globals|context-menu)\.css';/, 'Renderer entry should not import style leaf files directly.');
assert.doesNotMatch(appTsx, /import '\.\/styles\/(?!index\.css).+\.css';/, 'App component should only import the consolidated style entry.');
assert.match(styleEntry, /@import '\.\/globals\.css';/, 'Style entry should import globals.css.');

console.log('style entry verification passed');
