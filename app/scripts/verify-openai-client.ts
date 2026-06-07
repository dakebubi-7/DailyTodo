import { strict as assert } from 'node:assert';
import { callChatCompletion } from '../shared/llm/openaiClient';

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

console.log('OpenAI client verification passed');
