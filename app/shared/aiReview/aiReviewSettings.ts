export interface AiReviewSettings {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  backfillDays: number;
  timerEnabled: boolean;
  timerTime: string; // HH:mm
}

export const AI_REVIEW_SETTINGS_KEY = 'aiReviewSettings';

export function createDefaultAiReviewSettings(): AiReviewSettings {
  return {
    enabled: false,
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    backfillDays: 7,
    timerEnabled: false,
    timerTime: '23:00',
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v && typeof v === 'object' && !Array.isArray(v));
}
function isTime(v: unknown): v is string {
  return typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}
function text(v: unknown, fb: string) {
  return typeof v === 'string' && v.trim() ? v : fb;
}

export function normalizeAiReviewSettings(value: unknown): AiReviewSettings {
  const d = createDefaultAiReviewSettings();
  if (!isObject(value)) return d;
  const backfill = Number(value.backfillDays);
  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : d.enabled,
    baseUrl: text(value.baseUrl, d.baseUrl),
    apiKey: typeof value.apiKey === 'string' ? value.apiKey : d.apiKey,
    model: text(value.model, d.model),
    backfillDays: Number.isInteger(backfill) && backfill >= 1 && backfill <= 60 ? backfill : d.backfillDays,
    timerEnabled: typeof value.timerEnabled === 'boolean' ? value.timerEnabled : d.timerEnabled,
    timerTime: isTime(value.timerTime) ? value.timerTime : d.timerTime,
  };
}
