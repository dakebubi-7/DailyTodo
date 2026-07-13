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
  filledMarkers: string[];
  skippedMarkers: string[];
}

export async function runReviewForFile(params: RunParams): Promise<RunResult> {
  const { filePath, date, tasks, sections, customBlocks, callLlm, force } = params;
  const snap = params.initialSnapshot ?? readWithStamp(filePath);
  if (snap.stamp === null) {
    return { ok: false, error: '\u65e5\u8bb0\u6587\u4ef6\u4e0d\u5b58\u5728', filledMarkers: [], skippedMarkers: [] };
  }

  const fileFrozen = snap.content.includes('<!-- DAILYTODO:FREEZE -->');
  const stats = computeDailyStats(tasks, date);
  let content = snap.content;
  const filled: string[] = [];
  const skipped: string[] = [];
  const blocks = buildReviewBlocks({ sections, customBlocks, date, stats, content });

  for (const block of blocks) {
    const result = await fillReviewBlock({ content, date, tasks, block, fileFrozen, force, callLlm });
    content = result.content;
    if (result.filled) filled.push(block.key);
    if (result.skipped) skipped.push(block.key);
  }

  if (!filled.length) return { ok: true, filledMarkers: [], skippedMarkers: skipped };

  const write = atomicReplace(filePath, content, snap.stamp);
  if (!write.ok) return { ok: false, error: write.error, filledMarkers: [], skippedMarkers: skipped };
  return { ok: true, filledMarkers: filled, skippedMarkers: skipped };
}
