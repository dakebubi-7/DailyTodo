import fs from 'node:fs';
import path from 'node:path';
import { atomicReplace, readWithStamp } from './atomicWrite';
import { buildWeeklyMessages, WeeklyParams } from '../../shared/aiReview/weekly';
import { buildMonthlyMessages, MonthlyParams } from '../../shared/aiReview/monthly';
import { redactForExport } from '../../shared/aiReview/redaction';
import type { LlmResult } from '../../shared/llm/openaiClient';

type LlmCaller = (messages: Array<{ role: 'system' | 'user'; content: string }>) => Promise<LlmResult>;

export interface WeeklyGenParams extends WeeklyParams {
  vaultPath: string;
  callLlm: (messages: ReturnType<typeof buildWeeklyMessages>) => Promise<LlmResult>;
}

export interface ReportResult {
  ok: boolean;
  filePath?: string;
  error?: string;
}

/** 通用写入：原子写 + AI 草稿标注。 */
async function writeReport(filePath: string, frontmatter: string, body: string): Promise<ReportResult> {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const snap = readWithStamp(filePath);
  const content = `${frontmatter}\n\n> 🤖 AI 草稿，请复核（对外稿需自行复核脱敏）\n\n${body.trim()}\n`;
  const write = atomicReplace(filePath, content, snap.stamp);
  return write.ok ? { ok: true, filePath } : { ok: false, error: write.error };
}

export async function generatePersonalWeekly(params: WeeklyGenParams): Promise<ReportResult> {
  const messages = buildWeeklyMessages(params);
  const llm = await params.callLlm(messages);
  if (!llm.ok) return { ok: false, error: llm.error };

  const filePath = path.join(params.vaultPath, 'logs', 'weekly-review', `${params.weekKey}.md`);
  const fm = `---\ntitle: "个人周报 ${params.weekKey}"\nweek: "${params.weekKey}"\ntags: [weekly-review]\n---`;
  return writeReport(filePath, fm, llm.content);
}

export interface MonthlyGenParams extends MonthlyParams {
  vaultPath: string;
  callLlm: (messages: ReturnType<typeof buildMonthlyMessages>) => Promise<LlmResult>;
}

export async function generatePersonalMonthly(params: MonthlyGenParams): Promise<ReportResult> {
  const messages = buildMonthlyMessages(params);
  const llm = await params.callLlm(messages);
  if (!llm.ok) return { ok: false, error: llm.error };

  const filePath = path.join(params.vaultPath, 'logs', 'monthly-review', `${params.month}.md`);
  const fm = `---\ntitle: "个人月报 ${params.month}"\nmonth: "${params.month}"\ntags: [monthly-review]\n---`;
  return writeReport(filePath, fm, llm.content);
}

export interface ExternalGenParams {
  vaultPath: string;
  /** 'weekly' → exports/weekly-reports/<periodKey>.md；'monthly' → exports/monthly-reports/<periodKey>.md */
  kind: 'weekly' | 'monthly';
  periodKey: string; // 2026-W23 或 2026-06
  /** 原始日记正文（未脱敏）；本函数会先脱敏再交给 LLM。 */
  rawDailyContents: string[];
  buildMessages: (redactedJoined: string) => Array<{ role: 'system' | 'user'; content: string }>;
  callLlm: LlmCaller;
}

/**
 * 对外周/月报：物理隔离到 exports/，且在调 LLM 前先 redactForExport 脱敏（PRD §M9 硬规则）。
 * 即便 LLM 失败也不写文件，私人内容永不进入 exports/。
 */
export async function generateExternalReport(params: ExternalGenParams): Promise<ReportResult> {
  const redacted = params.rawDailyContents.map((c) => redactForExport(c)).filter(Boolean).join('\n\n');
  const messages = params.buildMessages(redacted);
  const llm = await params.callLlm(messages);
  if (!llm.ok) return { ok: false, error: llm.error };

  const subdir = params.kind === 'weekly' ? 'weekly-reports' : 'monthly-reports';
  const filePath = path.join(params.vaultPath, 'exports', subdir, `${params.periodKey}.md`);
  const fm = `---\ntitle: "对外${params.kind === 'weekly' ? '周' : '月'}报 ${params.periodKey}"\nperiod: "${params.periodKey}"\ntags: [external-report, needs-review]\n---`;
  return writeReport(filePath, fm, llm.content);
}

