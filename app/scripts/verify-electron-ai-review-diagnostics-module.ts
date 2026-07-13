import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAiReviewDiagnostics } from '../electron/aiReviewDiagnostics';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewDiagnostics.ts');
const runtimePath = join(root, 'electron', 'aiReviewRuntime.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI review diagnostics module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const runtime = readFileSync(runtimePath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function createAiReviewDiagnostics\b/, 'AI review diagnostics should export a focused factory.');
assert.match(helper, /mergeTokenUsage/, 'AI review diagnostics should own token-usage aggregation.');
assert.match(helper, /safeBaseUrlHost/, 'AI review diagnostics should own profile host sanitization.');
assert.match(helper, /function stage\b/, 'AI review diagnostics should create stage records.');
assert.match(helper, /function createDiagnostic\b/, 'AI review diagnostics should assemble run diagnostics.');
assert.match(runtime, /from '\.\/aiReviewDiagnostics'/, 'AI review runtime should compose the diagnostics helper.');
assert.match(runtime, /createAiReviewDiagnostics\(\)/, 'AI review runtime should create diagnostics through the focused helper.');
assert.doesNotMatch(runtime, /mergeTokenUsage/, 'AI review runtime should not aggregate token usage inline.');
assert.doesNotMatch(runtime, /function createDiagnostic\b/, 'AI review runtime should not retain diagnostic assembly inline.');

assert.equal(
  scripts['verify:electron-ai-review-diagnostics-module'],
  'tsx scripts/verify-electron-ai-review-diagnostics-module.ts',
  'package.json should expose the focused AI review diagnostics verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-diagnostics-module', 'cleanup-core should include the focused AI review diagnostics verifier.');

const diagnostics = createAiReviewDiagnostics({ now: () => 2_000, runId: () => 'daily-fixed' });
const result = diagnostics.createDiagnostic({
  reportKind: 'daily',
  startedAt: 1_500,
  finalStatus: 'completed',
  resolution: {
    ok: true,
    source: 'specific',
    profile: {
      id: 'profile-1',
      name: 'Primary',
      provider: 'openai',
      apiKey: 'secret',
      model: 'gpt-test',
      baseUrl: 'https://relay.example/v1?token=secret',
    },
  },
  stages: [diagnostics.stage('inspectDaily', 'Inspect', 'completed', 10)],
  llmResults: [
    { ok: true, content: 'answer', truncated: true, diagnostics: { durationMs: 20, usage: { source: 'openai', promptTokens: 3, completionTokens: 5, totalTokens: 8 } } },
    { ok: false, error: 'failed', diagnostics: { durationMs: 7, usage: { source: 'openai', promptTokens: 2, totalTokens: 2 } } },
  ],
  sourceChars: 42,
});

assert.equal(result.runId, 'daily-fixed', 'diagnostics should use the injected run ID factory.');
assert.equal(result.durationMs, 500, 'diagnostics should calculate duration from the injected clock.');
assert.equal(result.profile.baseUrlHost, 'relay.example', 'diagnostics should expose only the sanitized base URL host.');
assert.deepEqual(result.usage, { source: 'openai', promptTokens: 5, completionTokens: 5, totalTokens: 10 }, 'diagnostics should merge token usage across results.');
assert.equal(result.outputChars, 6, 'diagnostics should count successful output characters only.');
assert.equal(result.truncated, true, 'diagnostics should retain successful response truncation.');
assert.deepEqual(result.stages.at(-1), diagnostics.stage('requestAi', '请求 AI', 'completed', 27), 'diagnostics should synthesize a request stage when callers did not record one.');

console.log('electron AI review diagnostics module verification passed');
