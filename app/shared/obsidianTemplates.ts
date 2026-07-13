import path from 'path';
import { ObsidianTemplateSettings } from './appSettings';
import { readObsidianTemplateCompat } from './obsidianTemplateCompat';
import { collectVisibleTaskStats } from './obsidianTemplateTaskLines';
import type { ObsidianTemplateTask } from './obsidianTemplateTaskLines';
import {
  INSPIRATION_START_MARKER,
  TASK_START_MARKER,
  WORK_START_MARKER,
} from './obsidianDailyNoteRendering';
import { dateKeyToLocalDate, expandPathTemplate } from './pathTemplate';

export { buildTaskLines } from './obsidianTemplateTaskLines';
export type { ObsidianTemplateCompletionReview, ObsidianTemplateTask } from './obsidianTemplateTaskLines';
export { getCompletionReviews } from './completionReviews';
export {
  buildDailyNoteContent,
  buildDailyNoteFromTemplate,
  buildInspirationBlock,
  buildTaskBlock,
  buildWorkBlock,
  INSPIRATION_END_MARKER,
  INSPIRATION_START_MARKER,
  TASK_END_MARKER,
  TASK_START_MARKER,
  WORK_END_MARKER,
  WORK_START_MARKER,
} from './obsidianDailyNoteRendering';

const compat = readObsidianTemplateCompat;

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

export function resolveTemplatePath(vaultPath: string, templatePath: string, date: string) {
  const renderedTemplate = expandPathTemplate(templatePath, dateKeyToLocalDate(date));
  if (path.isAbsolute(renderedTemplate)) {
    throw new Error(`Template path must be relative to the vault: ${renderedTemplate}`);
  }

  const rendered = renderedTemplate.replace(/[<>:"|?*]/g, '-');
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

  const body = existing.slice(start + startMarker.length, end).trim().replace(/\r\n/g, '\n');
  const firstLineEnd = body.indexOf('\n');
  const firstLine = firstLineEnd === -1 ? body : body.slice(0, firstLineEnd);
  const content = firstLine.trim().startsWith('## ')
    ? body.slice(firstLineEnd === -1 ? body.length : firstLineEnd + 1).trim()
    : body.trim();
  return content === '-' ? '' : content;
}

export function buildSyncPreview(params: {
  date: string;
  tasksBeforeDelete?: ObsidianTemplateTask[];
  tasksAfterDelete: ObsidianTemplateTask[];
  dailyWork: string;
  dailyInspiration: string;
  templates: ObsidianTemplateSettings;
  vaultPath: string;
  existingDailyNote?: string;
}) {
  const existingDailyNote = params.existingDailyNote || '';
  const afterStats = collectVisibleTaskStats(params.tasksAfterDelete, params.date);
  const beforeStats = params.tasksBeforeDelete
    ? collectVisibleTaskStats(params.tasksBeforeDelete, params.date)
    : afterStats;
  let deletedReviewWillDisappear = false;
  for (const key of beforeStats.reviewKeys) {
    if (!afterStats.reviewKeys.has(key)) {
      deletedReviewWillDisappear = true;
      break;
    }
  }
  const cc = compat(params.templates);
  const dailyPath = resolveTemplatePath(params.vaultPath, cc.dailyPath, params.date);
  const hasWorkBlock = cc.workEnabled && existingDailyNote.includes(WORK_START_MARKER);
  const hasInspirationBlock = cc.inspirationEnabled && existingDailyNote.includes(INSPIRATION_START_MARKER);
  const hasTasksBlock = cc.tasksEnabled && existingDailyNote.includes(TASK_START_MARKER);

  const managedBlocks: SyncPreviewBlock[] = [];
  if (cc.workEnabled) managedBlocks.push({ marker: 'DAILYTODO:WORK', action: hasWorkBlock ? 'replace' : 'insert' });
  if (cc.inspirationEnabled) managedBlocks.push({ marker: 'DAILYTODO:INSPIRATION', action: hasInspirationBlock ? 'replace' : 'insert' });
  if (cc.tasksEnabled) managedBlocks.push({ marker: 'DAILYTODO:TASKS', action: hasTasksBlock ? 'replace' : 'insert' });

  return {
    files: [{ filePath: dailyPath, action: existingDailyNote ? 'update' : 'create' }],
    managedBlocks,
    taskCount: afterStats.taskCount,
    completionRecordCount: afterStats.completionRecordCount,
    deletedReviewWillDisappear,
  } satisfies SyncPreview;
}
