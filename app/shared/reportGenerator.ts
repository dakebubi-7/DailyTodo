// app/shared/reportGenerator.ts
//
// Helpers for weekly/monthly N-block report generation.
//
// Slicing strategy: blocks whose name contains work keywords get the "work"
// source slice (detailed work content). All other blocks get the "general"
// slice (tasks + review + inspiration), avoiding redundant token usage.

import type { CustomBlock, RenderType } from './aiReview/sectionConfig';

const WORK_KEYWORDS = /工作|总结|summary|work|概览|overview/i;

/**
 * Returns true if this block should receive the "work" source slice
 * (detailed daily work content). Used to split LLM calls by slice type.
 */
export function isWorkBlock(block: CustomBlock): boolean {
  return WORK_KEYWORDS.test(block.name);
}

/**
 * Appends a renderType-specific format instruction to the user prompt.
 * For 'text', the prompt is unchanged (no instruction needed).
 */
export function applyRenderTypeInstruction(basePrompt: string, renderType: RenderType): string {
  switch (renderType) {
    case 'list':
      return `${basePrompt}\n\n请用 Markdown 无序列表格式(- item)输出。`;
    case 'table':
      return `${basePrompt}\n\n请用 Markdown 表格格式输出,首行为表头(|列1|列2|...|)。`;
    case 'callout':
      return `${basePrompt}\n\n请用 Obsidian Callout 格式输出,例如:\n> [!note] 标题\n> 内容`;
    case 'dataview':
      return `${basePrompt}\n\n请生成一段 Dataview 查询语句,用代码块包裹:\n\`\`\`dataview\n...\n\`\`\``;
    case 'text':
    default:
      return basePrompt;
  }
}

export interface BuildBlockPromptParams {
  block: CustomBlock;
  sourceContent: string; // pre-assembled source material for this block's slice
  period: string;        // ISO week key (e.g. "2026-W24") or month key (e.g. "2026-06")
}

/**
 * Builds the final LLM user prompt for a single report block.
 * Combines the block's custom prompt with source material and period info.
 */
export function buildBlockPrompt(params: BuildBlockPromptParams): string {
  const { block, sourceContent, period } = params;
  const base = block.prompt
    ? block.prompt
    : `请根据以下内容生成"${block.name}"部分(周期:${period}):`;

  const withPeriod = base.includes(period) ? base : `${base}\n\n周期:${period}`;
  const withSource = `${withPeriod}\n\n---原始内容---\n${sourceContent}`;
  return applyRenderTypeInstruction(withSource, block.renderType);
}

/**
 * Validates and formats LLM output according to renderType.
 * Falls back to 'text' rendering with a warning if format doesn't match.
 */
export function validateBlockOutput(content: string, renderType: RenderType): { output: string; downgraded: boolean } {
  const trimmed = content.trim();
  switch (renderType) {
    case 'list': {
      const lines = trimmed.split('\n').filter(Boolean);
      const hasList = lines.some(l => /^[-*+]\s/.test(l) || /^\d+\.\s/.test(l));
      if (!hasList) {
        const withBullets = lines.map(l => `- ${l}`).join('\n');
        return { output: withBullets, downgraded: false };
      }
      return { output: trimmed, downgraded: false };
    }
    case 'table': {
      if (!trimmed.includes('|')) {
        return { output: `${trimmed}\n\n⚠️ 表格格式识别失败,降级为文本`, downgraded: true };
      }
      return { output: trimmed, downgraded: false };
    }
    case 'callout': {
      if (!trimmed.includes('[!')) {
        return { output: `${trimmed}\n\n⚠️ Callout 格式识别失败,降级为文本`, downgraded: true };
      }
      return { output: trimmed, downgraded: false };
    }
    case 'dataview': {
      if (!trimmed.includes('```dataview')) {
        return { output: `${trimmed}\n\n⚠️ Dataview 格式识别失败,降级为文本`, downgraded: true };
      }
      return { output: trimmed, downgraded: false };
    }
    default:
      return { output: trimmed, downgraded: false };
  }
}
