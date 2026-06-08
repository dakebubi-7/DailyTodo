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
  /** 相对 vault 的输出目录；空/未给 → logs/weekly-review。 */
  relativeDir?: string;
  callLlm: (messages: ReturnType<typeof buildWeeklyMessages>) => Promise<LlmResult>;
}

export interface ReportResult {
  ok: boolean;
  filePath?: string;
  error?: string;
  /** LLM 因输出上限被截断；文件仍写入，但提示用户调高 max_tokens。 */
  truncated?: boolean;
}

const DRAFT_NOTE = '> 🤖 AI 草稿，请复核（对外稿需自行复核脱敏）';

/**
 * 组装最终写入内容：
 * - 模型输出已自带 frontmatter（`---` 开头）：保留模型的 frontmatter，在其后插入草稿提示，
 *   不再叠加 app 的 frontmatter（避免双重 frontmatter 破坏 Obsidian 解析）。
 * - 否则：用 app 的 frontmatter + 草稿提示 + 正文（兼容不带 frontmatter 的旧/自定义模板）。
 */
export function composeReportContent(appFrontmatter: string, body: string): string {
  const trimmed = body.trim();
  const fm = trimmed.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n?/);
  if (fm) {
    const head = fm[0].trimEnd();
    const rest = trimmed.slice(fm[0].length).replace(/^\s+/, '');
    return `${head}\n\n${DRAFT_NOTE}\n\n${rest}\n`;
  }
  return `${appFrontmatter}\n\n${DRAFT_NOTE}\n\n${trimmed}\n`;
}

/** 通用写入：原子写 + AI 草稿标注。truncated 透传给调用方，文件照常写。 */
async function writeReport(filePath: string, frontmatter: string, body: string, truncated?: boolean): Promise<ReportResult> {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const snap = readWithStamp(filePath);
  const content = composeReportContent(frontmatter, body);
  const write = atomicReplace(filePath, content, snap.stamp);
  if (!write.ok) return { ok: false, error: write.error };
  return truncated ? { ok: true, filePath, truncated: true } : { ok: true, filePath };
}

export async function generatePersonalWeekly(params: WeeklyGenParams): Promise<ReportResult> {
  const messages = buildWeeklyMessages(params);
  const llm = await params.callLlm(messages);
  if (!llm.ok) return { ok: false, error: llm.error };

  const filePath = path.join(params.vaultPath, params.relativeDir || 'logs/weekly-review', `${params.weekKey}.md`);
  const fm = `---\ntitle: "个人周报 ${params.weekKey}"\nweek: "${params.weekKey}"\ntags: [weekly-review]\n---`;
  return writeReport(filePath, fm, llm.content, llm.truncated);
}

export interface MonthlyGenParams extends MonthlyParams {
  vaultPath: string;
  /** 相对 vault 的输出目录；空/未给 → logs/monthly-review。 */
  relativeDir?: string;
  callLlm: (messages: ReturnType<typeof buildMonthlyMessages>) => Promise<LlmResult>;
}

export async function generatePersonalMonthly(params: MonthlyGenParams): Promise<ReportResult> {
  const messages = buildMonthlyMessages(params);
  const llm = await params.callLlm(messages);
  if (!llm.ok) return { ok: false, error: llm.error };

  const filePath = path.join(params.vaultPath, params.relativeDir || 'logs/monthly-review', `${params.month}.md`);
  const fm = `---\ntitle: "个人月报 ${params.month}"\nmonth: "${params.month}"\ntags: [monthly-review]\n---`;
  return writeReport(filePath, fm, llm.content, llm.truncated);
}

export interface ExternalGenParams {
  vaultPath: string;
  /** 'weekly' → exports/weekly-reports/<periodKey>.md；'monthly' → exports/monthly-reports/<periodKey>.md */
  kind: 'weekly' | 'monthly';
  periodKey: string; // 2026-W23 或 2026-06
  /** 相对 vault 的输出目录；空/未给 → exports/weekly-reports 或 exports/monthly-reports。 */
  relativeDir?: string;
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

  const defaultDir = params.kind === 'weekly' ? 'exports/weekly-reports' : 'exports/monthly-reports';
  const filePath = path.join(params.vaultPath, params.relativeDir || defaultDir, `${params.periodKey}.md`);
  const fm = `---\ntitle: "对外${params.kind === 'weekly' ? '周' : '月'}报 ${params.periodKey}"\nperiod: "${params.periodKey}"\ntags: [external-report, needs-review]\n---`;
  return writeReport(filePath, fm, llm.content, llm.truncated);
}

