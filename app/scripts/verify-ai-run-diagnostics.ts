import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { mergeTokenUsage, safeBaseUrlHost } from '../shared/aiReview/runDiagnostics';
import { callChatCompletion } from '../shared/llm/openaiClient';

const base = { baseUrl: 'https://relay.example/v1', apiKey: 'secret-key-must-not-leak', model: 'm' };
const messages = [{ role: 'user' as const, content: 'hi' }];
const jsonRes = (obj: any) => ({
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

const mainSrc = fs.readFileSync(path.join(process.cwd(), 'electron/main.ts'), 'utf-8');
assert.ok(mainSrc.includes('createDiagnostic'), 'main process builds AI run diagnostics');
assert.ok(mainSrc.includes('emitAiReviewProgress'), 'main process emits staged progress');
assert.ok(mainSrc.includes("'aiReview:progress'"), 'main process sends progress IPC event');
assert.ok(mainSrc.includes("reportKind: 'weekly'"), 'weekly diagnostics are wired');
assert.ok(mainSrc.includes("reportKind: 'monthly'"), 'monthly diagnostics are wired');
assert.ok(mainSrc.includes("reportKind: 'daily'"), 'daily diagnostics are wired');
assert.ok(mainSrc.includes("stage('buildPrompt', '构建提示词'"), 'daily diagnostics include buildPrompt stage');
assert.ok(mainSrc.includes("stage('writeObsidian', '写入 Obsidian'"), 'daily diagnostics include writeObsidian stage');
assert.ok(mainSrc.includes("stage('confirmResult', '确认结果'"), 'daily diagnostics include confirmResult stage');
assert.ok(mainSrc.includes('日记文件不存在，请先同步/创建当天日记后再生成复盘'), 'missing daily note gets a clear error');
assert.ok(mainSrc.includes('sourceChars'), 'daily diagnostics include source character count');
assert.ok(!mainSrc.includes('apiKey:' + ' resolution'), 'diagnostic code must not copy apiKey');

const preloadSrc = fs.readFileSync(path.join(process.cwd(), 'electron/preload.ts'), 'utf-8');
assert.ok(preloadSrc.includes('onProgress'), 'preload exposes progress subscription');
assert.ok(preloadSrc.includes('aiReview:progress'), 'preload listens to progress IPC event');

const settingsPanelSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/SettingsPanel.tsx'), 'utf-8');
assert.ok(settingsPanelSrc.includes('lastDiagnostic'), 'SettingsPanel stores last diagnostic');
assert.ok(settingsPanelSrc.includes('setLastDiagnostic(null)'), 'SettingsPanel can close diagnostics');
assert.ok(settingsPanelSrc.includes('currentProgress'), 'SettingsPanel stores current generation progress');
assert.ok(settingsPanelSrc.includes('initialProgressForAction'), 'SettingsPanel sets a visible first stage immediately after clicking generate');
assert.ok(settingsPanelSrc.includes('scheduleFallbackProgress'), 'SettingsPanel shows a waiting state if IPC progress is delayed');
assert.ok(settingsPanelSrc.includes('waitingForRealProgress'), 'SettingsPanel fallback copy should be explicit about waiting for real progress');
assert.ok(!settingsPanelSrc.includes('function fallbackProgress'), 'SettingsPanel should not synthesize fake AI pipeline stages');
assert.ok(settingsPanelSrc.includes('finishProgress'), 'SettingsPanel sets final progress after result returns');
assert.ok(settingsPanelSrc.includes('generationActiveRef'), 'SettingsPanel ignores stale late progress events');
assert.ok(settingsPanelSrc.includes('progressDisplay(currentProgress'), 'active generate button shows current stage instead of static generating text');
assert.ok(settingsPanelSrc.includes('progressStatusLabel'), 'SettingsPanel localizes progress status');
assert.ok(settingsPanelSrc.includes('onProgress'), 'SettingsPanel subscribes to progress events');
assert.ok(settingsPanelSrc.includes('DiagnosticCard'), 'SettingsPanel renders diagnostic card');
assert.ok(settingsPanelSrc.includes('服务未返回 token 用量'), 'UI explains missing token usage');
assert.ok(settingsPanelSrc.includes('requestAi'), 'UI reads AI request stage');
assert.ok(settingsPanelSrc.includes('profileName'), 'UI shows profile name, not key');
assert.ok(!settingsPanelSrc.includes('diagnostic.profile.apiKey'), 'UI must not read API Key from diagnostics');

console.log('AI run diagnostics verification passed');
