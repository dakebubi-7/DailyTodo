import assert from 'node:assert/strict';
import fs, { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';
import { createAiReviewDailyRunner } from '../electron/aiReviewDailyRunner';
import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';
import type { AiReviewProfileResolution } from '../shared/aiReview/aiReviewSettings';
import type { AiReviewRunDiagnostic, AiReviewRunFinalStatus, AiReviewStageDiagnostic } from '../shared/aiReview/runDiagnostics';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/aiReviewDailyRunner.ts');
const inspectionModulePath = join(root, 'electron/aiReviewDailyContentInspection.ts');
const servicesPath = join(root, 'electron/mainAiReviewServices.ts');
const mainPath = join(root, 'electron/main.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI daily review runner module should exist.');
assert.ok(existsSync(inspectionModulePath), 'Electron AI daily content inspection module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const inspectionHelper = readFileSync(inspectionModulePath, 'utf8');
const services = readFileSync(servicesPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /from '\.\/aiReviewDailyContentInspection'/, 'AI daily review runner should compose the focused daily content inspector.');
assert.match(helper, /runReviewForFile/, 'AI daily review runner module should own daily review file execution.');
assert.match(helper, /export function createAiReviewDailyRunner\b/, 'AI daily review runner module should export a helper factory.');
assert.match(helper, /function inspectDailyAiContent\b/, 'AI daily review runner module should own daily inspection.');
assert.match(helper, /async function runReviewForDate\b/, 'AI daily review runner module should own daily review orchestration.');
assert.match(inspectionHelper, /import fs from 'fs'/, 'AI daily content inspection module should own daily file reads.');
assert.match(inspectionHelper, /hasManagedAiContent/, 'AI daily content inspection module should own managed-content inspection.');
assert.match(inspectionHelper, /hasAiContent: false, filePath, error:/, 'AI daily content inspection module should preserve safe inspection fallback on read errors.');
assert.match(helper, /if \(inspection\.error\)/, 'AI daily review runner module should preserve structured daily inspection failures.');
assert.match(helper, /读取日记失败/, 'AI daily review runner module should preserve user-facing daily inspection read errors.');
assert.match(helper, /progress\.record\('buildPrompt'/, 'AI daily review runner module should preserve buildPrompt diagnostics through the shared progress recorder.');
assert.match(helper, /progress\.record\('writeObsidian'/, 'AI daily review runner module should preserve writeObsidian diagnostics through the shared progress recorder.');
assert.match(helper, /progress\.record\('confirmResult'/, 'AI daily review runner module should preserve confirmResult diagnostics through the shared progress recorder.');
assert.match(helper, /sourceChars/, 'AI daily review runner module should preserve source character diagnostics.');
assert.match(helper, /initialSnapshot: inspection\.snapshot/, 'AI daily review runner should reuse its inspected file snapshot for review execution.');
assert.match(inspectionHelper, /beforeRead\.size !== afterRead\.size \|\| beforeRead\.mtimeMs !== afterRead\.mtimeMs/, 'AI daily content inspection should reject snapshots changed during inspection.');
assert.match(helper, /force,/, 'AI daily review runner module should forward force into runReviewForFile.');
assert.doesNotMatch(
  helper,
  /tasks:\s*tasks as StatTask\[\]/,
  'AI daily review runner should pass already-validated Electron tasks without casting them to StatTask[].',
);

assert.match(services, /from '\.\/aiReviewDailyRunner'/, 'services composition should import AI daily review helpers.');
assert.match(services, /createAiReviewDailyRunner\(\{/, 'services composition should create AI daily review helpers through the module.');
assert.match(services, /getDailyFilePath,/, 'services composition should pass daily file path access into the AI daily review helper.');
assert.match(services, /getTemplates: getObsidianTemplateSettings,/, 'services composition should pass template access into the AI daily review helper.');
assert.match(services, /getReviewSections,/, 'services composition should pass review sections into the AI daily review helper.');
assert.match(services, /ensureReportLlmAvailable,/, 'services composition should pass runtime account checks into the AI daily review helper.');
assert.match(services, /emitAiReviewProgress,/, 'services composition should pass staged progress emission into the AI daily review helper.');
assert.match(services, /stage,/, 'services composition should pass diagnostic stage creation into the AI daily review helper.');
assert.match(services, /createDiagnostic,/, 'services composition should pass diagnostic assembly into the AI daily review helper.');
assert.match(main, /from '\.\/mainAiReviewServices'/, 'main should delegate daily review wiring to the AI review services composition.');

for (const movedFunction of ['inspectDailyAiContent', 'runReviewForDate']) {
  const declarationPattern = new RegExp(`function ${movedFunction}\\b|async function ${movedFunction}\\b`);
  assert.doesNotMatch(main, declarationPattern, `main should not keep ${movedFunction} inline after extraction.`);
}

assert.equal(
  scripts['verify:electron-ai-review-daily-runner-module'],
  'tsx scripts/verify-electron-ai-review-daily-runner-module.ts',
  'package.json should expose the focused AI daily review runner verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-daily-runner-module', 'cleanup-core should include the focused AI daily review runner verifier.');

const dailyRunnerVault = fs.mkdtempSync(join(tmpdir(), 'dailytodo-ai-daily-runner-sourcechars-'));
const dailyRunnerFilePath = join(dailyRunnerVault, '2026-05-26.md');
fs.writeFileSync(dailyRunnerFilePath, '# Daily\n\nExisting note', 'utf8');
const dailyRunnerResolution: AiReviewProfileResolution = {
  ok: true,
  profile: {
    id: 'test-profile',
    name: 'Test profile',
    provider: 'openai',
    apiKey: 'test-key',
    model: 'gpt-test',
    baseUrl: 'https://example.test',
  },
  source: 'specific',
};
const dailyRunnerStages: AiReviewStageDiagnostic[] = [];
const originalReadFileSync = fs.readFileSync;
let dailyRunnerReadCount = 0;
let dailyRunnerReadThrew = false;
let dailyRunnerResult:
  | Awaited<ReturnType<ReturnType<typeof createAiReviewDailyRunner>['runReviewForDate']>>
  | undefined;
try {
  fs.readFileSync = ((target: fs.PathOrFileDescriptor, options?: BufferEncoding | { encoding?: BufferEncoding | null; flag?: string } | null) => {
    if (String(target) === dailyRunnerFilePath) {
      dailyRunnerReadCount += 1;
      if (dailyRunnerReadCount === 2) {
        throw new Error('daily runner should not reread the daily note for sourceChars');
      }
    }
    return originalReadFileSync(target, options as never) as never;
  }) as typeof fs.readFileSync;
  const runner = createAiReviewDailyRunner({
    getDailyFilePath: () => dailyRunnerFilePath,
    getTemplates: createDefaultObsidianTemplateSettings,
    getReviewSections: () => [],
    ensureReportLlmAvailable: () => ({
      ok: true,
      callLlm: async () => ({ ok: true, content: 'unused' }),
      resolution: dailyRunnerResolution,
    }),
    emitAiReviewProgress: () => undefined,
    stage: (key, label, status, durationMs, message) => {
      const item: AiReviewStageDiagnostic = { key, label, status, durationMs, message };
      dailyRunnerStages.push(item);
      return item;
    },
    createDiagnostic: ({ reportKind, startedAt, finalStatus, resolution, stages, sourceChars, error, warning }) => ({
      runId: 'daily-sourcechars-failure',
      reportKind,
      startedAt: new Date(startedAt).toISOString(),
      finalStatus: finalStatus as AiReviewRunFinalStatus,
      profile: {
        provider: resolution?.profile?.provider ?? 'missing',
        model: resolution?.profile?.model ?? 'missing',
        profileId: resolution?.profile?.id,
        profileName: resolution?.profile?.name,
      },
      stages,
      sourceChars,
      error,
      warning,
    }) satisfies AiReviewRunDiagnostic,
  });
  dailyRunnerResult = await runner.runReviewForDate('2026-05-26', []);
} catch {
  dailyRunnerReadThrew = true;
} finally {
  fs.readFileSync = originalReadFileSync;
}
assert.equal(dailyRunnerReadThrew, false, 'daily runner should not reread the daily note after inspecting it.');
assert.equal(dailyRunnerReadCount, 1, 'daily runner should read the daily note only once per review run.');
assert.equal(dailyRunnerResult?.ok, true, 'daily runner should continue when the inspected daily note has no AI blocks to fill.');
assert.equal(
  dailyRunnerResult?.diagnostic.sourceChars,
  '# Daily\n\nExisting note'.length,
  'daily runner diagnostics should derive sourceChars from the inspected daily note content.',
);
assert.ok(
  dailyRunnerStages.some((stage) => stage.key === 'prepareMaterials' && stage.status === 'completed'),
  'daily runner should complete material preparation from the inspected daily note content.',
);

console.log('electron AI daily review runner module verification passed');
