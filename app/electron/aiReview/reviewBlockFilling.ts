import { REVIEW_MARKERS, customBlockMarker, hasBlock, readBlockBody, upsertBlock } from '../../shared/aiReview/markers';
import { embedHash } from '../../shared/aiReview/hash';
import { decideBlock, BlockAction } from '../../shared/aiReview/scanDecision';
import type { CustomBlock, SectionConfig } from '../../shared/aiReview/sectionConfig';
import { SectionType } from '../../shared/aiReview/sectionConfig';
import { buildCustomBlockReviewMessages, buildReviewMessages } from '../../shared/aiReview/promptBuilder';
import { computeDailyStats, type StatTask } from '../../shared/aiReview/stats';
import { renderTomorrowProjection } from '../../shared/aiReview/tomorrowProjection';
import type { ChatMessage, LlmResult } from '../../shared/llm/openaiClient';
import { cleanReviewContent, stripDuplicateReviewHeading } from './reviewContentCleanup';

const FREEZE_TAG = '<!-- DAILYTODO:FREEZE -->';

export type ReviewBlockInput = {
  key: string;
  marker: { start: string; end: string };
  title: string;
  type: SectionType;
  buildMessages: (content: string) => ChatMessage[];
};

function isManagedMarkerLine(line: string) {
  return /<!--\s*DAILYTODO:.*:(?:START|END)\s*-->/.test(line.trim());
}

function isManagedStartMarkerLine(line: string) {
  return /<!--\s*DAILYTODO:.*:START\s*-->/.test(line.trim());
}

function isManagedEndMarkerLine(line: string) {
  return /<!--\s*DAILYTODO:.*:END\s*-->/.test(line.trim());
}

export function findNearestHeadingBeforeMarker(content: string, markerStart: string) {
  const markerIndex = content.indexOf(markerStart);
  if (markerIndex < 0) return '';
  let managedBlockDepth = 0;
  let end = markerIndex;

  while (end > 0) {
    const lineStart = content.lastIndexOf('\n', end - 1) + 1;
    const line = content.slice(lineStart, end).replace(/\r$/, '');
    end = lineStart - 1;
    const trimmed = line.trim();

    if (isManagedMarkerLine(trimmed)) {
      if (isManagedEndMarkerLine(trimmed)) {
        managedBlockDepth += 1;
        continue;
      }
      if (isManagedStartMarkerLine(trimmed)) {
        managedBlockDepth = Math.max(0, managedBlockDepth - 1);
        continue;
      }
    }

    if (managedBlockDepth > 0) continue;

    const match = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return '';
}

function buildDeterministicTomorrowBody(tasks: StatTask[], date: string) {
  return embedHash(renderTomorrowProjection(tasks, date));
}

export function buildReviewBlocks(params: {
  sections: SectionConfig[];
  customBlocks?: CustomBlock[];
  date: string;
  stats: ReturnType<typeof computeDailyStats>;
  content: string;
}): ReviewBlockInput[] {
  const { sections, customBlocks, date, stats, content } = params;
  const aiCustomBlocks = customBlocks?.filter((block) => block.aiGenerate) ?? [];
  return [
    ...sections.map((section) => ({
      key: section.markerKey,
      marker: REVIEW_MARKERS[section.markerKey],
      title: section.title,
      type: section.type,
      buildMessages: (currentContent: string) => buildReviewMessages({ date, dailyContent: currentContent, section, stats }),
    })),
    ...aiCustomBlocks.map((block) => ({
      key: `CUSTOM:${block.id}`,
      marker: customBlockMarker(block.id),
      title: block.name,
      type: block.contentSource === 'tomorrowProjection' ? SectionType.Deterministic : SectionType.Ai,
      buildMessages: (currentContent: string) => buildCustomBlockReviewMessages({ date, dailyContent: currentContent, block, stats }),
    })),
  ].filter((block) => hasBlock(content, block.marker));
}

export async function fillReviewBlock(params: {
  content: string;
  date: string;
  tasks: StatTask[];
  block: ReviewBlockInput;
  fileFrozen: boolean;
  force?: boolean;
  callLlm: (messages: ChatMessage[]) => Promise<LlmResult>;
}) {
  const { date, tasks, block, fileFrozen, force, callLlm } = params;
  const body = readBlockBody(params.content, block.marker);
  const blockFrozen = fileFrozen || body.includes(FREEZE_TAG);
  const decision = decideBlock(body, { frozen: blockFrozen, force });

  if (decision.action === BlockAction.Skip) {
    return { content: params.content, filled: false, skipped: true };
  }

  if (block.type === SectionType.Deterministic) {
    return {
      content: upsertBlock(params.content, block.marker, buildDeterministicTomorrowBody(tasks, date)),
      filled: true,
      skipped: false,
    };
  }

  const llm = await callLlm(block.buildMessages(params.content));
  if (!llm.ok) {
    return { content: params.content, filled: false, skipped: false, failed: true, error: llm.error };
  }

  const outerHeading = findNearestHeadingBeforeMarker(params.content, block.marker.start);
  const rawCleaned = cleanReviewContent(llm.content);
  const cleaned = stripDuplicateReviewHeading(rawCleaned, outerHeading, block.title, date);
  return {
    content: upsertBlock(params.content, block.marker, embedHash(cleaned)),
    filled: true,
    skipped: false,
  };
}
