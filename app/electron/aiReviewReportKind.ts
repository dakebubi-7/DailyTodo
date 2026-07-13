export type AiReviewReportKind = 'weekly' | 'monthly';

export const AI_REVIEW_REPORT_KIND_ERROR = 'AI Review report kind is malformed.';

export function isAiReviewReportKind(value: unknown): value is AiReviewReportKind {
  return value === 'weekly' || value === 'monthly';
}
