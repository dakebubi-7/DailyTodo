import { getDatesAffectedBySync } from './obsidianSyncPlanning';
import { readObsidianSyncInput, type ObsidianSyncTask } from './obsidianSyncValidation';
import type { VaultStatus } from './sharedTypes';

type ObsidianSyncRequestReaderOptions = {
  getDateKey(date?: string): string;
  getTaskDate(task: ObsidianSyncTask): string;
  getReviewDate(review: NonNullable<ObsidianSyncTask['completionReview']>): string;
  getVaultStatus(): VaultStatus;
};

export type ObsidianSyncRequest = {
  vaultStatus: Extract<VaultStatus, { ok: true }>;
  input: ReturnType<typeof readObsidianSyncInput> & { ok: true };
  selected: string;
  affectedDates: string[];
};

export type ReadObsidianSyncRequestResult =
  | { ok: true; value: ObsidianSyncRequest }
  | { ok: false; error: string };

export function createObsidianSyncRequestReader({
  getDateKey,
  getTaskDate,
  getReviewDate,
  getVaultStatus,
}: ObsidianSyncRequestReaderOptions) {
  return function readSyncRequest(
    tasks: unknown,
    date?: unknown,
    dailyWork: unknown = '',
    inspiration: unknown = '',
    beforeTasks?: unknown,
  ): ReadObsidianSyncRequestResult {
    const vaultStatus = getVaultStatus();
    if (!vaultStatus.ok || !vaultStatus.vaultPath) {
      return { ok: false, error: vaultStatus.reason ?? 'Obsidian vault is unavailable.' };
    }

    const input = readObsidianSyncInput(tasks, date, dailyWork, inspiration, beforeTasks);
    if (!input.ok) return { ok: false, error: input.error };

    const selected = getDateKey(input.value.date);
    const affectedDates = getDatesAffectedBySync(
      input.value.tasks,
      selected,
      { getTaskDate, getReviewDate },
      input.value.beforeTasks,
    );

    return { ok: true, value: { vaultStatus, input, selected, affectedDates } };
  };
}
