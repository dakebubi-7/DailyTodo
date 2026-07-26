import { ipcMain } from 'electron';
import type { DailyReviewBatch } from '../shared/dailyReview';

export type RegisterAiReviewDailyBatchIpcHandlersOptions = {
  getDateKey(date?: unknown): string;
  getDailyReviewBatch(sourceDate: string): DailyReviewBatch | undefined;
  runDailyReviewBatch(sourceDate: string): Promise<unknown>;
};

export function registerAiReviewDailyBatchIpcHandlers({
  getDateKey,
  getDailyReviewBatch,
  runDailyReviewBatch,
}: RegisterAiReviewDailyBatchIpcHandlersOptions): void {
  ipcMain.handle('aiReview:getDailyReviewBatch', (_event, sourceDate: unknown) => {
    return getDailyReviewBatch(getDateKey(sourceDate));
  });
  ipcMain.handle('aiReview:runDailyReviewBatch', (_event, sourceDate: unknown) => {
    return runDailyReviewBatch(getDateKey(sourceDate));
  });
}
