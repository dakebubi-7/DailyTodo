import { runReviewForFile, RunParams } from './runner';

export interface BackfillParams {
  dates: string[]; // 近 N 天（业务日）
  resolveFilePath: (date: string) => string;
  tasksForDate: (date: string) => RunParams['tasks'];
  sections: RunParams['sections'];
  callLlm: RunParams['callLlm'];
  fileExists: (filePath: string) => boolean;
}

export interface BackfillReport {
  processed: string[];
  filled: string[];
  errors: Array<{ date: string; error: string }>;
}

/** 串行处理，单文件失败跳过、记录，不中断整体。 */
export async function backfillReviews(params: BackfillParams): Promise<BackfillReport> {
  const report: BackfillReport = { processed: [], filled: [], errors: [] };
  for (const date of params.dates) {
    const filePath = params.resolveFilePath(date);
    if (!params.fileExists(filePath)) continue;
    report.processed.push(date);
    const r = await runReviewForFile({
      filePath, date,
      tasks: params.tasksForDate(date),
      sections: params.sections,
      callLlm: params.callLlm,
    });
    if (!r.ok && r.error) report.errors.push({ date, error: r.error });
    if (r.filledMarkers.length) report.filled.push(date);
  }
  return report;
}
