import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const syncModulePath = join(root, 'electron/obsidianSync.ts');
const previewModulePath = join(root, 'electron/obsidianSyncPreview.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(syncModulePath), 'Obsidian sync orchestration module should exist.');
assert.ok(
  existsSync(previewModulePath),
  'Obsidian sync preview assembly should live in a focused preview module.',
);

const sync = readFileSync(syncModulePath, 'utf8');
const preview = readFileSync(previewModulePath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(
  sync,
  /from '\.\/obsidianSyncPreview'/,
  'Obsidian sync orchestration should delegate preview assembly to the focused module.',
);
assert.match(
  preview,
  /export function createObsidianSyncPreviewHelper\b/,
  'The focused module should expose a preview helper factory.',
);
assert.match(preview, /buildSyncPreview/, 'The preview helper should own shared preview construction.');
assert.match(
  preview,
  /for \(const affectedDate of affectedDates\)/,
  'The preview helper should traverse affected dates to aggregate preview output.',
);
assert.match(
  preview,
  /taskCount \+= preview\.taskCount[\s\S]*?completionRecordCount \+= preview\.completionRecordCount/,
  'The preview helper should aggregate totals during its single traversal.',
);
assert.doesNotMatch(
  sync,
  /function previewTasksToObsidian[\s\S]*?buildSyncPreview/,
  'The sync orchestrator should not retain inline preview construction after extraction.',
);
assert.equal(
  scripts['verify:electron-obsidian-sync-preview-module'],
  'tsx scripts/verify-electron-obsidian-sync-preview-module.ts',
  'package.json should expose the focused Obsidian preview verifier.',
);
assertCleanupCoreIncludes(
  'verify:electron-obsidian-sync-preview-module',
  'cleanup-core should include the focused Obsidian preview verifier.',
);

console.log('electron Obsidian sync preview module verification passed');
