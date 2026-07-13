import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewReportIpcLlmProgress.ts');
const executionPath = join(root, 'electron', 'aiReviewReportIpcExecution.ts');
const weeklyPath = join(root, 'electron', 'aiReviewWeeklyReportIpc.ts');
const monthlyPath = join(root, 'electron', 'aiReviewMonthlyReportIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review report IPC LLM progress module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const execution = existsSync(executionPath) ? readFileSync(executionPath, 'utf8') : '';
const weekly = readFileSync(weeklyPath, 'utf8');
const monthly = readFileSync(monthlyPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /export type CallReportLlmWithProgressOptions\b/, 'LLM progress module should export explicit options.');
assert.match(moduleSource, /export async function callReportLlmWithProgress\b/, 'LLM progress module should export callReportLlmWithProgress.');
assert.match(moduleSource, /emitAiReviewProgress\(\s*reportKind,\s*'requestAi',\s*REQUEST_AI_LABEL,\s*'running',\s*waitMessage\s*\)/s, 'LLM progress module should emit request-AI running progress before calling the provider.');
assert.match(moduleSource, /const result = await callLlm\(messages\)/, 'LLM progress module should call the injected LLM caller.');
assert.match(moduleSource, /result\.ok \? 'completed' : 'failed'/, 'LLM progress module should preserve completed/failed request-AI status mapping.');
assert.match(moduleSource, /result\.ok \? receivedMessage : result\.error/, 'LLM progress module should preserve received-message/error progress text mapping.');

assert.match(execution, /from '\.\/aiReviewReportIpcLlmProgress'/, 'report IPC execution helper should import the shared LLM progress helper.');
assert.match(execution, /llmResult = await callReportLlmWithProgress\(\{/, 'report IPC execution helper should assign LLM results through the shared progress helper.');
assert.doesNotMatch(execution, /llmResult = await callLlm\(messages\)/, 'report IPC execution helper should not bypass the shared LLM progress helper.');
for (const source of [weekly, monthly]) {
  assert.doesNotMatch(source, /llmResult = await callReportLlmWithProgress\(\{/, 'weekly/monthly report IPC modules should not keep inline LLM progress-wrapped calls after execution-helper extraction.');
  assert.doesNotMatch(source, /llmResult = await llm\.callLlm\(messages\)/, 'weekly/monthly report IPC modules should not call llm.callLlm inline after execution-helper extraction.');
}

assert.match(weekly, /reportKind:\s*'weekly'/, 'weekly report IPC module should pass weekly report kind through the shared execution helper.');
assert.match(weekly, /waitMessage:\s*WAIT_WEEKLY_REPORT_MESSAGE/, 'weekly report IPC module should pass weekly wait message through the shared execution helper.');
assert.match(weekly, /receivedMessage:\s*RECEIVED_WEEKLY_REPORT_MESSAGE/, 'weekly report IPC module should pass weekly received message through the shared execution helper.');
assert.match(monthly, /reportKind:\s*'monthly'/, 'monthly report IPC module should pass monthly report kind through the shared execution helper.');
assert.match(monthly, /waitMessage:\s*WAIT_MONTHLY_REPORT_MESSAGE/, 'monthly report IPC module should pass monthly wait message through the shared execution helper.');
assert.match(monthly, /receivedMessage:\s*RECEIVED_MONTHLY_REPORT_MESSAGE/, 'monthly report IPC module should pass monthly received message through the shared execution helper.');

const llmProgress = await import('../electron/aiReviewReportIpcLlmProgress');

const okEvents: any[] = [];
const okResult = await llmProgress.callReportLlmWithProgress({
  reportKind: 'weekly',
  messages: [{ role: 'user' as const, content: 'hello' }],
  callLlm: async () => ({ ok: true as const, content: 'draft' }),
  emitAiReviewProgress: (...args: any[]) => okEvents.push(args),
  waitMessage: 'waiting',
  receivedMessage: 'received',
});
assert.deepEqual(okResult, { ok: true, content: 'draft' }, 'LLM progress helper should return successful provider results unchanged.');
assert.deepEqual(
  okEvents.map((event) => [event[0], event[1], event[3], event[4]]),
  [
    ['weekly', 'requestAi', 'running', 'waiting'],
    ['weekly', 'requestAi', 'completed', 'received'],
  ],
  'LLM progress helper should emit running then completed progress for successful provider results.',
);

const failedEvents: any[] = [];
const failedResult = await llmProgress.callReportLlmWithProgress({
  reportKind: 'monthly',
  messages: [{ role: 'user' as const, content: 'hello' }],
  callLlm: async () => ({ ok: false as const, error: 'provider failed' }),
  emitAiReviewProgress: (...args: any[]) => failedEvents.push(args),
  waitMessage: 'waiting monthly',
  receivedMessage: 'received monthly',
});
assert.deepEqual(failedResult, { ok: false, error: 'provider failed' }, 'LLM progress helper should return failed provider results unchanged.');
assert.deepEqual(
  failedEvents.map((event) => [event[0], event[1], event[3], event[4]]),
  [
    ['monthly', 'requestAi', 'running', 'waiting monthly'],
    ['monthly', 'requestAi', 'failed', 'provider failed'],
  ],
  'LLM progress helper should emit running then failed progress for failed provider results.',
);

assert.equal(
  scripts['verify:electron-ai-review-report-ipc-llm-progress-module'],
  'tsx scripts/verify-electron-ai-review-report-ipc-llm-progress-module.ts',
  'package.json should expose the focused AI Review report IPC LLM progress verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-report-ipc-llm-progress-module', 'cleanup-core should include the focused AI Review report IPC LLM progress verifier.');

console.log('electron AI Review report IPC LLM progress module verification passed');
