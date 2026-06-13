import {
  REVIEW_MARKERS,
  customBlockMarker,
} from './aiReview/markers';
import type { DailyTemplate, ReportTemplate, CustomBlock } from './aiReview/sectionConfig';
import { getDailyBlockOrder } from './aiReview/sectionConfig';

export interface RenderDailyParams {
  template: DailyTemplate;
  work: string;
  inspiration: string;
  tasks: string;
  date: string;
}

export interface RenderReportParams {
  template: ReportTemplate;
  content: string;
}

const BLOCK_KEYWORDS: Record<'REVIEW' | 'TOMORROW' | 'KNOWLEDGE', RegExp[]> = {
  REVIEW: [/复盘/, /review/i, /总结/, /summary/i, /work/i, /工作/],
  TOMORROW: [/明日/, /tomorrow/i, /下周/, /下月/, /next/i, /待办/],
  KNOWLEDGE: [/知识/, /knowledge/i, /灵感/, /inspiration/i, /insight/i],
};

function inferBlockMarkerKey(block: CustomBlock): 'REVIEW' | 'TOMORROW' | 'KNOWLEDGE' {
  for (const [key, patterns] of Object.entries(BLOCK_KEYWORDS) as Array<['REVIEW' | 'TOMORROW' | 'KNOWLEDGE', RegExp[]]>) {
    if (patterns.some((p) => p.test(block.name))) return key;
  }
  return 'REVIEW';
}

function getMarker(key: 'REVIEW' | 'TOMORROW' | 'KNOWLEDGE') {
  if (key === 'REVIEW') return REVIEW_MARKERS.REVIEW;
  if (key === 'TOMORROW') return REVIEW_MARKERS.TOMORROW;
  return REVIEW_MARKERS.KNOWLEDGE;
}

export function renderDailyTemplate(params: RenderDailyParams): string {
  const { template, work, inspiration, tasks, date } = params;
  const lines: string[] = [`# ${date}`, ''];
  const fixedById = new Map(template.fixedBlocks.map((block) => [block.id, block]));
  const customById = new Map(template.customBlocks.map((block) => [block.id, block]));

  for (const item of getDailyBlockOrder(template)) {
    if (item.type === 'fixed') {
      const fixed = fixedById.get(item.id);
      if (!fixed) continue;
      if (fixed.id === 'work') {
        lines.push(`## ${fixed.displayName}`, work || '', '');
      } else if (fixed.id === 'inspire') {
        lines.push(`## ${fixed.displayName}`, inspiration || '', '');
      } else if (fixed.id === 'tasks') {
        lines.push(`## ${fixed.displayName}`, tasks || '', '');
      }
      continue;
    }

    const block = customById.get(item.id);
    if (!block) continue;
    lines.push(`## ${block.name}`);
    if (block.aiGenerate) {
      const marker = customBlockMarker(block.id);
      lines.push(marker.start, marker.end);
    } else {
      lines.push('');
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function renderReportTemplate(params: RenderReportParams): string {
  const { template, content } = params;
  const lines: string[] = [];
  const bodies = content.split('<!--NEXT_BLOCK-->');

  template.customBlocks.forEach((block, idx) => {
    lines.push(`## ${block.name}`);
    if (block.aiGenerate) {
      const key = inferBlockMarkerKey(block);
      const marker = getMarker(key);
      const body = bodies[idx] ?? '';
      lines.push(marker.start, body, marker.end);
    } else {
      lines.push(bodies[idx] || '');
    }
    lines.push('');
  });

  return lines.join('\n');
}
