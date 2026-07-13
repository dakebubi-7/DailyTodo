import type { AiProfile } from '../../../shared/aiReview/aiReviewSettings';

export const AI_ACCOUNT_PRESETS: ReadonlyArray<{
  id: string;
  label: string;
  baseUrl: string;
  provider: AiProfile['provider'];
  model: string;
}> = [
  { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', provider: 'auto', model: 'deepseek-chat' },
  { id: 'openai', label: 'OpenAI (GPT)', baseUrl: 'https://api.openai.com/v1', provider: 'auto', model: 'gpt-4o-mini' },
  { id: 'glm', label: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', provider: 'auto', model: 'glm-4-flash' },
  { id: 'minimax', label: 'MiniMax', baseUrl: 'https://api.minimax.chat/v1', provider: 'auto', model: 'abab6.5s-chat' },
  { id: 'claude', label: 'Claude (Anthropic)', baseUrl: 'https://api.anthropic.com', provider: 'anthropic', model: 'claude-3-5-haiku-latest' },
  { id: 'gemini', label: 'Gemini (Google)', baseUrl: 'https://generativelanguage.googleapis.com', provider: 'gemini', model: 'gemini-1.5-flash' },
];

export function getAiAccountPresetId(baseUrl: string): string {
  return AI_ACCOUNT_PRESETS.find((preset) => preset.baseUrl === baseUrl)?.id ?? 'custom';
}

export function normalizeAiAccountTimeout(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  return Math.min(600, Math.max(10, Math.round(value)));
}

export function normalizeAiAccountMaxTokens(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  return Math.min(32768, Math.max(256, Math.round(value)));
}
