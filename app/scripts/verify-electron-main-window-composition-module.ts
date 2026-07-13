import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'mainWindowComposition.ts');
const typesPath = join(root, 'electron', 'mainWindowCompositionTypes.ts');
const mainPath = join(root, 'electron', 'main.ts');

assert.ok(existsSync(modulePath), 'Electron main-window composition module should exist.');
assert.ok(existsSync(typesPath), 'Electron main-window composition types module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const types = readFileSync(typesPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');

assert.match(helper, /from '\.\/mainWindowCompositionTypes'/, 'mainWindowComposition should import its dependency contract from the focused types module.');
assert.match(types, /export type CreateMainWindowCompositionOptions\b/, 'mainWindowCompositionTypes should own the composition dependency contract.');
assert.doesNotMatch(helper, /type CreateMainWindowCompositionOptions\b/, 'mainWindowComposition should not keep the large composition options type inline.');
assert.match(helper, /export function createMainWindowComposition\b/, 'mainWindowComposition should export its composition factory.');
assert.match(helper, /createMainShellController\(/, 'mainWindowComposition should assemble the shell controller.');
assert.match(helper, /createMainWindowModeController\(/, 'mainWindowComposition should assemble window-mode changes.');
assert.match(helper, /createMainWindowStarter\(/, 'mainWindowComposition should assemble main-window startup.');
assert.match(helper, /createMainWindowBootstrap\(/, 'mainWindowComposition should assemble the main-window bootstrap callback.');
assert.match(helper, /return \{ createWindow \};/, 'mainWindowComposition should expose the lifecycle createWindow callback.');

assert.match(main, /from '\.\/mainWindowComposition'/, 'main should import the main-window composition factory.');
assert.match(main, /const \{ createWindow \} = createMainWindowComposition\(\{/, 'main should delegate main-window assembly through the composition factory.');
assert.doesNotMatch(main, /createMainShellController\(\{/, 'main should not assemble the shell controller inline.');
assert.doesNotMatch(main, /createMainWindowModeController\(\{/, 'main should not assemble the mode controller inline.');
assert.doesNotMatch(main, /createMainWindowStarter\(\{/, 'main should not assemble the window starter inline.');

console.log('electron main-window composition module verification passed');
