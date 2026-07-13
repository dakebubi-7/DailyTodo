import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewDailyRunInspectIpc.ts');
const taskPayloadPath = join(root, 'electron', 'aiReviewTaskPayload.ts');
const parentPath = join(root, 'electron', 'aiReviewIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review daily run/inspect IPC module should exist.');
assert.ok(existsSync(taskPayloadPath), 'Electron AI Review task payload guard module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const taskPayload = readFileSync(taskPayloadPath, 'utf8');
const parent = readFileSync(parentPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /import \{[^}]*ipcMain[^}]*\} from 'electron'/, 'daily run/inspect IPC module should own ipcMain registration.');
assert.match(moduleSource, /export type RegisterAiReviewDailyRunInspectIpcHandlersOptions\b/, 'daily run/inspect IPC module should export explicit registration dependencies.');
assert.match(moduleSource, /export function registerAiReviewDailyRunInspectIpcHandlers\b/, 'daily run/inspect IPC module should export its registration function.');

for (const channel of ['aiReview:runForDate', 'aiReview:inspectDaily']) {
  assert.match(moduleSource, new RegExp(`ipcMain\\.handle\\('${channel}'`), `daily run/inspect IPC module should register ${channel}.`);
  assert.doesNotMatch(parent, new RegExp(`ipcMain\\.handle\\('${channel}'`), `parent AI Review IPC module should not register ${channel} inline after extraction.`);
}

assert.match(taskPayload, /export function isAiReviewTaskArray\(value: unknown\): value is ElectronTask\[\]/, 'shared task payload module should define a runtime guard for AI Review task payload arrays.');
assert.match(taskPayload, /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/, 'shared task payload module should reuse the Electron object-record guard.');
assert.doesNotMatch(taskPayload, /function isObject\(value: unknown\)/, 'shared task payload module should not redeclare an Electron object-record guard.');
assert.match(taskPayload, /function isTaskCompletionReview\(value: unknown\): value is TaskCompletionReview/, 'shared task payload module should define a runtime guard for optional completion-review entries.');
for (const optionalStringField of ['carriedFromDate', 'carriedFromTaskId', 'completedAt']) {
  assert.match(taskPayload, new RegExp(`value\\.${optionalStringField} === undefined \\|\\| typeof value\\.${optionalStringField} === 'string'`), `shared task payload module should validate optional ${optionalStringField} strings.`);
}
assert.match(taskPayload, /value\.completionReview === undefined \|\| isTaskCompletionReview\(value\.completionReview\)/, 'shared task payload module should validate optional completionReview objects.');
assert.match(taskPayload, /value\.completionReviews === undefined \|\| \(Array\.isArray\(value\.completionReviews\) && value\.completionReviews\.every\(isTaskCompletionReview\)\)/, 'shared task payload module should validate optional completionReviews arrays.');
assert.match(moduleSource, /from '\.\/aiReviewTaskPayload'/, 'daily run/inspect IPC module should use the shared AI Review task payload guard.');
assert.match(moduleSource, /aiReview:runForDate'[^)]*tasks: unknown, force\?: unknown/, 'daily run IPC should treat task and force payloads as unknown runtime data.');
assert.match(moduleSource, /if \(!isAiReviewTaskArray\(tasks\)\) \{[\s\S]*?error: 'AI Review tasks contain malformed entries\.'/s, 'daily run IPC should reject malformed task payloads before invoking the review runner.');
assert.match(moduleSource, /runReviewForDate\(getDateKey\(date\), tasks, force === true\)/, 'daily run IPC should pass only strict true as the force flag.');
assert.match(moduleSource, /inspectDailyAiContent\(getDateKey\(date\)\)/, 'daily run/inspect IPC module should preserve daily inspection date normalization.');
assert.match(moduleSource, /getDateKey\(date\?: unknown\): string/, 'daily run/inspect IPC module should inject an untrusted-date normalizer.');
assert.match(moduleSource, /aiReview:runForDate'[^)]*date: unknown/, 'daily run IPC should treat the runtime date as unknown before normalization.');
assert.match(moduleSource, /aiReview:inspectDaily'[^)]*date: unknown/, 'daily inspect IPC should treat the runtime date as unknown before normalization.');
assert.match(moduleSource, /runReviewForDate\(date: string, tasks: ElectronTask\[\], force\?: boolean\): unknown/, 'daily run/inspect IPC module should type the injected daily runner dependency after runtime validation.');
assert.match(moduleSource, /inspectDailyAiContent\(date: string\): InspectDailyResult/, 'daily run/inspect IPC module should type the injected daily inspection dependency.');

assert.match(parent, /from '\.\/aiReviewDailyRunInspectIpc'/, 'parent AI Review IPC module should import the daily run/inspect IPC module.');
assert.match(parent, /registerAiReviewDailyRunInspectIpcHandlers\(\{/, 'parent AI Review IPC module should delegate daily run/inspect handler registration.');
for (const dependency of ['getDateKey', 'runReviewForDate', 'inspectDailyAiContent']) {
  assert.match(parent, new RegExp(`\\b${dependency},`), `parent AI Review IPC module should pass ${dependency} to the daily run/inspect IPC module.`);
}

assert.doesNotMatch(parent, /runReviewForDate\(getDateKey\(date\), tasks, Boolean\(force\)\)/, 'parent AI Review IPC module should not call runReviewForDate inline after extraction.');
assert.doesNotMatch(parent, /inspectDailyAiContent\(getDateKey\(date\)\)/, 'parent AI Review IPC module should not call inspectDailyAiContent inline after extraction.');
assert.doesNotMatch(parent, /import \{[^}]*ipcMain[^}]*\} from 'electron'/, 'parent AI Review IPC module should no longer import ipcMain after all channel handlers are delegated.');

assert.equal(
  scripts['verify:electron-ai-review-daily-run-inspect-ipc-module'],
  'tsx scripts/verify-electron-ai-review-daily-run-inspect-ipc-module.ts',
  'package.json should expose the focused AI Review daily run/inspect IPC verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-daily-run-inspect-ipc-module', 'cleanup-core should include the focused AI Review daily run/inspect IPC verifier.');

console.log('electron AI Review daily run/inspect IPC module verification passed');
