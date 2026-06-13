export type AiProvider = 'auto' | 'openai' | 'anthropic' | 'gemini';

export interface AiProfile {
  id: string;
  name: string;
  provider: AiProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutSeconds: number;
  /** 输出 token 上限。空/非法 → 默认 8192。长周/月报靠它避免被截断。 */
  maxTokens?: number;
  note?: string;
}

export const DEFAULT_MAX_TOKENS = 8192;
export const MIN_MAX_TOKENS = 256;
export const MAX_MAX_TOKENS = 32768;

export type WeeklySourceMode = 'daily-notes' | 'manual-files';
export type MonthlySourceMode = 'weekly-then-daily' | 'weekly-reports' | 'daily-notes' | 'manual-files';

/** 归一化输出上限：取整后限定在 [256, 32768]，非法回落默认 8192。 */
export function normalizeMaxTokens(v: unknown, fb: number = DEFAULT_MAX_TOKENS): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= MIN_MAX_TOKENS && n <= MAX_MAX_TOKENS ? n : fb;
}

export interface AiReviewSettings {
  enabled: boolean;
  provider: AiProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  // 轻量多账号：保存多套 key/url/model，activeProfileId 指向当前生效的账号。
  // 顶层 provider/baseUrl/apiKey/model/timeoutSeconds 仅作迁移来源与兜底，实际调用走 resolveActiveProfile。
  profiles: AiProfile[];
  activeProfileId: string;
  timerEnabled: boolean;
  timerTime: string; // HH:mm
  // 周报定时：开关 + 星期几(0=周日..6=周六) + HH:mm。默认周一 09:00 生成上一周。
  weeklyTimerEnabled: boolean;
  weeklyTimerWeekday: number;
  weeklyTimerTime: string;
  // 月报定时：开关 + 每月几号(1..31，不足落当月末) + HH:mm。默认 1 号 09:00 生成上一月。
  monthlyTimerEnabled: boolean;
  monthlyTimerDay: number;
  monthlyTimerTime: string;
  // 对外周报定时（生成发给同事/客户的报告，独立于个人周报）。
  externalWeeklyTimerEnabled: boolean;
  externalWeeklyTimerWeekday: number;
  externalWeeklyTimerTime: string;
  // 对外月报定时。
  externalMonthlyTimerEnabled: boolean;
  externalMonthlyTimerDay: number;
  externalMonthlyTimerTime: string;
  // 对外报告轻量脱敏：开启时把姓名/联系方式/项目代号等替换成 [人员]/[联系方式]/[项目A] 等占位符。
  anonymizeExternalReports: boolean;
  weeklySourceMode: WeeklySourceMode;
  monthlySourceMode: MonthlySourceMode;
  externalWeeklySourceMode: WeeklySourceMode;
  externalMonthlySourceMode: MonthlySourceMode;
  timeoutSeconds: number;
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

export function createDefaultAiProfile(): AiProfile {
  return {
    id: `profile-${Math.random().toString(36).slice(2, 10)}`,
    name: '默认账号',
    provider: 'auto',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    timeoutSeconds: 90,
    maxTokens: DEFAULT_MAX_TOKENS,
    note: '',
  };
}

export function createDefaultAiReviewSettings(): AiReviewSettings {
  return {
    enabled: false,
    provider: 'auto',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    timerEnabled: false,
    timerTime: '23:00',
    weeklyTimerEnabled: false,
    weeklyTimerWeekday: 1,
    weeklyTimerTime: '09:00',
    monthlyTimerEnabled: false,
    monthlyTimerDay: 1,
    monthlyTimerTime: '09:00',
    externalWeeklyTimerEnabled: false,
    externalWeeklyTimerWeekday: 0, // 周日
    externalWeeklyTimerTime: '21:00',
    externalMonthlyTimerEnabled: false,
    externalMonthlyTimerDay: 1,
    externalMonthlyTimerTime: '21:00',
    anonymizeExternalReports: true, // 默认开启对外报告脱敏
    weeklySourceMode: 'daily-notes',
    monthlySourceMode: 'weekly-then-daily',
    externalWeeklySourceMode: 'daily-notes',
    externalMonthlySourceMode: 'weekly-then-daily',
    timeoutSeconds: 90,
    profiles: [],
    activeProfileId: '',
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

const WEEKLY_SOURCE_MODES: WeeklySourceMode[] = ['daily-notes', 'manual-files'];
const MONTHLY_SOURCE_MODES: MonthlySourceMode[] = ['weekly-then-daily', 'weekly-reports', 'daily-notes', 'manual-files'];

export function normalizeWeeklySourceMode(value: unknown): WeeklySourceMode {
  return typeof value === 'string' && (WEEKLY_SOURCE_MODES as string[]).includes(value) ? value as WeeklySourceMode : 'daily-notes';
}

export function normalizeMonthlySourceMode(value: unknown): MonthlySourceMode {
  return typeof value === 'string' && (MONTHLY_SOURCE_MODES as string[]).includes(value) ? value as MonthlySourceMode : 'weekly-then-daily';
}

function normalizeTimeout(v: unknown, fb: number): number {
  const n = Number(v);
  return Number.isInteger(n) && n >= 10 && n <= 600 ? n : fb;
}

/** 归一化单个 profile；非法字段回落到 fb（通常是一个全新的默认 profile，提供 id 等兜底）。 */
function normalizeProfile(value: unknown, fb: AiProfile): AiProfile {
  if (!isObject(value)) return fb;
  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id : fb.id,
    name: text(value.name, fb.name),
    provider: isProvider(value.provider) ? value.provider : fb.provider,
    baseUrl: text(value.baseUrl, fb.baseUrl),
    apiKey: typeof value.apiKey === 'string' ? value.apiKey : fb.apiKey,
    model: text(value.model, fb.model),
    timeoutSeconds: normalizeTimeout(value.timeoutSeconds, fb.timeoutSeconds),
    maxTokens: normalizeMaxTokens(value.maxTokens, fb.maxTokens ?? DEFAULT_MAX_TOKENS),
    note: typeof value.note === 'string' ? value.note : fb.note ?? '',
  };
}

export function normalizeAiReviewSettings(value: unknown): AiReviewSettings {
  const d = createDefaultAiReviewSettings();
  if (!isObject(value)) return d;
  const provider = isProvider(value.provider) ? value.provider : d.provider;
  const baseUrl = text(value.baseUrl, d.baseUrl);
  const apiKey = typeof value.apiKey === 'string' ? value.apiKey : d.apiKey;
  const model = text(value.model, d.model);
  const timeoutSeconds = normalizeTimeout(value.timeoutSeconds, d.timeoutSeconds);

  // 轻量多账号：有显式 profiles 就保留并校验 activeProfileId；否则把旧单配置迁移成一个默认 profile。
  const rawProfiles = Array.isArray(value.profiles) ? value.profiles : [];
  let profiles: AiProfile[];
  let activeProfileId: string;
  if (rawProfiles.length > 0) {
    profiles = rawProfiles.map((p) => normalizeProfile(p, createDefaultAiProfile()));
    const given = typeof value.activeProfileId === 'string' ? value.activeProfileId : '';
    activeProfileId = profiles.some((p) => p.id === given) ? given : profiles[0].id;
  } else {
    const migrated: AiProfile = { ...createDefaultAiProfile(), provider, baseUrl, apiKey, model, timeoutSeconds };
    profiles = [migrated];
    activeProfileId = migrated.id;
  }

  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : d.enabled,
    provider,
    baseUrl,
    apiKey,
    model,
    profiles,
    activeProfileId,
    timerEnabled: typeof value.timerEnabled === 'boolean' ? value.timerEnabled : d.timerEnabled,
    timerTime: isTime(value.timerTime) ? value.timerTime : d.timerTime,
    weeklyTimerEnabled: typeof value.weeklyTimerEnabled === 'boolean' ? value.weeklyTimerEnabled : d.weeklyTimerEnabled,
    weeklyTimerWeekday:
      Number.isInteger(Number(value.weeklyTimerWeekday)) && Number(value.weeklyTimerWeekday) >= 0 && Number(value.weeklyTimerWeekday) <= 6
        ? Number(value.weeklyTimerWeekday)
        : d.weeklyTimerWeekday,
    weeklyTimerTime: isTime(value.weeklyTimerTime) ? value.weeklyTimerTime : d.weeklyTimerTime,
    monthlyTimerEnabled: typeof value.monthlyTimerEnabled === 'boolean' ? value.monthlyTimerEnabled : d.monthlyTimerEnabled,
    monthlyTimerDay:
      Number.isInteger(Number(value.monthlyTimerDay)) && Number(value.monthlyTimerDay) >= 1 && Number(value.monthlyTimerDay) <= 31
        ? Number(value.monthlyTimerDay)
        : d.monthlyTimerDay,
    monthlyTimerTime: isTime(value.monthlyTimerTime) ? value.monthlyTimerTime : d.monthlyTimerTime,
    externalWeeklyTimerEnabled:
      typeof value.externalWeeklyTimerEnabled === 'boolean' ? value.externalWeeklyTimerEnabled : d.externalWeeklyTimerEnabled,
    externalWeeklyTimerWeekday:
      Number.isInteger(Number(value.externalWeeklyTimerWeekday)) && Number(value.externalWeeklyTimerWeekday) >= 0 && Number(value.externalWeeklyTimerWeekday) <= 6
        ? Number(value.externalWeeklyTimerWeekday)
        : d.externalWeeklyTimerWeekday,
    externalWeeklyTimerTime: isTime(value.externalWeeklyTimerTime) ? value.externalWeeklyTimerTime : d.externalWeeklyTimerTime,
    externalMonthlyTimerEnabled:
      typeof value.externalMonthlyTimerEnabled === 'boolean' ? value.externalMonthlyTimerEnabled : d.externalMonthlyTimerEnabled,
    externalMonthlyTimerDay:
      Number.isInteger(Number(value.externalMonthlyTimerDay)) && Number(value.externalMonthlyTimerDay) >= 1 && Number(value.externalMonthlyTimerDay) <= 31
        ? Number(value.externalMonthlyTimerDay)
        : d.externalMonthlyTimerDay,
    externalMonthlyTimerTime: isTime(value.externalMonthlyTimerTime) ? value.externalMonthlyTimerTime : d.externalMonthlyTimerTime,
    anonymizeExternalReports:
      typeof value.anonymizeExternalReports === 'boolean' ? value.anonymizeExternalReports : d.anonymizeExternalReports,
    weeklySourceMode: normalizeWeeklySourceMode(value.weeklySourceMode),
    monthlySourceMode: normalizeMonthlySourceMode(value.monthlySourceMode),
    externalWeeklySourceMode: normalizeWeeklySourceMode(value.externalWeeklySourceMode),
    externalMonthlySourceMode: normalizeMonthlySourceMode(value.externalMonthlySourceMode),
    timeoutSeconds,
    onboardingDismissed:
      typeof value.onboardingDismissed === 'boolean' ? value.onboardingDismissed : d.onboardingDismissed,
  };
}

/** 取当前生效账号：按 activeProfileId 命中；失效回落首个 profile；完全没有 profile 时用顶层字段合成。 */
export function resolveActiveProfile(settings: AiReviewSettings): AiProfile {
  const found = settings.profiles.find((p) => p.id === settings.activeProfileId);
  if (found) return found;
  if (settings.profiles.length > 0) return settings.profiles[0];
  return {
    id: settings.activeProfileId || 'inline',
    name: '默认账号',
    provider: settings.provider,
    baseUrl: settings.baseUrl,
    apiKey: settings.apiKey,
    model: settings.model,
    timeoutSeconds: settings.timeoutSeconds,
    maxTokens: DEFAULT_MAX_TOKENS,
    note: '',
  };
}
