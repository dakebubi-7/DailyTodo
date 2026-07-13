import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const overviewUpdatePath = join(root, 'electron/obsidianOverviewUpdate.ts');
const dailyNotePath = join(root, 'electron/obsidianSyncDailyNote.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(overviewUpdatePath), 'Electron Obsidian overview-update module should exist.');

const overviewUpdate = readFileSync(overviewUpdatePath, 'utf8');
const dailyNote = readFileSync(dailyNotePath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(overviewUpdate, /export function triggerObsidianOverviewUpdate\b/, 'Overview-update module should export its refresh helper.');
assert.match(overviewUpdate, /spawnSync\('python', \[scriptPath, '--from-hook'\]/, 'Overview-update module should retain the existing Python hook invocation.');
assert.match(overviewUpdate, /windowsHide: true/, 'Overview-update module should keep the refresh subprocess hidden.');
assert.match(dailyNote, /from '\.\/obsidianOverviewUpdate'/, 'Daily-note sync should compose the overview-update helper.');
assert.match(dailyNote, /triggerObsidianOverviewUpdate\(getVaultPath, filePath\)/, 'Daily-note sync should provide its vault accessor and updated file path to the overview helper.');
assert.doesNotMatch(dailyNote, /spawnSync\('python'/, 'Daily-note sync should not keep overview-refresh subprocess handling inline.');
assert.equal(
  scripts['verify:electron-obsidian-overview-update'],
  'tsx scripts/verify-electron-obsidian-overview-update.ts',
  'package.json should expose the focused Obsidian overview-update verifier.',
);
assertCleanupCoreIncludes('verify:electron-obsidian-overview-update', 'cleanup-core should include the focused Obsidian overview-update verifier.');

console.log('electron Obsidian overview-update verification passed');
