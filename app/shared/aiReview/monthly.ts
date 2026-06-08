import type { RangeStats } from './stats';
import type { ChatMessage } from '../llm/openaiClient';
import { DEFAULT_MONTHLY_SYSTEM } from './defaultPrompts';

/** 月键，如 2026-06。 */
export function monthKey(date: string): string {
  return date.slice(0, 7);
}

/** 给定 YYYY-MM，返回该月起止日期 [first, last]。 */
export function monthRange(month: string): { first: string; last: string } {
  const [y, m] = month.split('-').map(Number);
  const first = `${month}-01`;
  const lastDay = new Date(y, m, 0).getDate(); // m 不减 1 → 下个月第 0 天 = 本月最后一天
  const last = `${month}-${String(lastDay).padStart(2, '0')}`;
  return { first, last };
}

/** 月报的一条输入来源（周报或日报），label 用于在 prompt 里标注，如「第 1 周周报」「06-01 日报」。 */
export interface MonthlySource {
  label: string;
  content: string;
}

export interface MonthlyParams {
  month: string; // YYYY-MM
  /** 月报输入来源：优先整月周报，缺失时回落当月日报全文（见 selectMonthlySources）。 */
  sources: MonthlySource[];
  stats: RangeStats;
  /** 自定义生成模板（system prompt）；空/未给 → 用内置默认句。 */
  systemPrompt?: string;
}

/** 月报输入选择：本月已有周报就只喂周报；一篇都没有则回落喂当月所有日报全文。空内容剔除。 */
export function selectMonthlySources(weeklyReports: MonthlySource[], dailyReports: MonthlySource[]): MonthlySource[] {
  const weekly = weeklyReports.filter((s) => s.content.trim());
  if (weekly.length) return weekly;
  return dailyReports.filter((s) => s.content.trim());
}

export function buildMonthlyMessages(params: MonthlyParams): ChatMessage[] {
  const system = params.systemPrompt?.trim() || DEFAULT_MONTHLY_SYSTEM;
  const user = [
    `月：${params.month}`,
    '确定性统计（以此为准）：',
    `- 活跃天数：${params.stats.activeDays}`,
    `- 完成任务：${params.stats.totalCompleted}/${params.stats.totalTasks}`,
    `- 连续天数（截至月末）：${params.stats.streak}`,
    '',
    '本月输入：',
    ...params.sources.map((s) => `### ${s.label}\n${s.content.trim()}`),
  ].join('\n');
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
