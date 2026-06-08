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
      const msg = data?.choices?.[0]?.message;
      const c = msg?.content;
      // content 可能是字符串，也可能是分段数组（[{type,text}]）。
      if (typeof c === 'string') return c.trim();
      if (Array.isArray(c)) return c.map((p: any) => (typeof p === 'string' ? p : p?.text ?? '')).join('').trim();
      return undefined;
    },
    truncated: (data) => data?.choices?.[0]?.finish_reason === 'length',
    // 流式：拼接每个 chunk 的 delta.content（reasoning_content 是思考过程，不计入正文）。
    aggregate: (events) => {
      let content = '';
      let truncated = false;
      for (const e of events) {
        const choice = e?.choices?.[0];
        const delta = choice?.delta;
        const piece = delta?.content ?? choice?.message?.content;
        if (typeof piece === 'string') content += piece;
        else if (Array.isArray(piece)) content += piece.map((p: any) => (typeof p === 'string' ? p : p?.text ?? '')).join('');
        if (choice?.finish_reason) truncated = choice.finish_reason === 'length';
      }
      return { content: content.trim(), truncated };
    },
  };
}

export async function callChatCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  options: CallOptions = {},
): Promise<LlmResult> {
  if (!config.apiKey) return { ok: false, error: '缺少 API Key（请在设置中填写）' };
  if (!config.baseUrl) return { ok: false, error: '缺少 base_url' };

  const provider: LlmProvider =
    options.provider && options.provider !== 'auto' ? options.provider : detectProvider(config.baseUrl);
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
      return { ok: false, error: `LLM 返回 ${res.status}：${body.slice(0, 200)}` };
    }
    // 有的中转站无视 stream:false，仍返回 text/event-stream。统一读成文本，再按格式分流。
    const text = await res.text();
    const contentType = (res.headers?.get?.('content-type') ?? '').toLowerCase();
    const looksSse = contentType.includes('event-stream') || /^\s*data:/.test(text);

    if (looksSse) {
      const events = parseSse(text);
      const agg = req.aggregate(events);
      if (!agg.content) {
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

/** 拉取账号可用模型列表。失败（含网络/鉴权/不支持）一律归一化为 ok:false，由 UI 回落手填。 */
export async function listModels(config: LlmConfig, options: CallOptions = {}): Promise<ListModelsResult> {
  if (!config.apiKey) return { ok: false, error: '缺少 API Key（请在设置中填写）' };
  if (!config.baseUrl) return { ok: false, error: '缺少 base_url' };

  const provider: LlmProvider =
    options.provider && options.provider !== 'auto' ? options.provider : detectProvider(config.baseUrl);
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
