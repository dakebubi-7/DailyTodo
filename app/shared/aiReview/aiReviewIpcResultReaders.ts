import { isObjectRecord } from '../unknownValueGuards';

export interface GenerationResult {
  ok: boolean;
  error?: string;
  filePath?: string;
  truncated?: boolean;
  filledMarkers?: string[];
  skippedMarkers?: string[];
}

export interface DailyInspection {
  exists: boolean;
  hasAiContent: boolean;
  filePath: string;
  error?: string;
}

export interface BackfillReport {
  processed: string[];
  filled: string[];
  errors: Array<{ date: string; error: string }>;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

export function readGenerationResult(value: unknown): GenerationResult | undefined {
  if (!isObjectRecord(value) || typeof value.ok !== 'boolean') return undefined;
  if (value.error !== undefined && typeof value.error !== 'string') return undefined;
  if (value.filePath !== undefined && typeof value.filePath !== 'string') return undefined;
  if (value.truncated !== undefined && typeof value.truncated !== 'boolean') return undefined;
  if (value.filledMarkers !== undefined && !isStringArray(value.filledMarkers)) return undefined;
  if (value.skippedMarkers !== undefined && !isStringArray(value.skippedMarkers)) return undefined;
  const result: GenerationResult = { ok: value.ok };
  if (typeof value.error === 'string') result.error = value.error;
  if (typeof value.filePath === 'string') result.filePath = value.filePath;
  if (typeof value.truncated === 'boolean') result.truncated = value.truncated;
  if (isStringArray(value.filledMarkers)) result.filledMarkers = value.filledMarkers;
  if (isStringArray(value.skippedMarkers)) result.skippedMarkers = value.skippedMarkers;
  return result;
}

export function readDailyInspection(value: unknown): DailyInspection | undefined {
  if (!isObjectRecord(value)) return undefined;
  if (typeof value.exists !== 'boolean') return undefined;
  if (typeof value.hasAiContent !== 'boolean') return undefined;
  if (typeof value.filePath !== 'string') return undefined;
  if (value.error !== undefined && typeof value.error !== 'string') return undefined;
  const result: DailyInspection = {
    exists: value.exists,
    hasAiContent: value.hasAiContent,
    filePath: value.filePath,
  };
  if (typeof value.error === 'string') result.error = value.error;
  return result;
}

function isBackfillErrorEntry(value: unknown): value is { date: string; error: string } {
  return isObjectRecord(value) && typeof value.date === 'string' && typeof value.error === 'string';
}

export function readBackfillReport(value: unknown): BackfillReport | undefined {
  if (!isObjectRecord(value)) return undefined;
  if (!isStringArray(value.processed) || !isStringArray(value.filled)) return undefined;
  if (!Array.isArray(value.errors) || !value.errors.every(isBackfillErrorEntry)) return undefined;
  return {
    processed: value.processed,
    filled: value.filled,
    errors: value.errors,
  };
}
