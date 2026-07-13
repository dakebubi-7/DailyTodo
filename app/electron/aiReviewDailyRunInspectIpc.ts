import { ipcMain } from 'electron';
import { isAiReviewTaskArray } from './aiReviewTaskPayload';
import type { ElectronTask, InspectDailyResult } from './sharedTypes';

export type RegisterAiReviewDailyRunInspectIpcHandlersOptions = {
  getDateKey(date?: unknown): string;
  runReviewForDate(date: string, tasks: ElectronTask[], force?: boolean): unknown;
  inspectDailyAiContent(date: string): InspectDailyResult;
};

export function registerAiReviewDailyRunInspectIpcHandlers({
  getDateKey,
  runReviewForDate,
  inspectDailyAiContent,
}: RegisterAiReviewDailyRunInspectIpcHandlersOptions): void {
  ipcMain.handle('aiReview:runForDate', (_event, date: unknown, tasks: unknown, force?: unknown) => {
    if (!isAiReviewTaskArray(tasks)) {
      return {
        ok: false,
        error: 'AI Review tasks contain malformed entries.',
        filledMarkers: [],
        skippedMarkers: [],
      };
    }
    return runReviewForDate(getDateKey(date), tasks, force === true);
  });
  ipcMain.handle('aiReview:inspectDaily', (_event, date: unknown) => {
    return inspectDailyAiContent(getDateKey(date));
  });
}
