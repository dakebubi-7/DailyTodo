import type { RangeStats } from './stats';
import type { ChatMessage } from '../llm/openaiClient';

/** ISO 8601 周键，如 2026-W23。周一为一周起点，含当年第一个周四的那周为第 1 周。 */
export function isoWeekKey(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7,
    );
  return `${target.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export interface WeeklyParams {
  weekKey: string;
  dailyContents: Array<{ date: string; content: string }>;
  stats: RangeStats;
  /** 自定义生成模板（system prompt）；空/未给 → 用内置默认句。 */
  systemPrompt?: string;
}

const DEFAULT_WEEKLY_SYSTEM =
  '你是周报助手。基于本周日记生成个人周报，包含：概览、关键事件、知识增量、未完成、下周计划。不要编造数字，统计以给定值为准。输出 Markdown。';

export function buildWeeklyMessages(params: WeeklyParams): ChatMessage[] {
  const system = params.systemPrompt?.trim() || DEFAULT_WEEKLY_SYSTEM;
  const user = [
    `周：${params.weekKey}`,
    '确定性统计（以此为准）：',
    `- 活跃天数：${params.stats.activeDays}`,
    `- 完成任务：${params.stats.totalCompleted}/${params.stats.totalTasks}`,
    `- 连续天数：${params.stats.streak}`,
    '',
    '本周日记：',
    ...params.dailyContents.map((d) => `### ${d.date}\n${d.content.trim()}`),
  ].join('\n');
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
