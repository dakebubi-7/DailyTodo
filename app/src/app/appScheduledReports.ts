import { readAiReviewGenerationResult } from '../../shared/aiReview/runDiagnostics';

declare global {
  interface Window {
    __dailytodoLastScheduledError?: string;
  }
}

export interface ScheduledReportResult {
  ok: boolean;
  error?: string;
}

export const SCHEDULED_REPORT_FALLBACK_ERROR = '没有找到本周期原始记录，请检查素材来源或手动选择素材文件。';

export function formatScheduledReportDateKey(date: Date): string {
  const pad2 = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function getScheduledWeeklyReportDateKey(now = new Date()): string {
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  return formatScheduledReportDateKey(lastWeek);
}

export function getScheduledMonthlyReportDateKey(now = new Date()): string {
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  return formatScheduledReportDateKey(prevMonthEnd);
}

export function handleScheduledReportResult(result?: unknown): void {
  const parsed = readAiReviewGenerationResult(result);
  if (!parsed || parsed.ok) return;
  const message = parsed.error || SCHEDULED_REPORT_FALLBACK_ERROR;
  console.warn('[scheduled report]', message);
  try {
    window.__dailytodoLastScheduledError = message;
  } catch {
    /* noop */
  }
}
