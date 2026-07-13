import type { ObsidianTemplateSettings } from '../shared/appSettings';
import { writeObsidianSyncBlogDraftOutput } from './obsidianSyncBlogDraftOutput';
import { createObsidianDailyNoteSyncHelpers } from './obsidianSyncDailyNote';
import { getDatesAffectedBySync } from './obsidianSyncPlanning';
import { createObsidianSyncPreviewHelper } from './obsidianSyncPreview';
import { readObsidianSyncInput, type ObsidianSyncTask } from './obsidianSyncValidation';
import type { VaultStatus } from './sharedTypes';

type CreateObsidianSyncHelpersOptions = {
  getDateKey(date?: string): string;
  getTaskDate(task: ObsidianSyncTask): string;
  getReviewDate(review: NonNullable<ObsidianSyncTask['completionReview']>): string;
  getVaultPath(): string | undefined;
  getVaultStatus(): VaultStatus;
  getTemplates(): ObsidianTemplateSettings;
  buildDailyTemplate(
    date: string,
    dailyWork?: string,
    inspiration?: string,
    templates?: ObsidianTemplateSettings,
  ): string;
  buildWorkBlock(dailyWork?: string, templates?: ObsidianTemplateSettings): string;
  buildInspirationBlock(inspiration?: string, templates?: ObsidianTemplateSettings): string;
  buildTaskBlock(date: string, tasks: ObsidianSyncTask[], templates?: ObsidianTemplateSettings): string;
  migrateLegacyInspirationSection(existing: string, inspiration?: string): string;
  upsertMarkedBlock(existing: string, startMarker: string, endMarker: string, block: string): string;
  readMarkedBlockBody(existing: string, startMarker: string, endMarker: string): string;
  migrateLegacyWorkSection(existing: string, dailyWork?: string): string;
  buildBlogDraft(date: string, tasks: ObsidianSyncTask[], obsidianContent?: string): string;
  runReviewForDate(date: string, tasks: ObsidianSyncTask[], force?: boolean): Promise<unknown>;
  localBlogDraftDir: string;
};

export function createObsidianSyncHelpers({
  getDateKey,
  getTaskDate,
  getReviewDate,
  getVaultPath,
  getVaultStatus,
  getTemplates,
  buildDailyTemplate,
  buildWorkBlock,
  buildInspirationBlock,
  buildTaskBlock,
  migrateLegacyInspirationSection,
  upsertMarkedBlock,
  readMarkedBlockBody,
  migrateLegacyWorkSection,
  buildBlogDraft,
  runReviewForDate,
  localBlogDraftDir,
}: CreateObsidianSyncHelpersOptions) {
  const {
    getDailyFilePath,
    triggerOverviewUpdate,
    readDailyNoteFileIfPresent,
    syncOneDailyNote,
  } = createObsidianDailyNoteSyncHelpers({
    getDateKey,
    getVaultPath,
    getTemplates,
    buildDailyTemplate,
    buildWorkBlock,
    buildInspirationBlock,
    buildTaskBlock,
    migrateLegacyInspirationSection,
    upsertMarkedBlock,
    readMarkedBlockBody,
    migrateLegacyWorkSection,
  });
  const buildObsidianSyncPreview = createObsidianSyncPreviewHelper({
    getTemplates,
    getDailyFilePath,
    readDailyNoteFileIfPresent,
  });

  function syncTasksToObsidian(
    tasks: unknown,
    date?: unknown,
    dailyWork: unknown = '',
    inspiration: unknown = '',
    beforeTasks?: unknown,
  ) {
    const vaultStatus = getVaultStatus();
    if (!vaultStatus.ok || !vaultStatus.vaultPath) return { ok: false, reason: vaultStatus.reason };
    const input = readObsidianSyncInput(tasks, date, dailyWork, inspiration, beforeTasks);
    if (!input.ok) return { ok: false, reason: input.error };

    const selected = getDateKey(input.value.date);
    const affectedDates = getDatesAffectedBySync(
      input.value.tasks,
      selected,
      { getTaskDate, getReviewDate },
      input.value.beforeTasks,
    );
    let selectedResult: { filePath: string; nextContent: string; didWrite: boolean };

    try {
      selectedResult = syncOneDailyNote(input.value.tasks, selected, input.value.dailyWork, input.value.inspiration, true);

      affectedDates
        .filter((affectedDate) => affectedDate !== selected)
        .forEach((affectedDate) => {
          syncOneDailyNote(input.value.tasks, affectedDate);
        });
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : String(error) };
    }

    writeObsidianSyncBlogDraftOutput({
      localBlogDraftDir,
      date: selected,
      tasks: input.value.tasks,
      obsidianContent: selectedResult.nextContent,
      buildBlogDraft,
    });
    if (selectedResult.didWrite) {
      triggerOverviewUpdate(selectedResult.filePath);
      void runReviewForDate(selected, input.value.tasks).catch(() => {});
    }
    return { ok: true, filePath: selectedResult.filePath };
  }

  function previewTasksToObsidian(
    tasks: unknown,
    date?: unknown,
    dailyWork: unknown = '',
    inspiration: unknown = '',
    beforeTasks?: unknown,
  ) {
    const vaultStatus = getVaultStatus();
    if (!vaultStatus.ok || !vaultStatus.vaultPath) {
      return {
        files: [],
        managedBlocks: [],
        taskCount: 0,
        completionRecordCount: 0,
        deletedReviewWillDisappear: false,
        error: vaultStatus.reason,
      };
    }
    const input = readObsidianSyncInput(tasks, date, dailyWork, inspiration, beforeTasks);
    if (!input.ok) {
      return {
        files: [],
        managedBlocks: [],
        taskCount: 0,
        completionRecordCount: 0,
        deletedReviewWillDisappear: false,
        error: input.error,
      };
    }

    const selected = getDateKey(input.value.date);
    const affectedDates = getDatesAffectedBySync(
      input.value.tasks,
      selected,
      { getTaskDate, getReviewDate },
      input.value.beforeTasks,
    );
    try {
      return buildObsidianSyncPreview(input.value, selected, affectedDates, vaultStatus);
    } catch (error) {
      return {
        files: [],
        managedBlocks: [],
        taskCount: 0,
        completionRecordCount: 0,
        deletedReviewWillDisappear: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    getDailyFilePath,
    triggerOverviewUpdate,
    syncTasksToObsidian,
    previewTasksToObsidian,
  };
}
