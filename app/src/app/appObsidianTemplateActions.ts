import type { Dispatch, SetStateAction } from 'react';
import type { ObsidianTemplateSettings } from '../../shared/appSettings';
import type { SyncPreview } from '../../shared/obsidianTemplates';
import { readSyncPreview } from '../../shared/obsidianIpcResults';
import type { Task } from '../types/task';

export interface AppObsidianTemplateActionDependencies {
  obsidianSyncTasks: Task[];
  selectedDate: string;
  dailyWork: string;
  dailyInspiration: string;
  allTasks: Task[];
  setObsidianTemplatesState: Dispatch<SetStateAction<ObsidianTemplateSettings>>;
  setSettingsSyncPreview: Dispatch<SetStateAction<SyncPreview | null>>;
  setObsidianTemplateSettings: (settings: ObsidianTemplateSettings) => Promise<unknown>;
  resetObsidianTemplateSettings: () => Promise<ObsidianTemplateSettings>;
  previewTasksToObsidian: (
    tasks: Task[],
    selectedDate?: string,
    dailyWork?: string,
    dailyInspiration?: string,
    beforeTasks?: Task[],
  ) => Promise<unknown>;
}

export function createAppObsidianTemplateActions({
  obsidianSyncTasks,
  selectedDate,
  dailyWork,
  dailyInspiration,
  allTasks,
  setObsidianTemplatesState,
  setSettingsSyncPreview,
  setObsidianTemplateSettings,
  resetObsidianTemplateSettings,
  previewTasksToObsidian,
}: AppObsidianTemplateActionDependencies) {
  const updateObsidianTemplates = async (next: ObsidianTemplateSettings) => {
    setObsidianTemplatesState(next);
    setSettingsSyncPreview(null);
    await setObsidianTemplateSettings(next);
  };

  const resetObsidianTemplates = async () => {
    const next = await resetObsidianTemplateSettings();
    setObsidianTemplatesState(next);
    setSettingsSyncPreview(null);
  };

  const previewSettingsSync = async () => {
    const preview = readSyncPreview(
      await previewTasksToObsidian(obsidianSyncTasks, selectedDate, dailyWork, dailyInspiration, allTasks),
    );
    setSettingsSyncPreview(preview || null);
  };

  return {
    updateObsidianTemplates,
    resetObsidianTemplates,
    previewSettingsSync,
  };
}
