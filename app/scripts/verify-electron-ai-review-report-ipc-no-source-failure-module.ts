import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewReportIpcNoSourceFailure.ts');
const sourcePreparationPath = join(root, 'electron', 'aiReviewReportIpcSourcePreparation.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review report IPC no-source failure helper module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const sourcePreparation = readFileSync(sourcePreparationPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /export type FailReportForNoSourceMaterialsOptions\b/, 'report IPC no-source failure helper should export explicit options.');
assert.match(moduleSource, /export function failReportForNoSourceMaterials\b/, 'report IPC no-source failure helper should export failReportForNoSourceMaterials.');
assert.match(moduleSource, /emitAiReviewProgress\(reportKind, 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'failed', NO_SOURCE_MATERIALS_ERROR\.zh\)/, 'report IPC no-source failure helper should preserve failed prepare-materials progress emission.');
assert.match(moduleSource, /finalStatus:\s*'noSourceMaterials'/, 'report IPC no-source failure helper should preserve the no-source-materials diagnostic status.');
assert.match(moduleSource, /error:\s*NO_SOURCE_MATERIALS_ERROR\.zh/, 'report IPC no-source failure helper should preserve the no-source-materials error text.');
assert.match(moduleSource, /return createReportFailureResult\(\{/, 'report IPC no-source failure helper should preserve failure-result assembly through the shared failure helper.');

assert.match(sourcePreparation, /from '\.\/aiReviewReportIpcNoSourceFailure'/, 'report source-preparation helper should import the shared report no-source failure helper.');
assert.match(sourcePreparation, /result:\s*failReportForNoSourceMaterials\(\{/, 'report source-preparation helper should route no-source-materials failures through the shared helper.');
assert.doesNotMatch(sourcePreparation, /emitAiReviewProgress\(\s*reportKind,\s*'prepareMaterials',\s*PREPARE_MATERIALS_LABEL,\s*'failed',\s*NO_SOURCE_MATERIALS_ERROR\.zh\s*\)/, 'report source-preparation helper should not keep inline failed prepare-materials progress for no-source-materials outside the shared helper.');
assert.doesNotMatch(sourcePreparation, /finalStatus:\s*'noSourceMaterials'/, 'report source-preparation helper should not keep inline no-source-materials final status outside the shared helper.');

const noSourceFailure = await import('../electron/aiReviewReportIpcNoSourceFailure');
const { NO_SOURCE_MATERIALS_ERROR } = await import('../shared/aiReview/sourceMaterials');
const { PREPARE_MATERIALS_LABEL } = await import('../electron/aiReviewIpcMessages');

const events: any[] = [];
const diagnosticCalls: any[] = [];
const resolution = { source: 'default' } as any;
const result = noSourceFailure.failReportForNoSourceMaterials({
  reportKind: 'weekly',
  startedAt: 123,
  resolution,
  stages: [{ key: 'prepareMaterials', label: 'Prepare', status: 'completed', message: 'done' }],
  sourceChars: 88,
  emitAiReviewProgress: (...args: any[]) => events.push(args),
  createDiagnostic: (params: any) => {
    diagnosticCalls.push(params);
    return { id: 'no-source-diagnostic' };
  },
});

assert.deepEqual(
  events,
  [['weekly', 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'failed', NO_SOURCE_MATERIALS_ERROR.zh]],
  'report IPC no-source failure helper should emit failed prepare-materials progress.',
);
assert.deepEqual(
  diagnosticCalls,
  [{
    reportKind: 'weekly',
    startedAt: 123,
    finalStatus: 'noSourceMaterials',
    resolution,
    stages: [{ key: 'prepareMaterials', label: 'Prepare', status: 'completed', message: 'done' }],
    sourceChars: 88,
    error: NO_SOURCE_MATERIALS_ERROR.zh,
  }],
  'report IPC no-source failure helper should preserve the no-source-materials diagnostic payload.',
);
assert.deepEqual(
  result,
  { ok: false, error: NO_SOURCE_MATERIALS_ERROR.zh, diagnostic: { id: 'no-source-diagnostic' } },
  'report IPC no-source failure helper should preserve the no-source-materials failed result shape.',
);

assert.equal(
  scripts['verify:electron-ai-review-report-ipc-no-source-failure-module'],
  'tsx scripts/verify-electron-ai-review-report-ipc-no-source-failure-module.ts',
  'package.json should expose the focused AI Review report IPC no-source failure helper verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-report-ipc-no-source-failure-module', 'cleanup-core should include the focused AI Review report IPC no-source failure helper verifier.');

console.log('electron AI Review report IPC no-source failure helper verification passed');
