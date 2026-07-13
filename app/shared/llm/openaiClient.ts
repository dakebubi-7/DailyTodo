import type { AiReviewTokenUsage } from '../aiReview/runDiagnostics';
import { callChatCompletionOnce as callChatCompletionTransport, listModelsOnce as listModelsTransport } from './llmClientTransport';
import { createChatTransportErrors, createModelTransportErrors, summarizeAutoErrors } from './llmClientErrorMessages';
import type { ListModelsResult } from './llmModelListResultReader';

export { readListModelsResult, type ListModelsResult } from './llmModelListResultReader';

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

export interface LlmDiagnostics {
  provider: LlmProvider;
  baseUrl: string;
  durationMs: number;
  usage?: AiReviewTokenUsage;
}

export type LlmResult =
  | { ok: true; content: string; truncated?: boolean; diagnostics?: LlmDiagnostics }
  | { ok: false; error: string; diagnostics?: Partial<LlmDiagnostics> };

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

import { buildAutoCandidates } from './llmProviderProtocol';
export { buildAutoCandidates, detectProvider, parseModelList, parseSse } from './llmProviderProtocol';

const chatTransportErrors = createChatTransportErrors();
const modelTransportErrors = createModelTransportErrors();

export async function callChatCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  options: CallOptions = {},
): Promise<LlmResult> {
  if (!config.apiKey) return { ok: false, error: '缺少 API Key（请在设置中填写）' };
  if (!config.baseUrl) return { ok: false, error: '缺少 base_url' };

  if (options.provider && options.provider !== 'auto') {
    return callChatCompletionTransport(config, messages, options.provider, options, chatTransportErrors);
  }

  const candidates = buildAutoCandidates(config.baseUrl);
  const errors: string[] = [];
  for (const candidate of candidates) {
    const result = await callChatCompletionTransport(
      { ...config, baseUrl: candidate.baseUrl },
      messages,
      candidate.provider,
      options,
      chatTransportErrors,
    );
    if (result.ok) return result;
    errors.push(`${candidate.provider} ${candidate.baseUrl}: ${result.error}`);
  }

  if (!errors.length) return { ok: false, error: '缺少 base_url' };
  return { ok: false, error: summarizeAutoErrors(errors) };
}

/** 拉取账号可用模型列表。失败（含网络/鉴权/不支持）一律归一化为 ok:false，由 UI 回落手填。 */
export async function listModels(config: LlmConfig, options: CallOptions = {}): Promise<ListModelsResult> {
  if (!config.apiKey) return { ok: false, error: '缺少 API Key（请在设置中填写）' };
  if (!config.baseUrl) return { ok: false, error: '缺少 base_url' };

  if (options.provider && options.provider !== 'auto') {
    return listModelsTransport(config, options.provider, options, modelTransportErrors);
  }

  const candidates = buildAutoCandidates(config.baseUrl);
  const errors: string[] = [];
  for (const candidate of candidates) {
    const result = await listModelsTransport({ ...config, baseUrl: candidate.baseUrl }, candidate.provider, options, modelTransportErrors);
    if (result.ok) return result;
    errors.push(`${candidate.provider} ${candidate.baseUrl}: ${result.error}`);
  }

  return { ok: false, error: errors[0] ?? '该接口未返回可用模型，请手动填写' };
}
