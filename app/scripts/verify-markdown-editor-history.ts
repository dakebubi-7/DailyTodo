import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const historyPath = join(root, 'src/hooks/markdownEditorHistory.ts');
const hookPath = join(root, 'src/hooks/useMarkdownEditor.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(historyPath), 'Markdown editor history module should exist.');

const { createMarkdownEditorHistory } = await import('../src/hooks/markdownEditorHistory');
const historySource = readFileSync(historyPath, 'utf8');
const hookSource = readFileSync(hookPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(historySource, /export function createMarkdownEditorHistory\b/, 'History module should expose a focused state-machine factory.');
assert.match(hookSource, /from '\.\/markdownEditorHistory'/, 'Markdown editor hook should compose the focused history module.');
assert.doesNotMatch(hookSource, /const COALESCE_MS = 500/, 'Markdown editor hook should not retain history coalescing policy inline.');
assert.doesNotMatch(hookSource, /const recordHistory = /, 'Markdown editor hook should not retain history recording logic inline.');

let now = 0;
const history = createMarkdownEditorHistory('a', () => now);
history.record('ab', 2, 2, true);
now = 300;
history.record('abc', 3, 3, true);
assert.deepEqual(history.undo(), { value: 'a', start: 1, end: 1 }, 'Typing inside the coalescing window should undo as one change.');
assert.deepEqual(history.redo(), { value: 'abc', start: 3, end: 3 }, 'Coalesced typing should remain redoable.');

history.undo();
history.record('ax', 2, 2, false);
assert.equal(history.redo(), null, 'A new edit after undo should discard the redo branch.');

history.record('ax', 1, 2, false);
assert.deepEqual(history.undo(), { value: 'a', start: 1, end: 1 }, 'Repeated values should update selection without creating an extra undo entry.');

history.reset('reset', 2);
assert.equal(history.undo(), null, 'Reset history should leave only the supplied baseline snapshot.');

assert.equal(
  scripts['verify:markdown-editor-history'],
  'tsx scripts/verify-markdown-editor-history.ts',
  'package.json should expose the focused Markdown editor history verifier.',
);
assertCleanupCoreIncludes('verify:markdown-editor-history', 'cleanup-core should include the focused Markdown editor history verifier.');

console.log('markdown editor history verification passed');
