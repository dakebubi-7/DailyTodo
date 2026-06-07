import fs from 'node:fs';
import path from 'node:path';
import { atomicReplace, readWithStamp } from './atomicWrite';
import { buildWeeklyMessages, WeeklyParams } from '../../shared/aiReview/weekly';
import type { LlmResult } from '../../shared/llm/openaiClient';

export interface WeeklyGenParams extends WeeklyParams {
  vaultPath: string;
  callLlm: (messages: ReturnType<typeof buildWeeklyMessages>) => Promise<LlmResult>;
}

export interface ReportResult {
  ok: boolean;
  filePath?: string;
  error?: string;
}

export async function generatePersonalWeekly(params: WeeklyGenParams): Promise<ReportResult> {
  const messages = buildWeeklyMessages(params);
  const llm = await params.callLlm(messages);
  if (!llm.ok) return { ok: false, error: llm.error };

  const dir = path.join(params.vaultPath, 'logs', 'weekly-review');
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${params.weekKey}.md`);
  const snap = readWithStamp(filePath);
  const content =
    `---\ntitle: "个人周报 ${params.weekKey}"\nweek: "${params.weekKey}"\ntags: [weekly-review]\n---\n\n` +
    `> 🤖 AI 草稿，请复核\n\n${llm.content.trim()}\n`;
  const write = atomicReplace(filePath, content, snap.stamp);
  return write.ok ? { ok: true, filePath } : { ok: false, error: write.error };
}
