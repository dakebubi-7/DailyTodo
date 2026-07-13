import { isObjectRecord } from './unknownValueGuards';

export interface ObsidianActionResult {
  ok: boolean;
  filePath?: string;
  reason?: string;
}

export function readObsidianActionResult(value: unknown): ObsidianActionResult | undefined {
  if (!isObjectRecord(value) || typeof value.ok !== 'boolean') return undefined;
  if (value.filePath !== undefined && typeof value.filePath !== 'string') return undefined;
  if (value.reason !== undefined && typeof value.reason !== 'string') return undefined;
  const result: ObsidianActionResult = { ok: value.ok };
  if (typeof value.filePath === 'string') result.filePath = value.filePath;
  if (typeof value.reason === 'string') result.reason = value.reason;
  return result;
}

export function readObsidianPath(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

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

function isSyncPreviewFile(value: unknown): value is SyncPreviewFile {
  return (
    isObjectRecord(value) &&
    typeof value.filePath === 'string' &&
    (value.action === 'create' || value.action === 'update')
  );
}

function isSyncPreviewBlock(value: unknown): value is SyncPreviewBlock {
  return (
    isObjectRecord(value) &&
    (value.marker === 'DAILYTODO:WORK' ||
      value.marker === 'DAILYTODO:INSPIRATION' ||
      value.marker === 'DAILYTODO:TASKS') &&
    (value.action === 'replace' || value.action === 'insert')
  );
}

export function isSyncPreview(value: unknown): value is SyncPreview {
  if (!isObjectRecord(value)) return false;
  return (
    Array.isArray(value.files) &&
    value.files.every(isSyncPreviewFile) &&
    Array.isArray(value.managedBlocks) &&
    value.managedBlocks.every(isSyncPreviewBlock) &&
    typeof value.taskCount === 'number' &&
    typeof value.completionRecordCount === 'number' &&
    typeof value.deletedReviewWillDisappear === 'boolean'
  );
}

export function readSyncPreview(value: unknown): SyncPreview | undefined {
  if (!isSyncPreview(value)) return undefined;
  return value;
}

