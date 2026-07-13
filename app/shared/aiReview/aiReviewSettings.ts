import type { AiProfile, AiProvider } from './aiReviewProfiles';
import {
  isMonthlySourceMode as isMonthlySourceModeValue,
  isWeeklySourceMode as isWeeklySourceModeValue,
  normalizeAiReviewSettingsValue,
} from './aiReviewSettingsNormalization';

export {
  DEFAULT_MAX_TOKENS,
  MIN_MAX_TOKENS,
  MAX_MAX_TOKENS,
  createDefaultAiProfile,
  isAiProvider,
  normalizeMaxTokens,
  resolveActiveProfile,
  resolveProfileForReportKind,
} from './aiReviewProfiles';
export type {
  AiProvider,
  AiProfile,
  AiReviewReportKind,
  AiReviewProfileResolution,
  AiReviewProfileSource,
} from './aiReviewProfiles';

export type WeeklySourceMode = 'daily-notes' | 'manual-files';
export type MonthlySourceMode = 'weekly-then-daily' | 'weekly-reports' | 'daily-notes' | 'manual-files';

export interface AiReviewSettings {
  enabled: boolean;
  provider: AiProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  profiles: AiProfile[];
  activeProfileId: string;
  dailyReviewProfileId?: string;
  weeklyReportProfileId?: string;
  monthlyReportProfileId?: string;
  timerEnabled: boolean;
  timerTime: string;
  weeklyTimerEnabled: boolean;
  weeklyTimerWeekday: number;
  weeklyTimerTime: string;
  monthlyTimerEnabled: boolean;
  monthlyTimerDay: number;
  monthlyTimerTime: string;
  externalWeeklyTimerEnabled: boolean;
  externalWeeklyTimerWeekday: number;
  externalWeeklyTimerTime: string;
  externalMonthlyTimerEnabled: boolean;
  externalMonthlyTimerDay: number;
  externalMonthlyTimerTime: string;
  anonymizeExternalReports: boolean;
  weeklySourceMode: WeeklySourceMode;
  monthlySourceMode: MonthlySourceMode;
  externalWeeklySourceMode: WeeklySourceMode;
  externalMonthlySourceMode: MonthlySourceMode;
  startupBackfillEnabled: boolean;
  backfillDays: number;
  weeklyDir: string;
  monthlyDir: string;
  externalWeeklyDir: string;
  externalMonthlyDir: string;
  weeklyPrompt: string;
  monthlyPrompt: string;
  externalWeeklyPrompt: string;
  externalMonthlyPrompt: string;
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

export function sanitizeRelDir(input: unknown, fallback: string): string {
  if (typeof input !== 'string') return fallback;
  const trimmed = input.trim().replace(/^[/\\]+|[/\\]+$/g, '');
  if (!trimmed) return fallback;
  const parts = trimmed.split(/[/\\]+/);
  if (parts.some((part) => part === '..' || part === '.' || /^[a-zA-Z]:$/.test(part))) return fallback;
  return parts.join('/');
}

export function createDefaultAiReviewSettings(): AiReviewSettings {
  return {
    enabled: false,
    provider: 'auto',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    profiles: [],
    activeProfileId: '',
    dailyReviewProfileId: '',
    weeklyReportProfileId: '',
    monthlyReportProfileId: '',
    timerEnabled: false,
    timerTime: '23:00',
    weeklyTimerEnabled: false,
    weeklyTimerWeekday: 1,
    weeklyTimerTime: '09:00',
    monthlyTimerEnabled: false,
    monthlyTimerDay: 1,
    monthlyTimerTime: '09:00',
    externalWeeklyTimerEnabled: false,
    externalWeeklyTimerWeekday: 0,
    externalWeeklyTimerTime: '21:00',
    externalMonthlyTimerEnabled: false,
    externalMonthlyTimerDay: 1,
    externalMonthlyTimerTime: '21:00',
    anonymizeExternalReports: true,
    weeklySourceMode: 'daily-notes',
    monthlySourceMode: 'weekly-then-daily',
    externalWeeklySourceMode: 'daily-notes',
    externalMonthlySourceMode: 'weekly-then-daily',
    startupBackfillEnabled: false,
    backfillDays: 7,
    weeklyDir: '',
    monthlyDir: '',
    externalWeeklyDir: '',
    externalMonthlyDir: '',
    weeklyPrompt: '',
    monthlyPrompt: '',
    externalWeeklyPrompt: '',
    externalMonthlyPrompt: '',
    timeoutSeconds: 90,
    onboardingDismissed: false,
  };
}

export function isWeeklySourceMode(value: unknown): value is WeeklySourceMode {
  return isWeeklySourceModeValue(value);
}

export function isMonthlySourceMode(value: unknown): value is MonthlySourceMode {
  return isMonthlySourceModeValue(value);
}

export function normalizeWeeklySourceMode(value: unknown): WeeklySourceMode {
  return isWeeklySourceMode(value) ? value : 'daily-notes';
}

export function normalizeMonthlySourceMode(value: unknown): MonthlySourceMode {
  return isMonthlySourceMode(value) ? value : 'weekly-then-daily';
}

export function normalizeAiReviewSettings(value: unknown): AiReviewSettings {
  return normalizeAiReviewSettingsValue(value, createDefaultAiReviewSettings());
}
