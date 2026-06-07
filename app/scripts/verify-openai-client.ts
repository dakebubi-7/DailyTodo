import { strict as assert } from 'node:assert';
import { callChatCompletion, detectProvider } from '../shared/llm/openaiClient';

const base = { baseUrl: 'https://x/v1', apiKey: 'sk-test', model: 'm' };
const messages = [{ role: 'user' as const, content: 'hi' }];

// 缺 key → ok:false，不抛
const noKey = await callChatCompletion({ ...base, apiKey: '' }, messages);
assert.equal(noKey.ok, false);
assert.ok(noKey.error.includes('key') || noKey.error.includes('Key'));

// 成功路径（注入 fetch）
const okFetch = (async () =>
  ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: '生成内容' } }] }) })) as unknown as typeof fetch;
const ok = await callChatCompletion(base, messages, { fetchImpl: okFetch });
assert.equal(ok.ok, true);
assert.equal(ok.ok && ok.content, '生成内容');

// 非 200 → ok:false
const badFetch = (async () => ({ ok: false, status: 401, text: async () => 'unauthorized' })) as unknown as typeof fetch;
const bad = await callChatCompletion(base, messages, { fetchImpl: badFetch });
assert.equal(bad.ok, false);
assert.ok(bad.error.includes('401'));

// fetch 抛错 → ok:false，不冒泡
const throwFetch = (async () => { throw new Error('ECONNREFUSED'); }) as unknown as typeof fetch;
const net = await callChatCompletion(base, messages, { fetchImpl: throwFetch });
assert.equal(net.ok, false);
assert.ok(net.error.includes('ECONNREFUSED'));

// 缺 baseUrl → ok:false
const noBase = await callChatCompletion({ ...base, baseUrl: '' }, messages);
assert.equal(noBase.ok, false);

// 200 但空内容 → ok:false
const emptyFetch = (async () =>
  ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: '' } }] }) })) as unknown as typeof fetch;
const empty = await callChatCompletion(base, messages, { fetchImpl: emptyFetch });
assert.equal(empty.ok, false);

// 200 但 JSON 解析失败 → ok:false（不抛）
const badJsonFetch = (async () =>
  ({ ok: true, status: 200, json: async () => { throw new Error('bad json'); } })) as unknown as typeof fetch;
const badJson = await callChatCompletion(base, messages, { fetchImpl: badJsonFetch });
assert.equal(badJson.ok, false);

// === 协议自动识别（detectProvider）===
assert.equal(detectProvider('https://api.anthropic.com'), 'anthropic');
assert.equal(detectProvider('https://api.anthropic.com/v1'), 'anthropic');
assert.equal(detectProvider('https://generativelanguage.googleapis.com'), 'gemini');
assert.equal(detectProvider('https://generativelanguage.googleapis.com/v1beta/openai'), 'openai', 'Gemini 的 OpenAI 兼容端点走 openai');
assert.equal(detectProvider('https://api.deepseek.com'), 'openai');
assert.equal(detectProvider('https://api.openai.com/v1'), 'openai');
assert.equal(detectProvider('https://my-relay.com/v1'), 'openai', '未知中转站默认 openai');

// === Anthropic 原生格式：请求体 + 响应解析 ===
let anthropicCapture: { url: string; body: any; headers: any } | null = null;
const anthropicFetch = (async (url: string, init: any) => {
  anthropicCapture = { url, body: JSON.parse(init.body), headers: init.headers };
  return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: 'Claude 回复' }] }) };
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
const forceFetch = (async (url: string) => { forced = url; return { ok: true, status: 200, json: async () => ({ content: [{ text: 'x' }] }) }; }) as unknown as typeof fetch;
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
  return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Gemini 回复' }] } }] }) };
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

console.log('OpenAI client verification passed');
