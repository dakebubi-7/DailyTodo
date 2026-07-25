import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { mergeTokenUsage, safeBaseUrlHost } from '../shared/aiReview/runDiagnostics';
import {
  isAiReviewRunDiagnostic,
  readAiReviewDailyInspection,
  readAiReviewBackfillReport,
  readAiReviewGenerationResult,
  readAiReviewRunDiagnostic,
} from '../shared/aiReview/runDiagnostics';
import { callChatCompletion } from '../shared/llm/openaiClient';

const runDiagnosticsSrc = fs.readFileSync(path.join(process.cwd(), 'shared/aiReview/runDiagnostics.ts'), 'utf-8');
const ipcReadersSrc = fs.readFileSync(path.join(process.cwd(), 'shared/aiReview/aiReviewIpcResultReaders.ts'), 'utf-8');
const diagnosticsValidationPath = path.join(process.cwd(), 'shared/aiReview/aiReviewDiagnosticsValidation.ts');
const unknownValueGuardsPath = path.join(process.cwd(), 'shared/unknownValueGuards.ts');
assert.ok(
  fs.existsSync(diagnosticsValidationPath),
  'unknown AI review diagnostic payload validation should live outside the shared diagnostic contract module.',
);
const diagnosticsValidationSrc = fs.readFileSync(diagnosticsValidationPath, 'utf-8');
assert.ok(fs.existsSync(unknownValueGuardsPath), 'shared unknown-value guards module should exist.');
const unknownValueGuardsSrc = fs.readFileSync(unknownValueGuardsPath, 'utf-8');
assert.match(unknownValueGuardsSrc, /export function isObjectRecord\b/, 'shared guards should expose an object-record predicate.');
for (const [source, label] of [
  [ipcReadersSrc, 'AI review IPC result readers'],
  [diagnosticsValidationSrc, 'AI review diagnostics validation'],
] as const) {
  assert.match(source, /import \{ isObjectRecord \} from '\.\.\/unknownValueGuards';/, `${label} should reuse the shared object-record predicate.`);
  assert.doesNotMatch(source, /function isObject\(/, `${label} should not keep a duplicate local object predicate.`);
}
assert.match(runDiagnosticsSrc, /from '\.\/aiReviewDiagnosticsValidation'/);
assert.match(
  runDiagnosticsSrc,
  /export function mergeTokenUsage[\s\S]*?for \(const item of items\) \{[\s\S]*?promptTokens[\s\S]*?completionTokens[\s\S]*?totalTokens/,
  'token usage aggregation should accumulate all token fields during one traversal.',
);
assert.doesNotMatch(
  runDiagnosticsSrc,
  /const usable = present\.filter[\s\S]*?const sum = [\s\S]*?usable\.map/,
  'token usage aggregation should not repeatedly filter and map the same result collection.',
);
const mainSrc = fs.readFileSync(path.join(process.cwd(), 'electron/main.ts'), 'utf-8');
const mainAiReviewServicesSrc = fs.readFileSync(path.join(process.cwd(), 'electron/mainAiReviewServices.ts'), 'utf-8');
const aiReviewRuntimeSrc = fs.readFileSync(path.join(process.cwd(), 'electron/aiReviewRuntime.ts'), 'utf-8');
const aiReviewDailyRunnerSrc = fs.readFileSync(path.join(process.cwd(), 'electron/aiReviewDailyRunner.ts'), 'utf-8');
const aiReviewDailyProgressSrc = fs.readFileSync(path.join(process.cwd(), 'electron/aiReviewDailyProgress.ts'), 'utf-8');
const aiReviewIpcSrc = fs.readFileSync(path.join(process.cwd(), 'electron/aiReviewIpc.ts'), 'utf-8');
const aiReviewWeeklyReportIpcSrc = fs.readFileSync(path.join(process.cwd(), 'electron/aiReviewWeeklyReportIpc.ts'), 'utf-8');
const aiReviewMonthlyReportIpcSrc = fs.readFileSync(path.join(process.cwd(), 'electron/aiReviewMonthlyReportIpc.ts'), 'utf-8');

const base = { baseUrl: 'https://relay.example/v1', apiKey: 'secret-key-must-not-leak', model: 'm' };
const messages = [{ role: 'user' as const, content: 'hi' }];
const jsonRes = (obj: unknown) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  text: async () => JSON.stringify(obj),
});

assert.equal(safeBaseUrlHost('https://relay.example/v1?token=secret'), 'relay.example', 'baseUrl host strips path/query');
assert.equal(safeBaseUrlHost('not a url'), undefined, 'invalid baseUrl host is undefined');

const openai = await callChatCompletion(base, messages, {
  provider: 'openai',
  fetchImpl: (async () => jsonRes({ choices: [{ message: { content: 'ok' } }], usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 } })) as unknown as typeof fetch,
});
assert.equal(openai.ok, true);
assert.equal(openai.ok && openai.diagnostics?.provider, 'openai');
assert.equal(openai.ok && openai.diagnostics?.usage?.source, 'openai');
assert.equal(openai.ok && openai.diagnostics?.usage?.totalTokens, 12);
assert.ok(openai.ok && typeof openai.diagnostics?.durationMs === 'number');
assert.ok(!JSON.stringify(openai).includes('secret-key-must-not-leak'), 'LLM diagnostics must not echo API Key');

const merged = mergeTokenUsage([
  { source: 'openai', promptTokens: 1, completionTokens: 2, totalTokens: 3 },
  { source: 'openai', promptTokens: 4, completionTokens: 5, totalTokens: 9 },
]);
assert.deepEqual(merged, { source: 'openai', promptTokens: 5, completionTokens: 7, totalTokens: 12 }, 'usage merges totals for daily multi-block runs');
assert.deepEqual(mergeTokenUsage([{ source: 'missing' }]), { source: 'missing' }, 'missing usage stays missing');

const validDiagnostic = {
  runId: 'daily-abc',
  reportKind: 'daily',
  startedAt: '2026-07-12T01:00:00.000Z',
  finalStatus: 'completed',
  profile: {
    provider: 'openai',
    model: 'gpt-test',
  },
  stages: [
    {
      key: 'prepareMaterials',
      label: 'prepare',
      status: 'completed',
    },
  ],
};
assert.equal(isAiReviewRunDiagnostic(validDiagnostic), true, 'valid run diagnostics should pass the runtime guard');
assert.equal(
  isAiReviewRunDiagnostic({ ...validDiagnostic, finalStatus: 'nope' }),
  false,
  'run diagnostics with invalid finalStatus should fail the runtime guard',
);
assert.deepEqual(
  readAiReviewRunDiagnostic({ ok: true, diagnostic: validDiagnostic }),
  validDiagnostic,
  'readAiReviewRunDiagnostic should return validated diagnostics from generation results',
);
assert.equal(
  readAiReviewRunDiagnostic({ ok: true, diagnostic: { runId: 1 } }),
  undefined,
  'readAiReviewRunDiagnostic should ignore malformed diagnostic payloads',
);
assert.equal(
  readAiReviewRunDiagnostic({ ok: true }),
  undefined,
  'readAiReviewRunDiagnostic should tolerate results without diagnostics',
);

const validGeneration = {
  ok: true,
  filePath: 'C:/notes/week.md',
  truncated: false,
  filledMarkers: ['REVIEW'],
  skippedMarkers: [],
  diagnostic: validDiagnostic,
};
assert.deepEqual(
  readAiReviewGenerationResult(validGeneration),
  {
    ok: true,
    filePath: 'C:/notes/week.md',
    truncated: false,
    filledMarkers: ['REVIEW'],
    skippedMarkers: [],
  },
  'readAiReviewGenerationResult should admit valid generation result fields',
);
assert.equal(
  readAiReviewGenerationResult({ ok: 'yes' }),
  undefined,
  'readAiReviewGenerationResult should reject non-boolean ok',
);
assert.equal(
  readAiReviewGenerationResult(null),
  undefined,
  'readAiReviewGenerationResult should reject non-objects',
);
assert.deepEqual(
  readAiReviewGenerationResult({ ok: false, error: 'boom' }),
  { ok: false, error: 'boom' },
  'readAiReviewGenerationResult should preserve failure error strings',
);

assert.deepEqual(
  readAiReviewDailyInspection({ exists: true, hasAiContent: true, filePath: 'C:/daily.md' }),
  { exists: true, hasAiContent: true, filePath: 'C:/daily.md' },
  'readAiReviewDailyInspection should admit valid inspection payloads',
);
assert.equal(
  readAiReviewDailyInspection({ exists: true, hasAiContent: 'yes', filePath: 'x' }),
  undefined,
  'readAiReviewDailyInspection should reject non-boolean hasAiContent',
);

assert.deepEqual(
  readAiReviewBackfillReport({
    processed: ['2026-07-11'],
    filled: ['2026-07-11'],
    errors: [{ date: '2026-07-10', error: 'missing file' }],
  }),
  {
    processed: ['2026-07-11'],
    filled: ['2026-07-11'],
    errors: [{ date: '2026-07-10', error: 'missing file' }],
  },
);
assert.equal(
  readAiReviewBackfillReport({ processed: ['x'], filled: ['y'], errors: [{ date: 1, error: 'bad' }] }),
  undefined,
  'readAiReviewBackfillReport should reject malformed error entries',
);
assert.equal(readAiReviewBackfillReport(null), undefined, 'readAiReviewBackfillReport should reject non-objects');



assert.ok(runDiagnosticsSrc.includes("| 'inspectDaily'"), 'runDiagnostics stage key union includes inspectDaily');

assert.ok(mainSrc.includes('createMainAiReviewServices({'), 'main process should compose the dedicated AI review services module');
assert.ok(mainAiReviewServicesSrc.includes('createAiReviewRuntimeHelpers({'), 'AI review services should delegate runtime wiring through aiReviewRuntime helpers');
assert.ok(mainAiReviewServicesSrc.includes('createAiReviewDailyRunner({'), 'AI review services should delegate daily orchestration through aiReviewDailyRunner');
assert.ok(aiReviewRuntimeSrc.includes('createDiagnostic'), 'AI review runtime module builds AI run diagnostics');
assert.ok(aiReviewRuntimeSrc.includes('emitAiReviewProgress'), 'AI review runtime module emits staged progress');
assert.ok(aiReviewRuntimeSrc.includes("'aiReview:progress'"), 'AI review runtime module sends progress IPC event');
assert.ok(aiReviewWeeklyReportIpcSrc.includes("reportKind: 'weekly'"), 'weekly diagnostics are wired');
assert.ok(aiReviewMonthlyReportIpcSrc.includes("reportKind: 'monthly'"), 'monthly diagnostics are wired');
assert.ok(aiReviewDailyRunnerSrc.includes("reportKind: 'daily'"), 'daily diagnostics are wired');
assert.ok(aiReviewDailyRunnerSrc.includes('createDailyAiReviewProgress'), 'daily runner should compose the dedicated progress helper.');
assert.ok(aiReviewDailyProgressSrc.includes("buildPrompt: '提交提示词'"), 'daily progress helper should own the buildPrompt stage label.');
assert.ok(aiReviewDailyProgressSrc.includes("writeObsidian: '写入 Obsidian'"), 'daily progress helper should own the writeObsidian stage label.');
assert.ok(aiReviewDailyProgressSrc.includes("confirmResult: '确认结果'"), 'daily progress helper should own the confirmResult stage label.');
assert.ok(aiReviewDailyRunnerSrc.includes('sourceChars'), 'daily diagnostics include source character count');
assert.ok(
  aiReviewWeeklyReportIpcSrc.includes('sourceChars') || aiReviewMonthlyReportIpcSrc.includes('sourceChars') || aiReviewIpcSrc.includes('sourceChars'),
  'weekly/monthly diagnostics include source character count',
);
assert.ok(!aiReviewRuntimeSrc.includes('apiKey:' + ' resolution'), 'daily diagnostic code must not copy apiKey');
assert.ok(!aiReviewIpcSrc.includes('apiKey:' + ' resolution'), 'report diagnostic code must not copy apiKey');

const preloadSrc = fs.readFileSync(path.join(process.cwd(), 'electron/preload.ts'), 'utf-8');
assert.ok(preloadSrc.includes('onProgress'), 'preload exposes progress subscription');
assert.ok(preloadSrc.includes('aiReview:progress'), 'preload listens to progress IPC event');
const viteEnvSrc = fs.readFileSync(path.join(process.cwd(), 'src/vite-env.d.ts'), 'utf-8');
assert.match(
  preloadSrc,
  /onProgress:\s*\(callback:\s*\(payload:\s*unknown\)\s*=>\s*void\)\s*=>\s*\{/,
  'preload onProgress should expose unknown runtime progress payloads.',
);
assert.match(
  viteEnvSrc,
  /onProgress:\s*\(callback:\s*\(payload:\s*unknown\)\s*=>\s*void\)\s*=>\s*\(\)\s*=>\s*void/,
  'onProgress should expose unknown progress payloads at the ambient preload boundary.',
);
assert.doesNotMatch(
  viteEnvSrc,
  /onProgress:\s*\(callback:\s*\(payload:\s*import\('\.\.\/shared\/aiReview\/runDiagnostics'\)\.AiReviewProgressEvent\)\s*=>\s*void\)/,
  'vite-env should not claim AI review progress payloads are already trusted progress events.',
);
assert.match(
  diagnosticsValidationSrc,
  /export function isAiReviewProgressEvent\(value:\s*unknown\):\s*value is AiReviewProgressEvent/,
  'the diagnostic validation module should export a runtime guard for AI review progress events.',
);
assert.ok(
  !/export function isAiReviewProgressEvent[\s\S]*?const candidate = value as Record<string, unknown>;[\s\S]*?const AI_REVIEW_FINAL_STATUSES/.test(diagnosticsValidationSrc),
  'isAiReviewProgressEvent should narrow runtime objects with isObject(...) instead of casting to Record<string, unknown>.',
);
assert.match(
  diagnosticsValidationSrc,
  /export function isAiReviewRunDiagnostic\(value:\s*unknown\):\s*value is AiReviewRunDiagnostic/,
  'the diagnostic validation module should export a runtime guard for AI review run diagnostics.',
);
assert.match(
  diagnosticsValidationSrc,
  /export function readAiReviewRunDiagnostic\(result:\s*unknown\):\s*AiReviewRunDiagnostic \| undefined/,
  'the diagnostic validation module should export a helper that reads optional diagnostics from unknown generation results.',
);

const settingsPanelSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/SettingsPanel.tsx'), 'utf-8');
const settingsPanelStateSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/settings/useAiReviewSettingsPanelState.ts'), 'utf-8');
const aiReviewGenerationSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/settings/useAiReviewGeneration.ts'), 'utf-8');
assert.ok(
  /runForDate:[\s\S]*Promise<unknown>/.test(viteEnvSrc),
  'ambient runForDate should return Promise<unknown>',
);
assert.ok(
  /generateWeekly:[\s\S]*Promise<unknown>/.test(viteEnvSrc),
  'ambient generateWeekly should return Promise<unknown>',
);
assert.ok(
  /generateMonthly:[\s\S]*Promise<unknown>/.test(viteEnvSrc),
  'ambient generateMonthly should return Promise<unknown>',
);
assert.ok(
  /generateExternal:[\s\S]*Promise<unknown>/.test(viteEnvSrc),
  'ambient generateExternal should return Promise<unknown>',
);
assert.ok(
  /inspectDaily:[\s\S]*Promise<unknown>/.test(viteEnvSrc),
  'ambient inspectDaily should return Promise<unknown>',
);
assert.ok(
  /backfill:[\s\S]*Promise<unknown>/.test(viteEnvSrc),
  'ambient backfill should return Promise<unknown>',
);
assert.ok(
  !viteEnvSrc.includes("diagnostic?: import('../shared/aiReview/runDiagnostics').AiReviewRunDiagnostic"),
  'ambient generation returns should not claim trusted diagnostic objects',
);
assert.ok(
  aiReviewGenerationSrc.includes('readAiReviewGenerationResult'),
  'AI review generation hook should parse generation results with readAiReviewGenerationResult',
);
assert.ok(
  aiReviewGenerationSrc.includes('readAiReviewDailyInspection'),
  'AI review generation hook should parse daily inspections with readAiReviewDailyInspection',
);
assert.match(
  runDiagnosticsSrc,
  /export function readAiReviewGenerationResult\(value:\s*unknown\)/,
  'runDiagnostics should export a generation-result reader for unknown IPC returns',
);
assert.match(runDiagnosticsSrc, /aiReviewIpcResultReaders/, 'runDiagnostics should delegate IPC return readers to a dedicated module');
assert.match(ipcReadersSrc, /export function readGenerationResult\b/, 'IPC reader module should own generation-result parsing');
assert.match(ipcReadersSrc, /export function readDailyInspection\b/, 'IPC reader module should own daily-inspection parsing');
assert.match(ipcReadersSrc, /export function readBackfillReport\b/, 'IPC reader module should own backfill parsing');
assert.match(
  runDiagnosticsSrc,
  /export function readAiReviewDailyInspection\(value:\s*unknown\)/,
  'runDiagnostics should export a daily-inspection reader for unknown IPC returns',
);

assert.match(
  runDiagnosticsSrc,
  /export function readAiReviewBackfillReport\(value:\s*unknown\)/,
  'runDiagnostics should export readAiReviewBackfillReport',
);

const aiReviewManualGenerationSectionSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/settings/AiReviewManualGenerationSection.tsx'), 'utf-8');
const aiReviewPresentationSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/settings/AiReviewGenerationPresentation.tsx'), 'utf-8');
assert.ok(settingsPanelSrc.includes('useAiReviewSettingsPanelState'), 'SettingsPanel composes the AI review settings state hook');
assert.ok(aiReviewGenerationSrc.includes('lastDiagnostic'), 'AI review generation hook stores last diagnostic');
assert.ok(aiReviewGenerationSrc.includes('setLastDiagnostic(null)'), 'AI review generation hook can close diagnostics');
assert.ok(aiReviewGenerationSrc.includes('currentProgress'), 'AI review generation hook stores current generation progress');
assert.ok(aiReviewGenerationSrc.includes('initialProgressForAction'), 'AI review generation hook sets a visible first stage immediately after clicking generate');
assert.ok(aiReviewGenerationSrc.includes('scheduleFallbackProgress'), 'AI review generation hook shows a waiting state if IPC progress is delayed');
assert.ok(aiReviewGenerationSrc.includes('waitingForRealProgress'), 'AI review generation hook fallback copy should be explicit about waiting for real progress');
assert.ok(!aiReviewGenerationSrc.includes('function fallbackProgress'), 'AI review generation hook should not synthesize fake AI pipeline stages');
assert.ok(aiReviewGenerationSrc.includes('finishProgress'), 'AI review generation hook sets final progress after result returns');
assert.ok(aiReviewGenerationSrc.includes('generationActiveRef'), 'AI review generation hook ignores stale late progress events');
assert.ok(aiReviewManualGenerationSectionSrc.includes('progressDisplay(currentProgress'), 'active generate button shows current stage instead of static generating text');
assert.ok(aiReviewPresentationSrc.includes('progressStatusLabel'), 'AI review generation presentation localizes progress status');
assert.ok(aiReviewGenerationSrc.includes('onProgress'), 'AI review generation hook subscribes to progress events');
assert.match(
  aiReviewGenerationSrc,
  /isAiReviewProgressEvent\(payload\)/,
  'AI review generation hook should narrow AI review progress payloads before storing them as progress state.',
);
assert.match(
  aiReviewGenerationSrc,
  /readAiReviewRunDiagnostic\((result|rawDailyResult|rawResult)\)/,
  'AI review generation hook should read generation diagnostics through a runtime guard instead of trusting ambient casts.',
);
assert.doesNotMatch(
  settingsPanelSrc,
  /result as \{ diagnostic\?: AiReviewRunDiagnostic \}/,
  'SettingsPanel should not cast generation results just to read diagnostic fields.',
);
assert.doesNotMatch(
  settingsPanelSrc,
  /if \(result\.diagnostic\) \{\s*setLastDiagnostic\(result\.diagnostic\);/,
  'SettingsPanel should not store unvalidated result.diagnostic values.',
);
assert.ok(aiReviewManualGenerationSectionSrc.includes('DiagnosticCard'), 'manual generation section renders diagnostic card');
assert.ok(aiReviewPresentationSrc.includes('token'), 'UI explains token usage when diagnostics render');
assert.ok(aiReviewPresentationSrc.includes('requestAi'), 'UI reads AI request stage');
assert.ok(aiReviewPresentationSrc.includes('profileName'), 'UI shows profile name, not key');
assert.ok(!aiReviewPresentationSrc.includes('diagnostic.profile.apiKey'), 'UI must not read API Key from diagnostics');

console.log('AI run diagnostics verification passed');
