import type { ObsidianTemplateSettings } from './appSettings';
import type { CustomBlock, FixedBlock, FixedBlockId } from './aiReview/sectionConfig';
import { isObjectRecord } from './unknownValueGuards';

function readString(value: Record<string, unknown>, key: string): string | undefined {
  const stored = value[key];
  return typeof stored === 'string' ? stored : undefined;
}

function readBoolean(value: Record<string, unknown>, key: string): boolean | undefined {
  const stored = value[key];
  return typeof stored === 'boolean' ? stored : undefined;
}

function readModuleEnabled(value: Record<string, unknown>, moduleId: string, fallback: boolean): boolean {
  const modules = value.modules;
  if (!isObjectRecord(modules)) return fallback;
  const module = modules[moduleId];
  if (!isObjectRecord(module)) return fallback;
  return readBoolean(module, 'enabled') ?? fallback;
}

function findFixedBlockTitle(blocks: readonly FixedBlock[], id: FixedBlockId): string | undefined {
  return blocks.find((block) => block.id === id)?.displayName;
}

function findCustomBlockTitle(blocks: readonly CustomBlock[], pattern: RegExp): string | undefined {
  return blocks.find((block) => pattern.test(block.name))?.name;
}

export function readObsidianTemplateCompat(t: ObsidianTemplateSettings) {
  const legacy: Record<string, unknown> = isObjectRecord(t) ? t : {};
  const fb = t.dailyTemplate?.fixedBlocks ?? [];
  const cb = t.dailyTemplate?.customBlocks ?? [];
  const defaultCompletionReviewTemplate = [
    '  - 完成记录 {{index}}: {{status}} {{percent}}% @ {{reviewedAt}}',
    '    - 完成情况: {{summary}}',
    '    - 卡点/未知: {{unknowns}}',
    '    - 下一步: {{nextStep}}',
  ].join('\n');
  return {
    dailyPath: t.dailyPath || readString(legacy, 'dailyNotePath') || 'logs/daily/{{date}}.md',
    workEnabled: readModuleEnabled(legacy, 'work', true),
    inspirationEnabled: readModuleEnabled(legacy, 'inspiration', true),
    tasksEnabled: readModuleEnabled(legacy, 'tasks', true),
    reviewEnabled: readModuleEnabled(legacy, 'review', true),
    tomorrowEnabled: readModuleEnabled(legacy, 'tomorrow', true),
    knowledgeEnabled: readModuleEnabled(legacy, 'knowledge', true),
    workSectionTitle: readString(legacy, 'workSectionTitle') ?? findFixedBlockTitle(fb, 'work') ?? '今日工作',
    inspirationSectionTitle: readString(legacy, 'inspirationSectionTitle') ?? findFixedBlockTitle(fb, 'inspire') ?? '灵感随笔',
    tasksSectionTitle: readString(legacy, 'tasksSectionTitle') ?? findFixedBlockTitle(fb, 'tasks') ?? '每日任务',
    reviewSectionTitle: readString(legacy, 'reviewSectionTitle') ?? findCustomBlockTitle(cb, /复盘|review/i) ?? '复盘',
    tomorrowTaskSectionTitle: readString(legacy, 'tomorrowTaskSectionTitle') ?? findCustomBlockTitle(cb, /明日|待办|tomorrow/i) ?? '明日待办',
    reusableKnowledgeSectionTitle: readString(legacy, 'reusableKnowledgeSectionTitle') ?? findCustomBlockTitle(cb, /知识|knowledge/i) ?? '可复用知识',
    taskLineTemplate: readString(legacy, 'taskLineTemplate') ?? '- [{checked}] {text}',
    completionReviewTemplate: readString(legacy, 'completionReviewTemplate') || defaultCompletionReviewTemplate,
    dailyMarkdownTemplate: readString(legacy, 'dailyMarkdownTemplate') ?? '',
  };
}
