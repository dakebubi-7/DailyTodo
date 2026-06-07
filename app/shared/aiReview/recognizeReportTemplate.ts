import type { ChatMessage } from '../llm/openaiClient';

export type ReportKind = 'weekly' | 'monthly';

/**
 * 让 AI 看用户现成的周/月报格式，产出一段「生成指令」（system prompt），
 * 之后直接作为 buildWeeklyMessages/buildMonthlyMessages 的 systemPrompt。
 */
export function buildRecognizeReportMessages(rawTemplate: string, kind: ReportKind): ChatMessage[] {
  const label = kind === 'weekly' ? '周报' : '月报';
  return [
    {
      role: 'system',
      content:
        `用户给出一份现成的${label}格式/范例。请把它转写成一段“生成指令”，` +
        `用于以后让 AI 按这个结构和语气生成${label}。指令要说明应包含哪些小节、顺序、语气风格。` +
        '只输出这段指令本身的纯文本，不要解释，不要加代码块围栏，不要编造统计数字（数字以运行时给定为准）。',
    },
    { role: 'user', content: rawTemplate.trim() || '（空模板）' },
  ];
}

/** 清洗 LLM 输出：去 ```/```json 围栏 + trim。空/无效 → 空串（调用方回落默认 prompt）。 */
export function parseRecognizedReportPrompt(raw: string): string {
  if (typeof raw !== 'string') return '';
  const cleaned = raw
    .replace(/^```(?:json|markdown|md)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  return cleaned;
}
