import path from 'path';
import { ObsidianTemplateSettings } from './appSettings';
import type { Task } from '../src/types/task';
import { REVIEW_MARKERS } from './aiReview/markers';

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

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN');
}

function getReviewDate(review: NonNullable<Task['completionReview']>) {
  return review.reviewedAt.slice(0, 10);
}

export function getCompletionReviews(task: Task) {
  if (task.completionReviews?.length) return task.completionReviews;
  return task.completionReview ? [task.completionReview] : [];
}

function renderTemplate(template: string, replacements: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(replacements[key] ?? ''));
}

export function buildTaskLines(tasks: Task[], date: string, templates: ObsidianTemplateSettings) {
  const priorityLabel = { high: '高', medium: '中', low: '低' };
  const statusLabel = { done: '全部完成', partial: '部分完成', blocked: '有卡点' };

  return tasks
    .filter((task) => getTaskDate(task) === date || getCompletionReviews(task).some((review) => getReviewDate(review) === date))
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .flatMap((task) => {
      const taskDate = getTaskDate(task);
      const lines = [
        renderTemplate(templates.taskLineTemplate, {
          checked: task.completed ? 'x' : ' ',
          text: escapeTaskText(task.text),
          priority: priorityLabel[task.priority],
          dateNote: taskDate && taskDate !== date ? ` (任务日期：${taskDate})` : '',
        }),
      ];

      if (task.completedAt) {
        lines.push(`  - 任务完成时间：${formatDateTime(task.completedAt)}`);
      }

      const visibleReviews =
        taskDate === date
          ? getCompletionReviews(task)
          : getCompletionReviews(task).filter((review) => getReviewDate(review) === date);

      visibleReviews.forEach((review, index) => {
        // 明细字段以「原始值 trim 后是否为空」判空，空字段所在行整行跳过，不写入 Obsidian。
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
        const renderedLines = templates.completionReviewTemplate
          .split('\n')
          .filter((lineTemplate) => {
            // 该行引用到的明细字段（summary / unknowns / nextStep）。
            const referenced = Object.keys(rawDetails).filter((token) => lineTemplate.includes(`{{${token}}}`));
            // 非明细行（首行：序号/状态/完成度/时间）恒保留。
            if (!referenced.length) return true;
            // 行内引用的明细字段全部为空 → 跳过此行；只要有一个非空就保留。
            return referenced.some((token) => escapeTaskText(rawDetails[token]) !== '');
          })
          .map((lineTemplate) => renderTemplate(lineTemplate, replacements));

        if (renderedLines.length) {
          lines.push(renderedLines.join('\n'));
        }
      });

      return lines;
    });
}

export function buildWorkBlock(dailyWork: string, templates: ObsidianTemplateSettings) {
  return [
    WORK_START_MARKER,
    `## ${templates.workSectionTitle}`,
    dailyWork.trim() || '-',
    WORK_END_MARKER,
  ].join('\n');
}

export function buildInspirationBlock(dailyInspiration: string, templates: ObsidianTemplateSettings) {
  return [
    INSPIRATION_START_MARKER,
    `## ${templates.inspirationSectionTitle}`,
    dailyInspiration.trim() || '-',
    INSPIRATION_END_MARKER,
  ].join('\n');
}

export function buildTaskBlock(date: string, tasks: Task[], templates: ObsidianTemplateSettings) {
  const taskLines = buildTaskLines(tasks, date, templates);
  return [
    TASK_START_MARKER,
    `## ${templates.taskSectionTitle}`,
    taskLines.length ? taskLines.join('\n') : '- [ ] 今天还没有记录任务',
    '',
    `同步时间：${new Date().toLocaleString('zh-CN')}`,
    TASK_END_MARKER,
  ].join('\n');
}

export function buildDailyNoteContent(params: {
  date: string;
  tasks: Task[];
  dailyWork: string;
  dailyInspiration: string;
  templates: ObsidianTemplateSettings;
}) {
  const { date, tasks, dailyWork, dailyInspiration, templates } = params;
  const content = [
    '---',
    `title: "DailyTodo ${date}"`,
    `date: "${date}"`,
    'tags: [daily-todo, daily-review, knowledge-base]',
    '---',
    '',
    `# ${date} 每日记录`,
    '',
  ];

  if (templates.modules.work.enabled) {
    content.push(buildWorkBlock(dailyWork, templates), '');
  }

  if (templates.modules.inspiration.enabled) {
    content.push(buildInspirationBlock(dailyInspiration, templates), '');
  }

  if (templates.modules.tasks.enabled) {
    content.push(buildTaskBlock(date, tasks, templates), '');
  }

  // 标题在 marker 块外，块内只放 AI 托管内容并默认留空，
  // 这样补偿扫描会把空块判为 Unprocessed 并填充，标题始终可见。
  if (templates.modules.review.enabled) {
    content.push(`## ${templates.reviewSectionTitle}`, REVIEW_MARKERS.REVIEW.start, REVIEW_MARKERS.REVIEW.end, '');
  }

  if (templates.modules.tomorrow.enabled) {
    content.push(`## ${templates.tomorrowTaskSectionTitle}`, REVIEW_MARKERS.TOMORROW.start, REVIEW_MARKERS.TOMORROW.end, '');
  }

  if (templates.modules.knowledge.enabled) {
    content.push(`## ${templates.reusableKnowledgeSectionTitle}`, REVIEW_MARKERS.KNOWLEDGE.start, REVIEW_MARKERS.KNOWLEDGE.end, '');
  }

  return content.join('\n');
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

function countCompletionRecords(tasks: Task[]) {
  return tasks.reduce((total, task) => total + getCompletionReviews(task).length, 0);
}

function reviewKeys(tasks: Task[]) {
  return new Set(
    tasks.flatMap((task) =>
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
  const dailyPath = resolveTemplatePath(params.vaultPath, params.templates.dailyNotePath, params.date);

  const managedBlocks: SyncPreviewBlock[] = [];
  if (params.templates.modules.work.enabled) {
    managedBlocks.push({ marker: 'DAILYTODO:WORK', action: existingDailyNote.includes(WORK_START_MARKER) ? 'replace' : 'insert' });
  }
  if (params.templates.modules.inspiration.enabled) {
    managedBlocks.push({ marker: 'DAILYTODO:INSPIRATION', action: existingDailyNote.includes(INSPIRATION_START_MARKER) ? 'replace' : 'insert' });
  }
  if (params.templates.modules.tasks.enabled) {
    managedBlocks.push({ marker: 'DAILYTODO:TASKS', action: existingDailyNote.includes(TASK_START_MARKER) ? 'replace' : 'insert' });
  }

  return {
    files: [
      { filePath: dailyPath, action: existingDailyNote ? 'update' : 'create' },
    ],
    managedBlocks,
    taskCount: params.tasksAfterDelete.filter((task) => getTaskDate(task) === params.date).length,
    completionRecordCount: countCompletionRecords(params.tasksAfterDelete),
    deletedReviewWillDisappear,
  } satisfies SyncPreview;
}
