import type { ChatMessage } from '../llm/openaiClient';
import type { RangeStats } from './stats';

export interface ReportMessageSource {
  label: string;
  content: string;
}

export interface BuildReportMessagesParams {
  system: string;
  periodLabel: string;
  period: string;
  streakLabel: string;
  sourceLabel: string;
  sources: ReportMessageSource[];
  stats: RangeStats;
}

export function buildReportMessages({
  system,
  periodLabel,
  period,
  streakLabel,
  sourceLabel,
  sources,
  stats,
}: BuildReportMessagesParams): ChatMessage[] {
  const user = [
    `${periodLabel}：${period}`,
    '确定性统计（以此为准）：',
    `- 活跃天数：${stats.activeDays}`,
    `- 完成任务：${stats.totalCompleted}/${stats.totalTasks}`,
    `- ${streakLabel}：${stats.streak}`,
    '',
    `${sourceLabel}：`,
    ...sources.map((source) => `### ${source.label}\n${source.content.trim()}`),
  ].join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
