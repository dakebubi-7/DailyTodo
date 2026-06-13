import { readWithStamp, atomicReplace } from './atomicWrite';
import { REVIEW_MARKERS, customBlockMarker, hasBlock, readBlockBody, upsertBlock } from '../../shared/aiReview/markers';
import { decideBlock, BlockAction } from '../../shared/aiReview/scanDecision';
import { embedHash } from '../../shared/aiReview/hash';
import { computeDailyStats, StatTask } from '../../shared/aiReview/stats';
import { buildCustomBlockReviewMessages, buildReviewMessages } from '../../shared/aiReview/promptBuilder';
import { SectionType } from '../../shared/aiReview/sectionConfig';
import type { CustomBlock, SectionConfig } from '../../shared/aiReview/sectionConfig';
import type { ChatMessage, LlmResult } from '../../shared/llm/openaiClient';

const FREEZE_TAG = '<!-- DAILYTODO:FREEZE -->';

export interface RunParams {
  filePath: string;
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

const FINAL_START = 'DAILYTODO_FINAL_START';
const FINAL_END = 'DAILYTODO_FINAL_END';

function extractFinalBlock(content: string) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === FINAL_START);
  if (start < 0) return null;
  const end = lines.findIndex((line, index) => index > start && line.trim() === FINAL_END);
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim();
}

function isMetaPrefixLine(line: string) {
  const text = line.trim();
  return /^(?:软件提示|提示词|用户要求|要求|任务|日期|确定性统计|今天的日记原文|以下是|下面是)[:：]/i.test(text)
    || /^(?:我将|我会|让我)(?:[:：]|\b)/i.test(text)
    || /^(?:let me|the user wants|the user asked|the user is asking|i will|i need to|i should|we need to)(?:[:：]|\b)/i.test(text);
}

function isManagedMarkerLine(line: string) {
  return /<!--\s*DAILYTODO:.*:(?:START|END)\s*-->/.test(line.trim());
}

function isManagedStartMarkerLine(line: string) {
  return /<!--\s*DAILYTODO:.*:START\s*-->/.test(line.trim());
}

function isManagedEndMarkerLine(line: string) {
  return /<!--\s*DAILYTODO:.*:END\s*-->/.test(line.trim());
}

function findNearestHeadingBeforeMarker(content: string, markerStart: string) {
  const markerIndex = content.indexOf(markerStart);
  if (markerIndex < 0) return '';
  const beforeMarker = content.slice(0, markerIndex);
  const lines = beforeMarker.split(/\r?\n/).reverse();
  let managedBlockDepth = 0;

  for (const line of lines) {
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

function stripDuplicateSectionHeading(content: string, outerHeading: string, fallbackTitle: string, date: string) {
  const lines = content.split(/\r?\n/);
  while (lines.length && !lines[0].trim()) lines.shift();

  const first = lines[0]?.trim() ?? '';
  if (!/^#{1,6}\s+/.test(first)) return lines.join('\n').trim();

  const generatedHeading = first.replace(/^#{1,6}\s+/, '').trim();
  const expectedHeading = outerHeading.trim() || fallbackTitle.trim();
  if (!expectedHeading) return lines.join('\n').trim();

  const isDuplicate =
    generatedHeading === expectedHeading ||
    generatedHeading === `${date} ${expectedHeading}`;

  if (!isDuplicate) return lines.join('\n').trim();

  lines.shift();
  while (lines.length && !lines[0].trim()) lines.shift();
  return lines.join('\n').trim();
}

function cleanLlmContent(content: string) {
  const finalBlock = extractFinalBlock(content);
  if (finalBlock !== null) return finalBlock;

  const lines = content
    .replace(/^```(?:markdown)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .split(/\r?\n/);
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && isMetaPrefixLine(lines[0])) {
    lines.shift();
    while (lines.length && !lines[0].trim()) lines.shift();
  }
  return lines.join('\n').trim();
}

type ReviewBlockInput = {
  key: string;
  marker: { start: string; end: string };
  title: string;
  type: SectionType;
  buildMessages: (content: string) => ChatMessage[];
};

function buildDeterministicTomorrowBody(tasks: StatTask[]) {
  const carried = tasks
    .filter((t) => !t.completed && t.text && t.text.trim())
    .map((t) => `- [ ] ${t.text!.trim()}（结转）`);
  return embedHash(carried.length ? carried.join('\n') : '- [ ] ');
}

async function fillReviewBlock(params: {
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
      content: upsertBlock(params.content, block.marker, buildDeterministicTomorrowBody(tasks)),
      filled: true,
      skipped: false,
    };
  }

  const llm = await callLlm(block.buildMessages(params.content));
  if (!llm.ok) return { content: params.content, filled: false, skipped: true };

  const outerHeading = findNearestHeadingBeforeMarker(params.content, block.marker.start);
  const rawCleaned = cleanLlmContent(llm.content);
  const cleaned = stripDuplicateSectionHeading(rawCleaned, outerHeading, block.title, date);
  return {
    content: upsertBlock(params.content, block.marker, embedHash(cleaned)),
    filled: true,
    skipped: false,
  };
}

export async function runReviewForFile(params: RunParams): Promise<RunResult> {
  const { filePath, date, tasks, sections, customBlocks, callLlm, force } = params;
  const snap = readWithStamp(filePath);
  if (snap.stamp === null) {
    return { ok: false, error: '日记文件不存在', filledMarkers: [], skippedMarkers: [] };
  }

  const fileFrozen = snap.content.includes(FREEZE_TAG);
  const stats = computeDailyStats(tasks, date);
  let content = snap.content;
  const filled: string[] = [];
  const skipped: string[] = [];

  const aiCustomBlocks = customBlocks?.filter((block) => block.aiGenerate) ?? [];
  const blocks: ReviewBlockInput[] = [
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
      type: SectionType.Ai,
      buildMessages: (currentContent: string) => buildCustomBlockReviewMessages({ date, dailyContent: currentContent, block, stats }),
    })),
  ].filter((block) => hasBlock(content, block.marker));

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
