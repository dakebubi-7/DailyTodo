import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'src')) ? cwd : join(cwd, 'app');
const dialogPath = join(root, 'src/components/TaskCompletionDialog.tsx');
const fieldPath = join(root, 'src/components/taskCompletionDialog/TaskCompletionMarkdownField.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(fieldPath), 'Task completion Markdown field should live in a focused component.');

const dialog = readFileSync(dialogPath, 'utf8');
const field = readFileSync(fieldPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

assert.match(dialog, /from '\.\/taskCompletionDialog\/TaskCompletionMarkdownField'/, 'TaskCompletionDialog should compose the focused Markdown field.');
assert.doesNotMatch(dialog, /function DialogTextarea\b/, 'TaskCompletionDialog should not define the Markdown field inline.');
assert.match(field, /export function TaskCompletionMarkdownField\b/, 'Markdown field module should export its focused component.');
assert.match(field, /useMarkdownEditor\(/, 'Markdown field should own the shared Markdown editor integration.');
assert.match(field, /editor\.resetHistory\(value, value\.length\)/, 'Markdown field should reset editor history when its task key changes.');
assert.equal(
  packageJson.scripts['verify:task-completion-dialog-markdown-field'],
  'tsx scripts/verify-task-completion-dialog-markdown-field.ts',
  'package.json should expose the focused completion Markdown field verifier.',
);
assertCleanupCoreIncludes(
  'verify:task-completion-dialog-markdown-field',
  'cleanup-core should include the focused completion Markdown field verifier.',
);

console.log('Task completion Markdown field verification passed');
