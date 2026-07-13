import type { ChatMessage, LlmConfig, LlmProvider } from './openaiClient';
import { createProviderResponseParser, parseModelList } from './llmProviderResponseParsing';
export { extractSseUsage, extractUsage, isUsageOnlyStream, parseModelList, parseSse } from './llmProviderResponseParsing';
export { buildAutoCandidates, detectProvider } from './llmProviderDiscovery';

const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MAX_TOKENS = 8192;

export interface ProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: unknown;
  parse: (data: unknown) => string | undefined;
  truncated: (data: unknown) => boolean;
  aggregate: (events: unknown[]) => { content: string; truncated: boolean };
}

export interface ModelsRequest {
  url: string;
  headers: Record<string, string>;
  parse: (data: unknown) => string[];
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function splitSystem(messages: ChatMessage[]): { system: string; turns: ChatMessage[] } {
  const systemParts: string[] = [];
  const turns: ChatMessage[] = [];
  for (const message of messages) {
    if (message.role === 'system') systemParts.push(message.content);
    else turns.push(message);
  }
  return { system: systemParts.join('\n\n'), turns };
}

export function buildProviderRequest(provider: LlmProvider, config: LlmConfig, messages: ChatMessage[]): ProviderRequest {
  const base = trimSlash(config.baseUrl);
  const maxTokens = config.maxTokens && config.maxTokens > 0 ? config.maxTokens : DEFAULT_MAX_TOKENS;
  if (provider === 'anthropic') {
    const { system, turns } = splitSystem(messages);
    const parser = createProviderResponseParser(provider);
    return {
      url: `${base.replace(/\/v1$/, '')}/v1/messages`,
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey, 'anthropic-version': ANTHROPIC_VERSION },
      body: { model: config.model, max_tokens: maxTokens, ...(system ? { system } : {}), messages: turns.map((message) => ({ role: message.role, content: message.content })) },
      ...parser,
    };
  }
  if (provider === 'gemini') {
    const { system, turns } = splitSystem(messages);
    const parser = createProviderResponseParser(provider);
    return {
      url: `${base.replace(/\/v1beta$/, '')}/v1beta/models/${config.model}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
      headers: { 'Content-Type': 'application/json' },
      body: { ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}), contents: turns.map((message) => ({ role: message.role === 'user' ? 'user' : 'model', parts: [{ text: message.content }] })), generationConfig: { maxOutputTokens: maxTokens } },
      ...parser,
    };
  }
  return {
    url: `${base}/chat/completions`,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
    body: { model: config.model, messages, temperature: 0.7, max_tokens: maxTokens },
    ...createProviderResponseParser(provider),
  };
}

export function buildModelsRequest(provider: LlmProvider, config: LlmConfig): ModelsRequest {
  const base = trimSlash(config.baseUrl);
  if (provider === 'anthropic') return { url: `${base.replace(/\/v1$/, '')}/v1/models`, headers: { 'x-api-key': config.apiKey, 'anthropic-version': ANTHROPIC_VERSION }, parse: (data) => parseModelList('anthropic', data) };
  if (provider === 'gemini') return { url: `${base.replace(/\/v1beta$/, '')}/v1beta/models?key=${encodeURIComponent(config.apiKey)}`, headers: {}, parse: (data) => parseModelList('gemini', data) };
  return { url: `${base}/models`, headers: { Authorization: `Bearer ${config.apiKey}` }, parse: (data) => parseModelList('openai', data) };
}
