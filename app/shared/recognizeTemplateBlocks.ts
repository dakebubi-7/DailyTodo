// app/shared/recognizeTemplateBlocks.ts
//
// Generic N-block + 5-renderType template recognition.
// Unlike recognizeTemplate.ts (3-fixed-section daily), this handles arbitrary
// N sections and infers renderType from content shape.

import type { CustomBlock, RenderType } from './aiReview/sectionConfig';

type ChatMessage = { role: string; content: string };

const FIXED_BLOCK_NAMES = ['今日工作', '灵感随笔', '每日任务'];

const SYSTEM_PROMPT = `你是 Markdown 模板解析器。把文档中的自定义区块(## 二级标题)解析为 JSON 数组。

返回纯 JSON 数组,格式:
[{"name":"区块名","aiGenerate":true,"renderType":"text|list|table|callout|dataview","prompt":""}]

规则:
- 忽略"今日工作""灵感随笔""每日任务"(系统固定提供)
- 忽略 # 一级标题、空标题
- renderType 推断:列表(-/*/1.)→list; 表格(|)→table; Callout(>[!])→callout; dataview代码块→dataview; 其他→text
- 只返回 JSON,不要任何说明`;

export function buildRecognizeBlocksMessages(rawTemplate: string): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: rawTemplate },
  ];
}

export interface RecognizeResult {
  blocks: CustomBlock[];
  confidence: 'high' | 'medium' | 'low';
}

export function parseRecognizedBlocks(raw: string, fallback: CustomBlock[]): RecognizeResult {
  // Local inference from raw Markdown (no LLM needed for structural parsing)
  const sections = splitIntoSections(raw);
  if (sections.length === 0) {
    return { blocks: fallback, confidence: 'low' };
  }

  const blocks: CustomBlock[] = [];
  let skipped = 0;

  for (const { name, body } of sections) {
    if (!name || FIXED_BLOCK_NAMES.includes(name)) {
      skipped++;
      continue;
    }
    const renderType = inferRenderType(body);
    blocks.push({
      id: Math.random().toString(36).slice(2),
      name,
      aiGenerate: true,
      renderType,
      prompt: '',
    });
  }

  if (blocks.length === 0) {
    return { blocks: fallback, confidence: 'low' };
  }

  const confidence: 'high' | 'medium' | 'low' = skipped === 0 ? 'high' : 'medium';
  return { blocks, confidence };
}

function splitIntoSections(md: string): Array<{ name: string; body: string }> {
  const lines = md.split('\n');
  const sections: Array<{ name: string; body: string }> = [];
  let current: { name: string; bodyLines: string[] } | null = null;

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      if (current) sections.push({ name: current.name, body: current.bodyLines.join('\n') });
      current = { name: h2[1].trim(), bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    }
  }
  if (current) sections.push({ name: current.name, body: current.bodyLines.join('\n') });
  return sections;
}

function inferRenderType(body: string): RenderType {
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return 'text';
  const first = lines[0];
  if (/^```dataview/i.test(first)) return 'dataview';
  if (/^>\s*\[!/.test(first)) return 'callout';
  if (/^\|/.test(first)) return 'table';
  const listLines = lines.filter(l => /^[-*+]\s/.test(l) || /^\d+\.\s/.test(l));
  if (listLines.length / lines.length >= 0.5) return 'list';
  return 'text';
}
