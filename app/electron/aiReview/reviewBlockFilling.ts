import { REVIEW_MARKERS, customBlockMarker, hasBlock, readBlockBody, upsertBlock, type BlockMarker } from '../../shared/aiReview/markers';
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

function normalizeReviewBlockHeading(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function findCustomBlockMarker(params: {
  content: string;
  block: CustomBlock;
  usedMarkerStarts: Set<string>;
}): BlockMarker | undefined {
  const { content, block, usedMarkerStarts } = params;
  const configuredMarker = customBlockMarker(block.id);
  if (hasBlock(content, configuredMarker) && !usedMarkerStarts.has(configuredMarker.start)) return configuredMarker;

  // 旧版本未持久化默认模板的 UUID，日报可能保留了旧 marker。按相邻标题安全地兼容一次。
  const targetHeading = normalizeReviewBlockHeading(block.name);
  const pattern = /<!--\s*DAILYTODO:CUSTOM:([^:\s]+):START\s*-->/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content))) {
    const marker: BlockMarker = {
      start: match[0].trim(),
      end: `<!-- DAILYTODO:CUSTOM:${match[1]}:END -->`,
    };
    if (usedMarkerStarts.has(marker.start) || !hasBlock(content, marker)) continue;
    if (normalizeReviewBlockHeading(findNearestHeadingBeforeMarker(content, marker.start)) === targetHeading) return marker;
  }
  return undefined;
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
  const usedCustomMarkerStarts = new Set<string>();
  const customReviewBlocks = aiCustomBlocks.flatMap((block) => {
    const marker = findCustomBlockMarker({ content, block, usedMarkerStarts: usedCustomMarkerStarts });
    if (!marker) return [];
    usedCustomMarkerStarts.add(marker.start);
    return [{
      key: `CUSTOM:${block.id}`,
      marker,
      title: block.name,
      type: block.contentSource === 'tomorrowProjection' ? SectionType.Deterministic : SectionType.Ai,
      buildMessages: (currentContent: string) => buildCustomBlockReviewMessages({ date, dailyContent: currentContent, block, stats }),
    }];
  });

  return [
    ...sections.map((section) => ({
      key: section.markerKey,
      marker: REVIEW_MARKERS[section.markerKey],
      title: section.title,
      type: section.type,
      buildMessages: (currentContent: string) => buildReviewMessages({ date, dailyContent: currentContent, section, stats }),
    })),
    ...customReviewBlocks,
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
