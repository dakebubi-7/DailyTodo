import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewBackfillIpc.ts');
const taskPayloadPath = join(root, 'electron', 'aiReviewTaskPayload.ts');
const parentPath = join(root, 'electron', 'aiReviewIpc.ts');
const viteEnvPath = join(root, 'src', 'vite-env.d.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review backfill IPC module should exist.');
assert.ok(existsSync(taskPayloadPath), 'Electron AI Review task payload guard module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const taskPayload = readFileSync(taskPayloadPath, 'utf8');
const parent = readFileSync(parentPath, 'utf8');
const viteEnv = readFileSync(viteEnvPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /import \{[^}]*ipcMain[^}]*\} from 'electron'/, 'backfill IPC module should own ipcMain registration.');
assert.match(moduleSource, /import fs from 'fs'/, 'backfill IPC module should own file-existence checks.');
assert.match(moduleSource, /export type RegisterAiReviewBackfillIpcHandlersOptions\b/, 'backfill IPC module should export explicit registration dependencies.');
assert.match(moduleSource, /getLlmCaller\(\): \(messages: ChatMessage\[\]\) => Promise<LlmResult>/, 'backfill IPC should expose the shared LLM result contract.');
assert.match(moduleSource, /export function registerAiReviewBackfillIpcHandlers\b/, 'backfill IPC module should export its registration function.');
assert.match(moduleSource, /ipcMain\.handle\('aiReview:backfill'/, 'backfill IPC module should register aiReview:backfill.');
assert.match(moduleSource, /aiReview:backfill'[^)]*tasks: unknown/, 'backfill IPC should treat the task payload as unknown runtime data.');
assert.match(moduleSource, /from '\.\/aiReviewTaskPayload'/, 'backfill IPC should use the shared AI Review task payload guard.');
assert.match(taskPayload, /export function isAiReviewTaskArray\(value: unknown\): value is ElectronTask\[\]/, 'shared task payload module should validate backfill task payload arrays.');
assert.match(moduleSource, /if \(!isAiReviewTaskArray\(tasks\)\) \{\s*return \{ processed: \[\], filled: \[\], errors: \[\{ date: '', error: 'AI Review tasks contain malformed entries\.' \}\] \};\s*\}/s, 'backfill IPC should reject malformed tasks before backfill processing.');
assert.match(moduleSource, /resolveActiveProfile\(settings\)\.apiKey/, 'backfill IPC module should preserve active-profile API-key guard.');
assert.match(moduleSource, /return \{ processed: \[\], filled: \[\], errors: \[\] \}/, 'backfill IPC module should preserve disabled/unauthorized empty result shape.');
assert.match(moduleSource, /getBusinessDateKey\(new Date\(\), rollover\)/, 'backfill IPC module should preserve business-date calculation.');
assert.match(moduleSource, /Array\.from\(\{ length: settings\.backfillDays \}, \(_, index\) => shiftDateKey\(today, -index\)\)/, 'backfill IPC module should preserve backfill date range derivation.');
assert.match(moduleSource, /backfillReviews\(\{/, 'backfill IPC module should call the shared backfill runner.');
assert.match(moduleSource, /resolveFilePath:\s*\(date\) => getDailyFilePath\(date\)/, 'backfill IPC module should preserve daily file path resolution.');
assert.match(moduleSource, /tasksForDate:\s*\(\) => tasks/, 'backfill IPC module should pass runtime-validated tasks to the backfill runner.');
assert.match(moduleSource, /customBlocks:\s*getObsidianTemplateSettings\(\)\.dailyTemplate\.customBlocks\.filter\(\(block\) => block\.aiGenerate\)/, 'backfill IPC module should preserve AI-generated custom block filtering.');
assert.match(moduleSource, /fileExists:\s*\(filePath\) => fs\.existsSync\(filePath\)/, 'backfill IPC module should preserve file-existence dependency.');

assert.match(parent, /from '\.\/aiReviewBackfillIpc'/, 'parent AI Review IPC module should import the backfill IPC module.');
assert.match(parent, /registerAiReviewBackfillIpcHandlers\(\{/, 'parent AI Review IPC module should delegate backfill handler registration.');
for (const dependency of ['getAppSettings', 'getAiReviewSettings', 'getDailyFilePath', 'getReviewSections', 'getObsidianTemplateSettings', 'getLlmCaller']) {
  assert.match(parent, new RegExp(`\\b${dependency},`), `parent AI Review IPC module should pass ${dependency} to the backfill IPC module.`);
}

assert.doesNotMatch(parent, /ipcMain\.handle\('aiReview:backfill'/, 'parent AI Review IPC module should not register aiReview:backfill inline after extraction.');
assert.doesNotMatch(parent, /backfillReviews\(/, 'parent AI Review IPC module should not call backfillReviews directly after extraction.');
assert.doesNotMatch(parent, /getBusinessDateKey\(new Date\(\), rollover\)/, 'parent AI Review IPC module should not own backfill business-date calculation after extraction.');

assert.match(
  viteEnv,
  /backfill:\s*\(tasks:\s*unknown\)\s*=>\s*Promise<unknown>/,
  'ambient AI Review backfill should expose unknown return values at the preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /backfill:\s*\(tasks:\s*unknown\)\s*=>\s*Promise<\{\s*processed:\s*string\[\];\s*filled:\s*string\[\];/,
  'ambient AI Review backfill should not claim a trusted structured backfill report return.',
);

assert.equal(
  scripts['verify:electron-ai-review-backfill-ipc-module'],
  'tsx scripts/verify-electron-ai-review-backfill-ipc-module.ts',
  'package.json should expose the focused AI Review backfill IPC verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-backfill-ipc-module', 'cleanup-core should include the focused AI Review backfill IPC verifier.');

console.log('electron AI Review backfill IPC module verification passed');
