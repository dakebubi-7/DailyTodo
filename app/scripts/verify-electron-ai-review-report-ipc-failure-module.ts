import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewReportIpcFailure.ts');
const noSourcePath = join(root, 'electron', 'aiReviewReportIpcNoSourceFailure.ts');
const preflightPath = join(root, 'electron', 'aiReviewReportIpcPreflight.ts');
const weeklyPath = join(root, 'electron', 'aiReviewWeeklyReportIpc.ts');
const monthlyPath = join(root, 'electron', 'aiReviewMonthlyReportIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review report IPC failure helper module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const noSource = existsSync(noSourcePath) ? readFileSync(noSourcePath, 'utf8') : '';
const preflight = readFileSync(preflightPath, 'utf8');
const weekly = readFileSync(weeklyPath, 'utf8');
const monthly = readFileSync(monthlyPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /export type AiReviewReportFailureFinalStatus\b/, 'report IPC failure helper should export the supported failure-status union.');
assert.match(moduleSource, /export type CreateReportFailureResultOptions\b/, 'report IPC failure helper should export explicit options.');
assert.match(moduleSource, /export function createReportFailureResult\b/, 'report IPC failure helper should export createReportFailureResult.');
assert.match(moduleSource, /stages:\s*stages \?\? \[\]/, 'report IPC failure helper should default missing stages to an empty list.');
assert.match(moduleSource, /return \{ ok: false, error, diagnostic \}/, 'report IPC failure helper should preserve the failed result return shape.');

assert.match(preflight, /from '\.\/aiReviewReportIpcFailure'/, 'report IPC preflight helper should import the shared report failure helper.');
assert.equal(
  (preflight.match(/createReportFailureResult\(\{/g) ?? []).length,
  2,
  'report IPC preflight helper should route account-unavailable and write-failed early branches through the shared report failure helper.',
);
assert.match(noSource, /from '\.\/aiReviewReportIpcFailure'/, 'report IPC no-source failure helper should import the shared report failure helper.');
assert.equal(
  (noSource.match(/createReportFailureResult\(\{/g) ?? []).length,
  1,
  'report IPC no-source failure helper should route the no-source-materials early branch through the shared report failure helper.',
);

for (const source of [weekly, monthly]) {
  assert.equal(
    (source.match(/return createReportFailureResult\(\{/g) ?? []).length,
    0,
    'weekly/monthly report IPC modules should not keep inline failure-result assembly after no-source failure helper extraction.',
  );
}

const failureHelper = await import('../electron/aiReviewReportIpcFailure');
const resolution = { source: 'default' } as any;

const explicitCalls: any[] = [];
const explicitResult = failureHelper.createReportFailureResult({
  reportKind: 'weekly',
  startedAt: 123,
  finalStatus: 'noSourceMaterials',
  resolution,
  createDiagnostic: (params: any) => {
    explicitCalls.push(params);
    return { id: 'diagnostic-a' };
  },
  stages: [{ key: 'prepareMaterials', label: 'Prepare', status: 'failed', message: 'missing' }],
  sourceChars: 42,
  error: 'missing materials',
});
assert.deepEqual(
  explicitResult,
  { ok: false, error: 'missing materials', diagnostic: { id: 'diagnostic-a' } },
  'report IPC failure helper should return the diagnostic alongside the failed result.',
);
assert.deepEqual(
  explicitCalls,
  [{
    reportKind: 'weekly',
    startedAt: 123,
    finalStatus: 'noSourceMaterials',
    resolution,
    stages: [{ key: 'prepareMaterials', label: 'Prepare', status: 'failed', message: 'missing' }],
    sourceChars: 42,
    error: 'missing materials',
  }],
  'report IPC failure helper should forward explicit diagnostic fields unchanged.',
);

const defaultStageCalls: any[] = [];
failureHelper.createReportFailureResult({
  reportKind: 'monthly',
  startedAt: 456,
  finalStatus: 'writeFailed',
  createDiagnostic: (params: any) => {
    defaultStageCalls.push(params);
    return { id: 'diagnostic-b' };
  },
  error: 'vault unavailable',
});
assert.deepEqual(
  defaultStageCalls,
  [{
    reportKind: 'monthly',
    startedAt: 456,
    finalStatus: 'writeFailed',
    resolution: undefined,
    stages: [],
    sourceChars: undefined,
    error: 'vault unavailable',
  }],
  'report IPC failure helper should default optional stages to an empty list while preserving optional fields.',
);

assert.equal(
  scripts['verify:electron-ai-review-report-ipc-failure-module'],
  'tsx scripts/verify-electron-ai-review-report-ipc-failure-module.ts',
  'package.json should expose the focused AI Review report IPC failure helper verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-report-ipc-failure-module', 'cleanup-core should include the focused AI Review report IPC failure helper verifier.');

console.log('electron AI Review report IPC failure helper verification passed');
