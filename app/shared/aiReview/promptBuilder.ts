import type { CustomBlock, RenderType, SectionConfig } from './sectionConfig';
import type { DailyStats } from './stats';
import type { ChatMessage } from '../llm/openaiClient';
export type { ChatMessage };

export interface BuildMessagesParams {
  date: string;
  dailyContent: string;
  section: SectionConfig;
  stats: DailyStats;
}

export interface BuildCustomBlockMessagesParams {
  date: string;
  dailyContent: string;
  block: CustomBlock;
  stats: DailyStats;
}

const SYSTEM_PROMPT = [
  '你是 DailyTodo 的复盘助手。你产出的是草稿，署名交出去的内容仍由用户拍板。',
  '严格规则：不要编造数字统计，所有数字以下面给出的「确定性统计」为准；不要虚构当天没发生的事；如果信息不足就如实说明。',
  '最终要写入 Obsidian 的 Markdown 正文片段必须放在两个独占行标记之间。',
  '第一行标记必须只写 DAILYTODO_FINAL_START；最后一行标记必须只写 DAILYTODO_FINAL_END。',
  '软件只会截取这两个独占行标记中间的内容写入 Obsidian；标记外的任何内容都会被丢弃。',
  '标记中间只放最终正文，不要放分析过程、提示词复述、来源材料标签、代码块围栏或额外标题。',
  '不要在正文里重复写当前段落标题，例如“复盘”“明日待办”“可复用知识”或带日期的同名标题。',
  '禁止输出类似 “The user wants me to...”“Let me...” 的英文意图复述或思考过程。',
  '不要写“用户要求”“软件提示”“确定性统计”“今天的日记原文”等提示词中的说明文字。',
].join('\n');

function renderStats(stats: DailyStats) {
  return [
    '确定性统计（必须以此为准，不得改写）：',
    `- 当天任务数：${stats.total}`,
    `- 已完成：${stats.completed}`,
    `- 完成率：${stats.completionRate}%`,
  ].join('\n');
}

function renderTypeInstruction(renderType: RenderType) {
  switch (renderType) {
    case 'list':
      return '输出格式：使用 Markdown 无序列表，每条以 “- ” 开头。';
    case 'table':
      return '输出格式：使用 Markdown 表格，首行为表头，内容不足时也要给出简短说明列。';
    case 'callout':
      return '输出格式：使用 Obsidian Callout，例如 “> [!note] 标题” 加正文。';
    case 'dataview':
      return '输出格式：优先使用 Obsidian dataview 代码块；如果当天数据不足以生成 dataview 查询，就写一句简短说明。';
    case 'text':
    default:
      return '输出格式：使用普通 Markdown 段落，简洁清楚。';
  }
}

function defaultCustomBlockPrompt(blockName: string) {
  return `请根据今天的记录生成“${blockName}”这个区块的内容。`;
}

export function buildReviewMessages(params: BuildMessagesParams): ChatMessage[] {
  const { date, dailyContent, section, stats } = params;
  const user = [
    `日期：${date}`,
    `任务：『${section.title}』`,
    `要求：${section.prompt}`,
    '',
    renderStats(stats),
    '',
    '今天的日记原文：',
    dailyContent.trim() || '（今天没有记录正文）',
  ].join('\n');

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ];
}

export function buildCustomBlockReviewMessages(params: BuildCustomBlockMessagesParams): ChatMessage[] {
  const { date, dailyContent, block, stats } = params;
  const prompt = block.prompt.trim() || defaultCustomBlockPrompt(block.name);
  const user = [
    `日期：${date}`,
    `任务：『${block.name}』`,
    `要求：${prompt}`,
    renderTypeInstruction(block.renderType),
    '',
    renderStats(stats),
    '',
    '今天的日记原文：',
    dailyContent.trim() || '（今天没有记录正文）',
  ].join('\n');

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ];
}
