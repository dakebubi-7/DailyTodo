export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export type LlmResult = { ok: true; content: string } | { ok: false; error: string };

export interface CallOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function callChatCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  options: CallOptions = {},
): Promise<LlmResult> {
  if (!config.apiKey) return { ok: false, error: '缺少 API Key（请在设置中填写）' };
  if (!config.baseUrl) return { ok: false, error: '缺少 base_url' };

  const doFetch = options.fetchImpl ?? fetch;
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs ?? 30_000);

  try {
    const res = await doFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.model, messages, temperature: 0.7 }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `LLM 返回 ${res.status}：${body.slice(0, 200)}` };
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return { ok: false, error: 'LLM 返回空内容' };
    return { ok: true, content };
  } catch (error) {
    if (timedOut) return { ok: false, error: `请求超时（${options.timeoutMs ?? 30_000}ms）` };
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}
