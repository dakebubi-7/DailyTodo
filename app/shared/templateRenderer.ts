// app/shared/templateRenderer.ts
//
// 模板渲染层:把 5 套模板之一渲染为 Obsidian 文件骨架。
//
// 严格职责:
//   - 写固定块(产品数据直接写入)
//   - 写 aiGenerate=false 块的内容(取自产品数据)
//   - 写 aiGenerate=true 块对应的**空 marker**(DAILYTODO:REVIEW:START/END 等)
//   - **不**调 LLM,**不**写任何 AI 内容(由 runner.ts 负责)

import {
  REVIEW_MARKERS,
} from './aiReview/markers';
import type { DailyTemplate, ReportTemplate, CustomBlock } from './aiReview/sectionConfig';

export interface RenderDailyParams {
  template: DailyTemplate;
  work: string;
  inspiration: string;
  tasks: string;
  date: string; // YYYY-MM-DD
}

export interface RenderReportParams {
  template: ReportTemplate;
  /** AI-generated content per block, joined with '<!--NEXT_BLOCK-->' in template.customBlocks order */
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

/**
 * Render a daily template into Obsidian file skeleton.
 *
 * Output format:
 *   # 2026-06-11
 *   ## 今日工作
 *   (work content)
 *   ## 灵感随笔
 *   (inspiration content)
 *   ## 每日任务
 *   - [x] 任务A
 *   ## 复盘
 *   <!-- DAILYTODO:REVIEW:START -->
 *   <!-- DAILYTODO:REVIEW:END -->
 */
export function renderDailyTemplate(params: RenderDailyParams): string {
  const { template, work, inspiration, tasks, date } = params;
  const lines: string[] = [`# ${date}`, ''];

  for (const fixed of template.fixedBlocks) {
    if (fixed.id === 'work') {
      lines.push(`## ${fixed.displayName}`, work || '', '');
    } else if (fixed.id === 'inspire') {
      lines.push(`## ${fixed.displayName}`, inspiration || '', '');
    } else if (fixed.id === 'tasks') {
      lines.push(`## ${fixed.displayName}`, tasks || '', '');
    }
  }

  for (const block of template.customBlocks) {
    lines.push(`## ${block.name}`);
    if (block.aiGenerate) {
      const key = inferBlockMarkerKey(block);
      const marker = getMarker(key);
      // Write EMPTY marker pair. AI fill layer (runner.ts) writes content here later.
      lines.push(marker.start, marker.end);
    } else {
      // Manual block: leave empty for now (future: accept user-provided content)
      lines.push('');
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Render a report template (weekly/monthly) into Obsidian file skeleton.
 *
 * @param content AI-generated content for each block, joined with `<!--NEXT_BLOCK-->`.
 *   Index i corresponds to template.customBlocks[i]. Empty string = no content for that block.
 */
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
