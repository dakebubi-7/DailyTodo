import { readWithStamp, atomicReplace } from './atomicWrite';
import type { ReadResult } from './atomicWrite';
import { computeDailyStats, type StatTask } from '../../shared/aiReview/stats';
import type { CustomBlock, SectionConfig } from '../../shared/aiReview/sectionConfig';
import type { ChatMessage, LlmResult } from '../../shared/llm/openaiClient';
import { buildReviewBlocks, fillReviewBlock } from './reviewBlockFilling';

export interface RunParams {
  filePath: string;
  initialSnapshot?: ReadResult;
  date: string;
  tasks: StatTask[];
  sections: SectionConfig[];
  customBlocks?: CustomBlock[];
  callLlm: (messages: ChatMessage[]) => Promise<LlmResult>;
  force?: boolean;
}

export interface RunResult {
  ok: boolean;
  error?: string;
  warning?: string;
  filledMarkers: string[];
  skippedMarkers: string[];
  failedMarkers: Array<{ key: string; error: string }>;
}

export async function runReviewForFile(params: RunParams): Promise<RunResult> {
  const { filePath, date, tasks, sections, customBlocks, callLlm, force } = params;
  const snap = params.initialSnapshot ?? readWithStamp(filePath);
  if (snap.stamp === null) {
    return { ok: false, error: '\u65e5\u8bb0\u6587\u4ef6\u4e0d\u5b58\u5728', filledMarkers: [], skippedMarkers: [], failedMarkers: [] };
  }

  const fileFrozen = snap.content.includes('<!-- DAILYTODO:FREEZE -->');
  const stats = computeDailyStats(tasks, date);
  let content = snap.content;
  const filled: string[] = [];
  const skipped: string[] = [];
  const failed: Array<{ key: string; error: string }> = [];
  const blocks = buildReviewBlocks({ sections, customBlocks, date, stats, content });

  for (const block of blocks) {
    const result = await fillReviewBlock({ content, date, tasks, block, fileFrozen, force, callLlm });
    content = result.content;
    if (result.filled) filled.push(block.key);
    if (result.skipped) skipped.push(block.key);
    if (result.failed) failed.push({ key: block.key, error: result.error ?? 'AI generation failed' });
  }

  if (!filled.length) {
    const error = failed.map((item) => `${item.key}: ${item.error}`).join('; ');
    return {
      ok: failed.length === 0,
      ...(error ? { error } : {}),
      filledMarkers: [],
      skippedMarkers: skipped,
      failedMarkers: failed,
    };
  }

  const write = atomicReplace(filePath, content, snap.stamp);
  if (!write.ok) {
    return { ok: false, error: write.error, filledMarkers: [], skippedMarkers: skipped, failedMarkers: failed };
  }
  const warning = failed.length
    ? failed.map((item) => `${item.key}: ${item.error}`).join('; ')
    : undefined;
  return { ok: true, ...(warning ? { warning } : {}), filledMarkers: filled, skippedMarkers: skipped, failedMarkers: failed };
}
