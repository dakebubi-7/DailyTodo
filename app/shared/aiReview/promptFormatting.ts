import type { RenderType } from './sectionConfig';
import type { DailyStats } from './stats';

export function formatDailyStats(stats: DailyStats) {
  return [
    '确定性统计（必须以此为准，不得改写）：',
    `- 当天任务数：${stats.total}`,
    `- 已完成：${stats.completed}`,
    `- 完成率：${stats.completionRate}%`,
  ].join('\n');
}

export function getRenderTypeInstruction(renderType: RenderType) {
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

export function getCustomBlockDefaultPrompt(blockName: string) {
  return `请根据今天的记录生成“${blockName}”这个区块的内容。`;
}
