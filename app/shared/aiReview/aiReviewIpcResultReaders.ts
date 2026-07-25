import { isObjectRecord } from '../unknownValueGuards';
import { isTaskHandoff, type ValidatedTaskHandoff } from '../taskValidation';

export interface AiReviewHandoffSuggestion {
  taskId: string;
  handoff: ValidatedTaskHandoff;
}

export interface GenerationResult {
  ok: boolean;
  error?: string;
  warning?: string;
  filePath?: string;
  truncated?: boolean;
  filledMarkers?: string[];
  skippedMarkers?: string[];
  failedMarkers?: Array<{ key: string; error: string }>;
  handoffs?: AiReviewHandoffSuggestion[];
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

function isFailedMarkerArray(value: unknown): value is Array<{ key: string; error: string }> {
  return Array.isArray(value)
    && value.every((entry) => isObjectRecord(entry) && typeof entry.key === 'string' && typeof entry.error === 'string');
}

function isHandoffSuggestionArray(value: unknown): value is AiReviewHandoffSuggestion[] {
  return Array.isArray(value)
    && value.every((entry) => isObjectRecord(entry) && typeof entry.taskId === 'string' && isTaskHandoff(entry.handoff));
}

export function readGenerationResult(value: unknown): GenerationResult | undefined {
  if (!isObjectRecord(value) || typeof value.ok !== 'boolean') return undefined;
  if (value.error !== undefined && typeof value.error !== 'string') return undefined;
  if (value.warning !== undefined && typeof value.warning !== 'string') return undefined;
  if (value.filePath !== undefined && typeof value.filePath !== 'string') return undefined;
  if (value.truncated !== undefined && typeof value.truncated !== 'boolean') return undefined;
  if (value.filledMarkers !== undefined && !isStringArray(value.filledMarkers)) return undefined;
  if (value.skippedMarkers !== undefined && !isStringArray(value.skippedMarkers)) return undefined;
  if (value.failedMarkers !== undefined && !isFailedMarkerArray(value.failedMarkers)) return undefined;
  if (value.handoffs !== undefined && !isHandoffSuggestionArray(value.handoffs)) return undefined;
  const result: GenerationResult = { ok: value.ok };
  if (typeof value.error === 'string') result.error = value.error;
  if (typeof value.warning === 'string') result.warning = value.warning;
  if (typeof value.filePath === 'string') result.filePath = value.filePath;
  if (typeof value.truncated === 'boolean') result.truncated = value.truncated;
  if (isStringArray(value.filledMarkers)) result.filledMarkers = value.filledMarkers;
  if (isStringArray(value.skippedMarkers)) result.skippedMarkers = value.skippedMarkers;
  if (isFailedMarkerArray(value.failedMarkers)) result.failedMarkers = value.failedMarkers;
  if (isHandoffSuggestionArray(value.handoffs)) result.handoffs = value.handoffs;
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
