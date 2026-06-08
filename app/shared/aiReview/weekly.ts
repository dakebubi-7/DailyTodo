import type { RangeStats } from './stats';
import type { ChatMessage } from '../llm/openaiClient';
import { DEFAULT_WEEKLY_SYSTEM } from './defaultPrompts';

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

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** ISO 周键（YYYY-Www）→ 该周周一的日期键（YYYY-MM-DD）。isoWeekKey 的逆运算。非法输入原样返回。 */
export function isoWeekToMonday(weekKey: string): string {
  const m = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!m) return weekKey;
  const year = Number(m[1]);
  const week = Number(m[2]);
  // 1 月 4 日恒在 ISO 第 1 周；由它回推第 1 周的周一，再按周数平移。
  const jan4 = new Date(year, 0, 4);
  const jan4Mon = (jan4.getDay() + 6) % 7; // 周一=0
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - jan4Mon + (week - 1) * 7);
  return `${monday.getFullYear()}-${pad2(monday.getMonth() + 1)}-${pad2(monday.getDate())}`;
}

export interface WeeklyParams {
  weekKey: string;
  dailyContents: Array<{ date: string; content: string }>;
  stats: RangeStats;
  /** 自定义生成模板（system prompt）；空/未给 → 用内置默认句。 */
  systemPrompt?: string;
}

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
