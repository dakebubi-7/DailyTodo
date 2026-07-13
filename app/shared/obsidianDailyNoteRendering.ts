import { ObsidianTemplateSettings } from './appSettings';
import { customBlockMarker } from './aiReview/markers';
import { getDailyBlockOrder } from './aiReview/sectionConfig';
import type { CustomBlock, FixedBlockId } from './aiReview/sectionConfig';
import { readObsidianTemplateCompat } from './obsidianTemplateCompat';
import { buildTaskLines } from './obsidianTemplateTaskLines';
import type { ObsidianTemplateTask } from './obsidianTemplateTaskLines';

export const TASK_START_MARKER = '<!-- DAILYTODO:TASKS:START -->';
export const TASK_END_MARKER = '<!-- DAILYTODO:TASKS:END -->';
export const WORK_START_MARKER = '<!-- DAILYTODO:WORK:START -->';
export const WORK_END_MARKER = '<!-- DAILYTODO:WORK:END -->';
export const INSPIRATION_START_MARKER = '<!-- DAILYTODO:INSPIRATION:START -->';
export const INSPIRATION_END_MARKER = '<!-- DAILYTODO:INSPIRATION:END -->';

const compat = readObsidianTemplateCompat;

export function buildWorkBlock(dailyWork: string, templates: ObsidianTemplateSettings) {
  const c = compat(templates);
  return [WORK_START_MARKER, `## ${c.workSectionTitle}`, dailyWork.trim() || '-', WORK_END_MARKER].join('\n');
}

export function buildInspirationBlock(dailyInspiration: string, templates: ObsidianTemplateSettings) {
  const c = compat(templates);
  return [INSPIRATION_START_MARKER, `## ${c.inspirationSectionTitle}`, dailyInspiration.trim() || '-', INSPIRATION_END_MARKER].join('\n');
}

export function buildTaskBlock(date: string, tasks: ObsidianTemplateTask[], templates: ObsidianTemplateSettings) {
  const c = compat(templates);
  const taskLines = buildTaskLines(tasks, date, templates);
  return [
    TASK_START_MARKER,
    `## ${c.tasksSectionTitle}`,
    taskLines.length ? taskLines.join('\n') : '- [ ] \u4eca\u5929\u8fd8\u6ca1\u6709\u8bb0\u5f55\u4efb\u52a1',
    '',
    `\u540c\u6b65\u65f6\u95f4\uff1a${new Date().toLocaleString('zh-CN')}`,
    TASK_END_MARKER,
  ].join('\n');
}

function buildCustomAiBlock(block: CustomBlock) {
  if (!block.aiGenerate) return '';
  const marker = customBlockMarker(block.id);
  return [`## ${block.name}`, marker.start, marker.end].join('\n');
}

function isFixedBlockEnabled(id: FixedBlockId, templates: ObsidianTemplateSettings) {
  const c = compat(templates);
  if (id === 'work') return c.workEnabled;
  if (id === 'inspire') return c.inspirationEnabled;
  return c.tasksEnabled;
}

type DailyNoteRenderParams = {
  date: string;
  tasks: ObsidianTemplateTask[];
  dailyWork: string;
  dailyInspiration: string;
  templates: ObsidianTemplateSettings;
};

function buildFixedBlock(id: FixedBlockId, params: DailyNoteRenderParams) {
  if (!isFixedBlockEnabled(id, params.templates)) return '';
  if (id === 'work') return buildWorkBlock(params.dailyWork, params.templates);
  if (id === 'inspire') return buildInspirationBlock(params.dailyInspiration, params.templates);
  return buildTaskBlock(params.date, params.tasks, params.templates);
}

function replaceDailyTemplateToken(content: string, token: string, replacement: string) {
  return content.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, 'gi'), replacement);
}

function buildCustomTokenBlock(token: 'review' | 'tomorrow' | 'knowledge', templates: ObsidianTemplateSettings) {
  const index = token === 'review' ? 0 : token === 'tomorrow' ? 1 : 2;
  const block = templates.dailyTemplate.customBlocks[index];
  return block ? buildCustomAiBlock(block) : '';
}

export function buildDailyNoteContent(params: DailyNoteRenderParams) {
  const { date, templates } = params;
  const content = [
    '---',
    `title: "${date} \u6bcf\u65e5\u8bb0\u5f55"`,
    `date: "${date}"`,
    'tags: [\u6bcf\u65e5\u8bb0\u5f55, \u6bcf\u65e5\u590d\u76d8, \u77e5\u8bc6\u6c89\u6dc0]',
    '---',
    '',
    `# ${date} \u6bcf\u65e5\u8bb0\u5f55`,
    '',
  ];
  const customById = new Map(templates.dailyTemplate.customBlocks.map((block) => [block.id, block]));

  for (const item of getDailyBlockOrder(templates.dailyTemplate)) {
    if (item.type === 'fixed') {
      const rendered = buildFixedBlock(item.id, params);
      if (rendered) content.push(rendered, '');
      continue;
    }
    const block = customById.get(item.id);
    if (block) {
      const rendered = buildCustomAiBlock(block);
      if (rendered) content.push(rendered, '');
    }
  }

  return content.join('\n');
}

export function buildDailyNoteFromTemplate(params: DailyNoteRenderParams) {
  const template = compat(params.templates).dailyMarkdownTemplate.trim();
  if (!template) return buildDailyNoteContent(params);

  let content = replaceDailyTemplateToken(template, 'date', params.date);
  content = replaceDailyTemplateToken(content, 'work', buildFixedBlock('work', params));
  content = replaceDailyTemplateToken(content, 'inspiration', buildFixedBlock('inspire', params));
  content = replaceDailyTemplateToken(content, 'inspire', buildFixedBlock('inspire', params));
  content = replaceDailyTemplateToken(content, 'tasks', buildFixedBlock('tasks', params));
  content = replaceDailyTemplateToken(content, 'review', buildCustomTokenBlock('review', params.templates));
  content = replaceDailyTemplateToken(content, 'tomorrow', buildCustomTokenBlock('tomorrow', params.templates));
  content = replaceDailyTemplateToken(content, 'knowledge', buildCustomTokenBlock('knowledge', params.templates));

  if (isFixedBlockEnabled('work', params.templates) && !content.includes(WORK_START_MARKER)) content += `\n\n${buildWorkBlock(params.dailyWork, params.templates)}`;
  if (isFixedBlockEnabled('inspire', params.templates) && !content.includes(INSPIRATION_START_MARKER)) content += `\n\n${buildInspirationBlock(params.dailyInspiration, params.templates)}`;
  if (isFixedBlockEnabled('tasks', params.templates) && !content.includes(TASK_START_MARKER)) content += `\n\n${buildTaskBlock(params.date, params.tasks, params.templates)}`;

  return `${content.trimEnd()}\n`;
}
