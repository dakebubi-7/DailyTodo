import type { ObsidianTemplateSettings } from '../shared/appSettings';
import { buildSyncPreview } from '../shared/obsidianTemplates';
import type { VaultStatus } from './sharedTypes';
import type { ObsidianSyncInput } from './obsidianSyncValidation';

type ObsidianSyncPreviewOptions = {
  getTemplates(): ObsidianTemplateSettings;
  getDailyFilePath(date: string, templates: ObsidianTemplateSettings): string;
  readDailyNoteFileIfPresent(filePath: string): string | null;
};

export function createObsidianSyncPreviewHelper({
  getTemplates,
  getDailyFilePath,
  readDailyNoteFileIfPresent,
}: ObsidianSyncPreviewOptions) {
  return function buildObsidianSyncPreview(
    input: ObsidianSyncInput,
    selected: string,
    affectedDates: string[],
    vaultStatus: Extract<VaultStatus, { ok: true }>,
  ) {
    const templates = getTemplates();
    const previewsByDate = [];
    const files = [];
    let taskCount = 0;
    let completionRecordCount = 0;
    let deletedReviewWillDisappear = false;
    let selectedPreview;

    for (const affectedDate of affectedDates) {
      const affectedFilePath = getDailyFilePath(affectedDate, templates);
      const existingDailyNote = readDailyNoteFileIfPresent(affectedFilePath) ?? '';
      const preview = buildSyncPreview({
        date: affectedDate,
        tasksBeforeDelete: input.beforeTasks,
        tasksAfterDelete: input.tasks,
        dailyWork: affectedDate === selected ? input.dailyWork : '',
        dailyInspiration: affectedDate === selected ? input.inspiration : '',
        templates,
        vaultPath: vaultStatus.vaultPath,
        existingDailyNote,
      });
      previewsByDate.push(preview);
      files.push(...preview.files);
      taskCount += preview.taskCount;
      completionRecordCount += preview.completionRecordCount;
      deletedReviewWillDisappear ||= preview.deletedReviewWillDisappear;
      if (affectedDate === selected) selectedPreview = preview;
    }

    return {
      ...(selectedPreview ?? previewsByDate[0]),
      files,
      taskCount,
      completionRecordCount,
      deletedReviewWillDisappear,
    };
  };
}
