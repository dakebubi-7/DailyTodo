export type AiReviewReportSourceContent = {
  content: string;
};

export function sumReportSourceChars(sources: AiReviewReportSourceContent[]): number {
  return sources.reduce((sum, source) => sum + source.content.length, 0);
}
