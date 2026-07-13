import type { AiReviewTokenUsage } from '../aiReview/runDiagnostics';
import type { CallOptions, ChatMessage, LlmConfig, LlmDiagnostics, LlmProvider, LlmResult, ListModelsResult } from './openaiClient';
import { buildModelsRequest, buildProviderRequest, extractSseUsage, extractUsage, isUsageOnlyStream, parseSse } from './llmProviderProtocol';

export interface ChatTransportErrorFormatters {
  diagnoseHttpError: (status: number, body: string) => string;
  usageOnlyStreamError: (events: unknown[]) => string;
  emptyStreamError: (events: unknown[], raw: string) => string;
  nonJsonError: (raw: string) => string;
  emptyContentError: (data: unknown) => string;
  timeoutError: (timeoutMs: number) => string;
}

export interface ModelTransportErrorFormatters {
  httpError: (status: number, body: string) => string;
  emptyModelsError: string;
  timeoutError: (timeoutMs: number) => string;
}

export async function callChatCompletionOnce(
  config: LlmConfig,
  messages: ChatMessage[],
  provider: LlmProvider,
  options: CallOptions,
  errors: ChatTransportErrorFormatters,
): Promise<LlmResult> {
  const req = buildProviderRequest(provider, config, messages);
  const started = Date.now();
  const diagnostics = (usage?: AiReviewTokenUsage): LlmDiagnostics => ({
    provider,
    baseUrl: config.baseUrl,
    durationMs: Date.now() - started,
    usage: usage ?? { source: 'missing' },
  });
  const doFetch = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  let timedOut = false;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);

  try {
    const res = await doFetch(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: errors.diagnoseHttpError(res.status, body), diagnostics: diagnostics() };
    }
    const text = await res.text();
    const contentType = (res.headers?.get?.('content-type') ?? '').toLowerCase();
    const looksSse = contentType.includes('event-stream') || /^\s*data:/.test(text);

    if (looksSse) {
      const events = parseSse(text);
      const aggregate = req.aggregate(events);
      if (!aggregate.content) {
        const usage = extractSseUsage(provider, events);
        return isUsageOnlyStream(events)
          ? { ok: false, error: errors.usageOnlyStreamError(events), diagnostics: diagnostics(usage) }
          : { ok: false, error: errors.emptyStreamError(events, text), diagnostics: diagnostics(usage) };
      }
      return { ok: true, content: aggregate.content, truncated: aggregate.truncated, diagnostics: diagnostics(extractSseUsage(provider, events)) };
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, error: errors.nonJsonError(text), diagnostics: diagnostics() };
    }
    const usage = extractUsage(provider, data);
    const content = req.parse(data);
    return content
      ? { ok: true, content, truncated: req.truncated(data), diagnostics: diagnostics(usage) }
      : { ok: false, error: errors.emptyContentError(data), diagnostics: diagnostics(usage) };
  } catch (error) {
    return timedOut
      ? { ok: false, error: errors.timeoutError(timeoutMs), diagnostics: diagnostics() }
      : { ok: false, error: error instanceof Error ? error.message : String(error), diagnostics: diagnostics() };
  } finally {
    clearTimeout(timer);
  }
}

export async function listModelsOnce(
  config: LlmConfig,
  provider: LlmProvider,
  options: CallOptions,
  errors: ModelTransportErrorFormatters,
): Promise<ListModelsResult> {
  const req = buildModelsRequest(provider, config);
  const doFetch = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  let timedOut = false;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);

  try {
    const res = await doFetch(req.url, { method: 'GET', headers: req.headers, signal: controller.signal });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: errors.httpError(res.status, body) };
    }
    const data: unknown = await res.json();
    const models = req.parse(data);
    return models.length
      ? { ok: true, models: Array.from(new Set(models)).sort() }
      : { ok: false, error: errors.emptyModelsError };
  } catch (error) {
    return timedOut
      ? { ok: false, error: errors.timeoutError(timeoutMs) }
      : { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}
