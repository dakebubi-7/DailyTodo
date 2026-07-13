import type { AiReviewTokenUsage } from '../aiReview/runDiagnostics';
import { isObjectRecord } from '../unknownValueGuards';
import type { LlmProvider } from './openaiClient';

function numberOrUndefined(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function extractUsage(provider: LlmProvider, data: unknown): AiReviewTokenUsage {
  const response = isObjectRecord(data) ? data : {};
  if (provider === 'openai') {
    const usage = isObjectRecord(response.usage) ? response.usage : {};
    const promptTokens = numberOrUndefined(usage.prompt_tokens);
    const completionTokens = numberOrUndefined(usage.completion_tokens);
    const totalTokens = numberOrUndefined(usage.total_tokens);
    return promptTokens !== undefined || completionTokens !== undefined || totalTokens !== undefined
      ? { source: 'openai', promptTokens, completionTokens, totalTokens }
      : { source: 'missing' };
  }
  if (provider === 'anthropic') {
    const usage = isObjectRecord(response.usage) ? response.usage : {};
    const promptTokens = numberOrUndefined(usage.input_tokens);
    const completionTokens = numberOrUndefined(usage.output_tokens);
    const totalTokens = promptTokens !== undefined || completionTokens !== undefined
      ? (promptTokens ?? 0) + (completionTokens ?? 0)
      : undefined;
    return promptTokens !== undefined || completionTokens !== undefined
      ? { source: 'anthropic', promptTokens, completionTokens, totalTokens }
      : { source: 'missing' };
  }
  const usage = isObjectRecord(response.usageMetadata) ? response.usageMetadata : {};
  const promptTokens = numberOrUndefined(usage.promptTokenCount);
  const completionTokens = numberOrUndefined(usage.candidatesTokenCount);
  const totalTokens = numberOrUndefined(usage.totalTokenCount);
  return promptTokens !== undefined || completionTokens !== undefined || totalTokens !== undefined
    ? { source: 'gemini', promptTokens, completionTokens, totalTokens }
    : { source: 'missing' };
}

export function extractSseUsage(provider: LlmProvider, events: unknown[]): AiReviewTokenUsage {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    const record = isObjectRecord(event) ? event : {};
    if (record.usage || record.usageMetadata) return extractUsage(provider, event);
  }
  return { source: 'missing' };
}

function containsText(value: unknown): boolean {
  if (typeof value === 'string') return Boolean(value.trim());
  if (!Array.isArray(value)) return false;
  return value.some((part) => isObjectRecord(part)
    && (typeof part.text === 'string' || typeof part.content === 'string'));
}

export function isUsageOnlyStream(events: unknown[]): boolean {
  return events.some((event) => {
    const record = isObjectRecord(event) ? event : {};
    return record.usage && Array.isArray(record.choices) && record.choices.length === 0;
  }) && events.every((event) => {
    const record = isObjectRecord(event) ? event : {};
    const choices = Array.isArray(record.choices) ? record.choices : [];
    return !choices.some((choice) => {
      const candidate = isObjectRecord(choice) ? choice : {};
      const delta = isObjectRecord(candidate.delta) ? candidate.delta : {};
      const message = isObjectRecord(candidate.message) ? candidate.message : {};
      return containsText(delta.content) || containsText(delta.text) || containsText(message.content) || containsText(candidate.text);
    }) && !containsText(record.content) && !containsText(record.text)
      && !containsText(record.response) && !containsText(record.output_text);
  });
}

export function parseModelList(provider: LlmProvider, data: unknown): string[] {
  const response = isObjectRecord(data) ? data : {};
  const models: string[] = [];
  if (provider === 'gemini') {
    const entries = Array.isArray(response.models) ? response.models : [];
    for (const model of entries) {
      if (isObjectRecord(model) && typeof model.name === 'string') {
        const name = model.name.replace(/^models\//, '');
        if (name) models.push(name);
      }
    }
    return models;
  }
  const entries = Array.isArray(response.data) ? response.data : [];
  for (const model of entries) {
    if (isObjectRecord(model) && typeof model.id === 'string' && model.id) models.push(model.id);
  }
  return models;
}
