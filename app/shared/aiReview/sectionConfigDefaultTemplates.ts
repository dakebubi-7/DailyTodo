import type {
  CustomBlock,
  DailyBlockOrderItem,
  DailyTemplate,
  FixedBlock,
  ReportTemplate,
} from './sectionConfig';

export function createDefaultDailyTemplate(): DailyTemplate {
  const fixedBlocks: FixedBlock[] = [
    { id: 'work', displayName: '今日工作' },
    { id: 'inspire', displayName: '灵感随笔' },
    { id: 'tasks', displayName: '每日任务' },
  ];
  const customBlocks: CustomBlock[] = [
    { id: crypto.randomUUID(), name: '复盘', aiGenerate: true, renderType: 'text', prompt: '' },
    { id: crypto.randomUUID(), name: '明日待办', aiGenerate: true, renderType: 'list', prompt: '' },
    { id: crypto.randomUUID(), name: '可复用知识', aiGenerate: true, renderType: 'text', prompt: '' },
  ];
  return {
    fixedBlocks,
    customBlocks,
    blockOrder: createDailyBlockOrder(fixedBlocks, customBlocks),
  };
}

export function createDefaultReportTemplate(
  kind: 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly'
): ReportTemplate {
  if (kind === 'personalWeekly') {
    return {
      customBlocks: [
        { id: crypto.randomUUID(), name: '本周工作总结', aiGenerate: true, renderType: 'text', prompt: '请用口语化、亲切的语气总结本周工作。' },
        { id: crypto.randomUUID(), name: '本周完成任务', aiGenerate: true, renderType: 'table', prompt: '' },
        { id: crypto.randomUUID(), name: '本周灵感汇总', aiGenerate: true, renderType: 'callout', prompt: '请用 Obsidian Callout 突出显示。' },
        { id: crypto.randomUUID(), name: '下周计划', aiGenerate: true, renderType: 'list', prompt: '' },
      ],
    };
  }
  if (kind === 'personalMonthly') {
    return {
      customBlocks: [
        { id: crypto.randomUUID(), name: '本月工作总结', aiGenerate: true, renderType: 'text', prompt: '请用口语化总结。' },
        { id: crypto.randomUUID(), name: '本月完成任务', aiGenerate: true, renderType: 'table', prompt: '' },
        { id: crypto.randomUUID(), name: '本月灵感汇总', aiGenerate: true, renderType: 'callout', prompt: '' },
        { id: crypto.randomUUID(), name: '本月复盘', aiGenerate: true, renderType: 'text', prompt: '' },
        { id: crypto.randomUUID(), name: '下月计划', aiGenerate: true, renderType: 'list', prompt: '' },
      ],
    };
  }
  if (kind === 'externalWeekly') {
    return {
      customBlocks: [
        { id: crypto.randomUUID(), name: '本周工作概览', aiGenerate: true, renderType: 'text', prompt: '请用正式书面语,不要包含个人情绪。' },
        { id: crypto.randomUUID(), name: '关键交付', aiGenerate: true, renderType: 'table', prompt: '' },
        { id: crypto.randomUUID(), name: '下周计划', aiGenerate: true, renderType: 'list', prompt: '' },
      ],
    };
  }
  return {
    customBlocks: [
      { id: crypto.randomUUID(), name: '本月工作概览', aiGenerate: true, renderType: 'text', prompt: '请用正式书面语。' },
      { id: crypto.randomUUID(), name: '关键交付', aiGenerate: true, renderType: 'table', prompt: '' },
      { id: crypto.randomUUID(), name: '下月计划', aiGenerate: true, renderType: 'list', prompt: '' },
    ],
  };
}

export function createDailyBlockOrder(fixedBlocks: FixedBlock[], customBlocks: CustomBlock[]): DailyBlockOrderItem[] {
  return [
    ...fixedBlocks.map((block) => ({ type: 'fixed' as const, id: block.id })),
    ...customBlocks.map((block) => ({ type: 'custom' as const, id: block.id })),
  ];
}
