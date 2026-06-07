import type { SectionConfig } from './sectionConfig';
import type { DailyStats } from './stats';

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export interface BuildMessagesParams {
  date: string;
  dailyContent: string;
  section: SectionConfig;
  stats: DailyStats;
}

const SYSTEM_PROMPT = [
  '你是 DailyTodo 的复盘助手。你产出的是草稿，署名交出去的内容仍由用户拍板。',
  '严格规则：不要编造数字统计，所有数字以下面给出的「确定性统计」为准；不要虚构当天没发生的事；如果信息不足就如实说明。',
  '输出 Markdown 正文片段，不要重复标题，不要加代码块围栏。',
].join('\n');

export function buildReviewMessages(params: BuildMessagesParams): ChatMessage[] {
  const { date, dailyContent, section, stats } = params;
  const user = [
    `日期：${date}`,
    `任务：『${section.title}』`,
    `要求：${section.prompt}`,
    '',
    '确定性统计（必须以此为准，不得改写）：',
    `- 当天任务数：${stats.total}`,
    `- 已完成：${stats.completed}`,
    `- 完成率：${stats.completionRate}%`,
    '',
    '今天的日记原文：',
    dailyContent.trim() || '（今天没有记录正文）',
  ].join('\n');

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ];
}
