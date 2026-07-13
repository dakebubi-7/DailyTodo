import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const storePath = path.join(root, 'src/store/taskStore.ts');
const builderPath = path.join(root, 'src/store/companionCaptureItems.ts');

assert.ok(fs.existsSync(builderPath), 'Companion capture-item construction should have a focused module.');

const storeSource = fs.readFileSync(storePath, 'utf-8');
const builderSource = fs.readFileSync(builderPath, 'utf-8');

assert.match(storeSource, /export \{ buildCaptureItems \} from '\.\/companionCaptureItems';/, 'Task-store should preserve the capture-item export path through a compatibility re-export.');
assert.doesNotMatch(storeSource, /export function buildCaptureItems\(/, 'Task-store should not retain Companion capture-item construction inline.');
assert.match(builderSource, /export function buildCaptureItems\(/, 'Focused module should own desktop Companion capture-item construction.');
assert.match(builderSource, /from ['"]\.\.\/\.\.\/shared\/taskRollover['"]/, 'Capture-item construction should reuse shared task-date resolution.');

console.log('Companion capture-item builder module verification passed');
