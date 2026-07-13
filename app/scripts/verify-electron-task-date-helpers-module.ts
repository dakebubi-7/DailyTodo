import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';
import { getDateKey, getTaskDate, getTodayDate } from '../electron/taskDateHelpers';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/taskDateHelpers.ts');
const mainPath = join(root, 'electron/main.ts');
const mainObsidianServicesPath = join(root, 'electron/mainObsidianServices.ts');
const mainAiReviewServicesPath = join(root, 'electron/mainAiReviewServices.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron task-date helper module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const mainObsidianServices = readFileSync(mainObsidianServicesPath, 'utf8');
const mainAiReviewServices = readFileSync(mainAiReviewServicesPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

for (const exported of [
  'getTodayDate',
  'getDateKey',
  'getTaskDate',
  'getReviewDate',
  'getCompletionReviews',
]) {
  assert.match(helper, new RegExp(`export function ${exported}\\b`), `taskDateHelpers should export ${exported}.`);
}

assert.match(helper, /type ElectronTask/, 'taskDateHelpers should type helpers against the shared Electron task shape.');
assert.match(helper, /getSharedTaskDate\(task, getTodayDate\(\)\)/, 'taskDateHelpers should preserve its local-date fallback through the shared task-date resolver.');
assert.equal(
  getTaskDate({ taskDate: '', createdAt: '2026-07-11T08:00:00.000Z' } as never),
  '2026-07-11',
  'taskDateHelpers should preserve createdAt task-date fallback behavior.',
);
assert.match(helper, /export function getDateKey\(date\?: unknown\)/, 'taskDateHelpers should accept untrusted date input before normalization.');
assert.doesNotThrow(
  () => getDateKey({} as never),
  'taskDateHelpers should not throw for malformed runtime date input.',
);
assert.equal(
  getDateKey({} as never),
  getTodayDate(),
  'taskDateHelpers should fall back to today for malformed runtime date input.',
);
assert.equal(getDateKey('2026-07-11T08:00:00'), '2026-07-11', 'taskDateHelpers should preserve string date-key normalization.');
assert.match(helper, /task\.completionReviews\?\.length/, 'taskDateHelpers should preserve completionReviews array preference.');
assert.match(helper, /task\.completionReview \? \[task\.completionReview\] : \[\]/, 'taskDateHelpers should preserve legacy single-review fallback.');

assert.match(main, /from '\.\/mainAiReviewServices'/, 'main should delegate AI review and Obsidian service setup to mainAiReviewServices.');
assert.match(mainAiReviewServices, /from '\.\/mainObsidianServices'/, 'AI review services should delegate Obsidian setup to mainObsidianServices.');
assert.match(mainAiReviewServices, /getDateKey,/, 'AI review services should expose getDateKey to downstream main-process helpers.');
assert.match(mainObsidianServices, /from '\.\/taskDateHelpers'/, 'mainObsidianServices should import task-date helpers from taskDateHelpers.');
assert.match(mainObsidianServices, /getDateKey,/, 'mainObsidianServices should inject getDateKey into downstream helpers.');
assert.match(mainObsidianServices, /getTaskDate,/, 'mainObsidianServices should inject getTaskDate into downstream helpers.');
assert.match(mainObsidianServices, /getReviewDate,/, 'mainObsidianServices should inject getReviewDate into downstream helpers.');

for (const removed of [
  'getTodayDate',
  'getDateKey',
  'getTaskDate',
  'getReviewDate',
  'getCompletionReviews',
  'escapeTaskText',
  'formatDateTime',
]) {
  assert.doesNotMatch(main, new RegExp(`function ${removed}\\b`), `main should not keep ${removed} inline after task-date helper extraction.`);
}

assert.doesNotMatch(main, /type DesktopWidgetState = 'desktop-visible' \| 'app-background' \| 'dt-active';/, 'main should not keep the unused DesktopWidgetState alias.');

assert.equal(
  scripts['verify:electron-task-date-helpers-module'],
  'tsx scripts/verify-electron-task-date-helpers-module.ts',
  'package.json should expose the focused task-date helper verifier.',
);
assertCleanupCoreIncludes('verify:electron-task-date-helpers-module', 'cleanup-core should include the focused task-date helper verifier.');

console.log('electron task-date helper module verification passed');
