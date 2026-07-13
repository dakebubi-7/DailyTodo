import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewReportIpcTypes.ts');
const parentPath = join(root, 'electron', 'aiReviewIpc.ts');
const registrationTypesPath = join(root, 'electron', 'aiReviewIpcRegistrationTypes.ts');
const weeklyPath = join(root, 'electron', 'aiReviewWeeklyReportIpc.ts');
const monthlyPath = join(root, 'electron', 'aiReviewMonthlyReportIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review report IPC types module should exist.');
assert.ok(existsSync(registrationTypesPath), 'Electron AI Review IPC registration types module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const parent = readFileSync(parentPath, 'utf8');
const registrationTypes = readFileSync(registrationTypesPath, 'utf8');
const weekly = readFileSync(weeklyPath, 'utf8');
const monthly = readFileSync(monthlyPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

for (const exportName of [
  'AiReviewReportLlmAvailableResult',
  'AiReviewReportProgressEmitter',
  'AiReviewReportStageFactory',
  'AiReviewReportDiagnosticFactory',
]) {
  assert.match(moduleSource, new RegExp(`export type ${exportName}\\b`), `report IPC types module should export ${exportName}.`);
}

for (const importedType of [
  'AiReviewProfileResolution',
  'AiReviewRunDiagnostic',
  'AiReviewRunFinalStatus',
  'AiReviewRunReportKind',
  'AiReviewStageDiagnostic',
  'ChatMessage',
  'LlmResult',
]) {
  assert.match(moduleSource, new RegExp(`\\b${importedType}\\b`), `report IPC types module should import ${importedType}.`);
}

for (const source of [registrationTypes, weekly, monthly]) {
  assert.match(source, /from '\.\/aiReviewReportIpcTypes'/, 'AI Review report IPC modules should import shared report IPC types.');
}

assert.match(registrationTypes, /ensureReportLlmAvailable\(reportKind: AiReviewReportKind\): AiReviewReportLlmAvailableResult/, 'registration types module should use shared LLM availability result type.');
assert.match(registrationTypes, /emitAiReviewProgress: AiReviewReportProgressEmitter/, 'registration types module should use shared progress-emitter type.');
assert.match(registrationTypes, /stage: AiReviewReportStageFactory/, 'registration types module should use shared stage-factory type.');
assert.match(registrationTypes, /createDiagnostic: AiReviewReportDiagnosticFactory/, 'registration types module should use shared diagnostic-factory type.');
assert.match(moduleSource, /callLlm\(messages: ChatMessage\[\]\): Promise<LlmResult>/, 'report IPC availability should expose the shared LLM result contract.');
assert.match(moduleSource, /llmResults\?: LlmResult\[\]/, 'report diagnostics should aggregate the shared LLM result contract.');

assert.match(weekly, /ensureReportLlmAvailable\(reportKind: 'weekly'\): AiReviewReportLlmAvailableResult/, 'weekly report IPC module should use shared LLM availability result type.');
assert.match(weekly, /emitAiReviewProgress: AiReviewReportProgressEmitter<'weekly'>/, 'weekly report IPC module should use shared weekly progress-emitter type.');
assert.match(weekly, /stage: AiReviewReportStageFactory/, 'weekly report IPC module should use shared stage-factory type.');
assert.match(weekly, /createDiagnostic: AiReviewReportDiagnosticFactory<'weekly'>/, 'weekly report IPC module should use shared weekly diagnostic-factory type.');

assert.match(monthly, /ensureReportLlmAvailable\(reportKind: 'monthly'\): AiReviewReportLlmAvailableResult/, 'monthly report IPC module should use shared LLM availability result type.');
assert.match(monthly, /emitAiReviewProgress: AiReviewReportProgressEmitter<'monthly'>/, 'monthly report IPC module should use shared monthly progress-emitter type.');
assert.match(monthly, /stage: AiReviewReportStageFactory/, 'monthly report IPC module should use shared stage-factory type.');
assert.match(monthly, /createDiagnostic: AiReviewReportDiagnosticFactory<'monthly'>/, 'monthly report IPC module should use shared monthly diagnostic-factory type.');

assert.doesNotMatch(parent, /type EnsureReportLlmAvailableResult\s*=/, 'parent AI Review IPC module should not keep a local LLM availability result type.');
assert.doesNotMatch(weekly, /type EnsureWeeklyReportLlmAvailableResult\s*=/, 'weekly report IPC module should not keep a local LLM availability result type.');
assert.doesNotMatch(monthly, /type EnsureMonthlyReportLlmAvailableResult\s*=/, 'monthly report IPC module should not keep a local LLM availability result type.');

assert.equal(
  scripts['verify:electron-ai-review-report-ipc-types-module'],
  'tsx scripts/verify-electron-ai-review-report-ipc-types-module.ts',
  'package.json should expose the focused AI Review report IPC types verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-report-ipc-types-module', 'cleanup-core should include the focused AI Review report IPC types verifier.');

console.log('electron AI Review report IPC types module verification passed');
