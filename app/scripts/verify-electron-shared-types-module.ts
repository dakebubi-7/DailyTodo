import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/sharedTypes.ts');
const packagePath = join(root, 'package.json');

const files = {
  aiReviewIpc: join(root, 'electron/aiReviewIpc.ts'),
  aiReviewIpcRegistrationTypes: join(root, 'electron/aiReviewIpcRegistrationTypes.ts'),
  aiReviewDailyRunner: join(root, 'electron/aiReviewDailyRunner.ts'),
  obsidianDailyNoteContent: join(root, 'electron/obsidianDailyNoteContent.ts'),
  obsidianSync: join(root, 'electron/obsidianSync.ts'),
  obsidianSyncValidation: join(root, 'electron/obsidianSyncValidation.ts'),
  obsidianIpc: join(root, 'electron/obsidianIpc.ts'),
  settingsIpc: join(root, 'electron/settingsIpc.ts'),
  windowIpc: join(root, 'electron/windowIpc.ts'),
  appStateAccessors: join(root, 'electron/appStateAccessors.ts'),
  obsidianVaultAccessors: join(root, 'electron/obsidianVaultAccessors.ts'),
};

assert.ok(existsSync(modulePath), 'Electron shared types module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;
const sources = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, readFileSync(value, 'utf8')]),
) as Record<keyof typeof files, string>;

for (const exportName of [
  'ElectronStoreLike',
  'VaultStatus',
  'InspectDailyResult',
  'TaskCompletionReview',
  'ElectronTask',
]) {
  const pattern = new RegExp(`export type ${exportName}\\b`);
  assert.match(helper, pattern, `sharedTypes should export ${exportName}.`);
}

assert.match(helper, /subtasks\?: ElectronTask\[];/, 'sharedTypes should preserve recursive Electron task subtasks.');
assert.match(helper, /get\(key: string, defaultValue: unknown\): unknown;/, 'sharedTypes should preserve the store get overload with default value.');
assert.match(helper, /vaultPath: string/, 'sharedTypes should preserve vaultPath on the success branch of VaultStatus.');
assert.match(helper, /hasAiContent: boolean/, 'sharedTypes should preserve inspect-daily AI-content state.');

for (const sourceName of ['aiReviewIpcRegistrationTypes', 'aiReviewDailyRunner', 'obsidianDailyNoteContent'] as const) {
  assert.match(sources[sourceName], /from '\.\/sharedTypes'/, `${sourceName} should import ElectronTask from sharedTypes.`);
  assert.match(sources[sourceName], /\bElectronTask\b/, `${sourceName} should reference ElectronTask after shared type extraction.`);
}

assert.match(sources.obsidianSyncValidation, /import type \{ ElectronTask \} from '\.\/sharedTypes';/, 'obsidianSyncValidation should derive its validated task shape from the shared ElectronTask type.');
assert.match(sources.obsidianSyncValidation, /export type ObsidianSyncTask = ElectronTask;/, 'obsidianSyncValidation should expose the dedicated sync task alias.');
assert.match(sources.obsidianSync, /from '\.\/obsidianSyncValidation'/, 'obsidianSync should depend on the dedicated validated sync task boundary.');
assert.match(sources.obsidianSync, /\bObsidianSyncTask\b/, 'obsidianSync should use the dedicated sync task type after validation extraction.');

for (const sourceName of ['obsidianIpc', 'settingsIpc', 'windowIpc', 'appStateAccessors'] as const) {
  assert.match(sources[sourceName], /from '\.\/sharedTypes'/, `${sourceName} should import shared Electron types.`);
}

assert.match(sources.aiReviewIpcRegistrationTypes, /\bInspectDailyResult\b/, 'aiReviewIpcRegistrationTypes should use the shared InspectDailyResult type.');
assert.match(sources.aiReviewDailyRunner, /\bInspectDailyResult\b/, 'aiReviewDailyRunner should use the shared InspectDailyResult type.');

for (const sourceName of ['aiReviewIpcRegistrationTypes', 'obsidianIpc', 'obsidianSync', 'obsidianVaultAccessors'] as const) {
  assert.match(sources[sourceName], /\bVaultStatus\b/, `${sourceName} should use the shared VaultStatus type.`);
}

assert.match(sources.appStateAccessors, /createObsidianVaultAccessors\(/, 'appStateAccessors should compose the focused Vault accessor factory.');
assert.match(sources.appStateAccessors, /getVaultStatus,/, 'appStateAccessors should forward the Vault status accessor from the focused factory.');

for (const sourceName of ['settingsIpc', 'windowIpc', 'obsidianIpc', 'appStateAccessors'] as const) {
  assert.match(sources[sourceName], /\bElectronStoreLike\b/, `${sourceName} should use the shared ElectronStoreLike type.`);
}

assert.doesNotMatch(sources.aiReviewIpc, /type AiReviewTask = \{/, 'aiReviewIpc should not keep an inline task object type after shared type extraction.');
assert.doesNotMatch(sources.aiReviewDailyRunner, /type AiReviewDailyRunnerTask = \{/, 'aiReviewDailyRunner should not keep an inline task object type after shared type extraction.');
assert.doesNotMatch(sources.obsidianDailyNoteContent, /type ObsidianDailyNoteTask = \{/, 'obsidianDailyNoteContent should not keep an inline task object type after shared type extraction.');
assert.doesNotMatch(sources.obsidianSync, /type ObsidianSyncTask = \{/, 'obsidianSync should not keep an inline task object type after shared type extraction.');

assert.doesNotMatch(sources.aiReviewIpc, /type VaultStatus =/, 'aiReviewIpc should not keep inline VaultStatus after shared type extraction.');
assert.doesNotMatch(sources.obsidianIpc, /type VaultStatus =/, 'obsidianIpc should not keep inline VaultStatus after shared type extraction.');
assert.doesNotMatch(sources.obsidianSync, /type VaultStatus =/, 'obsidianSync should not keep inline VaultStatus after shared type extraction.');
assert.doesNotMatch(sources.appStateAccessors, /type VaultStatus =/, 'appStateAccessors should not keep inline VaultStatus after shared type extraction.');

assert.doesNotMatch(sources.aiReviewIpc, /type InspectDailyResult =/, 'aiReviewIpc should not keep inline InspectDailyResult after shared type extraction.');
assert.doesNotMatch(sources.aiReviewDailyRunner, /type InspectDailyResult =/, 'aiReviewDailyRunner should not keep inline InspectDailyResult after shared type extraction.');

assert.doesNotMatch(sources.windowIpc, /type ElectronStoreLike =/, 'windowIpc should not keep inline ElectronStoreLike after shared type extraction.');
assert.doesNotMatch(sources.settingsIpc, /type ElectronStoreLike =/, 'settingsIpc should not keep inline ElectronStoreLike after shared type extraction.');
assert.doesNotMatch(sources.obsidianIpc, /type ElectronStoreLike =/, 'obsidianIpc should not keep inline ElectronStoreLike after shared type extraction.');
assert.doesNotMatch(sources.appStateAccessors, /type StoreLike =/, 'appStateAccessors should not keep its inline store interface after shared type extraction.');

assert.equal(
  scripts['verify:electron-shared-types-module'],
  'tsx scripts/verify-electron-shared-types-module.ts',
  'package.json should expose the focused Electron shared-types verifier.',
);
assertCleanupCoreIncludes('verify:electron-shared-types-module', 'cleanup-core should include the focused Electron shared-types verifier.');

console.log('electron shared types module verification passed');
