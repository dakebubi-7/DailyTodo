import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const contentModulePath = join(root, 'electron/obsidianDailyNoteContent.ts');
const blogDraftModulePath = join(root, 'electron/obsidianBlogDraft.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(contentModulePath), 'Obsidian daily-note content helpers should exist.');
assert.ok(existsSync(blogDraftModulePath), 'Obsidian blog-draft generation should live in a focused module.');

const content = readFileSync(contentModulePath, 'utf8');
const blogDraft = readFileSync(blogDraftModulePath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(
  content,
  /from '\.\/obsidianBlogDraft'/,
  'Daily-note content helpers should delegate blog-draft generation to the focused module.',
);
assert.match(blogDraft, /export function createObsidianBlogDraftBuilder\b/, 'The focused module should expose a blog-draft builder.');
assert.match(blogDraft, /function buildBlogDraft\b/, 'The focused builder should own draft content assembly.');
assert.match(
  blogDraft,
  /let completed = 0;\s*let total = 0;\s*for \(const task of tasks\)/,
  'Blog draft statistics should count matching tasks in one traversal.',
);
assert.doesNotMatch(
  content,
  /function buildBlogDraft\b/,
  'Daily-note content helpers should not retain inline blog-draft assembly after extraction.',
);
assert.equal(
  scripts['verify:electron-obsidian-blog-draft-module'],
  'tsx scripts/verify-electron-obsidian-blog-draft-module.ts',
  'package.json should expose the focused Obsidian blog-draft verifier.',
);
assertCleanupCoreIncludes(
  'verify:electron-obsidian-blog-draft-module',
  'cleanup-core should include the focused Obsidian blog-draft verifier.',
);

console.log('electron Obsidian blog draft module verification passed');
