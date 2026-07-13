import {
  createDefaultAiProfile,
  isAiProvider,
  normalizeAiProfile,
  normalizeAiTimeoutSeconds,
} from './aiReviewProfiles';
import type { AiProfile } from './aiReviewProfiles';
import type { AiReviewSettings } from './aiReviewSettings';
import { isScheduleTime } from './scheduleTimeParsing';
import { isObjectRecord } from '../unknownValueGuards';

export type WeeklySourceMode = 'daily-notes' | 'manual-files';
export type MonthlySourceMode = 'weekly-then-daily' | 'weekly-reports' | 'daily-notes' | 'manual-files';

const WEEKLY_SOURCE_MODE_SET = new Set<unknown>(['daily-notes', 'manual-files']);
const MONTHLY_SOURCE_MODE_SET = new Set<unknown>(['weekly-then-daily', 'weekly-reports', 'daily-notes', 'manual-files']);

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function integerInRange(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue >= min && numberValue <= max ? numberValue : fallback;
}

function normalizeBackfillDays(value: unknown, fallback: number) {
  return integerInRange(value, 1, 60, fallback);
}

function looseText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeProfileRouteId(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function isWeeklySourceMode(value: unknown): value is WeeklySourceMode {
  return WEEKLY_SOURCE_MODE_SET.has(value);
}

export function isMonthlySourceMode(value: unknown): value is MonthlySourceMode {
  return MONTHLY_SOURCE_MODE_SET.has(value);
}

export function normalizeWeeklySourceMode(value: unknown): WeeklySourceMode {
  return isWeeklySourceMode(value) ? value : 'daily-notes';
}

export function normalizeMonthlySourceMode(value: unknown): MonthlySourceMode {
  return isMonthlySourceMode(value) ? value : 'weekly-then-daily';
}

export function normalizeAiReviewSettingsValue(value: unknown, defaults: AiReviewSettings): AiReviewSettings {
  if (!isObjectRecord(value)) return defaults;
  const provider = isAiProvider(value.provider) ? value.provider : defaults.provider;
  const baseUrl = text(value.baseUrl, defaults.baseUrl);
  const apiKey = typeof value.apiKey === 'string' ? value.apiKey : defaults.apiKey;
  const model = text(value.model, defaults.model);
  const timeoutSeconds = normalizeAiTimeoutSeconds(value.timeoutSeconds, defaults.timeoutSeconds);
  const rawProfiles = Array.isArray(value.profiles) ? value.profiles : null;
  let profiles: AiProfile[];
  let activeProfileId: string;

  if (rawProfiles) {
    profiles = rawProfiles.map((profile: unknown) => normalizeAiProfile(profile, createDefaultAiProfile()));
    const given = typeof value.activeProfileId === 'string' ? value.activeProfileId : '';
    activeProfileId = profiles.some((profile) => profile.id === given) ? given : profiles[0]?.id ?? '';
  } else {
    const migrated: AiProfile = { ...createDefaultAiProfile(), provider, baseUrl, apiKey, model, timeoutSeconds };
    profiles = [migrated];
    activeProfileId = migrated.id;
  }

  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : defaults.enabled,
    provider,
    baseUrl,
    apiKey,
    model,
    profiles,
    activeProfileId,
    dailyReviewProfileId: normalizeProfileRouteId(value.dailyReviewProfileId),
    weeklyReportProfileId: normalizeProfileRouteId(value.weeklyReportProfileId),
    monthlyReportProfileId: normalizeProfileRouteId(value.monthlyReportProfileId),
    timerEnabled: typeof value.timerEnabled === 'boolean' ? value.timerEnabled : defaults.timerEnabled,
    timerTime: isScheduleTime(value.timerTime) ? value.timerTime : defaults.timerTime,
    weeklyTimerEnabled: typeof value.weeklyTimerEnabled === 'boolean' ? value.weeklyTimerEnabled : defaults.weeklyTimerEnabled,
    weeklyTimerWeekday: integerInRange(value.weeklyTimerWeekday, 0, 6, defaults.weeklyTimerWeekday),
    weeklyTimerTime: isScheduleTime(value.weeklyTimerTime) ? value.weeklyTimerTime : defaults.weeklyTimerTime,
    monthlyTimerEnabled: typeof value.monthlyTimerEnabled === 'boolean' ? value.monthlyTimerEnabled : defaults.monthlyTimerEnabled,
    monthlyTimerDay: integerInRange(value.monthlyTimerDay, 1, 31, defaults.monthlyTimerDay),
    monthlyTimerTime: isScheduleTime(value.monthlyTimerTime) ? value.monthlyTimerTime : defaults.monthlyTimerTime,
    externalWeeklyTimerEnabled: typeof value.externalWeeklyTimerEnabled === 'boolean' ? value.externalWeeklyTimerEnabled : defaults.externalWeeklyTimerEnabled,
    externalWeeklyTimerWeekday: integerInRange(value.externalWeeklyTimerWeekday, 0, 6, defaults.externalWeeklyTimerWeekday),
    externalWeeklyTimerTime: isScheduleTime(value.externalWeeklyTimerTime) ? value.externalWeeklyTimerTime : defaults.externalWeeklyTimerTime,
    externalMonthlyTimerEnabled: typeof value.externalMonthlyTimerEnabled === 'boolean' ? value.externalMonthlyTimerEnabled : defaults.externalMonthlyTimerEnabled,
    externalMonthlyTimerDay: integerInRange(value.externalMonthlyTimerDay, 1, 31, defaults.externalMonthlyTimerDay),
    externalMonthlyTimerTime: isScheduleTime(value.externalMonthlyTimerTime) ? value.externalMonthlyTimerTime : defaults.externalMonthlyTimerTime,
    anonymizeExternalReports: typeof value.anonymizeExternalReports === 'boolean' ? value.anonymizeExternalReports : defaults.anonymizeExternalReports,
    weeklySourceMode: normalizeWeeklySourceMode(value.weeklySourceMode),
    monthlySourceMode: normalizeMonthlySourceMode(value.monthlySourceMode),
    externalWeeklySourceMode: normalizeWeeklySourceMode(value.externalWeeklySourceMode),
    externalMonthlySourceMode: normalizeMonthlySourceMode(value.externalMonthlySourceMode),
    startupBackfillEnabled: typeof value.startupBackfillEnabled === 'boolean' ? value.startupBackfillEnabled : defaults.startupBackfillEnabled,
    backfillDays: normalizeBackfillDays(value.backfillDays, defaults.backfillDays),
    weeklyDir: looseText(value.weeklyDir),
    monthlyDir: looseText(value.monthlyDir),
    externalWeeklyDir: looseText(value.externalWeeklyDir),
    externalMonthlyDir: looseText(value.externalMonthlyDir),
    weeklyPrompt: looseText(value.weeklyPrompt),
    monthlyPrompt: looseText(value.monthlyPrompt),
    externalWeeklyPrompt: looseText(value.externalWeeklyPrompt),
    externalMonthlyPrompt: looseText(value.externalMonthlyPrompt),
    timeoutSeconds,
    onboardingDismissed: typeof value.onboardingDismissed === 'boolean' ? value.onboardingDismissed : defaults.onboardingDismissed,
  };
}
