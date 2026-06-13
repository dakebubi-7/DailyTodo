# AI Review LLM Auto Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AI Review's `auto` provider try common LLM endpoint/protocol variants, parse more relay response formats, and return beginner-friendly diagnostics.

**Architecture:** Keep the existing `callChatCompletion` entry point. Add focused helpers inside `app/shared/llm/openaiClient.ts` for URL candidate generation, text extraction, usage-only stream detection, and error diagnosis; `provider=auto` will try a bounded list of candidates, while explicit providers keep single-protocol behavior.

**Tech Stack:** Electron app, TypeScript, Node `tsx` verification scripts, built-in `assert`, existing `fetch` injection tests.

---

## File Structure

- Modify `app/shared/llm/openaiClient.ts`
  - Add candidate generation helpers: normalize user URL, repair `/chat/completions`, add `/v1`, order provider candidates.
  - Add robust text extraction helpers for standard and common relay response shapes.
  - Add usage-only SSE detection and friendly diagnostic helpers.
  - Update `callChatCompletion` so `provider=auto` tries candidates sequentially; explicit providers still use one request.
- Modify `app/scripts/verify-openai-client.ts`
  - Add TDD coverage for auto URL candidates, auto retry success, explicit-provider no retry, nonstandard response fields, usage-only stream diagnostics, 404 diagnostics, and Claude Code restricted diagnostics.
- Optional modify `app/src/i18n.ts`
  - Only if implementation chooses to update hint text. Do not touch UI behavior in this plan.

## Task 1: Export and Test Auto Candidate Generation

**Files:**
- Modify: `app/shared/llm/openaiClient.ts`
- Modify: `app/scripts/verify-openai-client.ts`

- [ ] **Step 1: Add failing tests for URL/protocol candidates**

Append this block in `app/scripts/verify-openai-client.ts` after the existing `detectProvider` assertions around lines 103-110:

```ts
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
```

Also update the import at the top:

```ts
import { buildAutoCandidates, callChatCompletion, detectProvider, listModels, parseModelList } from '../shared/llm/openaiClient';
```

- [ ] **Step 2: Run test to verify it fails**

Run from `app/`:

```bash
npm run verify:openai-client
```

Expected: FAIL with TypeScript/import error similar to `Module '../shared/llm/openaiClient' has no exported member 'buildAutoCandidates'`.

- [ ] **Step 3: Implement candidate generation**

In `app/shared/llm/openaiClient.ts`, add this exported interface after `CallOptions`:

```ts
export interface AutoCandidate {
  provider: LlmProvider;
  baseUrl: string;
}
```

Add these helpers after `trimSlash`:

```ts
function stripChatCompletionsPath(baseUrl: string): string {
  return baseUrl.replace(/\/chat\/completions\/?$/i, '');
}

function hasApiVersionPath(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl);
    return /\/(v\d+|v\d+beta)(\/|$)/i.test(url.pathname);
  } catch {
    return /\/(v\d+|v\d+beta)(\/|$)/i.test(baseUrl);
  }
}

function pushCandidate(list: AutoCandidate[], candidate: AutoCandidate) {
  if (!candidate.baseUrl) return;
  if (list.some((x) => x.provider === candidate.provider && x.baseUrl === candidate.baseUrl)) return;
  list.push(candidate);
}

function openAiBaseVariants(input: string): string[] {
  const cleaned = stripChatCompletionsPath(trimSlash(input.trim()));
  const variants: string[] = [];
  const push = (v: string) => {
    const t = trimSlash(v);
    if (t && !variants.includes(t)) variants.push(t);
  };

  push(cleaned);
  if (cleaned && !hasApiVersionPath(cleaned)) push(`${cleaned}/v1`);
  return variants;
}

export function buildAutoCandidates(baseUrl: string): AutoCandidate[] {
  const raw = trimSlash((baseUrl || '').trim());
  if (!raw) return [];
  const lower = raw.toLowerCase();
  const candidates: AutoCandidate[] = [];
  const openaiVariants = openAiBaseVariants(raw);

  if (lower.includes('generativelanguage.googleapis.com') && !lower.includes('openai')) {
    pushCandidate(candidates, { provider: 'gemini', baseUrl: raw });
  }

  if (lower.includes('api.anthropic.com') || lower.includes('/anthropic')) {
    pushCandidate(candidates, { provider: 'anthropic', baseUrl: raw });
  }

  for (const variant of openaiVariants) pushCandidate(candidates, { provider: 'openai', baseUrl: variant });

  if (!candidates.some((c) => c.provider === 'anthropic')) pushCandidate(candidates, { provider: 'anthropic', baseUrl: raw });
  if (!candidates.some((c) => c.provider === 'gemini')) pushCandidate(candidates, { provider: 'gemini', baseUrl: raw });

  return candidates;
}
```

- [ ] **Step 4: Run test to verify it passes this section**

Run from `app/`:

```bash
npm run verify:openai-client
```

Expected: PASS for new candidate assertions; existing tests should still pass because `callChatCompletion` behavior has not changed yet.

- [ ] **Step 5: Commit**

```bash
git add app/shared/llm/openaiClient.ts app/scripts/verify-openai-client.ts
git commit -m "test(ai-review): cover LLM auto endpoint candidates"
```

## Task 2: Add Friendly Diagnostics for Existing Single-Protocol Failures

**Files:**
- Modify: `app/shared/llm/openaiClient.ts`
- Modify: `app/scripts/verify-openai-client.ts`

- [ ] **Step 1: Add failing tests for 404 and Claude Code restricted diagnostics**

Append this block near the existing non-200 tests in `app/scripts/verify-openai-client.ts` after the `bad` 401 assertion:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run from `app/`:

```bash
npm run verify:openai-client
```

Expected: FAIL because current errors are raw `LLM 返回 404：...` and do not include the new friendly text.

- [ ] **Step 3: Implement diagnostic helper**

In `app/shared/llm/openaiClient.ts`, add this helper before `callChatCompletion`:

```ts
function diagnoseHttpError(status: number, body: string): string {
  const snippet = body.slice(0, 200);
  const lower = body.toLowerCase();

  if (lower.includes('official claude code client only')) {
    return [
      '这个服务或凭据看起来是 Claude Code 官方客户端专用，不能在 DailyTodo 这类第三方应用中直接使用。',
      '请使用 Anthropic Console 创建的 API Key，或使用支持 OpenAI 兼容协议的中转站 Key。',
      `原始返回 ${status}：${snippet}`,
    ].join('\n');
  }

  if (status === 404 || lower.includes('not found')) {
    return [
      'LLM 接口没有找到请求路径。',
      '如果这是 OpenAI 兼容或中转站接口，Base URL 通常需要填到 /v1，不要填完整的 /chat/completions。',
      'DailyTodo 的自动识别会尝试常见 URL 变体；如果仍失败，请检查中转站文档里的 Base URL。',
      `原始返回 ${status}：${snippet}`,
    ].join('\n');
  }

  if (status === 401 || status === 403) {
    return [
      'LLM 鉴权失败：API Key 无效、无权限、余额不足，或当前服务限制了访问。',
      '请确认 Key 属于当前 Base URL 对应的服务商，不要混用官方 Key 和中转站 URL。',
      `原始返回 ${status}：${snippet}`,
    ].join('\n');
  }

  return `LLM 返回 ${status}：${snippet}`;
}
```

Replace the non-OK branch inside `callChatCompletion`:

```ts
if (!res.ok) {
  const body = await res.text().catch(() => '');
  return { ok: false, error: diagnoseHttpError(res.status, body) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run from `app/`:

```bash
npm run verify:openai-client
```

Expected: PASS, including existing 401 assertion because the new diagnostic still includes `401`.

- [ ] **Step 5: Commit**

```bash
git add app/shared/llm/openaiClient.ts app/scripts/verify-openai-client.ts
git commit -m "fix(ai-review): explain LLM endpoint and auth failures"
```

## Task 3: Add Robust Text Extraction and Usage-Only Stream Diagnostics

**Files:**
- Modify: `app/shared/llm/openaiClient.ts`
- Modify: `app/scripts/verify-openai-client.ts`

- [ ] **Step 1: Add failing tests for nonstandard fields and usage-only SSE**

Append this block after the existing SSE tests in `app/scripts/verify-openai-client.ts` around lines 69-101:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run from `app/`:

```bash
npm run verify:openai-client
```

Expected: FAIL on `choices[0].text` or `output_text` parsing.

- [ ] **Step 3: Implement text extraction helpers**

In `app/shared/llm/openaiClient.ts`, add these helpers before `buildRequest`:

```ts
function textFromValue(value: any): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === 'string') return part;
        if (typeof part?.text === 'string') return part.text;
        if (typeof part?.content === 'string') return part.content;
        return '';
      })
      .join('');
  }
  return '';
}

function firstText(...values: any[]): string | undefined {
  for (const value of values) {
    const text = textFromValue(value).trim();
    if (text) return text;
  }
  return undefined;
}

function extractOpenAiChoiceText(choice: any): string | undefined {
  return firstText(
    choice?.delta?.content,
    choice?.delta?.text,
    choice?.message?.content,
    choice?.text,
  );
}

function extractOpenAiTopLevelText(data: any): string | undefined {
  return firstText(data?.content, data?.text, data?.response, data?.output_text);
}

function isUsageOnlyStream(events: any[]): boolean {
  return events.some((e) => e?.usage && Array.isArray(e?.choices) && e.choices.length === 0)
    && events.every((e) => !extractOpenAiChoiceText(e?.choices?.[0]) && !extractOpenAiTopLevelText(e));
}

function usageOnlyStreamError(events: any[]): string {
  const withUsage = events.find((e) => e?.usage)?.usage ?? {};
  const promptTokens = Number.isFinite(Number(withUsage.prompt_tokens)) ? Number(withUsage.prompt_tokens) : undefined;
  const promptLine = promptTokens ? `本次输入约 ${promptTokens} tokens。` : '服务商没有返回可用正文。';
  return [
    `模型没有返回正文，只返回了 token 用量统计。${promptLine}`,
    '可能原因：模型不支持当前生成接口、模型名不可用、输入过长、中转站异常，或账号余额/权限限制。',
    '建议先用设置里的模型列表或短文本测试；如果短文本可以，再换长上下文模型或减少复盘输入内容。',
  ].join('\n');
}
```

- [ ] **Step 4: Use helpers in OpenAI parse/aggregate**

In the OpenAI-compatible branch of `buildRequest`, replace the existing `parse` with:

```ts
parse: (data) => {
  const choice = data?.choices?.[0];
  return extractOpenAiChoiceText(choice) ?? extractOpenAiTopLevelText(data);
},
```

Replace the OpenAI-compatible `aggregate` loop with:

```ts
aggregate: (events) => {
  let content = '';
  let truncated = false;
  for (const e of events) {
    const choice = e?.choices?.[0];
    const piece = extractOpenAiChoiceText(choice) ?? extractOpenAiTopLevelText(e);
    if (piece) content += piece;
    if (choice?.finish_reason) truncated = choice.finish_reason === 'length';
  }
  return { content: content.trim(), truncated };
},
```

- [ ] **Step 5: Use usage-only diagnostic in SSE empty branch**

In `callChatCompletion`, inside `if (looksSse)`, before computing `last`, insert:

```ts
if (isUsageOnlyStream(events)) {
  return { ok: false, error: usageOnlyStreamError(events) };
}
```

The branch should become:

```ts
if (looksSse) {
  const events = parseSse(text);
  const agg = req.aggregate(events);
  if (!agg.content) {
    if (isUsageOnlyStream(events)) {
      return { ok: false, error: usageOnlyStreamError(events) };
    }
    const last = events.length ? JSON.stringify(events[events.length - 1]).slice(0, 300) : text.slice(0, 300);
    return { ok: false, error: `LLM 返回空内容（流式，${events.length} 段）。末段：${last}` };
  }
  return { ok: true, content: agg.content, truncated: agg.truncated };
}
```

- [ ] **Step 6: Run test to verify it passes**

Run from `app/`:

```bash
npm run verify:openai-client
```

Expected: PASS; nonstandard JSON/SSE text extraction and usage-only diagnostics pass.

- [ ] **Step 7: Commit**

```bash
git add app/shared/llm/openaiClient.ts app/scripts/verify-openai-client.ts
git commit -m "fix(ai-review): parse relay LLM response variants"
```

## Task 4: Make provider=auto Try Candidate Requests Sequentially

**Files:**
- Modify: `app/shared/llm/openaiClient.ts`
- Modify: `app/scripts/verify-openai-client.ts`

- [ ] **Step 1: Add failing tests for auto retry and explicit-provider behavior**

Append this block after the candidate tests in `app/scripts/verify-openai-client.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run from `app/`:

```bash
npm run verify:openai-client
```

Expected: FAIL because `provider=auto` still resolves to one provider/base URL and does not retry `/v1`.

- [ ] **Step 3: Extract one-attempt request helper**

In `app/shared/llm/openaiClient.ts`, replace the body of `callChatCompletion` with a wrapper and move the current fetch logic into a new helper.

Add this helper before `callChatCompletion`:

```ts
async function callChatCompletionOnce(
  config: LlmConfig,
  messages: ChatMessage[],
  provider: LlmProvider,
  options: CallOptions,
): Promise<LlmResult> {
  const req = buildRequest(provider, config, messages);
  const doFetch = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs ?? 30_000);

  try {
    const res = await doFetch(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: diagnoseHttpError(res.status, body) };
    }

    const text = await res.text();
    const contentType = (res.headers?.get?.('content-type') ?? '').toLowerCase();
    const looksSse = contentType.includes('event-stream') || /^\s*data:/.test(text);

    if (looksSse) {
      const events = parseSse(text);
      const agg = req.aggregate(events);
      if (!agg.content) {
        if (isUsageOnlyStream(events)) {
          return { ok: false, error: usageOnlyStreamError(events) };
        }
        const last = events.length ? JSON.stringify(events[events.length - 1]).slice(0, 300) : text.slice(0, 300);
        return { ok: false, error: `LLM 返回空内容（流式，${events.length} 段）。末段：${last}` };
      }
      return { ok: true, content: agg.content, truncated: agg.truncated };
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, error: `LLM 返回非 JSON：${text.slice(0, 200)}` };
    }
    const content = req.parse(data);
    if (!content) return { ok: false, error: `LLM 返回空内容。原始：${JSON.stringify(data).slice(0, 300)}` };
    return { ok: true, content, truncated: req.truncated(data) };
  } catch (error) {
    if (timedOut) return { ok: false, error: `请求超时（${options.timeoutMs ?? 30_000}ms）` };
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}
```

Then replace `callChatCompletion` with:

```ts
export async function callChatCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  options: CallOptions = {},
): Promise<LlmResult> {
  if (!config.apiKey) return { ok: false, error: '缺少 API Key（请在设置中填写）' };
  if (!config.baseUrl) return { ok: false, error: '缺少 base_url' };

  if (options.provider && options.provider !== 'auto') {
    return callChatCompletionOnce(config, messages, options.provider, options);
  }

  const candidates = buildAutoCandidates(config.baseUrl);
  const errors: string[] = [];
  for (const candidate of candidates) {
    const result = await callChatCompletionOnce(
      { ...config, baseUrl: candidate.baseUrl },
      messages,
      candidate.provider,
      options,
    );
    if (result.ok) return result;
    errors.push(`${candidate.provider} ${candidate.baseUrl}: ${result.error}`);
  }

  if (!errors.length) return { ok: false, error: '缺少 base_url' };
  return { ok: false, error: summarizeAutoErrors(errors) };
}
```

- [ ] **Step 4: Add auto error summarizer**

Add this helper before `callChatCompletionOnce`:

```ts
function summarizeAutoErrors(errors: string[]): string {
  const joined = errors.join('\n---\n');
  if (joined.includes('只返回了 token 用量统计')) {
    return joined.split('\n---\n').find((e) => e.includes('只返回了 token 用量统计')) ?? joined.slice(0, 1200);
  }
  if (joined.includes('Claude Code 官方客户端专用')) {
    return joined.split('\n---\n').find((e) => e.includes('Claude Code 官方客户端专用')) ?? joined.slice(0, 1200);
  }
  if (joined.includes('没有找到请求路径')) {
    return [
      '自动识别已尝试常见协议和 URL 变体，但都没有成功。',
      '主要失败原因：LLM 接口没有找到请求路径。请检查中转站文档里的 Base URL，通常应填到 /v1。',
      '尝试记录：',
      joined.slice(0, 1200),
    ].join('\n');
  }
  return [
    '自动识别已尝试常见协议和 URL 变体，但都没有成功。',
    '请确认 Base URL、API Key、模型名属于同一个服务商或中转站。',
    '尝试记录：',
    joined.slice(0, 1200),
  ].join('\n');
}
```

- [ ] **Step 5: Run test to verify it passes**

Run from `app/`:

```bash
npm run verify:openai-client
```

Expected: PASS. The auto retry test should show first `https://relay.example/chat/completions`, then `https://relay.example/v1/chat/completions`.

- [ ] **Step 6: Commit**

```bash
git add app/shared/llm/openaiClient.ts app/scripts/verify-openai-client.ts
git commit -m "feat(ai-review): auto-detect LLM endpoint variants"
```

## Task 5: Verify Full App Type Safety and Update Setting Hint If Needed

**Files:**
- Modify: `app/src/i18n.ts` only if hint text still says auto is only URL guessing.
- Test: `app/package.json` scripts already include `typecheck` and `verify:openai-client`.

- [ ] **Step 1: Inspect current hint text**

Check `app/src/i18n.ts` around the `providerHint` strings. If Chinese still says only “按 URL 判断”, change it to:

```ts
providerHint: '“自动识别”会尝试常见协议和 URL 变体。DeepSeek/GPT/GLM/MiniMax/大多数中转站都建议选自动；只有你明确知道接口协议时才手动指定。',
```

Change the English string to:

```ts
providerHint: 'Auto tries common protocols and URL variants. DeepSeek/GPT/GLM/MiniMax/most relays should use Auto; choose a protocol manually only when you know the endpoint requires it.',
```

- [ ] **Step 2: Run OpenAI client verification**

Run from `app/`:

```bash
npm run verify:openai-client
```

Expected: `OpenAI client verification passed`.

- [ ] **Step 3: Run TypeScript typecheck**

Run from `app/`:

```bash
npm run typecheck
```

Expected: TypeScript exits successfully with no errors.

- [ ] **Step 4: Commit final integration**

If `app/src/i18n.ts` changed:

```bash
git add app/src/i18n.ts
git commit -m "chore(ai-review): clarify auto LLM protocol hint"
```

If `app/src/i18n.ts` did not change, skip this commit.

## Task 6: Manual Acceptance Checklist

**Files:**
- No code changes expected.

- [ ] **Step 1: Review behavior for the user's relay configuration**

Use this mental/request trace for the screenshot configuration:

```text
Provider: auto
Base URL: https://token.offerya.cc/v1
Model: gpt-5.5
```

Expected first OpenAI-compatible candidate request URL:

```text
https://token.offerya.cc/v1/chat/completions
```

If the relay returns usage-only SSE like:

```json
{"choices":[],"usage":{"prompt_tokens":24403,"completion_tokens":0,"total_tokens":24403}}
```

Expected user-facing error includes:

```text
模型没有返回正文，只返回了 token 用量统计。本次输入约 24403 tokens。
```

- [ ] **Step 2: Review behavior for missing `/v1` relay configuration**

For:

```text
Provider: auto
Base URL: https://token.offerya.cc
```

Expected request order begins:

```text
https://token.offerya.cc/chat/completions
https://token.offerya.cc/v1/chat/completions
```

If the second succeeds, AI Review succeeds without user changing the URL.

- [ ] **Step 3: Review explicit provider behavior**

For:

```text
Provider: OpenAI compatible
Base URL: https://token.offerya.cc
```

Expected request order contains only:

```text
https://token.offerya.cc/chat/completions
```

This preserves explicit user choice.

- [ ] **Step 4: Final status report**

Report:

```text
Implemented auto LLM endpoint compatibility for AI Review.
Verified with npm run verify:openai-client and npm run typecheck.
```

If either command fails, report the exact failing command and error instead of claiming completion.

## Self-Review Notes

- Spec coverage: Tasks cover auto candidates, URL repair, protocol ordering, standard and nonstandard response parsing, usage-only stream diagnostics, Claude Code restricted diagnostics, 404/auth diagnostics, explicit-provider preservation, tests, and hint text.
- Placeholder scan: No `TBD`, `TODO`, “similar to”, or vague “add error handling” steps remain. Each code-changing step includes concrete code.
- Type consistency: New exports are `AutoCandidate` and `buildAutoCandidates`; existing `LlmProvider`, `LlmConfig`, `LlmResult`, `CallOptions` remain unchanged. `provider='auto'` continues using the existing `CallOptions` type.
