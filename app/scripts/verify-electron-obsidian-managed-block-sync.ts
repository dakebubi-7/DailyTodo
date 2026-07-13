import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  preserveTaskSyncTimestamp,
  upsertManagedBlockIfChanged,
} from '../electron/obsidianManagedBlockSync';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const existing = '<!-- TASKS_START -->\n同步时间：2026-07-13 08:00\n- [ ] Keep\n<!-- TASKS_END -->';
const next = '<!-- TASKS_START -->\n同步时间：2026-07-13 09:00\n- [ ] Keep\n<!-- TASKS_END -->';
assert.ok(preserveTaskSyncTimestamp(existing, next).includes('同步时间：2026-07-13 08:00'));
assert.equal(
  preserveTaskSyncTimestamp(existing, `${next}\n- [ ] Changed`),
  `${next}\n- [ ] Changed`,
  'changed task content should retain its new timestamp.',
);

let replacements = 0;
const unchanged = upsertManagedBlockIfChanged('before\nstart\nblock\nend\nafter', 'start', 'end', 'start\nblock\nend', () => {
  replacements += 1;
  return 'unexpected';
});
assert.equal(unchanged, 'before\nstart\nblock\nend\nafter');
assert.equal(replacements, 0, 'identical managed blocks should not call the replacement dependency.');

const updated = upsertManagedBlockIfChanged('before\nstart\nold\nend\nafter', 'start', 'end', 'new', (source, start, end, block) => {
  replacements += 1;
  return `${source}|${start}|${end}|${block}`;
});
assert.equal(updated, 'before\nstart\nold\nend\nafter|start|end|new');
assert.equal(replacements, 1);

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const policyPath = join(root, 'electron/obsidianManagedBlockSync.ts');
const dailyNotePath = join(root, 'electron/obsidianSyncDailyNote.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(policyPath), 'Electron managed-block sync policy module should exist.');
const policy = readFileSync(policyPath, 'utf8');
const dailyNote = readFileSync(dailyNotePath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

assert.match(policy, /export function preserveTaskSyncTimestamp\b/, 'managed-block policy should own task timestamp preservation.');
assert.match(policy, /export function upsertManagedBlockIfChanged\b/, 'managed-block policy should own unchanged-block detection.');
assert.match(dailyNote, /from '\.\/obsidianManagedBlockSync'/, 'daily-note sync should compose the managed-block policy module.');
assert.doesNotMatch(dailyNote, /function preserveTaskSyncTimestamp\b/, 'daily-note sync should delegate task timestamp preservation.');
assert.doesNotMatch(dailyNote, /function upsertManagedBlockIfChanged\b/, 'daily-note sync should delegate unchanged-block detection.');
assert.equal(
  packageJson.scripts['verify:electron-obsidian-managed-block-sync'],
  'tsx scripts/verify-electron-obsidian-managed-block-sync.ts',
  'package.json should expose the managed-block sync verifier.',
);
assertCleanupCoreIncludes('verify:electron-obsidian-managed-block-sync', 'cleanup-core should include the managed-block sync verifier.');

console.log('electron Obsidian managed-block sync verification passed');
