import type { ObsidianTemplateSettings } from '../shared/appSettings';
import { createObsidianDailyNoteContentHelpers } from './obsidianDailyNoteContent';
import { createObsidianSyncHelpers } from './obsidianSync';
import type { ElectronTask, VaultStatus } from './sharedTypes';
import {
  getDateKey,
  getReviewDate,
  getTaskDate,
} from './taskDateHelpers';

type CreateMainObsidianServicesOptions = {
  getVaultPath(): string | undefined;
  getVaultStatus(): VaultStatus;
  getObsidianTemplateSettings(): ObsidianTemplateSettings;
  runReviewForDate(date: string, tasks: ElectronTask[], force?: boolean): Promise<unknown>;
  localBlogDraftDir: string;
  zh(text: string): string;
};

export function createMainObsidianServices({
  getVaultPath,
  getVaultStatus,
  getObsidianTemplateSettings,
  runReviewForDate,
  localBlogDraftDir,
  zh,
}: CreateMainObsidianServicesOptions) {
  const {
    buildTaskBlock,
    buildWorkBlock,
    buildInspirationBlock,
    buildDailyTemplate,
    migrateLegacyInspirationSection,
    upsertMarkedBlock,
    readMarkedBlockBody,
    migrateLegacyWorkSection,
    buildBlogDraft,
  } = createObsidianDailyNoteContentHelpers({
    getDateKey,
    getTaskDate,
    getTemplates: getObsidianTemplateSettings,
    zh,
  });

  const {
    getDailyFilePath,
    triggerOverviewUpdate,
    syncTasksToObsidian,
    previewTasksToObsidian,
  } = createObsidianSyncHelpers({
    getDateKey,
    getTaskDate,
    getReviewDate,
    getVaultPath,
    getVaultStatus,
    getTemplates: getObsidianTemplateSettings,
    buildDailyTemplate,
    buildWorkBlock,
    buildInspirationBlock,
    buildTaskBlock,
    migrateLegacyInspirationSection,
    readMarkedBlockBody,
    upsertMarkedBlock,
    migrateLegacyWorkSection,
    buildBlogDraft,
    runReviewForDate,
    localBlogDraftDir,
  });

  return {
    getDateKey,
    getDailyFilePath,
    triggerOverviewUpdate,
    syncTasksToObsidian,
    previewTasksToObsidian,
    buildDailyTemplate,
  };
}
