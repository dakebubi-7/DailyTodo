import type { RangeStats } from './stats';
import type { ChatMessage } from '../llm/openaiClient';

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

export interface MonthlyParams {
  month: string; // YYYY-MM
  weeklyHighlights: string[]; // 各周报要点
  stats: RangeStats;
  /** 自定义生成模板（system prompt）；空/未给 → 用内置默认句。 */
  systemPrompt?: string;
}

const DEFAULT_MONTHLY_SYSTEM =
  '你是月报助手。基于本月各周报要点生成个人月报，包含：月度概览、主要成果、知识沉淀、未完成与下月计划。不要编造数字，统计以给定值为准。输出 Markdown。';

export function buildMonthlyMessages(params: MonthlyParams): ChatMessage[] {
  const system = params.systemPrompt?.trim() || DEFAULT_MONTHLY_SYSTEM;
  const user = [
    `月：${params.month}`,
    '确定性统计（以此为准）：',
    `- 活跃天数：${params.stats.activeDays}`,
    `- 完成任务：${params.stats.totalCompleted}/${params.stats.totalTasks}`,
    `- 连续天数（截至月末）：${params.stats.streak}`,
    '',
    '本月各周要点：',
    ...params.weeklyHighlights.map((h, i) => `### 第 ${i + 1} 周\n${h.trim()}`),
  ].join('\n');
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
