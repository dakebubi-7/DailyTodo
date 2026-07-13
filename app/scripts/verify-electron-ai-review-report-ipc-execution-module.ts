import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewReportIpcExecution.ts');
const weeklyPath = join(root, 'electron', 'aiReviewWeeklyReportIpc.ts');
const monthlyPath = join(root, 'electron', 'aiReviewMonthlyReportIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review report IPC execution helper module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const weekly = readFileSync(weeklyPath, 'utf8');
const monthly = readFileSync(monthlyPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /export type ExecuteReportGenerationOptions\b/, 'report IPC execution helper should export explicit options.');
assert.match(moduleSource, /export async function executeReportGeneration\b/, 'report IPC execution helper should export executeReportGeneration.');
assert.match(moduleSource, /from '\.\/aiReviewReportIpcLlmProgress'/, 'report IPC execution helper should import the shared LLM progress helper.');
assert.match(moduleSource, /from '\.\/aiReviewReportIpcCompletion'/, 'report IPC execution helper should import the shared completion helper.');
assert.match(moduleSource, /let llmResult: LlmResult \| undefined/, 'report IPC execution helper should preserve delayed LLM-result capture.');
assert.match(moduleSource, /llmResult = await callReportLlmWithProgress\(\{/, 'report IPC execution helper should preserve request-AI progress-wrapped provider calls.');
assert.match(moduleSource, /const result = await runReport\(async \(messages\) => \{/, 'report IPC execution helper should preserve injected report-writer execution.');
assert.match(moduleSource, /return finalizeReportResult\(\{/, 'report IPC execution helper should preserve shared result finalization.');

for (const source of [weekly, monthly]) {
  assert.match(source, /from '\.\/aiReviewReportIpcExecution'/, 'weekly/monthly report IPC modules should import the shared report execution helper.');
  assert.match(source, /return executeReportGeneration\(\{/, 'weekly/monthly report IPC modules should delegate their execution/finalization tail through the shared helper.');
  assert.doesNotMatch(source, /let llmResult: LlmResult \| undefined/, 'weekly/monthly report IPC modules should not keep inline LLM-result capture after execution-helper extraction.');
  assert.doesNotMatch(source, /llmResult = await callReportLlmWithProgress\(\{/, 'weekly/monthly report IPC modules should not keep inline request-AI progress-wrapped provider calls after execution-helper extraction.');
  assert.doesNotMatch(source, /return finalizeReportResult\(\{/, 'weekly/monthly report IPC modules should not keep inline final result assembly after execution-helper extraction.');
}

assert.match(weekly, /reportKind:\s*'weekly'/, 'weekly report IPC module should pass weekly report kind to the shared execution helper.');
assert.match(weekly, /waitMessage:\s*WAIT_WEEKLY_REPORT_MESSAGE/, 'weekly report IPC module should pass weekly wait progress text to the shared execution helper.');
assert.match(weekly, /receivedMessage:\s*RECEIVED_WEEKLY_REPORT_MESSAGE/, 'weekly report IPC module should pass weekly received progress text to the shared execution helper.');
assert.match(weekly, /writtenMessage:\s*WEEKLY_WRITTEN_MESSAGE/, 'weekly report IPC module should pass weekly written progress text to the shared execution helper.');
assert.match(weekly, /runReport:\s*async \(callLlm\) => generatePersonalWeekly\(\{/, 'weekly report IPC module should preserve weekly report generation inside the shared execution helper callback.');
assert.match(weekly, /callLlm,\s*\n\s*\}\)/s, 'weekly report IPC module should forward the shared execution helper caller to the weekly report writer.');

assert.match(monthly, /reportKind:\s*'monthly'/, 'monthly report IPC module should pass monthly report kind to the shared execution helper.');
assert.match(monthly, /waitMessage:\s*WAIT_MONTHLY_REPORT_MESSAGE/, 'monthly report IPC module should pass monthly wait progress text to the shared execution helper.');
assert.match(monthly, /receivedMessage:\s*RECEIVED_MONTHLY_REPORT_MESSAGE/, 'monthly report IPC module should pass monthly received progress text to the shared execution helper.');
assert.match(monthly, /writtenMessage:\s*MONTHLY_WRITTEN_MESSAGE/, 'monthly report IPC module should pass monthly written progress text to the shared execution helper.');
assert.match(monthly, /runReport:\s*async \(callLlm\) => generatePersonalMonthly\(\{/, 'monthly report IPC module should preserve monthly report generation inside the shared execution helper callback.');
assert.match(monthly, /callLlm,\s*\n\s*\}\)/s, 'monthly report IPC module should forward the shared execution helper caller to the monthly report writer.');

const executionHelper = await import('../electron/aiReviewReportIpcExecution');

const successEvents: any[] = [];
const successDiagnostics: any[] = [];
const successResult = await executionHelper.executeReportGeneration({
  reportKind: 'weekly',
  callLlm: async () => ({ ok: true as const, content: 'draft' }),
  emitAiReviewProgress: (...args: any[]) => successEvents.push(args),
  waitMessage: 'waiting',
  receivedMessage: 'received',
  writtenMessage: 'written',
  startedAt: 123,
  resolution: { source: 'default' } as any,
  stages: [{ key: 'prepareMaterials', label: 'Prepare', status: 'completed', message: 'done' }],
  sourceChars: 99,
  createDiagnostic: (params: any) => {
    successDiagnostics.push(params);
    return { id: 'success-diagnostic' };
  },
  runReport: async (callLlm: any) => {
    const llm = await callLlm([{ role: 'user', content: 'hello' }]);
    return llm.ok ? { ok: true, filePath: 'weekly.md' } : { ok: false, error: llm.error };
  },
});
assert.deepEqual(
  successEvents.map((event) => [event[0], event[1], event[3], event[4]]),
  [
    ['weekly', 'requestAi', 'running', 'waiting'],
    ['weekly', 'requestAi', 'completed', 'received'],
    ['weekly', 'writeObsidian', 'completed', 'written'],
  ],
  'report IPC execution helper should preserve request/write progress sequencing for successful report generation.',
);
assert.deepEqual(
  successDiagnostics,
  [{
    reportKind: 'weekly',
    startedAt: 123,
    finalStatus: 'completed',
    resolution: { source: 'default' },
    stages: [{ key: 'prepareMaterials', label: 'Prepare', status: 'completed', message: 'done' }],
    llmResults: [{ ok: true, content: 'draft' }],
    sourceChars: 99,
    error: undefined,
  }],
  'report IPC execution helper should preserve diagnostic construction for successful report generation.',
);
assert.deepEqual(
  successResult,
  { ok: true, filePath: 'weekly.md', diagnostic: { id: 'success-diagnostic' } },
  'report IPC execution helper should return successful results with diagnostics attached.',
);

const failedEvents: any[] = [];
const failedDiagnostics: any[] = [];
const failedResult = await executionHelper.executeReportGeneration({
  reportKind: 'monthly',
  callLlm: async () => ({ ok: false as const, error: 'provider failed' }),
  emitAiReviewProgress: (...args: any[]) => failedEvents.push(args),
  waitMessage: 'waiting monthly',
  receivedMessage: 'received monthly',
  writtenMessage: 'written monthly',
  startedAt: 456,
  stages: [],
  sourceChars: 12,
  createDiagnostic: (params: any) => {
    failedDiagnostics.push(params);
    return { id: 'failed-diagnostic' };
  },
  runReport: async (callLlm: any) => {
    const llm = await callLlm([{ role: 'user', content: 'hello' }]);
    return llm.ok ? { ok: true, filePath: 'monthly.md' } : { ok: false, error: llm.error };
  },
});
assert.deepEqual(
  failedEvents.map((event) => [event[0], event[1], event[3], event[4]]),
  [
    ['monthly', 'requestAi', 'running', 'waiting monthly'],
    ['monthly', 'requestAi', 'failed', 'provider failed'],
    ['monthly', 'writeObsidian', 'failed', 'provider failed'],
  ],
  'report IPC execution helper should preserve request/write progress sequencing for failed report generation.',
);
assert.deepEqual(
  failedDiagnostics,
  [{
    reportKind: 'monthly',
    startedAt: 456,
    finalStatus: 'providerFailed',
    resolution: undefined,
    stages: [],
    llmResults: [{ ok: false, error: 'provider failed' }],
    sourceChars: 12,
    error: 'provider failed',
  }],
  'report IPC execution helper should preserve diagnostic construction for failed report generation.',
);
assert.deepEqual(
  failedResult,
  { ok: false, error: 'provider failed', diagnostic: { id: 'failed-diagnostic' } },
  'report IPC execution helper should return failed results with diagnostics attached.',
);

assert.equal(
  scripts['verify:electron-ai-review-report-ipc-execution-module'],
  'tsx scripts/verify-electron-ai-review-report-ipc-execution-module.ts',
  'package.json should expose the focused AI Review report IPC execution helper verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-report-ipc-execution-module', 'cleanup-core should include the focused AI Review report IPC execution helper verifier.');

console.log('electron AI Review report IPC execution helper verification passed');
