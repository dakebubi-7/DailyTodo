import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const syncModulePath = join(root, 'electron/obsidianSync.ts');
const outputModulePath = join(root, 'electron/obsidianSyncBlogDraftOutput.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(syncModulePath), 'Obsidian sync orchestration module should exist.');
assert.ok(existsSync(outputModulePath), 'Optional blog-draft output should live in a focused module.');

const sync = readFileSync(syncModulePath, 'utf8');
const output = readFileSync(outputModulePath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(sync, /from '\.\/obsidianSyncBlogDraftOutput'/, 'Obsidian sync should delegate optional blog-draft output.');
assert.match(output, /export function writeObsidianSyncBlogDraftOutput\b/, 'Focused blog-draft output module should expose a write helper.');
assert.match(output, /fs\.existsSync\(localBlogDraftDir\).*fs\.statSync\(localBlogDraftDir\)\.isDirectory\(\)/s, 'Blog-draft output should guard the configured directory.');
assert.match(output, /const existingBlogDraft = blogDraftExists \? fs\.readFileSync\(blogDraftPath, 'utf-8'\) : null;/, 'Blog-draft output should read an existing file only when present.');
assert.match(output, /if \(nextBlogDraft !== existingBlogDraft\) \{\s*fs\.writeFileSync\(blogDraftPath, nextBlogDraft, 'utf-8'\);\s*\}/, 'Blog-draft output should skip unchanged physical writes.');
assert.match(output, /catch \{\s*\/\/ Optional blog draft output should never interrupt the primary Obsidian sync\.\s*\}/, 'Blog-draft output failures should remain optional.');
assert.doesNotMatch(sync, /const blogDraftExists = fs\.existsSync\(blogDraftPath\);/, 'Obsidian sync should not retain inline blog-draft file writes.');
assert.equal(
  scripts['verify:electron-obsidian-sync-blog-draft-output'],
  'tsx scripts/verify-electron-obsidian-sync-blog-draft-output.ts',
  'package.json should expose the focused blog-draft output verifier.',
);
assertCleanupCoreIncludes(
  'verify:electron-obsidian-sync-blog-draft-output',
  'cleanup-core should include the focused blog-draft output verifier.',
);

console.log('electron Obsidian sync blog-draft output verification passed');
