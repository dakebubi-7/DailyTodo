export type AiProvider = 'auto' | 'openai' | 'anthropic' | 'gemini';

export interface AiReviewSettings {
  enabled: boolean;
  provider: AiProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  backfillDays: number;
  timerEnabled: boolean;
  timerTime: string; // HH:mm
  timeoutSeconds: number;
  // 报告输出目录（相对 vault 根，空 = 用 DEFAULT_REPORT_DIRS 对应默认）
  weeklyDir: string;
  monthlyDir: string;
  externalWeeklyDir: string;
  externalMonthlyDir: string;
  // 报告生成模板（system prompt，空 = 用内置默认句）
  weeklyPrompt: string;
  monthlyPrompt: string;
  onboardingDismissed: boolean;
}

export const AI_REVIEW_SETTINGS_KEY = 'aiReviewSettings';

export const DEFAULT_REPORT_DIRS = {
  weekly: 'logs/weekly-review',
  monthly: 'logs/monthly-review',
  externalWeekly: 'exports/weekly-reports',
  externalMonthly: 'exports/monthly-reports',
} as const;

/** 清洗用户填的相对目录：去首尾斜杠/空白；含 `..` 或绝对盘符等非法形态 → 回落 fallback。 */
export function sanitizeRelDir(input: unknown, fallback: string): string {
  if (typeof input !== 'string') return fallback;
  const trimmed = input.trim().replace(/^[/\\]+|[/\\]+$/g, '');
  if (!trimmed) return fallback;
  const parts = trimmed.split(/[/\\]+/);
  if (parts.some((p) => p === '..' || p === '.' || /^[a-zA-Z]:$/.test(p))) return fallback;
  return parts.join('/');
}

export function createDefaultAiReviewSettings(): AiReviewSettings {
  return {
    enabled: false,
    provider: 'auto',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    backfillDays: 7,
    timerEnabled: false,
    timerTime: '23:00',
    timeoutSeconds: 90,
    weeklyDir: '',
    monthlyDir: '',
    externalWeeklyDir: '',
    externalMonthlyDir: '',
    weeklyPrompt: '',
    monthlyPrompt: '',
    onboardingDismissed: false,
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
const PROVIDERS: AiProvider[] = ['auto', 'openai', 'anthropic', 'gemini'];
function isProvider(v: unknown): v is AiProvider {
  return typeof v === 'string' && (PROVIDERS as string[]).includes(v);
}

export function normalizeAiReviewSettings(value: unknown): AiReviewSettings {
  const d = createDefaultAiReviewSettings();
  if (!isObject(value)) return d;
  const backfill = Number(value.backfillDays);
  const timeout = Number(value.timeoutSeconds);
  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : d.enabled,
    provider: isProvider(value.provider) ? value.provider : d.provider,
    baseUrl: text(value.baseUrl, d.baseUrl),
    apiKey: typeof value.apiKey === 'string' ? value.apiKey : d.apiKey,
    model: text(value.model, d.model),
    backfillDays: Number.isInteger(backfill) && backfill >= 1 && backfill <= 60 ? backfill : d.backfillDays,
    timerEnabled: typeof value.timerEnabled === 'boolean' ? value.timerEnabled : d.timerEnabled,
    timerTime: isTime(value.timerTime) ? value.timerTime : d.timerTime,
    timeoutSeconds: Number.isInteger(timeout) && timeout >= 10 && timeout <= 600 ? timeout : d.timeoutSeconds,
    // 路径：合法→清洗后保留；非法/空→空串（消费端再回落默认目录）
    weeklyDir: sanitizeRelDir(value.weeklyDir, ''),
    monthlyDir: sanitizeRelDir(value.monthlyDir, ''),
    externalWeeklyDir: sanitizeRelDir(value.externalWeeklyDir, ''),
    externalMonthlyDir: sanitizeRelDir(value.externalMonthlyDir, ''),
    weeklyPrompt: typeof value.weeklyPrompt === 'string' ? value.weeklyPrompt : d.weeklyPrompt,
    monthlyPrompt: typeof value.monthlyPrompt === 'string' ? value.monthlyPrompt : d.monthlyPrompt,
    onboardingDismissed:
      typeof value.onboardingDismissed === 'boolean' ? value.onboardingDismissed : d.onboardingDismissed,
  };
}
