import { readWithStamp, atomicReplace } from './atomicWrite';
import { REVIEW_MARKERS, readBlockBody, upsertBlock } from '../../shared/aiReview/markers';
import { decideBlock, BlockAction } from '../../shared/aiReview/scanDecision';
import { embedHash } from '../../shared/aiReview/hash';
import { computeDailyStats, StatTask } from '../../shared/aiReview/stats';
import { buildReviewMessages } from '../../shared/aiReview/promptBuilder';
import { SectionConfig, SectionType } from '../../shared/aiReview/sectionConfig';
import type { LlmResult } from '../../shared/llm/openaiClient';

const FREEZE_TAG = '<!-- DAILYTODO:FREEZE -->';

export interface RunParams {
  filePath: string;
  date: string;
  tasks: StatTask[];
  sections: SectionConfig[];
  callLlm: (messages: ReturnType<typeof buildReviewMessages>) => Promise<LlmResult>;
  force?: boolean;
}

export interface RunResult {
  ok: boolean;
  error?: string;
  filledMarkers: string[];
  skippedMarkers: string[];
}

export async function runReviewForFile(params: RunParams): Promise<RunResult> {
  const { filePath, date, tasks, sections, callLlm, force } = params;
  const snap = readWithStamp(filePath);
  if (snap.stamp === null) {
    return { ok: false, error: '日记文件不存在', filledMarkers: [], skippedMarkers: [] };
  }

  const fileFrozen = snap.content.includes(FREEZE_TAG);
  const stats = computeDailyStats(tasks, date);
  let content = snap.content;
  const filled: string[] = [];
  const skipped: string[] = [];

  for (const section of sections) {
    const marker = REVIEW_MARKERS[section.markerKey];
    const body = readBlockBody(content, marker);
    const blockFrozen = fileFrozen || body.includes(FREEZE_TAG);
    const decision = decideBlock(body, { frozen: blockFrozen, force });

    if (decision.action === BlockAction.Skip) {
      skipped.push(section.markerKey);
      continue;
    }

    if (section.type === SectionType.Deterministic) {
      // 明日待办：确定性结转在 Task 14 增强；此处先跳过，保证块存在不被破坏。
      skipped.push(section.markerKey);
      continue;
    }

    const messages = buildReviewMessages({ date, dailyContent: content, section, stats });
    const llm = await callLlm(messages);
    if (!llm.ok) {
      skipped.push(section.markerKey);
      continue; // 单段失败不影响其它段，更不破坏文件
    }

    const newBody = embedHash(`🤖 AI 草稿\n${llm.content}`);
    content = upsertBlock(content, marker, newBody);
    filled.push(section.markerKey);
  }

  if (!filled.length) return { ok: true, filledMarkers: [], skippedMarkers: skipped };

  const write = atomicReplace(filePath, content, snap.stamp);
  if (!write.ok) return { ok: false, error: write.error, filledMarkers: [], skippedMarkers: skipped };
  return { ok: true, filledMarkers: filled, skippedMarkers: skipped };
}
