export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export type LlmProvider = 'openai' | 'anthropic' | 'gemini';

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export type LlmResult = { ok: true; content: string } | { ok: false; error: string };

export interface CallOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** 显式指定协议；不给则按 baseUrl 自动识别。 */
  provider?: LlmProvider | 'auto';
}

const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MAX_TOKENS = 4096;

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
}

function buildRequest(provider: LlmProvider, config: LlmConfig, messages: ChatMessage[]): ProviderRequest {
  const base = trimSlash(config.baseUrl);

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
        max_tokens: DEFAULT_MAX_TOKENS,
        ...(system ? { system } : {}),
        messages: turns.map((m) => ({ role: m.role, content: m.content })),
      },
      parse: (data) =>
        Array.isArray(data?.content)
          ? data.content.map((p: any) => p?.text ?? '').join('').trim()
          : undefined,
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
      },
      parse: (data) =>
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('').trim(),
    };
  }

  // openai 兼容
  return {
    url: `${base}/chat/completions`,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
    body: { model: config.model, messages, temperature: 0.7 },
    parse: (data) => data?.choices?.[0]?.message?.content?.trim(),
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
    const data = await res.json();
    const content = req.parse(data);
    if (!content) return { ok: false, error: 'LLM 返回空内容' };
    return { ok: true, content };
  } catch (error) {
    if (timedOut) return { ok: false, error: `请求超时（${options.timeoutMs ?? 30_000}ms）` };
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}
