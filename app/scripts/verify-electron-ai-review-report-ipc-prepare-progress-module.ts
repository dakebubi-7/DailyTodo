import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewReportIpcPrepareProgress.ts');
const sourcePreparationPath = join(root, 'electron', 'aiReviewReportIpcSourcePreparation.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review report IPC prepare-progress helper module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const sourcePreparation = readFileSync(sourcePreparationPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /export type CompleteReportPrepareMaterialsOptions\b/, 'report IPC prepare-progress helper should export explicit options.');
assert.match(moduleSource, /export function completeReportPrepareMaterials\b/, 'report IPC prepare-progress helper should export completeReportPrepareMaterials.');
assert.match(moduleSource, /const sourceCharsMessage = buildSourceCharsMessage\(sourceChars\)/, 'report IPC prepare-progress helper should preserve source-character message derivation.');
assert.match(moduleSource, /stage\('prepareMaterials', PREPARE_MATERIALS_LABEL, 'completed', Date\.now\(\) - prepareStartedAt, sourceCharsMessage\)/, 'report IPC prepare-progress helper should preserve completed prepare-materials stage construction.');
assert.match(moduleSource, /emitAiReviewProgress\(reportKind, 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'completed', sourceCharsMessage\)/, 'report IPC prepare-progress helper should preserve completed prepare-materials progress emission.');
assert.match(moduleSource, /return \{ sourceCharsMessage, stages \}/, 'report IPC prepare-progress helper should preserve returned stage/message shape.');

assert.match(sourcePreparation, /from '\.\/aiReviewReportIpcPrepareProgress'/, 'report source-preparation helper should import the shared prepare-progress helper.');
assert.match(sourcePreparation, /const \{ stages \} = completeReportPrepareMaterials\(\{/, 'report source-preparation helper should derive completed prepare-materials stage data through the shared helper.');
assert.doesNotMatch(sourcePreparation, /stage\('prepareMaterials', PREPARE_MATERIALS_LABEL, 'completed', Date\.now\(\) - prepareStartedAt, sourceCharsMessage\)/, 'report source-preparation helper should not keep inline completed prepare-materials stage construction outside the shared helper.');

const prepareProgress = await import('../electron/aiReviewReportIpcPrepareProgress');
const { buildSourceCharsMessage } = await import('../electron/aiReviewIpcHelpers');
const { PREPARE_MATERIALS_LABEL } = await import('../electron/aiReviewIpcMessages');

const realDateNow = Date.now;
Date.now = () => 1450;
try {
  const events: any[] = [];
  const stagesCreated: any[] = [];
  const result = prepareProgress.completeReportPrepareMaterials({
    reportKind: 'weekly',
    sourceChars: 12,
    prepareStartedAt: 1000,
    stage: (...args: any[]) => {
      stagesCreated.push(args);
      return { key: args[0], label: args[1], status: args[2], durationMs: args[3], message: args[4] };
    },
    emitAiReviewProgress: (...args: any[]) => events.push(args),
  });

  const expectedMessage = buildSourceCharsMessage(12);

  assert.equal(result.sourceCharsMessage, expectedMessage, 'prepare-progress helper should preserve source-character message text.');
  assert.deepEqual(
    stagesCreated,
    [['prepareMaterials', PREPARE_MATERIALS_LABEL, 'completed', 450, expectedMessage]],
    'prepare-progress helper should preserve completed stage arguments.',
  );
  assert.deepEqual(
    result.stages,
    [{ key: 'prepareMaterials', label: PREPARE_MATERIALS_LABEL, status: 'completed', durationMs: 450, message: expectedMessage }],
    'prepare-progress helper should return the created completed stage.',
  );
  assert.deepEqual(
    events,
    [['weekly', 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'completed', expectedMessage]],
    'prepare-progress helper should emit completed prepare-materials progress.',
  );
} finally {
  Date.now = realDateNow;
}

assert.equal(
  scripts['verify:electron-ai-review-report-ipc-prepare-progress-module'],
  'tsx scripts/verify-electron-ai-review-report-ipc-prepare-progress-module.ts',
  'package.json should expose the focused AI Review report IPC prepare-progress helper verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-report-ipc-prepare-progress-module', 'cleanup-core should include the focused AI Review report IPC prepare-progress helper verifier.');

console.log('electron AI Review report IPC prepare-progress helper verification passed');
