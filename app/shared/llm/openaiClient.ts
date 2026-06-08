export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export type LlmProvider = 'openai' | 'anthropic' | 'gemini';

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  /** 输出 token 上限。空 → DEFAULT_MAX_TOKENS。三种协议统一应用。 */
  maxTokens?: number;
}

export type LlmResult = { ok: true; content: string; truncated?: boolean } | { ok: false; error: string };

export interface CallOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** 显式指定协议；不给则按 baseUrl 自动识别。 */
  provider?: LlmProvider | 'auto';
}

export interface AutoCandidate {
  provider: LlmProvider;
  baseUrl: string;
}

const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MAX_TOKENS = 8192;

/** 按 baseUrl 自动识别使用哪种 API 协议。未知一律按 OpenAI 兼容（覆盖绝大多数中转站）。 */
export function detectProvider(baseUrl: string): LlmProvider {
  const url = (baseUrl || '').toLowerCase();
  // Gemini 的 OpenAI 兼容端点（.../openai 或 .../openai/...）仍走 openai 协议。
  if (url.includes('generativelanguage.googleapis.com') && !url.includes('openai')) return 'gemini';
  if (url.includes('api.anthropic.com') || url.includes('/anthropic')) return 'anthropic';
  return 'openai';
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

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

/** 把内部 ChatMessage 拆成 (systemText, 非 system 的对话轮) —— Anthropic/Gemini 都需要把 system 单独拎出来。 */
function splitSystem(messages: ChatMessage[]): { system: string; turns: ChatMessage[] } {
  const sys = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const turns = messages.filter((m) => m.role !== 'system');
  return { system: sys, turns };
}

interface ProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: unknown;
  parse: (data: any) => string | undefined;
  /** 是否因输出上限被截断（finish_reason=length / stop_reason=max_tokens / finishReason=MAX_TOKENS）。 */
  truncated: (data: any) => boolean;
  /** 把 SSE 流的多条事件聚合成完整结果（中转站返回 text/event-stream 时走这里）。 */
  aggregate: (events: any[]) => { content: string; truncated: boolean };
}

/** 解析 SSE 文本：逐行取 `data:` 负载，跳过空行和 [DONE]，每条尝试 JSON.parse。 */
export function parseSse(raw: string): any[] {
  const events: any[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith('data:')) continue;
    const payload = t.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      events.push(JSON.parse(payload));
    } catch {
      /* 半条/非 JSON 行忽略 */
    }
  }
  return events;
}

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

function firstTextPreserveWhitespace(...values: any[]): string | undefined {
  for (const value of values) {
    const text = textFromValue(value);
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

function extractOpenAiChoiceTextChunk(choice: any): string | undefined {
  return firstTextPreserveWhitespace(
    choice?.delta?.content,
    choice?.delta?.text,
    choice?.message?.content,
    choice?.text,
  );
}

function extractOpenAiTopLevelText(data: any): string | undefined {
  return firstText(data?.content, data?.text, data?.response, data?.output_text);
}

function extractOpenAiTopLevelTextChunk(data: any): string | undefined {
  return firstTextPreserveWhitespace(data?.content, data?.text, data?.response, data?.output_text);
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

function buildRequest(provider: LlmProvider, config: LlmConfig, messages: ChatMessage[]): ProviderRequest {
  const base = trimSlash(config.baseUrl);
  const maxTokens = config.maxTokens && config.maxTokens > 0 ? config.maxTokens : DEFAULT_MAX_TOKENS;

  if (provider === 'anthropic') {
    const { system, turns } = splitSystem(messages);
    return {
      url: `${base.replace(/\/v1$/, '')}/v1/messages`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: {
        model: config.model,
        max_tokens: maxTokens,
        ...(system ? { system } : {}),
        messages: turns.map((m) => ({ role: m.role, content: m.content })),
      },
      parse: (data) =>
        Array.isArray(data?.content)
          ? data.content.map((p: any) => p?.text ?? '').join('').trim()
          : undefined,
      truncated: (data) => data?.stop_reason === 'max_tokens',
      // Anthropic 流式：content_block_delta 累加 text，message_delta 带 stop_reason。
      aggregate: (events) => {
        let content = '';
        let truncated = false;
        for (const e of events) {
          if (e?.type === 'content_block_delta') content += e?.delta?.text ?? '';
          const stop = e?.delta?.stop_reason ?? e?.stop_reason;
          if (stop) truncated = stop === 'max_tokens';
        }
        return { content: content.trim(), truncated };
      },
    };
  }

  if (provider === 'gemini') {
    const { system, turns } = splitSystem(messages);
    return {
      url: `${base.replace(/\/v1beta$/, '')}/v1beta/models/${config.model}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents: turns.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: maxTokens },
      },
      parse: (data) =>
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('').trim(),
      truncated: (data) => data?.candidates?.[0]?.finishReason === 'MAX_TOKENS',
      // Gemini 流式：每个 chunk 同样是 candidates[0].content.parts。
      aggregate: (events) => {
        let content = '';
        let truncated = false;
        for (const e of events) {
          const cand = e?.candidates?.[0];
          content += cand?.content?.parts?.map((p: any) => p?.text ?? '').join('') ?? '';
          if (cand?.finishReason) truncated = cand.finishReason === 'MAX_TOKENS';
        }
        return { content: content.trim(), truncated };
      },
    };
  }

  // openai 兼容
  return {
    url: `${base}/chat/completions`,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
    body: { model: config.model, messages, temperature: 0.7, max_tokens: maxTokens },
    parse: (data) => {
      const choice = data?.choices?.[0];
      return extractOpenAiChoiceText(choice) ?? extractOpenAiTopLevelText(data);
    },
    truncated: (data) => data?.choices?.[0]?.finish_reason === 'length',
    // 流式：拼接每个 chunk 的正文（reasoning_content 是思考过程，不计入正文）。
    aggregate: (events) => {
      let content = '';
      let truncated = false;
      for (const e of events) {
        const choice = e?.choices?.[0];
        const piece = extractOpenAiChoiceTextChunk(choice) ?? extractOpenAiTopLevelTextChunk(e);
        if (piece) content += piece;
        if (choice?.finish_reason) truncated = choice.finish_reason === 'length';
      }
      return { content: content.trim(), truncated };
    },
  };
}

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
  if (joined.includes('空内容')) {
    return joined.split('\n---\n').find((e) => e.includes('空内容')) ?? joined.slice(0, 1200);
  }
  return [
    '自动识别已尝试常见协议和 URL 变体，但都没有成功。',
    '请确认 Base URL、API Key、模型名属于同一个服务商或中转站。',
    '尝试记录：',
    joined.slice(0, 1200),
  ].join('\n');
}

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
    // 有的中转站无视 stream:false，仍返回 text/event-stream。统一读成文本，再按格式分流。
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
        // 把最后一个事件的结构透出来，便于定位（如 gpt-5 把正文放在非常规字段、或 finish_reason 异常）。
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

export type ListModelsResult = { ok: true; models: string[] } | { ok: false; error: string };

interface ModelsRequest {
  url: string;
  headers: Record<string, string>;
  parse: (data: any) => string[];
}

/** 从各家 /models 响应里抽出模型 id 列表。导出供单测。 */
export function parseModelList(provider: LlmProvider, data: any): string[] {
  if (provider === 'gemini') {
    // { models: [{ name: "models/gemini-1.5-flash" }] }
    const arr = Array.isArray(data?.models) ? data.models : [];
    return arr
      .map((m: any) => (typeof m?.name === 'string' ? m.name.replace(/^models\//, '') : ''))
      .filter(Boolean);
  }
  // openai 兼容 & anthropic 都是 { data: [{ id }] }
  const arr = Array.isArray(data?.data) ? data.data : [];
  return arr.map((m: any) => (typeof m?.id === 'string' ? m.id : '')).filter(Boolean);
}

function buildModelsRequest(provider: LlmProvider, config: LlmConfig): ModelsRequest {
  const base = trimSlash(config.baseUrl);
  if (provider === 'anthropic') {
    return {
      url: `${base.replace(/\/v1$/, '')}/v1/models`,
      headers: { 'x-api-key': config.apiKey, 'anthropic-version': ANTHROPIC_VERSION },
      parse: (data) => parseModelList('anthropic', data),
    };
  }
  if (provider === 'gemini') {
    return {
      url: `${base.replace(/\/v1beta$/, '')}/v1beta/models?key=${encodeURIComponent(config.apiKey)}`,
      headers: {},
      parse: (data) => parseModelList('gemini', data),
    };
  }
  return {
    url: `${base}/models`,
    headers: { Authorization: `Bearer ${config.apiKey}` },
    parse: (data) => parseModelList('openai', data),
  };
}

async function listModelsOnce(
  config: LlmConfig,
  provider: LlmProvider,
  options: CallOptions,
): Promise<ListModelsResult> {
  const req = buildModelsRequest(provider, config);
  const doFetch = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs ?? 30_000);

  try {
    const res = await doFetch(req.url, { method: 'GET', headers: req.headers, signal: controller.signal });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `获取模型列表失败 ${res.status}：${body.slice(0, 200)}` };
    }
    const data = await res.json();
    const models = req.parse(data);
    if (!models.length) return { ok: false, error: '该接口未返回可用模型，请手动填写' };
    return { ok: true, models: Array.from(new Set(models)).sort() };
  } catch (error) {
    if (timedOut) return { ok: false, error: `请求超时（${options.timeoutMs ?? 30_000}ms）` };
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

/** 拉取账号可用模型列表。失败（含网络/鉴权/不支持）一律归一化为 ok:false，由 UI 回落手填。 */
export async function listModels(config: LlmConfig, options: CallOptions = {}): Promise<ListModelsResult> {
  if (!config.apiKey) return { ok: false, error: '缺少 API Key（请在设置中填写）' };
  if (!config.baseUrl) return { ok: false, error: '缺少 base_url' };

  if (options.provider && options.provider !== 'auto') {
    return listModelsOnce(config, options.provider, options);
  }

  const candidates = buildAutoCandidates(config.baseUrl);
  const errors: string[] = [];
  for (const candidate of candidates) {
    const result = await listModelsOnce({ ...config, baseUrl: candidate.baseUrl }, candidate.provider, options);
    if (result.ok) return result;
    errors.push(`${candidate.provider} ${candidate.baseUrl}: ${result.error}`);
  }

  return { ok: false, error: errors[0] ?? '该接口未返回可用模型，请手动填写' };
}
