import type { RenderType } from './aiReview/sectionConfig';

export interface ValidatedBlockOutput {
  output: string;
  downgraded: boolean;
}

/**
 * Validates and formats LLM output according to render type.
 * Falls back to text rendering with a warning if the requested format is absent.
 */
export function validateBlockOutput(content: string, renderType: RenderType): ValidatedBlockOutput {
  const trimmed = content.trim();
  switch (renderType) {
    case 'list': {
      const lines = trimmed.split('\n').filter(Boolean);
      const hasList = lines.some((line) => /^[-*+]\s/.test(line) || /^\d+\.\s/.test(line));
      if (!hasList) {
        return { output: lines.map((line) => `- ${line}`).join('\n'), downgraded: false };
      }
      return { output: trimmed, downgraded: false };
    }
    case 'table':
      return trimmed.includes('|')
        ? { output: trimmed, downgraded: false }
        : { output: `${trimmed}\n\n⚠️ 表格格式识别失败,降级为文本`, downgraded: true };
    case 'callout':
      return trimmed.includes('[!')
        ? { output: trimmed, downgraded: false }
        : { output: `${trimmed}\n\n⚠️ Callout 格式识别失败,降级为文本`, downgraded: true };
    case 'dataview':
      return trimmed.includes('```dataview')
        ? { output: trimmed, downgraded: false }
        : { output: `${trimmed}\n\n⚠️ Dataview 格式识别失败,降级为文本`, downgraded: true };
    default:
      return { output: trimmed, downgraded: false };
  }
}
