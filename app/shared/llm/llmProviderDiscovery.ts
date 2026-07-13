import type { AutoCandidate, LlmProvider } from './openaiClient';

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function detectProvider(baseUrl: string): LlmProvider {
  const url = (baseUrl || '').toLowerCase();
  if (url.includes('generativelanguage.googleapis.com') && !url.includes('openai')) return 'gemini';
  if (url.includes('api.anthropic.com') || url.includes('/anthropic')) return 'anthropic';
  return 'openai';
}

function stripChatCompletionsPath(baseUrl: string): string {
  return baseUrl.replace(/\/chat\/completions\/?$/i, '');
}

function hasApiVersionPath(baseUrl: string): boolean {
  try {
    return /\/(v\d+|v\d+beta)(\/|$)/i.test(new URL(baseUrl).pathname);
  } catch {
    return /\/(v\d+|v\d+beta)(\/|$)/i.test(baseUrl);
  }
}

function pushCandidate(list: AutoCandidate[], candidate: AutoCandidate) {
  if (!candidate.baseUrl || list.some((entry) => entry.provider === candidate.provider && entry.baseUrl === candidate.baseUrl)) return;
  list.push(candidate);
}

function openAiBaseVariants(input: string): string[] {
  const cleaned = stripChatCompletionsPath(trimSlash(input.trim()));
  const variants: string[] = [];
  const push = (value: string) => {
    const trimmed = trimSlash(value);
    if (trimmed && !variants.includes(trimmed)) variants.push(trimmed);
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
  if (lower.includes('generativelanguage.googleapis.com') && !lower.includes('openai')) pushCandidate(candidates, { provider: 'gemini', baseUrl: raw });
  if (lower.includes('api.anthropic.com') || lower.includes('/anthropic')) pushCandidate(candidates, { provider: 'anthropic', baseUrl: raw });
  for (const variant of openAiBaseVariants(raw)) pushCandidate(candidates, { provider: 'openai', baseUrl: variant });
  if (!candidates.some((candidate) => candidate.provider === 'anthropic')) pushCandidate(candidates, { provider: 'anthropic', baseUrl: raw });
  if (!candidates.some((candidate) => candidate.provider === 'gemini')) pushCandidate(candidates, { provider: 'gemini', baseUrl: raw });
  return candidates;
}
