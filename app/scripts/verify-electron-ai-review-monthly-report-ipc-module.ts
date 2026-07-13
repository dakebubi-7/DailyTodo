import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewMonthlyReportIpc.ts');
const taskPayloadPath = join(root, 'electron', 'aiReviewTaskPayload.ts');
const parentPath = join(root, 'electron', 'aiReviewIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review monthly report IPC module should exist.');
assert.ok(existsSync(taskPayloadPath), 'Electron AI Review task payload guard module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const taskPayload = readFileSync(taskPayloadPath, 'utf8');
const parent = readFileSync(parentPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /import \{[^}]*ipcMain[^}]*\} from 'electron'/, 'monthly report IPC module should own ipcMain registration.');
assert.match(moduleSource, /export type RegisterAiReviewMonthlyReportIpcHandlersOptions\b/, 'monthly report IPC module should export explicit registration dependencies.');
assert.match(moduleSource, /export function registerAiReviewMonthlyReportIpcHandlers\b/, 'monthly report IPC module should export its registration function.');
assert.match(moduleSource, /ipcMain\.handle\('aiReview:generateMonthly'/, 'monthly report IPC module should register aiReview:generateMonthly.');
assert.match(moduleSource, /getDateKey\(date\?: unknown\): string/, 'monthly report IPC module should inject an untrusted-date normalizer.');
assert.match(moduleSource, /aiReview:generateMonthly'[^)]*date: unknown/, 'monthly report IPC should treat the runtime date as unknown before normalization.');
assert.match(moduleSource, /aiReview:generateMonthly'[^)]*tasks: unknown/, 'monthly report IPC should treat the task payload as unknown runtime data.');
assert.match(moduleSource, /from '\.\/aiReviewTaskPayload'/, 'monthly report IPC should use the shared AI Review task payload guard.');
assert.match(taskPayload, /export function isAiReviewTaskArray\(value: unknown\): value is ElectronTask\[\]/, 'shared task payload module should validate report task payload arrays.');
assert.match(moduleSource, /if \(!isAiReviewTaskArray\(tasks\)\) \{\s*return \{ ok: false, error: 'AI Review tasks contain malformed entries\.' \};\s*\}/s, 'monthly report IPC should reject malformed tasks before report preflight.');

assert.match(moduleSource, /from '\.\/aiReviewReportIpcPreflight'/, 'monthly report IPC module should import the shared report preflight helper.');
assert.match(moduleSource, /const preflight = startReportPreflight\(\{/, 'monthly report IPC module should derive preflight data through the shared helper.');
assert.match(moduleSource, /prepareMessage:\s*READ_MONTHLY_SOURCES_MESSAGE/, 'monthly report IPC module should preserve monthly source-read progress text via the shared preflight helper.');
assert.match(moduleSource, /if \(!preflight\.ok\) \{\s*return preflight\.result;\s*\}/s, 'monthly report IPC module should return shared preflight failures directly.');
assert.match(moduleSource, /const \{ startedAt, settings, llm, vaultPath \} = preflight/, 'monthly report IPC module should preserve started-at/settings/llm/vault-path data via the shared preflight helper.');
assert.doesNotMatch(moduleSource, /const startedAt = Date\.now\(\)/, 'monthly report IPC module should not keep inline started-at timing after preflight-helper extraction.');
assert.doesNotMatch(moduleSource, /emitAiReviewProgress\('monthly', 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'running', READ_MONTHLY_SOURCES_MESSAGE\)/, 'monthly report IPC module should not keep inline prepare-materials running progress after preflight-helper extraction.');
assert.doesNotMatch(moduleSource, /const llm = ensureReportLlmAvailable\('monthly'\)/, 'monthly report IPC module should not keep inline monthly report account resolution after preflight-helper extraction.');
assert.doesNotMatch(moduleSource, /const vaultStatus = getVaultStatus\(\)/, 'monthly report IPC module should not keep inline vault-status guard after preflight-helper extraction.');
assert.doesNotMatch(moduleSource, /stage\('requestAi', REQUEST_AI_LABEL, 'failed', undefined, llm\.error\)/, 'monthly report IPC module should not keep inline failed request-AI stage diagnostics after preflight-helper extraction.');

assert.match(moduleSource, /from '\.\/aiReviewReportIpcSourceCollection'/, 'monthly report IPC module should import the shared report source-collection helper.');
assert.match(moduleSource, /const \{ prepareStartedAt, month, first, last, sources \} = collectMonthlyReportSources\(\{/, 'monthly report IPC module should delegate source collection through the shared helper.');
assert.match(moduleSource, /vaultPath,\s*\n\s*weeklyPathTemplate:\s*templateSettings\.weeklyPath,/s, 'monthly report IPC module should pass the weekly report template path to the shared source-collection helper.');
assert.match(moduleSource, /monthlySourceMode:\s*settings\.monthlySourceMode,\s*\n\s*getDateKey,\s*\n\s*getDailySourceRules,/s, 'monthly report IPC module should pass monthly source mode and injected accessors to the shared source-collection helper.');
assert.doesNotMatch(moduleSource, /const month = monthKey\(getDateKey\(date\)\)/, 'monthly report IPC module should not keep inline month derivation after source-collection extraction.');
assert.doesNotMatch(moduleSource, /const \{ first, last \} = getMonthDates\(month\)/, 'monthly report IPC module should not keep inline month range derivation after source-collection extraction.');
assert.doesNotMatch(moduleSource, /collectMonthlySources\(\{/, 'monthly report IPC module should not keep inline monthly source collection after source-collection extraction.');
assert.match(moduleSource, /from '\.\/aiReviewReportIpcSourcePreparation'/, 'monthly report IPC module should import the shared report source-preparation helper.');
assert.match(moduleSource, /const sourcePreparation = prepareReportSources\(\{/, 'monthly report IPC module should derive source preparation state through the shared helper.');
assert.match(moduleSource, /if \(!sourcePreparation\.ok\) \{\s*return sourcePreparation\.result;\s*\}/s, 'monthly report IPC module should return shared source-preparation failures directly.');
assert.match(moduleSource, /const \{ sourceChars, stages \} = sourcePreparation/, 'monthly report IPC module should preserve prepared sourceChars/stages via the shared helper.');
assert.match(moduleSource, /prepareStartedAt,\s*\n\s*resolution:\s*llm\.resolution,/s, 'monthly report IPC module should pass shared source-collection prepare-start timing to source preparation.');
assert.doesNotMatch(moduleSource, /NO_SOURCE_MATERIALS_ERROR\.zh/, 'monthly report IPC module should not keep inline no-source-materials error text after helper extraction.');
assert.doesNotMatch(moduleSource, /from '\.\/aiReviewReportIpcPrepareProgress'/, 'monthly report IPC module should not import the prepare-progress helper directly after source-preparation extraction.');
assert.doesNotMatch(moduleSource, /from '\.\/aiReviewReportIpcNoSourceFailure'/, 'monthly report IPC module should not import the no-source failure helper directly after source-preparation extraction.');
assert.doesNotMatch(moduleSource, /from '\.\/aiReviewReportIpcSourceSummary'/, 'monthly report IPC module should not import the source summary helper directly after source-preparation extraction.');
assert.doesNotMatch(moduleSource, /completeReportPrepareMaterials\(/, 'monthly report IPC module should not keep inline prepare-progress helper usage after source-preparation extraction.');
assert.doesNotMatch(moduleSource, /failReportForNoSourceMaterials\(/, 'monthly report IPC module should not keep inline no-source failure helper usage after source-preparation extraction.');
assert.doesNotMatch(moduleSource, /sumReportSourceChars\(/, 'monthly report IPC module should not keep inline source summary helper usage after source-preparation extraction.');
assert.doesNotMatch(moduleSource, /hasSourceMaterials\(/, 'monthly report IPC module should not keep inline no-source-materials guards after source-preparation extraction.');

assert.match(moduleSource, /computeRangeStats\(tasks, first, last\)/, 'monthly report IPC module should preserve monthly stats range after task payload validation.');
assert.match(moduleSource, /generatePersonalMonthly\(\{/, 'monthly report IPC module should call the personal monthly report writer.');
assert.match(moduleSource, /month,\s*sources,\s*stats,/s, 'monthly report IPC module should pass month, sources, and stats to the monthly report writer.');
assert.match(moduleSource, /getObsidianTemplateSettings\(\)/, 'monthly report IPC module should read template settings for report paths.');
assert.match(moduleSource, /relativeFilePath:\s*expandPathTemplate\(templateSettings\.monthlyPath, dateKeyToLocalDate\(selected\)\)/, 'monthly report IPC module should resolve monthly output from the template path.');
assert.match(moduleSource, /reportTemplate:\s*templateSettings\.monthlyTemplate/, 'monthly report IPC module should pass the monthly report template to generation.');
assert.match(moduleSource, /systemPrompt:\s*settings\.monthlyPrompt/, 'monthly report IPC module should preserve monthly custom prompt selection.');
assert.equal(
  (moduleSource.match(/return createReportFailureResult\(\{/g) ?? []).length,
  0,
  'monthly report IPC module should not keep inline failure-result assembly after no-source failure helper extraction.',
);
assert.match(moduleSource, /from '\.\/aiReviewReportIpcExecution'/, 'monthly report IPC module should import the shared report execution helper.');
assert.match(moduleSource, /return executeReportGeneration\(\{/, 'monthly report IPC module should delegate report execution/finalization through the shared execution helper.');
assert.match(moduleSource, /reportKind:\s*'monthly'/, 'monthly report IPC module should pass monthly report kind to the shared execution helper.');
assert.match(moduleSource, /waitMessage:\s*WAIT_MONTHLY_REPORT_MESSAGE/, 'monthly report IPC module should pass monthly wait progress text to the shared execution helper.');
assert.match(moduleSource, /receivedMessage:\s*RECEIVED_MONTHLY_REPORT_MESSAGE/, 'monthly report IPC module should pass monthly received progress text to the shared execution helper.');
assert.match(moduleSource, /writtenMessage:\s*MONTHLY_WRITTEN_MESSAGE/, 'monthly report IPC module should pass the monthly written message to the shared execution helper.');
assert.match(moduleSource, /runReport:\s*async \(callLlm\) => generatePersonalMonthly\(\{/, 'monthly report IPC module should preserve monthly report generation inside the shared execution helper callback.');
assert.match(moduleSource, /RECEIVED_MONTHLY_REPORT_MESSAGE/, 'monthly report IPC module should preserve monthly received-report progress text.');
assert.match(moduleSource, /MONTHLY_WRITTEN_MESSAGE/, 'monthly report IPC module should preserve monthly written progress text.');
assert.doesNotMatch(moduleSource, /emitAiReviewProgress\(\s*'monthly',\s*'writeObsidian',\s*WRITE_OBSIDIAN_LABEL,\s*result\.ok \? 'completed' : 'failed'/s, 'monthly report IPC module should not keep inline final write progress emission after completion-helper extraction.');
assert.doesNotMatch(moduleSource, /llmResult = await callReportLlmWithProgress\(\{/, 'monthly report IPC module should not keep inline LLM progress-wrapped calls after execution-helper extraction.');
assert.doesNotMatch(moduleSource, /return finalizeReportResult\(\{/, 'monthly report IPC module should not keep inline final result assembly after execution-helper extraction.');

assert.match(parent, /from '\.\/aiReviewMonthlyReportIpc'/, 'parent AI Review IPC module should import the monthly report IPC module.');
assert.match(parent, /registerAiReviewMonthlyReportIpcHandlers\(\{/, 'parent AI Review IPC module should delegate monthly report handler registration.');
for (const dependency of [
  'getAiReviewSettings',
  'getObsidianTemplateSettings',
  'getVaultStatus',
  'getDateKey',
  'getDailySourceRules',
  'ensureReportLlmAvailable',
  'emitAiReviewProgress',
  'stage',
  'createDiagnostic',
]) {
  assert.match(parent, new RegExp(`\\b${dependency},`), `parent AI Review IPC module should pass ${dependency} to the monthly report IPC module.`);
}

assert.doesNotMatch(parent, /ipcMain\.handle\('aiReview:generateMonthly'/, 'parent AI Review IPC module should not register aiReview:generateMonthly inline after extraction.');
assert.doesNotMatch(parent, /\bgeneratePersonalMonthly\b/, 'parent AI Review IPC module should not call or import generatePersonalMonthly after extraction.');
assert.doesNotMatch(parent, /\bREAD_MONTHLY_SOURCES_MESSAGE\b/, 'parent AI Review IPC module should not own monthly source-read progress text after extraction.');
assert.doesNotMatch(parent, /\bWAIT_MONTHLY_REPORT_MESSAGE\b/, 'parent AI Review IPC module should not own monthly wait progress text after extraction.');
assert.doesNotMatch(parent, /\bRECEIVED_MONTHLY_REPORT_MESSAGE\b/, 'parent AI Review IPC module should not own monthly received progress text after extraction.');
assert.doesNotMatch(parent, /\bMONTHLY_WRITTEN_MESSAGE\b/, 'parent AI Review IPC module should not own monthly written progress text after extraction.');

assert.equal(
  scripts['verify:electron-ai-review-monthly-report-ipc-module'],
  'tsx scripts/verify-electron-ai-review-monthly-report-ipc-module.ts',
  'package.json should expose the focused AI Review monthly report IPC verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-monthly-report-ipc-module', 'cleanup-core should include the focused AI Review monthly report IPC verifier.');

console.log('electron AI Review monthly report IPC module verification passed');
