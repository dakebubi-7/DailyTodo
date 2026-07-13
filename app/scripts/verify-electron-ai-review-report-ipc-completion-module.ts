import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewReportIpcCompletion.ts');
const executionPath = join(root, 'electron', 'aiReviewReportIpcExecution.ts');
const weeklyPath = join(root, 'electron', 'aiReviewWeeklyReportIpc.ts');
const monthlyPath = join(root, 'electron', 'aiReviewMonthlyReportIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review report IPC completion helper module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const execution = existsSync(executionPath) ? readFileSync(executionPath, 'utf8') : '';
const weekly = readFileSync(weeklyPath, 'utf8');
const monthly = readFileSync(monthlyPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /export type FinalizeReportResultOptions\b/, 'report IPC completion helper should export explicit options.');
assert.match(moduleSource, /export function finalizeReportResult\b/, 'report IPC completion helper should export finalizeReportResult.');
assert.match(moduleSource, /emitAiReviewProgress\(\s*reportKind,\s*'writeObsidian',\s*WRITE_OBSIDIAN_LABEL,\s*result\.ok \? 'completed' : 'failed',\s*result\.ok \? writtenMessage : result\.error\s*\)/s, 'report IPC completion helper should preserve write-Obsidian progress emission.');
assert.match(moduleSource, /finalStatus:\s*getReportFinalStatus\(result, llmResult\)/, 'report IPC completion helper should preserve final-status derivation through the shared diagnostics helper.');
assert.match(moduleSource, /llmResults:\s*getReportLlmResults\(llmResult\)/, 'report IPC completion helper should preserve diagnostic LLM-result wrapping through the shared diagnostics helper.');
assert.match(moduleSource, /return \{ \.\.\.result, diagnostic \}/, 'report IPC completion helper should preserve the final result return shape.');

assert.match(execution, /from '\.\/aiReviewReportIpcCompletion'/, 'report IPC execution helper should import the shared report completion helper.');
assert.match(execution, /return finalizeReportResult\(\{/, 'report IPC execution helper should return through the shared report completion helper.');
assert.match(weekly, /writtenMessage:\s*WEEKLY_WRITTEN_MESSAGE/, 'weekly report IPC module should pass weekly written text through the shared execution helper.');
assert.match(monthly, /writtenMessage:\s*MONTHLY_WRITTEN_MESSAGE/, 'monthly report IPC module should pass monthly written text through the shared execution helper.');
assert.doesNotMatch(weekly, /emitAiReviewProgress\(\s*'weekly',\s*'writeObsidian',\s*WRITE_OBSIDIAN_LABEL,\s*result\.ok \? 'completed' : 'failed'/s, 'weekly report IPC module should not keep inline final write progress emission after completion-helper extraction.');
assert.doesNotMatch(monthly, /emitAiReviewProgress\(\s*'monthly',\s*'writeObsidian',\s*WRITE_OBSIDIAN_LABEL,\s*result\.ok \? 'completed' : 'failed'/s, 'monthly report IPC module should not keep inline final write progress emission after completion-helper extraction.');
assert.doesNotMatch(weekly, /return finalizeReportResult\(\{/, 'weekly report IPC module should not keep inline final result assembly after execution-helper extraction.');
assert.doesNotMatch(monthly, /return finalizeReportResult\(\{/, 'monthly report IPC module should not keep inline final result assembly after execution-helper extraction.');

const completionHelper = await import('../electron/aiReviewReportIpcCompletion');
const resolution = { source: 'default' } as any;
const okEvents: any[] = [];
const okDiagnostics: any[] = [];
const okLlmResult = { ok: true as const, content: 'draft' };
const okResult = completionHelper.finalizeReportResult({
  reportKind: 'weekly',
  result: { ok: true, filePath: 'weekly.md', truncated: true },
  llmResult: okLlmResult,
  emitAiReviewProgress: (...args: any[]) => okEvents.push(args),
  writtenMessage: '周报已写入',
  startedAt: 123,
  resolution,
  stages: [{ key: 'prepareMaterials', label: 'Prepare', status: 'completed', message: 'done' }],
  sourceChars: 99,
  createDiagnostic: (params: any) => {
    okDiagnostics.push(params);
    return { id: 'weekly-diagnostic' };
  },
});
assert.deepEqual(
  okEvents.map((event) => [event[0], event[1], event[3], event[4]]),
  [['weekly', 'writeObsidian', 'completed', '周报已写入']],
  'report IPC completion helper should emit completed write progress for successful results.',
);
assert.deepEqual(
  okDiagnostics,
  [{
    reportKind: 'weekly',
    startedAt: 123,
    finalStatus: 'completedWithWarning',
    resolution,
    stages: [{ key: 'prepareMaterials', label: 'Prepare', status: 'completed', message: 'done' }],
    llmResults: [okLlmResult],
    sourceChars: 99,
    error: undefined,
  }],
  'report IPC completion helper should preserve diagnostic fields for successful/truncated results.',
);
assert.deepEqual(
  okResult,
  { ok: true, filePath: 'weekly.md', truncated: true, diagnostic: { id: 'weekly-diagnostic' } },
  'report IPC completion helper should return successful results with the diagnostic attached.',
);

const failedEvents: any[] = [];
const failedDiagnostics: any[] = [];
const failedLlmResult = { ok: false as const, error: 'provider failed' };
const failedResult = completionHelper.finalizeReportResult({
  reportKind: 'monthly',
  result: { ok: false, error: 'provider failed' },
  llmResult: failedLlmResult,
  emitAiReviewProgress: (...args: any[]) => failedEvents.push(args),
  writtenMessage: '月报已写入',
  startedAt: 456,
  stages: [],
  sourceChars: 10,
  createDiagnostic: (params: any) => {
    failedDiagnostics.push(params);
    return { id: 'monthly-diagnostic' };
  },
});
assert.deepEqual(
  failedEvents.map((event) => [event[0], event[1], event[3], event[4]]),
  [['monthly', 'writeObsidian', 'failed', 'provider failed']],
  'report IPC completion helper should emit failed write progress for failed results.',
);
assert.deepEqual(
  failedDiagnostics,
  [{
    reportKind: 'monthly',
    startedAt: 456,
    finalStatus: 'providerFailed',
    resolution: undefined,
    stages: [],
    llmResults: [failedLlmResult],
    sourceChars: 10,
    error: 'provider failed',
  }],
  'report IPC completion helper should preserve diagnostic fields for failed/provider-error results.',
);
assert.deepEqual(
  failedResult,
  { ok: false, error: 'provider failed', diagnostic: { id: 'monthly-diagnostic' } },
  'report IPC completion helper should return failed results with the diagnostic attached.',
);

assert.equal(
  scripts['verify:electron-ai-review-report-ipc-completion-module'],
  'tsx scripts/verify-electron-ai-review-report-ipc-completion-module.ts',
  'package.json should expose the focused AI Review report IPC completion helper verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-report-ipc-completion-module', 'cleanup-core should include the focused AI Review report IPC completion helper verifier.');

console.log('electron AI Review report IPC completion helper verification passed');
