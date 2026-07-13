import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewReportIpcSourcePreparation.ts');
const weeklyPath = join(root, 'electron', 'aiReviewWeeklyReportIpc.ts');
const monthlyPath = join(root, 'electron', 'aiReviewMonthlyReportIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review report IPC source-preparation helper module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const weekly = readFileSync(weeklyPath, 'utf8');
const monthly = readFileSync(monthlyPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /export type PrepareReportSourcesOptions\b/, 'report IPC source-preparation helper should export explicit options.');
assert.match(moduleSource, /export function prepareReportSources\b/, 'report IPC source-preparation helper should export prepareReportSources.');
assert.match(moduleSource, /from '\.\/aiReviewReportIpcSourceSummary'/, 'report IPC source-preparation helper should import the shared source summary helper.');
assert.match(moduleSource, /from '\.\/aiReviewReportIpcPrepareProgress'/, 'report IPC source-preparation helper should import the shared prepare-progress helper.');
assert.match(moduleSource, /from '\.\/aiReviewReportIpcNoSourceFailure'/, 'report IPC source-preparation helper should import the shared no-source failure helper.');
assert.match(moduleSource, /const sourceChars = sumReportSourceChars\(sources\)/, 'report IPC source-preparation helper should preserve source-character summarization.');
assert.match(moduleSource, /const \{ stages \} = completeReportPrepareMaterials\(\{/, 'report IPC source-preparation helper should preserve completed prepare-materials stage/progress derivation.');
assert.match(moduleSource, /if \(!hasSourceMaterials\(sources\)\) \{\s*return \{\s*ok:\s*false,\s*result:\s*failReportForNoSourceMaterials\(\{/s, 'report IPC source-preparation helper should preserve the no-source-materials failure path.');
assert.match(moduleSource, /return \{ ok: true, sourceChars, stages \}/, 'report IPC source-preparation helper should preserve the successful prepared-source return shape.');

for (const source of [weekly, monthly]) {
  assert.match(source, /from '\.\/aiReviewReportIpcSourcePreparation'/, 'weekly/monthly report IPC modules should import the shared report source-preparation helper.');
  assert.match(source, /const sourcePreparation = prepareReportSources\(\{/, 'weekly/monthly report IPC modules should derive source preparation state through the shared helper.');
  assert.match(source, /if \(!sourcePreparation\.ok\) \{\s*return sourcePreparation\.result;\s*\}/s, 'weekly/monthly report IPC modules should return shared source-preparation failures directly.');
  assert.match(source, /const \{ sourceChars, stages \} = sourcePreparation/, 'weekly/monthly report IPC modules should preserve prepared sourceChars/stages from the shared helper.');
  assert.doesNotMatch(source, /from '\.\/aiReviewReportIpcSourceSummary'/, 'weekly/monthly report IPC modules should not import the source summary helper directly after source-preparation extraction.');
  assert.doesNotMatch(source, /from '\.\/aiReviewReportIpcPrepareProgress'/, 'weekly/monthly report IPC modules should not import the prepare-progress helper directly after source-preparation extraction.');
  assert.doesNotMatch(source, /from '\.\/aiReviewReportIpcNoSourceFailure'/, 'weekly/monthly report IPC modules should not import the no-source failure helper directly after source-preparation extraction.');
}

const sourcePreparation = await import('../electron/aiReviewReportIpcSourcePreparation');
const { buildSourceCharsMessage } = await import('../electron/aiReviewIpcHelpers');
const { PREPARE_MATERIALS_LABEL } = await import('../electron/aiReviewIpcMessages');
const { NO_SOURCE_MATERIALS_ERROR } = await import('../shared/aiReview/sourceMaterials');

const realDateNow = Date.now;
Date.now = () => 1450;
try {
  const successEvents: any[] = [];
  const successStages: any[] = [];
  const successDiagnostics: any[] = [];
  const successResult = sourcePreparation.prepareReportSources({
    reportKind: 'weekly',
    sources: [{ content: 'abc' }, { content: '任务' }],
    startedAt: 123,
    prepareStartedAt: 1000,
    resolution: { source: 'default' } as any,
    emitAiReviewProgress: (...args: any[]) => successEvents.push(args),
    stage: (...args: any[]) => {
      successStages.push(args);
      return { key: args[0], label: args[1], status: args[2], durationMs: args[3], message: args[4] };
    },
    createDiagnostic: (params: any) => {
      successDiagnostics.push(params);
      return { id: 'unused-success-diagnostic' };
    },
  });

  const successMessage = buildSourceCharsMessage(5);
  assert.deepEqual(
    successStages,
    [['prepareMaterials', PREPARE_MATERIALS_LABEL, 'completed', 450, successMessage]],
    'report IPC source-preparation helper should preserve completed prepare-materials stage construction on success.',
  );
  assert.deepEqual(
    successEvents,
    [['weekly', 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'completed', successMessage]],
    'report IPC source-preparation helper should preserve completed prepare-materials progress emission on success.',
  );
  assert.deepEqual(successDiagnostics, [], 'report IPC source-preparation helper should not construct diagnostics on successful source preparation.');
  assert.deepEqual(
    successResult,
    {
      ok: true,
      sourceChars: 5,
      stages: [{ key: 'prepareMaterials', label: PREPARE_MATERIALS_LABEL, status: 'completed', durationMs: 450, message: successMessage }],
    },
    'report IPC source-preparation helper should preserve successful prepared-source return data.',
  );

  const failureEvents: any[] = [];
  const failureStages: any[] = [];
  const failureDiagnostics: any[] = [];
  const failureResult = sourcePreparation.prepareReportSources({
    reportKind: 'monthly',
    sources: [{ content: '   ' }],
    startedAt: 456,
    prepareStartedAt: 1000,
    resolution: { source: 'profile' } as any,
    emitAiReviewProgress: (...args: any[]) => failureEvents.push(args),
    stage: (...args: any[]) => {
      failureStages.push(args);
      return { key: args[0], label: args[1], status: args[2], durationMs: args[3], message: args[4] };
    },
    createDiagnostic: (params: any) => {
      failureDiagnostics.push(params);
      return { id: 'no-source-diagnostic' };
    },
  });

  const failureMessage = buildSourceCharsMessage(3);
  assert.deepEqual(
    failureStages,
    [['prepareMaterials', PREPARE_MATERIALS_LABEL, 'completed', 450, failureMessage]],
    'report IPC source-preparation helper should preserve completed prepare-materials stage construction before no-source failure.',
  );
  assert.deepEqual(
    failureEvents,
    [
      ['monthly', 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'completed', failureMessage],
      ['monthly', 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'failed', NO_SOURCE_MATERIALS_ERROR.zh],
    ],
    'report IPC source-preparation helper should preserve completed-then-failed prepare-materials progress emission for no-source failures.',
  );
  assert.deepEqual(
    failureDiagnostics,
    [{
      reportKind: 'monthly',
      startedAt: 456,
      finalStatus: 'noSourceMaterials',
      resolution: { source: 'profile' },
      stages: [{ key: 'prepareMaterials', label: PREPARE_MATERIALS_LABEL, status: 'completed', durationMs: 450, message: failureMessage }],
      sourceChars: 3,
      error: NO_SOURCE_MATERIALS_ERROR.zh,
    }],
    'report IPC source-preparation helper should preserve no-source-materials diagnostic construction.',
  );
  assert.deepEqual(
    failureResult,
    { ok: false, result: { ok: false, error: NO_SOURCE_MATERIALS_ERROR.zh, diagnostic: { id: 'no-source-diagnostic' } } },
    'report IPC source-preparation helper should preserve no-source-materials failure return shape.',
  );
} finally {
  Date.now = realDateNow;
}

assert.equal(
  scripts['verify:electron-ai-review-report-ipc-source-preparation-module'],
  'tsx scripts/verify-electron-ai-review-report-ipc-source-preparation-module.ts',
  'package.json should expose the focused AI Review report IPC source-preparation helper verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-report-ipc-source-preparation-module', 'cleanup-core should include the focused AI Review report IPC source-preparation helper verifier.');

console.log('electron AI Review report IPC source-preparation helper verification passed');
