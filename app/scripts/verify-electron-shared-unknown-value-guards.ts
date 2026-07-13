import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'app')) ? join(cwd, 'app') : cwd;
const sharedPath = join(root, 'shared/unknownValueGuards.ts');
const electronPath = join(root, 'electron/unknownValueGuards.ts');

assert.ok(existsSync(sharedPath), 'shared unknown-value guard module should exist');
assert.ok(existsSync(electronPath), 'Electron unknown-value guard facade should exist');

const sharedSource = readFileSync(sharedPath, 'utf8');
const electronSource = readFileSync(electronPath, 'utf8');
assert.match(sharedSource, /export function isObjectRecord\b/, 'shared module should own object-record narrowing');
assert.match(
  electronSource,
  /export \{ isObjectRecord \} from '\.\.\/shared\/unknownValueGuards';/,
  'Electron module should retain its compatibility export through the shared guard',
);

const shared = await import(pathToFileURL(sharedPath).href);
const electron = await import(pathToFileURL(electronPath).href);

for (const value of [null, [], 'record', 1, { key: 'value' }]) {
  assert.equal(electron.isObjectRecord(value), shared.isObjectRecord(value), 'Electron facade should preserve shared guard behavior');
}

console.log('Electron shared unknown-value guard verification passed.');
