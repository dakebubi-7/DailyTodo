import { buildWeeklyMessages, WeeklyParams } from '../../shared/aiReview/weekly';
import { buildMonthlyMessages, MonthlyParams } from '../../shared/aiReview/monthly';
import { redactForExport } from '../../shared/aiReview/redaction';
import type { ReportTemplate } from '../../shared/aiReview/sectionConfig';
import type { LlmResult } from '../../shared/llm/openaiClient';
import {
  buildExternalReportFrontmatter,
  buildPersonalReportFrontmatter,
  resolveReportFilePath,
} from './reportOutput';
import type { ReportResult } from './reportOutput';
import {
  generateTemplateBackedReport,
  type LlmCaller,
} from './templateReportGeneration';
export { composeReportContent } from './reportOutput';
export type { ReportResult } from './reportOutput';


export interface WeeklyGenParams extends WeeklyParams {
  vaultPath: string;
  /** 相对 vault 的输出目录；空/未给 → logs/weekly-review。 */
  relativeDir?: string;
  relativeFilePath?: string;
  reportTemplate?: ReportTemplate;
  callLlm: (messages: ReturnType<typeof buildWeeklyMessages>) => Promise<LlmResult>;
}

export async function generatePersonalWeekly(params: WeeklyGenParams): Promise<ReportResult> {
  const filePath = resolveReportFilePath({
    vaultPath: params.vaultPath,
    relativeDir: params.relativeDir,
    relativeFilePath: params.relativeFilePath,
    defaultDir: 'logs/weekly-review',
    fileName: `${params.weekKey}.md`,
  });
  const fm = buildPersonalReportFrontmatter('weekly', params.weekKey);
  return generateTemplateBackedReport({
    reportTemplate: params.reportTemplate,
    buildMessages: () => buildWeeklyMessages(params),
    callLlm: params.callLlm,
    periodKey: params.weekKey,
    filePath,
    frontmatter: fm,
  });
}

export interface MonthlyGenParams extends MonthlyParams {
  vaultPath: string;
  /** 相对 vault 的输出目录；空/未给 → logs/monthly-review。 */
  relativeDir?: string;
  relativeFilePath?: string;
  reportTemplate?: ReportTemplate;
  callLlm: (messages: ReturnType<typeof buildMonthlyMessages>) => Promise<LlmResult>;
}

export async function generatePersonalMonthly(params: MonthlyGenParams): Promise<ReportResult> {
  const filePath = resolveReportFilePath({
    vaultPath: params.vaultPath,
    relativeDir: params.relativeDir,
    relativeFilePath: params.relativeFilePath,
    defaultDir: 'logs/monthly-review',
    fileName: `${params.month}.md`,
  });
  const fm = buildPersonalReportFrontmatter('monthly', params.month);
  return generateTemplateBackedReport({
    reportTemplate: params.reportTemplate,
    buildMessages: () => buildMonthlyMessages(params),
    callLlm: params.callLlm,
    periodKey: params.month,
    filePath,
    frontmatter: fm,
  });
}

export interface ExternalGenParams {
  vaultPath: string;
  /** 'weekly' → exports/weekly-reports/<periodKey>.md；'monthly' → exports/monthly-reports/<periodKey>.md */
  kind: 'weekly' | 'monthly';
  periodKey: string; // 2026-W23 或 2026-06
  /** 相对 vault 的输出目录；空/未给 → exports/weekly-reports 或 exports/monthly-reports。 */
  relativeDir?: string;
  relativeFilePath?: string;
  reportTemplate?: ReportTemplate;
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
  const redactedParts: string[] = [];
  for (const content of params.rawDailyContents) {
    const redactedPart = redactForExport(content);
    if (redactedPart) redactedParts.push(redactedPart);
  }
  const redacted = redactedParts.join('\n\n');
  const defaultDir = params.kind === 'weekly' ? 'exports/weekly-reports' : 'exports/monthly-reports';
  const filePath = resolveReportFilePath({
    vaultPath: params.vaultPath,
    relativeDir: params.relativeDir,
    relativeFilePath: params.relativeFilePath,
    defaultDir,
    fileName: `${params.periodKey}.md`,
  });
  const fm = buildExternalReportFrontmatter(params.kind, params.periodKey);
  return generateTemplateBackedReport({
    reportTemplate: params.reportTemplate,
    buildMessages: () => params.buildMessages(redacted),
    callLlm: params.callLlm,
    periodKey: params.periodKey,
    filePath,
    frontmatter: fm,
  });
}

