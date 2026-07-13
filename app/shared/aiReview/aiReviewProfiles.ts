import { isObjectRecord } from '../unknownValueGuards';

export type AiProvider = 'auto' | 'openai' | 'anthropic' | 'gemini';

export interface AiProfile {
  id: string;
  name: string;
  provider: AiProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutSeconds: number;
  /** 输出 token 上限。空/非法 -> 默认 8192。长周/月报靠它避免被截断。 */
  maxTokens?: number;
  note?: string;
}

export const DEFAULT_MAX_TOKENS = 8192;
export const MIN_MAX_TOKENS = 256;
export const MAX_MAX_TOKENS = 32768;

export type AiReviewReportKind = 'daily' | 'weekly' | 'monthly';
export type AiReviewProfileSource = 'specific' | 'default' | 'fallbackDefault' | 'missing';

export interface AiReviewProfileResolution {
  reportKind: AiReviewReportKind;
  profile: AiProfile;
  source: AiReviewProfileSource;
  requestedProfileId?: string;
  warning?: string;
}

export interface AiReviewProfileSettings {
  provider: AiProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  profiles: AiProfile[];
  activeProfileId: string;
  dailyReviewProfileId?: string;
  weeklyReportProfileId?: string;
  monthlyReportProfileId?: string;
  timeoutSeconds: number;
}

/** 归一化输出上限：取整后限定在 [256, 32768]，非法回落默认 8192。 */
export function normalizeMaxTokens(v: unknown, fb: number = DEFAULT_MAX_TOKENS): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= MIN_MAX_TOKENS && n <= MAX_MAX_TOKENS ? n : fb;
}

function text(v: unknown, fb: string) {
  return typeof v === 'string' && v.trim() ? v : fb;
}

export function normalizeAiTimeoutSeconds(v: unknown, fb: number): number {
  const n = Number(v);
  return Number.isInteger(n) && n >= 10 && n <= 600 ? n : fb;
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

const PROVIDERS: AiProvider[] = ['auto', 'openai', 'anthropic', 'gemini'];
const AI_PROVIDER_SET = new Set<unknown>(PROVIDERS);

export function isAiProvider(v: unknown): v is AiProvider {
  return AI_PROVIDER_SET.has(v);
}

/** 归一化单个 profile；非法字段回落到 fb（通常是一个全新的默认 profile，提供 id 等兜底）。 */
export function normalizeAiProfile(value: unknown, fb: AiProfile): AiProfile {
  if (!isObjectRecord(value)) return fb;
  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id : fb.id,
    name: text(value.name, fb.name),
    provider: isAiProvider(value.provider) ? value.provider : fb.provider,
    baseUrl: text(value.baseUrl, fb.baseUrl),
    apiKey: typeof value.apiKey === 'string' ? value.apiKey : fb.apiKey,
    model: text(value.model, fb.model),
    timeoutSeconds: normalizeAiTimeoutSeconds(value.timeoutSeconds, fb.timeoutSeconds),
    maxTokens: normalizeMaxTokens(value.maxTokens, fb.maxTokens ?? DEFAULT_MAX_TOKENS),
    note: typeof value.note === 'string' ? value.note : fb.note ?? '',
  };
}

/** 取当前生效账号：按 activeProfileId 命中；失效回落首个 profile；完全没有 profile 时用顶层字段合成。 */
export function resolveActiveProfile(settings: AiReviewProfileSettings): AiProfile {
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

function hasUsableApiKey(profile: AiProfile): boolean {
  return Boolean(profile.apiKey.trim());
}

function routeProfileId(settings: AiReviewProfileSettings, reportKind: AiReviewReportKind): string {
  if (reportKind === 'daily') return settings.dailyReviewProfileId ?? '';
  if (reportKind === 'weekly') return settings.weeklyReportProfileId ?? '';
  return settings.monthlyReportProfileId ?? '';
}

/**
 * 按报告类型解析要使用的 AI 账号。只返回 profile 与非敏感路由元信息；API Key 仍只存在 profile 本身。
 */
export function resolveProfileForReportKind(
  settings: AiReviewProfileSettings,
  reportKind: AiReviewReportKind,
): AiReviewProfileResolution {
  const requestedProfileId = routeProfileId(settings, reportKind).trim();
  const defaultProfile = resolveActiveProfile(settings);

  if (!requestedProfileId) {
    return { reportKind, profile: defaultProfile, source: hasUsableApiKey(defaultProfile) ? 'default' : 'missing' };
  }

  const specific = settings.profiles.find((p) => p.id === requestedProfileId);
  if (specific && hasUsableApiKey(specific)) {
    return { reportKind, profile: specific, source: 'specific', requestedProfileId };
  }

  if (hasUsableApiKey(defaultProfile)) {
    const warning = specific
      ? '指定报告账号缺少 API Key，已回退当前账号。'
      : '指定报告账号不存在，已回退当前账号。';
    return { reportKind, profile: defaultProfile, source: 'fallbackDefault', requestedProfileId, warning };
  }

  const warning = specific
    ? '指定报告账号和当前账号都缺少 API Key。'
    : '指定报告账号不存在，且当前账号缺少 API Key。';
  return { reportKind, profile: specific ?? defaultProfile, source: 'missing', requestedProfileId, warning };
}
