import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewReportIpcDiagnostics.ts');
const completionPath = join(root, 'electron', 'aiReviewReportIpcCompletion.ts');
const executionPath = join(root, 'electron', 'aiReviewReportIpcExecution.ts');
const weeklyPath = join(root, 'electron', 'aiReviewWeeklyReportIpc.ts');
const monthlyPath = join(root, 'electron', 'aiReviewMonthlyReportIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review report IPC diagnostics module should exist.');
assert.ok(existsSync(completionPath), 'Electron AI Review report IPC completion helper module should exist.');
assert.ok(existsSync(executionPath), 'Electron AI Review report IPC execution helper module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const completion = readFileSync(completionPath, 'utf8');
const execution = readFileSync(executionPath, 'utf8');
const weekly = readFileSync(weeklyPath, 'utf8');
const monthly = readFileSync(monthlyPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /export function getReportFinalStatus\b/, 'report diagnostics module should export getReportFinalStatus.');
assert.match(moduleSource, /export function getReportLlmResults\b/, 'report diagnostics module should export getReportLlmResults.');
assert.match(moduleSource, /result\.ok \? \(result\.truncated \? 'completedWithWarning' : 'completed'\) : llmResult && !llmResult\.ok \? 'providerFailed' : 'writeFailed'/, 'report diagnostics module should preserve final-status decision logic.');
assert.match(moduleSource, /return llmResult \? \[llmResult\] : \[\]/, 'report diagnostics module should preserve diagnostic LLM result array normalization.');
assert.match(completion, /from '\.\/aiReviewReportIpcDiagnostics'/, 'report completion helper should import the shared report diagnostics helpers.');
assert.match(completion, /finalStatus:\s*getReportFinalStatus\(result, llmResult\)/, 'report completion helper should use shared final-status helper.');
assert.match(completion, /llmResults:\s*getReportLlmResults\(llmResult\)/, 'report completion helper should use shared LLM-result array helper.');
assert.match(execution, /from '\.\/aiReviewReportIpcCompletion'/, 'report execution helper should import the shared report completion helper.');
assert.match(execution, /return finalizeReportResult\(\{/, 'report execution helper should finalize report results through the shared completion helper.');

for (const source of [weekly, monthly]) {
  assert.match(source, /from '\.\/aiReviewReportIpcExecution'/, 'weekly/monthly report IPC modules should import the shared report execution helper.');
  assert.match(source, /return executeReportGeneration\(\{/, 'weekly/monthly report IPC modules should delegate final report execution through the shared execution helper.');
  assert.doesNotMatch(source, /from '\.\/aiReviewReportIpcCompletion'/, 'weekly/monthly report IPC modules should not import the shared report completion helper directly after execution-helper extraction.');
  assert.doesNotMatch(source, /return finalizeReportResult\(\{/, 'weekly/monthly report IPC modules should not finalize report results directly after execution-helper extraction.');
  assert.doesNotMatch(source, /finalStatus: result\.ok \? \(result\.truncated \? 'completedWithWarning' : 'completed'\) : llmResult && !llmResult\.ok \? 'providerFailed' : 'writeFailed'/, 'weekly/monthly report IPC modules should not keep inline final-status ternary logic.');
  assert.doesNotMatch(source, /llmResults: llmResult \? \[llmResult\] : \[\]/, 'weekly/monthly report IPC modules should not keep inline LLM-result array normalization.');
}

const diagnostics = await import('../electron/aiReviewReportIpcDiagnostics');

assert.equal(diagnostics.getReportFinalStatus({ ok: true }), 'completed', 'successful report writes should be completed.');
assert.equal(diagnostics.getReportFinalStatus({ ok: true, truncated: true }), 'completedWithWarning', 'truncated successful report writes should be completedWithWarning.');
assert.equal(
  diagnostics.getReportFinalStatus({ ok: false, error: 'write failed' }, { ok: false, error: 'provider failed' }),
  'providerFailed',
  'failed provider result should produce providerFailed final status.',
);
assert.equal(
  diagnostics.getReportFinalStatus({ ok: false, error: 'write failed' }, { ok: true, content: 'draft' }),
  'writeFailed',
  'successful provider result followed by failed write should produce writeFailed final status.',
);
assert.equal(
  diagnostics.getReportFinalStatus({ ok: false, error: 'write failed' }),
  'writeFailed',
  'missing provider result with failed report write should produce writeFailed final status.',
);
const llmResult = { ok: true as const, content: 'draft' };
assert.deepEqual(diagnostics.getReportLlmResults(llmResult), [llmResult], 'present LLM result should be wrapped for diagnostics.');
assert.deepEqual(diagnostics.getReportLlmResults(undefined), [], 'missing LLM result should produce an empty diagnostic array.');

assert.equal(
  scripts['verify:electron-ai-review-report-ipc-diagnostics-module'],
  'tsx scripts/verify-electron-ai-review-report-ipc-diagnostics-module.ts',
  'package.json should expose the focused AI Review report IPC diagnostics verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-report-ipc-diagnostics-module', 'cleanup-core should include the focused AI Review report IPC diagnostics verifier.');

console.log('electron AI Review report IPC diagnostics module verification passed');
