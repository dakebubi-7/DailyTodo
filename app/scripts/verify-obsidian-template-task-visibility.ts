import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const taskLinesPath = path.join(root, 'shared/obsidianTemplateTaskLines.ts');
const visibilityPath = path.join(root, 'shared/obsidianTemplateTaskVisibility.ts');

assert.ok(fs.existsSync(visibilityPath), 'Template task visibility should have a focused module.');

const taskLinesSource = fs.readFileSync(taskLinesPath, 'utf-8');
const visibilitySource = fs.readFileSync(visibilityPath, 'utf-8');

assert.match(taskLinesSource, /from '\.\/obsidianTemplateTaskVisibility'/, 'Task-line rendering should consume the focused task-visibility module.');
assert.doesNotMatch(taskLinesSource, /function collectVisibleTaskData\(/, 'Task-line rendering should not retain visibility indexing inline.');
assert.doesNotMatch(taskLinesSource, /function collectVisibleTaskStats\(/, 'Task-line rendering should not retain sync-preview statistics inline.');
assert.match(visibilitySource, /export function collectVisibleTaskData\(/, 'Task-visibility module should own rendering visibility indexing.');
assert.match(visibilitySource, /export function collectVisibleTaskStats\(/, 'Task-visibility module should own sync-preview statistics traversal.');

console.log('Obsidian template task-visibility module verification passed');
