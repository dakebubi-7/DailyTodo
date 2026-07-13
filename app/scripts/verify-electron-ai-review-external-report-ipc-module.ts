import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewExternalReportIpc.ts');
const reportKindPath = join(root, 'electron', 'aiReviewReportKind.ts');
const parentPath = join(root, 'electron', 'aiReviewIpc.ts');
const preloadPath = join(root, 'electron', 'preload.ts');
const viteEnvPath = join(root, 'src', 'vite-env.d.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review external report IPC module should exist.');
assert.ok(existsSync(reportKindPath), 'Electron AI Review report-kind guard module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const reportKind = readFileSync(reportKindPath, 'utf8');
const parent = readFileSync(parentPath, 'utf8');
const preload = readFileSync(preloadPath, 'utf8');
const viteEnv = readFileSync(viteEnvPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /import \{[^}]*ipcMain[^}]*\} from 'electron'/, 'external report IPC module should own ipcMain registration.');
assert.match(moduleSource, /export type RegisterAiReviewExternalReportIpcHandlersOptions\b/, 'external report IPC module should export explicit registration dependencies.');
assert.match(moduleSource, /getLlmCaller\(\): \(messages: ChatMessage\[\]\) => Promise<LlmResult>/, 'external report IPC should expose the shared LLM result contract.');
assert.match(moduleSource, /export function registerAiReviewExternalReportIpcHandlers\b/, 'external report IPC module should export its registration function.');
assert.match(moduleSource, /ipcMain\.handle\('aiReview:generateExternal'/, 'external report IPC module should register aiReview:generateExternal.');
assert.match(moduleSource, /getDateKey\(date\?: unknown\): string/, 'external report IPC module should inject an untrusted-date normalizer.');
assert.match(moduleSource, /aiReview:generateExternal'[^)]*kind: unknown, date: unknown/, 'external report IPC should treat report kind and date as unknown runtime data.');
assert.match(moduleSource, /aiReview:generateExternal'[^)]*date: unknown/, 'external report IPC should treat the runtime date as unknown before normalization.');
assert.match(moduleSource, /from '\.\/aiReviewReportKind'/, 'external report IPC module should use the shared report-kind guard.');
assert.match(reportKind, /export function isAiReviewReportKind\(value: unknown\): value is AiReviewReportKind/, 'shared report-kind module should validate weekly/monthly report kinds.');
assert.match(reportKind, /export const AI_REVIEW_REPORT_KIND_ERROR = 'AI Review report kind is malformed\.'/, 'shared report-kind module should expose a stable malformed-kind error.');
assert.match(moduleSource, /if \(!isAiReviewReportKind\(kind\)\) \{\s*return \{ ok: false, error: AI_REVIEW_REPORT_KIND_ERROR \};\s*\}\s*const settings = getAiReviewSettings\(\);/s, 'external report IPC should reject malformed report kinds before settings or vault work.');
assert.match(preload, /generateExternal: \(kind: unknown, date: unknown\) => ipcRenderer\.invoke\('aiReview:generateExternal', kind, date\)/, 'preload should expose external report kind as runtime data.');
assert.match(viteEnv, /generateExternal: \(kind: unknown, date: unknown\)/, 'ambient preload API should expose external report kind as unknown.');
assert.match(moduleSource, /resolveActiveProfile\(settings\)\.apiKey/, 'external report IPC module should preserve active-profile API-key guard.');
assert.match(moduleSource, /AI_REVIEW_DISABLED_ERROR/, 'external report IPC module should preserve disabled AI Review error text.');
assert.match(moduleSource, /getVaultStatus\(\)/, 'external report IPC module should preserve vault-status guard.');
assert.match(moduleSource, /getDateKey\(date\)/, 'external report IPC module should normalize the selected report date.');

assert.match(moduleSource, /if \(kind === 'weekly'\)/, 'external report IPC module should preserve weekly/monthly branching.');
assert.match(moduleSource, /getWeekDates\(selected\)/, 'external weekly report should expand the selected week with getWeekDates.');
assert.match(moduleSource, /periodKey = isoWeekKey\(selected\)/, 'external weekly report should preserve ISO week period keys.');
assert.match(moduleSource, /settings\.externalWeeklySourceMode === 'manual-files'/, 'external weekly report should preserve manual-files source behavior.');
assert.match(moduleSource, /collectDailySourcesForDates\(\{/, 'external weekly report should collect daily source materials.');
assert.match(moduleSource, /rules:\s*getDailySourceRules\(\)/, 'external weekly report should use injected daily source rules.');

assert.match(moduleSource, /const month = monthKey\(selected\)/, 'external monthly report should preserve month-key derivation.');
assert.match(moduleSource, /getMonthDates\(month\)/, 'external monthly report should expand month dates with getMonthDates.');
assert.match(moduleSource, /collectMonthlySources\(\{/, 'external monthly report should collect monthly source materials.');
assert.match(moduleSource, /weeklyPathTemplate:\s*templateSettings\.weeklyPath/, 'external monthly report should resolve weekly source reports from the template path.');
assert.match(moduleSource, /mode:\s*settings\.externalMonthlySourceMode/, 'external monthly report should preserve external monthly source mode.');

assert.match(moduleSource, /NO_SOURCE_MATERIALS_ERROR\.zh/, 'external report IPC module should preserve no-source-materials error text.');
assert.match(moduleSource, /getObsidianTemplateSettings\(\)/, 'external report IPC module should read template settings for report paths.');
assert.match(moduleSource, /templateSettings\.externalWeeklyPath/, 'external weekly report should select the external weekly template path.');
assert.match(moduleSource, /templateSettings\.externalMonthlyPath/, 'external monthly report should select the external monthly template path.');
assert.match(moduleSource, /relativeFilePath:\s*expandPathTemplate\(externalPath, dateKeyToLocalDate\(selected\)\)/, 'external report IPC module should resolve its output from the selected template path.');
assert.match(moduleSource, /templateSettings\.externalWeeklyTemplate/, 'external weekly report should select the external weekly generation template.');
assert.match(moduleSource, /templateSettings\.externalMonthlyTemplate/, 'external monthly report should select the external monthly generation template.');
assert.match(moduleSource, /reportTemplate,/, 'external report IPC module should pass the selected template to generation.');
assert.match(moduleSource, /settings\.externalWeeklyPrompt/, 'external weekly report should preserve custom prompt selection.');
assert.match(moduleSource, /settings\.externalMonthlyPrompt/, 'external monthly report should preserve custom prompt selection.');
assert.match(moduleSource, /DEFAULT_EXTERNAL_WEEKLY_SYSTEM/, 'external weekly report should preserve default system prompt fallback.');
assert.match(moduleSource, /DEFAULT_EXTERNAL_MONTHLY_SYSTEM/, 'external monthly report should preserve default system prompt fallback.');
assert.match(moduleSource, /generateExternalReport\(\{/, 'external report IPC module should call the external report writer.');
assert.match(moduleSource, /buildMessages:\s*\(redacted\) =>\s*buildMonthlyMessages\(\{/, 'external report IPC module should preserve redacted-content message building.');
assert.match(moduleSource, /sources:\s*\[\{ label: periodKey, content: redacted \}\]/, 'external report IPC module should preserve redacted source mapping.');
assert.match(moduleSource, /activeDays:\s*0/, 'external report IPC module should preserve zeroed external stats.');
assert.match(moduleSource, /totalCompleted:\s*0/, 'external report IPC module should preserve zeroed completion stats.');
assert.match(moduleSource, /totalTasks:\s*0/, 'external report IPC module should preserve zeroed task stats.');
assert.match(moduleSource, /streak:\s*0/, 'external report IPC module should preserve zeroed streak stats.');
assert.match(moduleSource, /callLlm:\s*getLlmCaller\(\)/, 'external report IPC module should use the injected LLM caller.');

assert.match(parent, /from '\.\/aiReviewExternalReportIpc'/, 'parent AI Review IPC module should import the external report IPC module.');
assert.match(parent, /registerAiReviewExternalReportIpcHandlers\(\{/, 'parent AI Review IPC module should delegate external report handler registration.');
for (const dependency of ['getAiReviewSettings', 'getObsidianTemplateSettings', 'getVaultStatus', 'getDateKey', 'getDailySourceRules', 'getLlmCaller']) {
  assert.match(parent, new RegExp(`\\b${dependency},`), `parent AI Review IPC module should pass ${dependency} to the external report IPC module.`);
}

assert.doesNotMatch(parent, /ipcMain\.handle\('aiReview:generateExternal'/, 'parent AI Review IPC module should not register aiReview:generateExternal inline after extraction.');
assert.doesNotMatch(parent, /\bgenerateExternalReport\b/, 'parent AI Review IPC module should not call or import generateExternalReport after extraction.');
assert.doesNotMatch(parent, /\bDEFAULT_EXTERNAL_WEEKLY_SYSTEM\b/, 'parent AI Review IPC module should not own external weekly prompt defaults after extraction.');
assert.doesNotMatch(parent, /\bDEFAULT_EXTERNAL_MONTHLY_SYSTEM\b/, 'parent AI Review IPC module should not own external monthly prompt defaults after extraction.');
assert.doesNotMatch(parent, /\bbuildMonthlyMessages\b/, 'parent AI Review IPC module should not own external report message building after extraction.');

assert.equal(
  scripts['verify:electron-ai-review-external-report-ipc-module'],
  'tsx scripts/verify-electron-ai-review-external-report-ipc-module.ts',
  'package.json should expose the focused AI Review external report IPC verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-external-report-ipc-module', 'cleanup-core should include the focused AI Review external report IPC verifier.');

console.log('electron AI Review external report IPC module verification passed');
