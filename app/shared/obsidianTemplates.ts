import path from 'path';
import { ObsidianTemplateSettings } from './appSettings';
import type { Task } from '../src/types/task';
import { customBlockMarker } from './aiReview/markers';
import { getDailyBlockOrder } from './aiReview/sectionConfig';
import type { CustomBlock, FixedBlockId } from './aiReview/sectionConfig';

// ── 新旧 schema 兼容层 ──────────────────────────────────────────
// T5 重构后 ObsidianTemplateSettings 删除了 modules / sectionTitles /
// taskLineTemplate / completionReviewTemplate 等字段。
// 以下 helper 在运行时优先读取新字段,找不到时退回老字段或默认值,
// 确保 main.ts / obsidianTemplates.ts 里的现有调用不因字段缺失而崩溃。
function compat(t: ObsidianTemplateSettings) {
  const a = t as any;
  const fb = t.dailyTemplate?.fixedBlocks ?? [];
  const cb = t.dailyTemplate?.customBlocks ?? [];
  const defaultCompletionReviewTemplate = [
    '  - 完成记录 {{index}}: {{status}} {{percent}}% @ {{reviewedAt}}',
    '    - 完成情况: {{summary}}',
    '    - 卡点/未知: {{unknowns}}',
    '    - 下一步: {{nextStep}}',
  ].join('\n');
  return {
    dailyPath:   t.dailyPath   || a.dailyNotePath || 'logs/daily/{{date}}.md',
    taskExportPath: a.taskExportPath || '',
    workEnabled:        a.modules?.work?.enabled        ?? true,
    inspirationEnabled: a.modules?.inspiration?.enabled ?? true,
    tasksEnabled:       a.modules?.tasks?.enabled       ?? true,
    reviewEnabled:      a.modules?.review?.enabled      ?? true,
    tomorrowEnabled:    a.modules?.tomorrow?.enabled    ?? true,
    knowledgeEnabled:   a.modules?.knowledge?.enabled   ?? true,
    workSectionTitle:      a.workSectionTitle        ?? fb.find((b: any) => b.id === 'work')?.displayName    ?? '今日工作',
    inspirationSectionTitle: a.inspirationSectionTitle ?? fb.find((b: any) => b.id === 'inspire')?.displayName ?? '灵感随笔',
    tasksSectionTitle:     a.tasksSectionTitle       ?? fb.find((b: any) => b.id === 'tasks')?.displayName   ?? '每日任务',
    reviewSectionTitle:    a.reviewSectionTitle      ?? cb.find((b: any) => /复盘|review/i.test(b.name))?.name ?? '复盘',
    tomorrowTaskSectionTitle: a.tomorrowTaskSectionTitle ?? cb.find((b: any) => /明日|待办|tomorrow/i.test(b.name))?.name ?? '明日待办',
    reusableKnowledgeSectionTitle: a.reusableKnowledgeSectionTitle ?? cb.find((b: any) => /知识|knowledge/i.test(b.name))?.name ?? '可复用知识',
    taskLineTemplate:   a.taskLineTemplate   ?? '- [{checked}] {text}',
    completionReviewTemplate: a.completionReviewTemplate || defaultCompletionReviewTemplate,
    dailyMarkdownTemplate: a.dailyMarkdownTemplate ?? '',
  };
}
// ────────────────────────────────────────────────────────────────

export const TASK_START_MARKER = '<!-- DAILYTODO:TASKS:START -->';
export const TASK_END_MARKER = '<!-- DAILYTODO:TASKS:END -->';
export const WORK_START_MARKER = '<!-- DAILYTODO:WORK:START -->';
export const WORK_END_MARKER = '<!-- DAILYTODO:WORK:END -->';
export const INSPIRATION_START_MARKER = '<!-- DAILYTODO:INSPIRATION:START -->';
export const INSPIRATION_END_MARKER = '<!-- DAILYTODO:INSPIRATION:END -->';

export interface SyncPreviewFile {
  filePath: string;
  action: 'create' | 'update';
}

export interface SyncPreviewBlock {
  marker: 'DAILYTODO:WORK' | 'DAILYTODO:INSPIRATION' | 'DAILYTODO:TASKS';
  action: 'replace' | 'insert';
}

export interface SyncPreview {
  files: SyncPreviewFile[];
  managedBlocks: SyncPreviewBlock[];
  taskCount: number;
  completionRecordCount: number;
  deletedReviewWillDisappear: boolean;
}

function renderPath(template: string, date: string) {
  return template.replace(/\{\{date\}\}/g, date);
}

export function resolveTemplatePath(vaultPath: string, templatePath: string, date: string) {
  const rendered = renderPath(templatePath, date).replace(/[<>:"|?*]/g, '-');
  if (path.isAbsolute(rendered)) {
    throw new Error(`Template path must be relative to the vault: ${rendered}`);
  }

  const vaultRoot = path.resolve(vaultPath);
  const resolved = path.resolve(vaultRoot, rendered);
  const relative = path.relative(vaultRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Template path escapes the selected vault: ${rendered}`);
  }
  return resolved;
}

function getTaskDate(task: Task) {
  return task.taskDate || task.createdAt?.slice(0, 10) || '';
}

function escapeTaskText(text = '') {
  return text.replace(/\r?\n/g, ' ').trim();
}

/** 复盘字段允许多行：保留换行，后续行加缩进以保持在 Obsidian 嵌套列表项内。 */
function escapeReviewText(text = '') {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed.replace(/\r?\n/g, '\n      ');
}

function formatTaskTags(tags: string[] = []) {
  return tags
    .map((tag) => tag.trim().replace(/\s+/g, '-'))
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join(' ');
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN');
}

function getReviewDate(review: NonNullable<Task['completionReview']>) {
  return review.reviewedAt.slice(0, 10);
}

export { getCompletionReviews } from './completionReviews';
import { getCompletionReviews } from './completionReviews';

function renderTemplate(template: string, replacements: Record<string, string | number>) {
  return template
    .replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(replacements[key] ?? ''))
    .replace(/\{(\w+)\}/g, (_, key: string) => String(replacements[key] ?? ''));
}

export function buildTaskLines(tasks: Task[], date: string, templates: ObsidianTemplateSettings) {
  const c = compat(templates);
  const priorityLabel = { high: 'high', medium: 'medium', low: 'low' };
  const statusLabel = { done: '全部完成', partial: '部分完成', blocked: '有卡点' };
  const taskAppliesToDate = (task: Task) =>
    getTaskDate(task) === date ||
    getCompletionReviews(task).some((review) => getReviewDate(review) === date) ||
    (task.subtasks || []).some(taskAppliesToDate);
  const sortTasks = (items: Task[]) =>
    [...items].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
  const indentLines = (value: string, depth: number) =>
    value
      .split('\n')
      .map((line) => `${'  '.repeat(depth)}${line}`)
      .join('\n');

  const renderTask = (task: Task, depth: number): string[] => {
    const taskDate = getTaskDate(task);
    const tags = formatTaskTags(task.tags);
    const taskText = [escapeTaskText(task.text), c.taskLineTemplate.includes('tags') ? '' : tags]
      .filter(Boolean)
      .join(' ');
    const lines = [
      indentLines(renderTemplate(c.taskLineTemplate, {
        checked: task.completed ? 'x' : ' ',
        text: taskText,
        priority: priorityLabel[task.priority],
        tags,
        dateNote: taskDate && taskDate !== date ? ` (任务日期: ${taskDate})` : '',
      }), depth),
    ];

    if (task.completedAt) {
      lines.push(indentLines(`  - 任务完成时间: ${formatDateTime(task.completedAt)}`, depth));
    }

    const visibleReviews =
      taskDate === date
        ? getCompletionReviews(task)
        : getCompletionReviews(task).filter((review) => getReviewDate(review) === date);

    visibleReviews.forEach((review, index) => {
      const rawDetails: Record<string, string> = {
        summary: review.summary,
        unknowns: review.unknowns,
        nextStep: review.nextStep,
      };
      const replacements = {
        index: index + 1,
        status: statusLabel[review.status],
        percent: review.percent,
        reviewedAt: formatDateTime(review.reviewedAt),
        summary: escapeReviewText(review.summary),
        unknowns: escapeReviewText(review.unknowns),
        nextStep: escapeReviewText(review.nextStep),
      };
      const renderedLines = String(c.completionReviewTemplate)
        .split('\n')
        .filter((lineTemplate) => {
          const referenced = Object.keys(rawDetails).filter((token) => lineTemplate.includes(`{{${token}}}`));
          if (!referenced.length) return true;
          return referenced.some((token) => escapeTaskText(rawDetails[token]) !== '');
        })
        .map((lineTemplate) => renderTemplate(lineTemplate, replacements));

      if (renderedLines.length) {
        lines.push(indentLines(renderedLines.join('\n'), depth));
      }
    });

    sortTasks(task.subtasks || [])
      .filter(taskAppliesToDate)
      .forEach((subtask) => {
        lines.push(...renderTask(subtask, depth + 1));
      });

    return lines;
  };

  return sortTasks(tasks)
    .filter(taskAppliesToDate)
    .flatMap((task) => renderTask(task, 0));
}

export function buildWorkBlock(dailyWork: string, templates: ObsidianTemplateSettings) {
  const c = compat(templates);
  return [
    WORK_START_MARKER,
    `## ${c.workSectionTitle}`,
    dailyWork.trim() || '-',
    WORK_END_MARKER,
  ].join('\n');
}

export function buildInspirationBlock(dailyInspiration: string, templates: ObsidianTemplateSettings) {
  const c = compat(templates);
  return [
    INSPIRATION_START_MARKER,
    `## ${c.inspirationSectionTitle}`,
    dailyInspiration.trim() || '-',
    INSPIRATION_END_MARKER,
  ].join('\n');
}

export function buildTaskBlock(date: string, tasks: Task[], templates: ObsidianTemplateSettings) {
  const c = compat(templates);
  const taskLines = buildTaskLines(tasks, date, templates);
  return [
    TASK_START_MARKER,
    `## ${c.tasksSectionTitle}`,
    taskLines.length ? taskLines.join('\n') : '- [ ] 今天还没有记录任务',
    '',
    `同步时间：${new Date().toLocaleString('zh-CN')}`,
    TASK_END_MARKER,
  ].join('\n');
}

function buildCustomAiBlock(block: CustomBlock) {
  if (!block.aiGenerate) return [`## ${block.name}`, ''].join('\n');
  const marker = customBlockMarker(block.id);
  return [`## ${block.name}`, marker.start, marker.end].join('\n');
}

function buildFixedBlock(id: FixedBlockId, params: {
  date: string;
  tasks: Task[];
  dailyWork: string;
  dailyInspiration: string;
  templates: ObsidianTemplateSettings;
}) {
  if (id === 'work') return buildWorkBlock(params.dailyWork, params.templates);
  if (id === 'inspire') return buildInspirationBlock(params.dailyInspiration, params.templates);
  return buildTaskBlock(params.date, params.tasks, params.templates);
}

export function buildDailyNoteContent(params: {
  date: string;
  tasks: Task[];
  dailyWork: string;
  dailyInspiration: string;
  templates: ObsidianTemplateSettings;
}) {
  const { date, templates } = params;
  const content = [
    '---',
    `title: "${date} 每日记录"`,
    `date: "${date}"`,
    'tags: [每日记录, 每日复盘, 知识沉淀]',
    '---',
    '',
    `# ${date} 每日记录`,
    '',
  ];
  const customById = new Map(templates.dailyTemplate.customBlocks.map((block) => [block.id, block]));

  for (const item of getDailyBlockOrder(templates.dailyTemplate)) {
    if (item.type === 'fixed') {
      content.push(buildFixedBlock(item.id, params), '');
      continue;
    }
    const block = customById.get(item.id);
    if (block) content.push(buildCustomAiBlock(block), '');
  }

  return content.join('\n');
}

export function buildDailyNoteFromTemplate(params: {
  date: string;
  tasks: Task[];
  dailyWork: string;
  dailyInspiration: string;
  templates: ObsidianTemplateSettings;
}) {
  const template = compat(params.templates).dailyMarkdownTemplate.trim();
  if (!template) return buildDailyNoteContent(params);

  let content = template
    .replace(/\{\{date\}\}/g, params.date)
    .replace(/\{\{work\}\}/g, buildWorkBlock(params.dailyWork, params.templates))
    .replace(/\{\{inspiration\}\}/g, buildInspirationBlock(params.dailyInspiration, params.templates))
    .replace(/\{\{tasks\}\}/g, buildTaskBlock(params.date, params.tasks, params.templates));

  if (!content.includes(WORK_START_MARKER)) content += `\n\n${buildWorkBlock(params.dailyWork, params.templates)}`;
  if (!content.includes(INSPIRATION_START_MARKER)) content += `\n\n${buildInspirationBlock(params.dailyInspiration, params.templates)}`;
  if (!content.includes(TASK_START_MARKER)) content += `\n\n${buildTaskBlock(params.date, params.tasks, params.templates)}`;

  return `${content.trimEnd()}\n`;
}



export function replaceManagedBlock(existing: string, startMarker: string, endMarker: string, block: string) {
  const start = existing.indexOf(startMarker);
  const end = existing.indexOf(endMarker);

  if (start !== -1 && end !== -1 && end > start) {
    const before = existing.slice(0, start).trimEnd();
    const after = existing.slice(end + endMarker.length).trimStart();
    return [before, block, after].filter(Boolean).join('\n\n') + '\n';
  }

  return `${existing.trimEnd()}\n\n${block}\n`;
}

export function readMarkedBlockBody(existing: string, startMarker: string, endMarker: string) {
  const start = existing.indexOf(startMarker);
  const end = existing.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) return '';

  const body = existing.slice(start + startMarker.length, end).trim();
  const lines = body.split(/\r?\n/);
  if (lines[0]?.trim().startsWith('## ')) lines.shift();
  const content = lines.join('\n').trim();
  return content === '-' ? '' : content;
}

function flattenTasks(tasks: Task[]): Task[] {
  return tasks.flatMap((task) => [task, ...flattenTasks(task.subtasks || [])]);
}

function countCompletionRecords(tasks: Task[]) {
  return flattenTasks(tasks).reduce((total, task) => total + getCompletionReviews(task).length, 0);
}

function reviewKeys(tasks: Task[]) {
  return new Set(
    flattenTasks(tasks).flatMap((task) =>
      getCompletionReviews(task).map((review) => `${task.id}:${review.id || review.reviewedAt}`),
    ),
  );
}

export function buildSyncPreview(params: {
  date: string;
  tasksBeforeDelete?: Task[];
  tasksAfterDelete: Task[];
  dailyWork: string;
  dailyInspiration: string;
  templates: ObsidianTemplateSettings;
  vaultPath: string;
  existingDailyNote?: string;
}) {
  const existingDailyNote = params.existingDailyNote || '';
  const beforeReviewKeys = reviewKeys(params.tasksBeforeDelete || params.tasksAfterDelete);
  const afterReviewKeys = reviewKeys(params.tasksAfterDelete);
  const deletedReviewWillDisappear = [...beforeReviewKeys].some((key) => !afterReviewKeys.has(key));
  const cc = compat(params.templates);
  const dailyPath = resolveTemplatePath(params.vaultPath, cc.dailyPath, params.date);

  const managedBlocks: SyncPreviewBlock[] = [];
  if (cc.workEnabled) {
    managedBlocks.push({ marker: 'DAILYTODO:WORK', action: existingDailyNote.includes(WORK_START_MARKER) ? 'replace' : 'insert' });
  }
  if (cc.inspirationEnabled) {
    managedBlocks.push({ marker: 'DAILYTODO:INSPIRATION', action: existingDailyNote.includes(INSPIRATION_START_MARKER) ? 'replace' : 'insert' });
  }
  if (cc.tasksEnabled) {
    managedBlocks.push({ marker: 'DAILYTODO:TASKS', action: existingDailyNote.includes(TASK_START_MARKER) ? 'replace' : 'insert' });
  }

  return {
    files: [
      { filePath: dailyPath, action: existingDailyNote ? 'update' : 'create' },
    ],
    managedBlocks,
    taskCount: flattenTasks(params.tasksAfterDelete).filter((task) => getTaskDate(task) === params.date).length,
    completionRecordCount: countCompletionRecords(params.tasksAfterDelete),
    deletedReviewWillDisappear,
  } satisfies SyncPreview;
}
