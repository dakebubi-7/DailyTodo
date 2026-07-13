import { isObjectRecord } from '../unknownValueGuards';
import type { LlmProvider } from './openaiClient';
import { firstText, firstTextPreserveWhitespace, textFromTextParts } from './llmProviderTextValues';
export { extractSseUsage, extractUsage, isUsageOnlyStream, parseModelList } from './llmProviderResponseMetadata';

export interface ProviderResponseParser {
  parse: (data: unknown) => string | undefined;
  truncated: (data: unknown) => boolean;
  aggregate: (events: unknown[]) => { content: string; truncated: boolean };
}

export { isObjectRecord } from '../unknownValueGuards';

export function parseSse(raw: string): unknown[] {
  const events: unknown[] = [];
  let lineStart = 0;
  while (lineStart <= raw.length) {
    const lineEnd = raw.indexOf('\n', lineStart);
    const line = raw.slice(lineStart, lineEnd === -1 ? raw.length : lineEnd);
    const text = line.trim();
    if (text.startsWith('data:')) {
      const payload = text.slice(5).trim();
      if (payload && payload !== '[DONE]') {
        try {
          events.push(JSON.parse(payload));
        } catch {
          // Ignore incomplete or non-JSON SSE payloads.
        }
      }
    }
    if (lineEnd === -1) break;
    lineStart = lineEnd + 1;
  }
  return events;
}

function extractOpenAiChoiceText(choice: unknown): string | undefined {
  const candidate = isObjectRecord(choice) ? choice : {};
  const delta = isObjectRecord(candidate.delta) ? candidate.delta : {};
  const message = isObjectRecord(candidate.message) ? candidate.message : {};
  return firstText(delta.content, delta.text, message.content, candidate.text);
}

function extractOpenAiChoiceTextChunk(choice: unknown): string | undefined {
  const candidate = isObjectRecord(choice) ? choice : {};
  const delta = isObjectRecord(candidate.delta) ? candidate.delta : {};
  const message = isObjectRecord(candidate.message) ? candidate.message : {};
  return firstTextPreserveWhitespace(delta.content, delta.text, message.content, candidate.text);
}

function extractOpenAiTopLevelText(data: unknown): string | undefined {
  const response = isObjectRecord(data) ? data : {};
  return firstText(response.content, response.text, response.response, response.output_text);
}

function extractOpenAiTopLevelTextChunk(data: unknown): string | undefined {
  const response = isObjectRecord(data) ? data : {};
  return firstTextPreserveWhitespace(response.content, response.text, response.response, response.output_text);
}

function openAiParser(): ProviderResponseParser {
  return {
    parse: (data) => {
      const response = isObjectRecord(data) ? data : {};
      const choices = Array.isArray(response.choices) ? response.choices : [];
      return extractOpenAiChoiceText(choices[0]) ?? extractOpenAiTopLevelText(response);
    },
    truncated: (data) => {
      const response = isObjectRecord(data) ? data : {};
      const choices = Array.isArray(response.choices) ? response.choices : [];
      return isObjectRecord(choices[0]) && choices[0].finish_reason === 'length';
    },
    aggregate: (events) => {
      const contentParts: string[] = [];
      let truncated = false;
      for (const eventValue of events) {
        const event = isObjectRecord(eventValue) ? eventValue : {};
        const choices = Array.isArray(event.choices) ? event.choices : [];
        const choice = choices[0];
        const piece = extractOpenAiChoiceTextChunk(choice) ?? extractOpenAiTopLevelTextChunk(event);
        if (piece) contentParts.push(piece);
        if (isObjectRecord(choice) && choice.finish_reason) truncated = choice.finish_reason === 'length';
      }
      return { content: contentParts.join('').trim(), truncated };
    },
  };
}

function anthropicParser(): ProviderResponseParser {
  return {
    parse: (data) => textFromTextParts((isObjectRecord(data) ? data : {}).content)?.trim(),
    truncated: (data) => isObjectRecord(data) && data.stop_reason === 'max_tokens',
    aggregate: (events) => {
      const contentParts: string[] = [];
      let truncated = false;
      for (const eventValue of events) {
        const event = isObjectRecord(eventValue) ? eventValue : {};
        const delta = isObjectRecord(event.delta) ? event.delta : {};
        if (event.type === 'content_block_delta' && typeof delta.text === 'string') contentParts.push(delta.text);
        const stop = delta.stop_reason ?? event.stop_reason;
        if (stop) truncated = stop === 'max_tokens';
      }
      return { content: contentParts.join('').trim(), truncated };
    },
  };
}

function geminiParser(): ProviderResponseParser {
  const firstCandidate = (data: unknown): Record<string, unknown> => {
    const response = isObjectRecord(data) ? data : {};
    return Array.isArray(response.candidates) && isObjectRecord(response.candidates[0]) ? response.candidates[0] : {};
  };
  return {
    parse: (data) => {
      const candidate = firstCandidate(data);
      return textFromTextParts((isObjectRecord(candidate.content) ? candidate.content : {}).parts)?.trim();
    },
    truncated: (data) => firstCandidate(data).finishReason === 'MAX_TOKENS',
    aggregate: (events) => {
      const contentParts: string[] = [];
      let truncated = false;
      for (const eventValue of events) {
        const candidate = firstCandidate(eventValue);
        const piece = textFromTextParts((isObjectRecord(candidate.content) ? candidate.content : {}).parts) ?? '';
        if (piece) contentParts.push(piece);
        if (candidate.finishReason) truncated = candidate.finishReason === 'MAX_TOKENS';
      }
      return { content: contentParts.join('').trim(), truncated };
    },
  };
}

export function createProviderResponseParser(provider: LlmProvider): ProviderResponseParser {
  if (provider === 'anthropic') return anthropicParser();
  if (provider === 'gemini') return geminiParser();
  return openAiParser();
}
