import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewWeeklyReportIpc.ts');
const taskPayloadPath = join(root, 'electron', 'aiReviewTaskPayload.ts');
const parentPath = join(root, 'electron', 'aiReviewIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review weekly report IPC module should exist.');
assert.ok(existsSync(taskPayloadPath), 'Electron AI Review task payload guard module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const taskPayload = readFileSync(taskPayloadPath, 'utf8');
const parent = readFileSync(parentPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /import \{[^}]*ipcMain[^}]*\} from 'electron'/, 'weekly report IPC module should own ipcMain registration.');
assert.match(moduleSource, /export type RegisterAiReviewWeeklyReportIpcHandlersOptions\b/, 'weekly report IPC module should export explicit registration dependencies.');
assert.match(moduleSource, /export function registerAiReviewWeeklyReportIpcHandlers\b/, 'weekly report IPC module should export its registration function.');
assert.match(moduleSource, /ipcMain\.handle\('aiReview:generateWeekly'/, 'weekly report IPC module should register aiReview:generateWeekly.');
assert.match(moduleSource, /getDateKey\(date\?: unknown\): string/, 'weekly report IPC module should inject an untrusted-date normalizer.');
assert.match(moduleSource, /aiReview:generateWeekly'[^)]*date: unknown/, 'weekly report IPC should treat the runtime date as unknown before normalization.');
assert.match(moduleSource, /aiReview:generateWeekly'[^)]*tasks: unknown/, 'weekly report IPC should treat the task payload as unknown runtime data.');
assert.match(moduleSource, /from '\.\/aiReviewTaskPayload'/, 'weekly report IPC should use the shared AI Review task payload guard.');
assert.match(taskPayload, /export function isAiReviewTaskArray\(value: unknown\): value is ElectronTask\[\]/, 'shared task payload module should validate report task payload arrays.');
assert.match(moduleSource, /if \(!isAiReviewTaskArray\(tasks\)\) \{\s*return \{ ok: false, error: 'AI Review tasks contain malformed entries\.' \};\s*\}/s, 'weekly report IPC should reject malformed tasks before report preflight.');

assert.match(moduleSource, /from '\.\/aiReviewReportIpcPreflight'/, 'weekly report IPC module should import the shared report preflight helper.');
assert.match(moduleSource, /const preflight = startReportPreflight\(\{/, 'weekly report IPC module should derive preflight data through the shared helper.');
assert.match(moduleSource, /prepareMessage:\s*READ_WEEKLY_SOURCES_MESSAGE/, 'weekly report IPC module should preserve weekly source-read progress text via the shared preflight helper.');
assert.match(moduleSource, /if \(!preflight\.ok\) \{\s*return preflight\.result;\s*\}/s, 'weekly report IPC module should return shared preflight failures directly.');
assert.match(moduleSource, /const \{ startedAt, settings, llm, vaultPath \} = preflight/, 'weekly report IPC module should preserve started-at/settings/llm/vault-path data via the shared preflight helper.');
assert.doesNotMatch(moduleSource, /const startedAt = Date\.now\(\)/, 'weekly report IPC module should not keep inline started-at timing after preflight-helper extraction.');
assert.doesNotMatch(moduleSource, /emitAiReviewProgress\('weekly', 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'running', READ_WEEKLY_SOURCES_MESSAGE\)/, 'weekly report IPC module should not keep inline prepare-materials running progress after preflight-helper extraction.');
assert.doesNotMatch(moduleSource, /const llm = ensureReportLlmAvailable\('weekly'\)/, 'weekly report IPC module should not keep inline weekly report account resolution after preflight-helper extraction.');
assert.doesNotMatch(moduleSource, /const vaultStatus = getVaultStatus\(\)/, 'weekly report IPC module should not keep inline vault-status guard after preflight-helper extraction.');
assert.doesNotMatch(moduleSource, /stage\('requestAi', REQUEST_AI_LABEL, 'failed', undefined, llm\.error\)/, 'weekly report IPC module should not keep inline failed request-AI stage diagnostics after preflight-helper extraction.');

assert.match(moduleSource, /from '\.\/aiReviewReportIpcSourceCollection'/, 'weekly report IPC module should import the shared report source-collection helper.');
assert.match(moduleSource, /const \{ prepareStartedAt, selected, monday, weekDates, dailyContents \} = collectWeeklyReportSources\(\{/, 'weekly report IPC module should delegate source collection through the shared helper.');
assert.match(moduleSource, /vaultPath,\s*\n\s*weeklySourceMode:\s*settings\.weeklySourceMode,/s, 'weekly report IPC module should pass weekly source mode and vault path to the shared source-collection helper.');
assert.match(moduleSource, /getDateKey,\s*\n\s*getDailySourceRules,/s, 'weekly report IPC module should pass injected date-key and daily-rule accessors to the shared source-collection helper.');
assert.doesNotMatch(moduleSource, /const selected = getDateKey\(date\)/, 'weekly report IPC module should not keep inline selected-date normalization after source-collection extraction.');
assert.doesNotMatch(moduleSource, /const \{ monday, dates: weekDates \} = getWeekDates\(selected\)/, 'weekly report IPC module should not keep inline week-date expansion after source-collection extraction.');
assert.doesNotMatch(moduleSource, /settings\.weeklySourceMode === 'manual-files'/, 'weekly report IPC module should not keep inline manual-files source behavior after source-collection extraction.');
assert.doesNotMatch(moduleSource, /collectDailySourcesForDates\(\{/, 'weekly report IPC module should not keep inline daily source collection after source-collection extraction.');
assert.match(moduleSource, /from '\.\/aiReviewReportIpcSourcePreparation'/, 'weekly report IPC module should import the shared report source-preparation helper.');
assert.match(moduleSource, /const sourcePreparation = prepareReportSources\(\{/, 'weekly report IPC module should derive source preparation state through the shared helper.');
assert.match(moduleSource, /if \(!sourcePreparation\.ok\) \{\s*return sourcePreparation\.result;\s*\}/s, 'weekly report IPC module should return shared source-preparation failures directly.');
assert.match(moduleSource, /const \{ sourceChars, stages \} = sourcePreparation/, 'weekly report IPC module should preserve prepared sourceChars/stages via the shared helper.');
assert.match(moduleSource, /prepareStartedAt,\s*\n\s*resolution:\s*llm\.resolution,/s, 'weekly report IPC module should pass shared source-collection prepare-start timing to source preparation.');
assert.doesNotMatch(moduleSource, /NO_SOURCE_MATERIALS_ERROR\.zh/, 'weekly report IPC module should not keep inline no-source-materials error text after helper extraction.');
assert.doesNotMatch(moduleSource, /from '\.\/aiReviewReportIpcPrepareProgress'/, 'weekly report IPC module should not import the prepare-progress helper directly after source-preparation extraction.');
assert.doesNotMatch(moduleSource, /from '\.\/aiReviewReportIpcNoSourceFailure'/, 'weekly report IPC module should not import the no-source failure helper directly after source-preparation extraction.');
assert.doesNotMatch(moduleSource, /from '\.\/aiReviewReportIpcSourceSummary'/, 'weekly report IPC module should not import the source summary helper directly after source-preparation extraction.');
assert.doesNotMatch(moduleSource, /completeReportPrepareMaterials\(/, 'weekly report IPC module should not keep inline prepare-progress helper usage after source-preparation extraction.');
assert.doesNotMatch(moduleSource, /failReportForNoSourceMaterials\(/, 'weekly report IPC module should not keep inline no-source failure helper usage after source-preparation extraction.');
assert.doesNotMatch(moduleSource, /sumReportSourceChars\(/, 'weekly report IPC module should not keep inline source summary helper usage after source-preparation extraction.');
assert.doesNotMatch(moduleSource, /hasSourceMaterials\(/, 'weekly report IPC module should not keep inline no-source-materials guards after source-preparation extraction.');

assert.match(moduleSource, /computeRangeStats\(tasks, monday, weekDates\[6\]\)/, 'weekly report IPC module should preserve weekly stats range after task payload validation.');
assert.match(moduleSource, /generatePersonalWeekly\(\{/, 'weekly report IPC module should call the personal weekly report writer.');
assert.match(moduleSource, /weekKey:\s*isoWeekKey\(selected\)/, 'weekly report IPC module should preserve ISO week key output.');
assert.match(moduleSource, /getObsidianTemplateSettings\(\)/, 'weekly report IPC module should read template settings for report output paths.');
assert.match(moduleSource, /relativeFilePath:\s*expandPathTemplate\(templateSettings\.weeklyPath, dateKeyToLocalDate\(selected\)\)/, 'weekly report IPC module should resolve weekly output from the template path.');
assert.match(moduleSource, /reportTemplate:\s*templateSettings\.weeklyTemplate/, 'weekly report IPC module should pass the weekly report template to generation.');
assert.match(moduleSource, /systemPrompt:\s*settings\.weeklyPrompt/, 'weekly report IPC module should preserve weekly custom prompt selection.');
assert.equal(
  (moduleSource.match(/return createReportFailureResult\(\{/g) ?? []).length,
  0,
  'weekly report IPC module should not keep inline failure-result assembly after no-source failure helper extraction.',
);
assert.match(moduleSource, /from '\.\/aiReviewReportIpcExecution'/, 'weekly report IPC module should import the shared report execution helper.');
assert.match(moduleSource, /return executeReportGeneration\(\{/, 'weekly report IPC module should delegate report execution/finalization through the shared execution helper.');
assert.match(moduleSource, /reportKind:\s*'weekly'/, 'weekly report IPC module should pass weekly report kind to the shared execution helper.');
assert.match(moduleSource, /waitMessage:\s*WAIT_WEEKLY_REPORT_MESSAGE/, 'weekly report IPC module should pass weekly wait progress text to the shared execution helper.');
assert.match(moduleSource, /receivedMessage:\s*RECEIVED_WEEKLY_REPORT_MESSAGE/, 'weekly report IPC module should pass weekly received progress text to the shared execution helper.');
assert.match(moduleSource, /writtenMessage:\s*WEEKLY_WRITTEN_MESSAGE/, 'weekly report IPC module should pass the weekly written message to the shared execution helper.');
assert.match(moduleSource, /runReport:\s*async \(callLlm\) => generatePersonalWeekly\(\{/, 'weekly report IPC module should preserve weekly report generation inside the shared execution helper callback.');
assert.match(moduleSource, /RECEIVED_WEEKLY_REPORT_MESSAGE/, 'weekly report IPC module should preserve weekly received-report progress text.');
assert.match(moduleSource, /WEEKLY_WRITTEN_MESSAGE/, 'weekly report IPC module should preserve weekly written progress text.');
assert.doesNotMatch(moduleSource, /emitAiReviewProgress\(\s*'weekly',\s*'writeObsidian',\s*WRITE_OBSIDIAN_LABEL,\s*result\.ok \? 'completed' : 'failed'/s, 'weekly report IPC module should not keep inline final write progress emission after completion-helper extraction.');
assert.doesNotMatch(moduleSource, /llmResult = await callReportLlmWithProgress\(\{/, 'weekly report IPC module should not keep inline LLM progress-wrapped calls after execution-helper extraction.');
assert.doesNotMatch(moduleSource, /return finalizeReportResult\(\{/, 'weekly report IPC module should not keep inline final result assembly after execution-helper extraction.');

assert.match(parent, /from '\.\/aiReviewWeeklyReportIpc'/, 'parent AI Review IPC module should import the weekly report IPC module.');
assert.match(parent, /registerAiReviewWeeklyReportIpcHandlers\(\{/, 'parent AI Review IPC module should delegate weekly report handler registration.');
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
  assert.match(parent, new RegExp(`\\b${dependency},`), `parent AI Review IPC module should pass ${dependency} to the weekly report IPC module.`);
}

assert.doesNotMatch(parent, /ipcMain\.handle\('aiReview:generateWeekly'/, 'parent AI Review IPC module should not register aiReview:generateWeekly inline after extraction.');
assert.doesNotMatch(parent, /\bgeneratePersonalWeekly\b/, 'parent AI Review IPC module should not call or import generatePersonalWeekly after extraction.');
assert.doesNotMatch(parent, /\bREAD_WEEKLY_SOURCES_MESSAGE\b/, 'parent AI Review IPC module should not own weekly source-read progress text after extraction.');
assert.doesNotMatch(parent, /\bWAIT_WEEKLY_REPORT_MESSAGE\b/, 'parent AI Review IPC module should not own weekly wait progress text after extraction.');
assert.doesNotMatch(parent, /\bRECEIVED_WEEKLY_REPORT_MESSAGE\b/, 'parent AI Review IPC module should not own weekly received progress text after extraction.');
assert.doesNotMatch(parent, /\bWEEKLY_WRITTEN_MESSAGE\b/, 'parent AI Review IPC module should not own weekly written progress text after extraction.');

assert.equal(
  scripts['verify:electron-ai-review-weekly-report-ipc-module'],
  'tsx scripts/verify-electron-ai-review-weekly-report-ipc-module.ts',
  'package.json should expose the focused AI Review weekly report IPC verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-weekly-report-ipc-module', 'cleanup-core should include the focused AI Review weekly report IPC verifier.');

console.log('electron AI Review weekly report IPC module verification passed');
