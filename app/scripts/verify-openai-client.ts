import { strict as assert } from 'node:assert';
import { buildAutoCandidates, callChatCompletion, detectProvider, listModels, parseModelList } from '../shared/llm/openaiClient';

const base = { baseUrl: 'https://x/v1', apiKey: 'sk-test', model: 'm' };
const messages = [{ role: 'user' as const, content: 'hi' }];

// callChatCompletion 现在按 res.text() + content-type 分流；用这些 helper 造非流式 / SSE 响应。
const jsonRes = (obj: any) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  text: async () => JSON.stringify(obj),
});
const sseRes = (body: string) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'text/event-stream' },
  text: async () => body,
});

// 缺 key → ok:false，不抛
const noKey = await callChatCompletion({ ...base, apiKey: '' }, messages);
assert.equal(noKey.ok, false);
assert.ok(noKey.error.includes('key') || noKey.error.includes('Key'));

// 成功路径（注入 fetch）
const okFetch = (async () => jsonRes({ choices: [{ message: { content: '生成内容' } }] })) as unknown as typeof fetch;
const ok = await callChatCompletion(base, messages, { fetchImpl: okFetch });
assert.equal(ok.ok, true);
assert.equal(ok.ok && ok.content, '生成内容');

// 非 200 → ok:false
const badFetch = (async () => ({ ok: false, status: 401, text: async () => 'unauthorized' })) as unknown as typeof fetch;
const bad = await callChatCompletion(base, messages, { fetchImpl: badFetch });
assert.equal(bad.ok, false);
assert.ok(bad.error.includes('401'));

// 404 给出小白可操作的 URL/path 提示
const notFoundFetch = (async () => ({ ok: false, status: 404, text: async () => '{"error":"not found"}' })) as unknown as typeof fetch;
const notFound = await callChatCompletion(base, messages, { fetchImpl: notFoundFetch, provider: 'openai' });
assert.equal(notFound.ok, false);
assert.ok(!notFound.ok && notFound.error.includes('没有找到请求路径'), '404 说明路径未找到');
assert.ok(!notFound.ok && notFound.error.includes('/v1'), '404 提示检查 /v1');

// Claude Code 专用服务限制给出明确说明
const claudeCodeDeniedText = 'Access Denied: This service is restricted to authorized use through the official Claude Code client only.';
const claudeDeniedFetch = (async () => ({ ok: false, status: 403, text: async () => claudeCodeDeniedText })) as unknown as typeof fetch;
const claudeDenied = await callChatCompletion(
  { baseUrl: 'https://api.anthropic.com', apiKey: 'sk-ant-x', model: 'claude-sonnet-4-6' },
  messages,
  { fetchImpl: claudeDeniedFetch, provider: 'anthropic' },
);
assert.equal(claudeDenied.ok, false);
assert.ok(!claudeDenied.ok && claudeDenied.error.includes('Claude Code 官方客户端专用'), '识别 Claude Code 专用限制');
assert.ok(!claudeDenied.ok && !claudeDenied.error.includes('sk-ant-x'), '错误不泄露 key');

// fetch 抛错 → ok:false，不冒泡
const throwFetch = (async () => { throw new Error('ECONNREFUSED'); }) as unknown as typeof fetch;
const net = await callChatCompletion(base, messages, { fetchImpl: throwFetch });
assert.equal(net.ok, false);
assert.ok(net.error.includes('ECONNREFUSED'));

// 缺 baseUrl → ok:false
const noBase = await callChatCompletion({ ...base, baseUrl: '' }, messages);
assert.equal(noBase.ok, false);

// 200 但空内容 → ok:false
const emptyFetch = (async () => jsonRes({ choices: [{ message: { content: '' } }] })) as unknown as typeof fetch;
const empty = await callChatCompletion(base, messages, { fetchImpl: emptyFetch });
assert.equal(empty.ok, false);
assert.ok(!empty.ok && empty.error.includes('空内容'), '空内容错误带提示');

// content 为分段数组也能解析
const arrFetch = (async () => jsonRes({ choices: [{ message: { content: [{ type: 'text', text: '分段' }, { type: 'text', text: '内容' }] } }] })) as unknown as typeof fetch;
const arr = await callChatCompletion(base, messages, { fetchImpl: arrFetch });
assert.equal(arr.ok && arr.content, '分段内容', 'content 数组分段拼接');

// 200 但返回非 JSON 文本 → ok:false（不抛）
const badJsonFetch = (async () => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  text: async () => 'not json at all',
})) as unknown as typeof fetch;
const badJson = await callChatCompletion(base, messages, { fetchImpl: badJsonFetch });
assert.equal(badJson.ok, false);

// === SSE 流式响应：能正确聚合（修复 "Unexpected token 'd', data: {...}" ）===
const sseBody = [
  'data: {"choices":[{"delta":{"content":"你好"}}]}',
  'data: {"choices":[{"delta":{"content":"世界"}}]}',
  'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}',
  'data: [DONE]',
  '',
].join('\n');
const sseFetch = (async () => sseRes(sseBody)) as unknown as typeof fetch;
const sse = await callChatCompletion(base, messages, { fetchImpl: sseFetch });
assert.equal(sse.ok, true, 'SSE 流式不再崩');
assert.equal(sse.ok && sse.content, '你好世界', 'SSE 多 chunk 聚合');
assert.equal(sse.ok && sse.truncated, false, 'finish_reason=stop → 不截断');

// SSE chunk 内前导/尾随空格必须保留，避免 "Hello" + " world" 或 "Hello " + "world" 被拼坏
const sseSpaceBody = [
  'data: {"choices":[{"delta":{"content":"Hello"}}]}',
  'data: {"choices":[{"delta":{"content":" world"}}]}',
  'data: [DONE]',
].join('\n');
const sseSpace = await callChatCompletion(base, messages, { fetchImpl: (async () => sseRes(sseSpaceBody)) as unknown as typeof fetch });
assert.equal(sseSpace.ok && sseSpace.content, 'Hello world', 'SSE 分片拼接保留分片内前导空格');

const sseTrailingSpaceBody = [
  'data: {"choices":[{"delta":{"content":"Hello "}}]}',
  'data: {"choices":[{"delta":{"content":"world"}}]}',
  'data: [DONE]',
].join('\n');
const sseTrailingSpace = await callChatCompletion(base, messages, { fetchImpl: (async () => sseRes(sseTrailingSpaceBody)) as unknown as typeof fetch });
assert.equal(sseTrailingSpace.ok && sseTrailingSpace.content, 'Hello world', 'SSE 分片拼接保留分片内尾随空格');

// SSE 截断信号
const sseTruncBody = [
  'data: {"choices":[{"delta":{"content":"半"}}]}',
  'data: {"choices":[{"delta":{},"finish_reason":"length"}]}',
  'data: [DONE]',
].join('\n');
const sseTrunc = await callChatCompletion(base, messages, { fetchImpl: (async () => sseRes(sseTruncBody)) as unknown as typeof fetch });
assert.equal(sseTrunc.ok && sseTrunc.truncated, true, 'SSE finish_reason=length → truncated');

// content-type 不是 event-stream，但 body 以 data: 开头 → 也按 SSE 处理
const sseByPrefix = await callChatCompletion(base, messages, {
  fetchImpl: (async () => ({
    ok: true,
    status: 200,
    headers: { get: () => 'text/plain' },
    text: async () => 'data: {"choices":[{"delta":{"content":"嗨"}}]}\ndata: [DONE]',
  })) as unknown as typeof fetch,
});
assert.equal(sseByPrefix.ok && sseByPrefix.content, '嗨', 'body 以 data: 开头也按 SSE 兜底');

// 非标准 OpenAI JSON 字段：中转站可能把正文放在 choices[0].text 或顶层字段
const choiceText = await callChatCompletion(base, messages, {
  fetchImpl: (async () => jsonRes({ choices: [{ text: 'choice text 正文' }] })) as unknown as typeof fetch,
});
assert.equal(choiceText.ok && choiceText.content, 'choice text 正文', '支持 choices[0].text');

const topLevelText = await callChatCompletion(base, messages, {
  fetchImpl: (async () => jsonRes({ output_text: '顶层正文' })) as unknown as typeof fetch,
});
assert.equal(topLevelText.ok && topLevelText.content, '顶层正文', '支持顶层 output_text');

// 非标准 OpenAI SSE 字段：delta.text 和顶层 output_text
const sseNonstandard = await callChatCompletion(base, messages, {
  fetchImpl: (async () => sseRes([
    'data: {"choices":[{"delta":{"text":"非标"}}]}',
    'data: {"output_text":"流式"}',
    'data: [DONE]',
  ].join('\n'))) as unknown as typeof fetch,
});
assert.equal(sseNonstandard.ok && sseNonstandard.content, '非标流式', '支持非标准 SSE 正文字段');

// usage-only SSE：只有用量统计，没有正文，给出可理解诊断
const usageOnly = await callChatCompletion(base, messages, {
  fetchImpl: (async () => sseRes('data: {"choices":[],"usage":{"prompt_tokens":24403,"completion_tokens":0,"total_tokens":24403}}\n')) as unknown as typeof fetch,
});
assert.equal(usageOnly.ok, false);
assert.ok(!usageOnly.ok && usageOnly.error.includes('只返回了 token 用量统计'), 'usage-only 流提示没有正文');
assert.ok(!usageOnly.ok && usageOnly.error.includes('24403'), 'usage-only 流展示 prompt token 数');

// === 协议自动识别（detectProvider）===
assert.equal(detectProvider('https://api.anthropic.com'), 'anthropic');
assert.equal(detectProvider('https://api.anthropic.com/v1'), 'anthropic');
assert.equal(detectProvider('https://generativelanguage.googleapis.com'), 'gemini');
assert.equal(detectProvider('https://generativelanguage.googleapis.com/v1beta/openai'), 'openai', 'Gemini 的 OpenAI 兼容端点走 openai');
assert.equal(detectProvider('https://api.deepseek.com'), 'openai');
assert.equal(detectProvider('https://api.openai.com/v1'), 'openai');
assert.equal(detectProvider('https://my-relay.com/v1'), 'openai', '未知中转站默认 openai');

// === 自动兼容候选：URL 修正 + 协议排序 ===
const bareCandidates = buildAutoCandidates('https://token.offerya.cc');
assert.deepEqual(
  bareCandidates.slice(0, 2),
  [
    { provider: 'openai', baseUrl: 'https://token.offerya.cc' },
    { provider: 'openai', baseUrl: 'https://token.offerya.cc/v1' },
  ],
  '裸域名先试原始地址，再试 /v1',
);

const v1Candidates = buildAutoCandidates('https://token.offerya.cc/v1');
assert.equal(
  v1Candidates.filter((c) => c.baseUrl === 'https://token.offerya.cc/v1' && c.provider === 'openai').length,
  1,
  '/v1 不重复追加',
);

const fullPathCandidates = buildAutoCandidates('https://token.offerya.cc/v1/chat/completions');
assert.equal(fullPathCandidates[0].baseUrl, 'https://token.offerya.cc/v1', '误填完整 chat/completions 时截回 /v1');
assert.equal(fullPathCandidates[0].provider, 'openai', '修正后的完整 OpenAI 路径仍走 OpenAI 兼容');

assert.equal(buildAutoCandidates('https://api.anthropic.com')[0].provider, 'anthropic', 'Anthropic 官方地址优先 Claude 原生');
assert.equal(buildAutoCandidates('https://generativelanguage.googleapis.com')[0].provider, 'gemini', 'Gemini 官方原生地址优先 Gemini 原生');
assert.equal(buildAutoCandidates('https://generativelanguage.googleapis.com/v1beta/openai')[0].provider, 'openai', 'Gemini OpenAI 兼容地址优先 OpenAI 兼容');

// provider=auto：裸域名 404 后自动尝试 /v1 并成功
const autoTriedUrls: string[] = [];
const autoRetryFetch = (async (url: string) => {
  autoTriedUrls.push(url);
  if (url === 'https://relay.example/chat/completions') {
    return { ok: false, status: 404, text: async () => '{"error":"not found"}' };
  }
  if (url === 'https://relay.example/v1/chat/completions') {
    return jsonRes({ choices: [{ message: { content: '自动成功' } }] });
  }
  return { ok: false, status: 500, text: async () => 'unexpected candidate' };
}) as unknown as typeof fetch;
const autoRetry = await callChatCompletion(
  { baseUrl: 'https://relay.example', apiKey: 'k', model: 'm' },
  messages,
  { fetchImpl: autoRetryFetch, provider: 'auto' },
);
assert.equal(autoRetry.ok && autoRetry.content, '自动成功', 'auto 会尝试 /v1 候选直到成功');
assert.deepEqual(autoTriedUrls.slice(0, 2), ['https://relay.example/chat/completions', 'https://relay.example/v1/chat/completions']);

// 显式 provider=openai：不自动尝试 /v1，保持用户指定协议行为
const explicitTriedUrls: string[] = [];
const explicitFetch = (async (url: string) => {
  explicitTriedUrls.push(url);
  return { ok: false, status: 404, text: async () => '{"error":"not found"}' };
}) as unknown as typeof fetch;
const explicit = await callChatCompletion(
  { baseUrl: 'https://relay.example', apiKey: 'k', model: 'm' },
  messages,
  { fetchImpl: explicitFetch, provider: 'openai' },
);
assert.equal(explicit.ok, false);
assert.deepEqual(explicitTriedUrls, ['https://relay.example/chat/completions'], '显式 provider 不做自动候选重试');

// === Anthropic 原生格式：请求体 + 响应解析 ===
let anthropicCapture: { url: string; body: any; headers: any } | null = null;
const anthropicFetch = (async (url: string, init: any) => {
  anthropicCapture = { url, body: JSON.parse(init.body), headers: init.headers };
  return jsonRes({ content: [{ type: 'text', text: 'Claude 回复' }] });
}) as unknown as typeof fetch;
const anth = await callChatCompletion(
  { baseUrl: 'https://api.anthropic.com', apiKey: 'sk-ant-x', model: 'claude-3-5-haiku' },
  [{ role: 'system', content: '系统提示' }, { role: 'user', content: '你好' }],
  { fetchImpl: anthropicFetch },
);
assert.equal(anth.ok, true);
assert.equal(anth.ok && anth.content, 'Claude 回复');
assert.ok(anthropicCapture!.url.includes('/v1/messages'), 'Anthropic 走 /v1/messages');
assert.equal(anthropicCapture!.headers['x-api-key'], 'sk-ant-x', 'Anthropic 用 x-api-key 认证');
assert.ok(anthropicCapture!.headers['anthropic-version'], 'Anthropic 需要版本头');
assert.equal(anthropicCapture!.body.system, '系统提示', 'system 提示提到顶层 system 字段');
assert.equal(anthropicCapture!.body.messages.length, 1, 'system 不进 messages 数组');
assert.ok(anthropicCapture!.body.max_tokens > 0, 'Anthropic 需要 max_tokens');

// Anthropic 显式 provider 覆盖（即便 url 是中转站）
let forced: string | null = null;
const forceFetch = (async (url: string) => { forced = url; return jsonRes({ content: [{ text: 'x' }] }); }) as unknown as typeof fetch;
await callChatCompletion(
  { baseUrl: 'https://relay.com', apiKey: 'k', model: 'm' },
  messages,
  { fetchImpl: forceFetch, provider: 'anthropic' },
);
assert.ok(forced!.includes('/v1/messages'), 'provider 显式指定时覆盖 url 识别');

// === Gemini 原生格式：generateContent + 响应解析 ===
let geminiCapture: { url: string; body: any } | null = null;
const geminiFetch = (async (url: string, init: any) => {
  geminiCapture = { url, body: JSON.parse(init.body) };
  return jsonRes({ candidates: [{ content: { parts: [{ text: 'Gemini 回复' }] } }] });
}) as unknown as typeof fetch;
const gem = await callChatCompletion(
  { baseUrl: 'https://generativelanguage.googleapis.com', apiKey: 'AIza-x', model: 'gemini-1.5-flash' },
  [{ role: 'system', content: 'sys' }, { role: 'user', content: 'hi' }],
  { fetchImpl: geminiFetch },
);
assert.equal(gem.ok, true);
assert.equal(gem.ok && gem.content, 'Gemini 回复');
assert.ok(geminiCapture!.url.includes(':generateContent'), 'Gemini 走 generateContent');
assert.ok(geminiCapture!.url.includes('gemini-1.5-flash'), 'Gemini 模型进 URL 路径');
assert.ok(geminiCapture!.body.contents, 'Gemini 用 contents 字段');

// Anthropic 非 200 仍归一化为 ok:false
const anthBad = (async () => ({ ok: false, status: 401, text: async () => 'auth error' })) as unknown as typeof fetch;
const ab = await callChatCompletion({ baseUrl: 'https://api.anthropic.com', apiKey: 'k', model: 'm' }, messages, { fetchImpl: anthBad });
assert.equal(ab.ok, false);
assert.ok(ab.error.includes('401'));

// === max_tokens 三协议统一下发 ===
let oaiBody: any = null;
const oaiCapture = (async (_url: string, init: any) => {
  oaiBody = JSON.parse(init.body);
  return jsonRes({ choices: [{ message: { content: 'x' }, finish_reason: 'stop' }] });
}) as unknown as typeof fetch;
await callChatCompletion({ ...base, maxTokens: 12345 }, messages, { fetchImpl: oaiCapture });
assert.equal(oaiBody.max_tokens, 12345, 'OpenAI 兼容下发 max_tokens（这是 MiniMax 截断的根因修复）');

// 未给 maxTokens → 用默认 8192（不再裸奔靠服务端默认）
let oaiDefault: any = null;
const oaiDefFetch = (async (_url: string, init: any) => {
  oaiDefault = JSON.parse(init.body);
  return jsonRes({ choices: [{ message: { content: 'x' }, finish_reason: 'stop' }] });
}) as unknown as typeof fetch;
await callChatCompletion(base, messages, { fetchImpl: oaiDefFetch });
assert.equal(oaiDefault.max_tokens, 8192, '缺省 max_tokens 回落 8192');

let gemBody: any = null;
const gemCapture = (async (_url: string, init: any) => {
  gemBody = JSON.parse(init.body);
  return jsonRes({ candidates: [{ content: { parts: [{ text: 'x' }] }, finishReason: 'STOP' }] });
}) as unknown as typeof fetch;
await callChatCompletion({ baseUrl: 'https://generativelanguage.googleapis.com', apiKey: 'k', model: 'gemini-1.5-flash', maxTokens: 4096 }, messages, { fetchImpl: gemCapture });
assert.equal(gemBody.generationConfig.maxOutputTokens, 4096, 'Gemini 下发 generationConfig.maxOutputTokens');

let anthBody: any = null;
const anthCapture = (async (_url: string, init: any) => {
  anthBody = JSON.parse(init.body);
  return jsonRes({ content: [{ text: 'x' }], stop_reason: 'end_turn' });
}) as unknown as typeof fetch;
await callChatCompletion({ baseUrl: 'https://api.anthropic.com', apiKey: 'k', model: 'm', maxTokens: 2048 }, messages, { fetchImpl: anthCapture });
assert.equal(anthBody.max_tokens, 2048, 'Anthropic max_tokens 用账号配置值');

// === 截断检测：三协议各自的「达到上限」信号 ===
const oaiTruncFetch = (async () => jsonRes({ choices: [{ message: { content: '半截' }, finish_reason: 'length' }] })) as unknown as typeof fetch;
const oaiTrunc = await callChatCompletion(base, messages, { fetchImpl: oaiTruncFetch });
assert.equal(oaiTrunc.ok && oaiTrunc.truncated, true, 'OpenAI finish_reason=length → truncated');

const oaiOkFetch = (async () => jsonRes({ choices: [{ message: { content: '完整' }, finish_reason: 'stop' }] })) as unknown as typeof fetch;
const oaiOk = await callChatCompletion(base, messages, { fetchImpl: oaiOkFetch });
assert.equal(oaiOk.ok && oaiOk.truncated, false, 'finish_reason=stop → 不截断');

const anthTruncFetch = (async () => jsonRes({ content: [{ text: '半截' }], stop_reason: 'max_tokens' })) as unknown as typeof fetch;
const anthTrunc = await callChatCompletion({ baseUrl: 'https://api.anthropic.com', apiKey: 'k', model: 'm' }, messages, { fetchImpl: anthTruncFetch });
assert.equal(anthTrunc.ok && anthTrunc.truncated, true, 'Anthropic stop_reason=max_tokens → truncated');

const gemTruncFetch = (async () => jsonRes({ candidates: [{ content: { parts: [{ text: '半截' }] }, finishReason: 'MAX_TOKENS' }] })) as unknown as typeof fetch;
const gemTrunc = await callChatCompletion({ baseUrl: 'https://generativelanguage.googleapis.com', apiKey: 'k', model: 'gemini-1.5-flash' }, messages, { fetchImpl: gemTruncFetch });
assert.equal(gemTrunc.ok && gemTrunc.truncated, true, 'Gemini finishReason=MAX_TOKENS → truncated');

// === 模型列表解析 ===
assert.deepEqual(parseModelList('openai', { data: [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }] }), ['gpt-4o', 'gpt-4o-mini']);
assert.deepEqual(parseModelList('anthropic', { data: [{ id: 'claude-3-5-haiku' }] }), ['claude-3-5-haiku']);
assert.deepEqual(parseModelList('gemini', { models: [{ name: 'models/gemini-1.5-flash' }, { name: 'models/gemini-1.5-pro' }] }), ['gemini-1.5-flash', 'gemini-1.5-pro'], 'Gemini 去掉 models/ 前缀');
assert.deepEqual(parseModelList('openai', {}), [], '无 data → 空');

// listModels：成功路径（openai 兼容，去重 + 排序）
let modelsUrl = '';
const modelsFetch = (async (url: string) => {
  modelsUrl = url;
  return { ok: true, status: 200, json: async () => ({ data: [{ id: 'b-model' }, { id: 'a-model' }, { id: 'a-model' }] }) };
}) as unknown as typeof fetch;
const ml = await listModels({ baseUrl: 'https://api.minimax.chat/v1', apiKey: 'k', model: '' }, { fetchImpl: modelsFetch });
assert.equal(ml.ok, true);
assert.deepEqual(ml.ok && ml.models, ['a-model', 'b-model'], '去重 + 排序');
assert.ok(modelsUrl.includes('/models'), 'openai 兼容走 /models');

// listModels：provider=auto 时也尝试 /v1 候选，和生成请求保持一致
const autoModelUrls: string[] = [];
const autoModelsFetch = (async (url: string) => {
  autoModelUrls.push(url);
  if (url === 'https://relay.example/models') {
    return { ok: false, status: 404, text: async () => '{"error":"not found"}' };
  }
  if (url === 'https://relay.example/v1/models') {
    return { ok: true, status: 200, json: async () => ({ data: [{ id: 'relay-model' }] }) };
  }
  return { ok: false, status: 500, text: async () => 'unexpected candidate' };
}) as unknown as typeof fetch;
const autoModels = await listModels(
  { baseUrl: 'https://relay.example', apiKey: 'k', model: '' },
  { fetchImpl: autoModelsFetch, provider: 'auto' },
);
assert.equal(autoModels.ok, true);
assert.deepEqual(autoModels.ok && autoModels.models, ['relay-model'], 'listModels auto 尝试 /v1 后成功');
assert.deepEqual(autoModelUrls.slice(0, 2), ['https://relay.example/models', 'https://relay.example/v1/models']);

// listModels：显式 provider=openai 时不自动尝试 /v1
const explicitModelUrls: string[] = [];
const explicitModelsFetch = (async (url: string) => {
  explicitModelUrls.push(url);
  return { ok: false, status: 404, text: async () => '{"error":"not found"}' };
}) as unknown as typeof fetch;
const explicitModels = await listModels(
  { baseUrl: 'https://relay.example', apiKey: 'k', model: '' },
  { fetchImpl: explicitModelsFetch, provider: 'openai' },
);
assert.equal(explicitModels.ok, false);
assert.deepEqual(explicitModelUrls, ['https://relay.example/models'], 'listModels 显式 provider 不做自动候选重试');

// listModels：缺 key → ok:false
const mlNoKey = await listModels({ baseUrl: 'https://x/v1', apiKey: '', model: '' });
assert.equal(mlNoKey.ok, false);

// listModels：非 200 → ok:false
const modelsBad = (async () => ({ ok: false, status: 401, text: async () => 'no' })) as unknown as typeof fetch;
const mlBad = await listModels({ baseUrl: 'https://x/v1', apiKey: 'k', model: '' }, { fetchImpl: modelsBad });
assert.equal(mlBad.ok, false);
assert.ok(!mlBad.ok && mlBad.error.includes('401'));

// listModels：空列表 → ok:false（提示手填）
const modelsEmpty = (async () => ({ ok: true, status: 200, json: async () => ({ data: [] }) })) as unknown as typeof fetch;
const mlEmpty = await listModels({ baseUrl: 'https://x/v1', apiKey: 'k', model: '' }, { fetchImpl: modelsEmpty });
assert.equal(mlEmpty.ok, false);

// listModels：Gemini 端点 + key 入 query
let gemUrl = '';
const gemModelsFetch = (async (url: string) => {
  gemUrl = url;
  return { ok: true, status: 200, json: async () => ({ models: [{ name: 'models/gemini-1.5-flash' }] }) };
}) as unknown as typeof fetch;
const gemMl = await listModels({ baseUrl: 'https://generativelanguage.googleapis.com', apiKey: 'AIza', model: '' }, { fetchImpl: gemModelsFetch });
assert.equal(gemMl.ok, true);
assert.ok(gemUrl.includes('/v1beta/models'), 'Gemini 走 /v1beta/models');
assert.ok(gemUrl.includes('key=AIza'), 'Gemini key 入 query');

console.log('OpenAI client verification passed');
