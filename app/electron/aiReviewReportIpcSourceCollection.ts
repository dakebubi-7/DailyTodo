import { type MonthlySourceMode, type WeeklySourceMode } from '../shared/aiReview/aiReviewSettings';
import type { ObsidianTemplateSettings } from '../shared/appSettings';
import { monthKey } from '../shared/aiReview/monthly';
import {
  collectDailySourcesForDates,
  collectMonthlySources,
  type DailySourceRule,
} from '../shared/aiReview/sourceMaterials';
import { getMonthDates, getWeekDates } from './aiReviewIpcHelpers';

type WeeklyReportSourceContent = { date: string; content: string };
type MonthlyReportSourceContent = { label: string; content: string };

function collectPreparedReportSources<PreparedContext extends object, RawSource, PreparedSource>({
  prepare,
  collect,
  mapSource,
}: {
  prepare(): PreparedContext;
  collect(prepared: PreparedContext): RawSource[];
  mapSource(source: RawSource): PreparedSource;
}): { prepareStartedAt: number } & PreparedContext & { sources: PreparedSource[] } {
  const prepareStartedAt = Date.now();
  const prepared = prepare();
  return {
    prepareStartedAt,
    ...prepared,
    sources: collect(prepared).map(mapSource),
  };
}

export type CollectWeeklyReportSourcesOptions = {
  date: unknown;
  vaultPath: string;
  weeklySourceMode: WeeklySourceMode;
  getDateKey(date?: unknown): string;
  getDailySourceRules(): DailySourceRule[];
};

export function collectWeeklyReportSources({
  date,
  vaultPath,
  weeklySourceMode,
  getDateKey,
  getDailySourceRules,
}: CollectWeeklyReportSourcesOptions): {
  prepareStartedAt: number;
  selected: string;
  monday: string;
  weekDates: string[];
  dailyContents: WeeklyReportSourceContent[];
} {
  const { prepareStartedAt, selected, monday, weekDates, sources } = collectPreparedReportSources({
    prepare: () => {
      const selected = getDateKey(date);
      const { monday, dates: weekDates } = getWeekDates(selected);
      return { selected, monday, weekDates };
    },
    collect: ({ weekDates }) =>
      weeklySourceMode === 'manual-files'
        ? []
        : collectDailySourcesForDates({
          vaultPath,
          dates: weekDates,
          rules: getDailySourceRules(),
        }),
    mapSource: (source) => ({ date: source.date, content: source.content }),
  });

  return { prepareStartedAt, selected, monday, weekDates, dailyContents: sources };
}

export type CollectMonthlyReportSourcesOptions = {
  date: unknown;
  vaultPath: string;
  weeklyPathTemplate: ObsidianTemplateSettings['weeklyPath'];
  monthlySourceMode: MonthlySourceMode;
  getDateKey(date?: unknown): string;
  getDailySourceRules(): DailySourceRule[];
};

export function collectMonthlyReportSources({
  date,
  vaultPath,
  weeklyPathTemplate,
  monthlySourceMode,
  getDateKey,
  getDailySourceRules,
}: CollectMonthlyReportSourcesOptions): {
  prepareStartedAt: number;
  month: string;
  first: string;
  last: string;
  sources: MonthlyReportSourceContent[];
} {
  const { prepareStartedAt, month, first, last, sources } = collectPreparedReportSources({
    prepare: () => {
      const month = monthKey(getDateKey(date));
      const { first, last } = getMonthDates(month);
      return { month, first, last };
    },
    collect: ({ month }) =>
      collectMonthlySources({
        vaultPath,
        month,
        weeklyPathTemplate,
        dailyRules: getDailySourceRules(),
        mode: monthlySourceMode,
      }),
    mapSource: (source) => ({ label: source.label, content: source.content }),
  });

  return { prepareStartedAt, month, first, last, sources };
}
