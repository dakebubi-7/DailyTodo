import type { ObsidianTemplateSettings } from '../shared/appSettings';
import { writeObsidianSyncBlogDraftOutput } from './obsidianSyncBlogDraftOutput';
import { createObsidianDailyNoteSyncHelpers } from './obsidianSyncDailyNote';
import { createObsidianSyncPreviewHelper } from './obsidianSyncPreview';
import { createObsidianSyncRequestReader } from './obsidianSyncRequest';
import type { ObsidianSyncTask } from './obsidianSyncValidation';
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
    prepareDailyNoteSync,
    commitDailyNoteSync,
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
  const readSyncRequest = createObsidianSyncRequestReader({
    getDateKey,
    getTaskDate,
    getReviewDate,
    getVaultStatus,
  });

  function syncTasksToObsidian(
    tasks: unknown,
    date?: unknown,
    dailyWork: unknown = '',
    inspiration: unknown = '',
    beforeTasks?: unknown,
  ) {
    const request = readSyncRequest(tasks, date, dailyWork, inspiration, beforeTasks);
    if (!request.ok) return { ok: false, reason: request.error };
    const { input, selected, affectedDates } = request.value;
    let selectedResult: { filePath: string; nextContent: string; didWrite: boolean };

    try {
      const plans = prepareDailyNoteSync(
        input.value.tasks,
        affectedDates,
        selected,
        input.value.dailyWork,
        input.value.inspiration,
      );
      const selectedPlan = plans.find((plan) => plan.date === selected);
      if (!selectedPlan) throw new Error(`Selected daily note plan is missing: ${selected}`);
      commitDailyNoteSync(plans, selected);
      selectedResult = selectedPlan;
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
    const request = readSyncRequest(tasks, date, dailyWork, inspiration, beforeTasks);
    if (!request.ok) {
      return {
        files: [],
        managedBlocks: [],
        taskCount: 0,
        completionRecordCount: 0,
        deletedReviewWillDisappear: false,
        error: request.error,
      };
    }

    const { input, selected, affectedDates, vaultStatus } = request.value;
    try {
      const preview = buildObsidianSyncPreview(input.value, selected, affectedDates, vaultStatus);
      const plans = prepareDailyNoteSync(
        input.value.tasks,
        affectedDates,
        selected,
        input.value.dailyWork,
        input.value.inspiration,
      );
      return {
        ...preview,
        markerWarnings: plans.flatMap((plan) => plan.markerWarnings.map((warning) => `${plan.filePath}: ${warning}`)),
      };
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
