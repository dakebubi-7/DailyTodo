import type { ObsidianTemplateSettings } from '../shared/appSettings';
import {
  INSPIRATION_END_MARKER,
  INSPIRATION_START_MARKER,
  TASK_END_MARKER,
  TASK_START_MARKER,
  WORK_END_MARKER,
  WORK_START_MARKER,
  resolveTemplatePath,
} from '../shared/obsidianTemplates';
import type { ObsidianSyncTask } from './obsidianSyncValidation';
import { isObjectRecord } from './unknownValueGuards';
import {
  preserveTaskSyncTimestamp,
  upsertManagedBlockIfChanged,
} from './obsidianManagedBlockSync';
import { triggerObsidianOverviewUpdate } from './obsidianOverviewUpdate';
import {
  readTextFileWithStamp,
  writeTextFileAtomicIfUnchanged,
  type TextFileStamp,
} from './fileWrite';

function readTemplateModuleEnabled(templates: ObsidianTemplateSettings, moduleId: string, fallback: boolean) {
  const modules = isObjectRecord(templates) ? templates.modules : undefined;
  if (!isObjectRecord(modules)) return fallback;
  const module = modules[moduleId];
  if (!isObjectRecord(module)) return fallback;
  return typeof module.enabled === 'boolean' ? module.enabled : fallback;
}

type CreateObsidianDailyNoteSyncHelpersOptions = {
  getDateKey(date?: string): string;
  getVaultPath(): string | undefined;
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
};

export type ObsidianDailyNoteSyncPlan = {
  date: string;
  filePath: string;
  nextContent: string;
  didWrite: boolean;
  stamp: TextFileStamp | null;
  markerWarnings: string[];
};

export function createObsidianDailyNoteSyncHelpers({
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
}: CreateObsidianDailyNoteSyncHelpersOptions) {
  function getDailyFilePath(date?: string, templates = getTemplates()) {
    const legacyRecord = isObjectRecord(templates) ? (templates as Record<string, unknown>) : null;
    const legacyDailyNotePath = typeof legacyRecord?.dailyNotePath === 'string'
      ? legacyRecord.dailyNotePath
      : undefined;
    const dailyPath = templates.dailyPath ||
      legacyDailyNotePath ||
      'logs/daily/{{date}}.md';
    const vaultPath = getVaultPath();
    if (!vaultPath) throw new Error('Obsidian vault path is missing.');
    return resolveTemplatePath(vaultPath, dailyPath, getDateKey(date));
  }

  function triggerOverviewUpdate(filePath: string) {
    triggerObsidianOverviewUpdate(getVaultPath, filePath);
  }

  function readDailyNoteFileIfPresent(filePath: string) {
    return readTextFileWithStamp(filePath).content;
  }

  function getMarkerWarnings(existing: string, enabledMarkers: Array<[string, string, string]>) {
    return enabledMarkers.flatMap(([name, startMarker, endMarker]) => {
      const start = existing.indexOf(startMarker);
      const end = existing.indexOf(endMarker);
      const starts = existing.split(startMarker).length - 1;
      const ends = existing.split(endMarker).length - 1;
      return start === -1 && end === -1
        ? []
        : start === -1 || end === -1 || end <= start || starts !== 1 || ends !== 1
          ? [`${name} marker health warning.`]
          : [];
    });
  }

  function prepareDailyNoteSync(
    tasks: ObsidianSyncTask[],
    affectedDates: string[],
    selected: string,
    dailyWork = '',
    inspiration = '',
  ): ObsidianDailyNoteSyncPlan[] {
    const templates = getTemplates();
    const workEnabled = readTemplateModuleEnabled(templates, 'work', true);
    const inspirationEnabled = readTemplateModuleEnabled(templates, 'inspiration', true);
    const tasksEnabled = readTemplateModuleEnabled(templates, 'tasks', true);

    return affectedDates.map((date) => {
      const filePath = getDailyFilePath(date, templates);
      const snapshot = readTextFileWithStamp(filePath);
      const existingFileContent = snapshot.content;
      const useProvidedDailySections = date === selected;
      const existing = existingFileContent ?? buildDailyTemplate(
        date,
        useProvidedDailySections ? dailyWork : '',
        useProvidedDailySections ? inspiration : '',
        templates,
      );
      let nextContent = existing;

      if (workEnabled) {
        nextContent = migrateLegacyWorkSection(nextContent, useProvidedDailySections ? dailyWork : '');
        const existingWork = readMarkedBlockBody(nextContent, WORK_START_MARKER, WORK_END_MARKER);
        nextContent = upsertManagedBlockIfChanged(
          nextContent, WORK_START_MARKER, WORK_END_MARKER,
          buildWorkBlock(useProvidedDailySections ? dailyWork : existingWork, templates), upsertMarkedBlock,
        );
      }
      if (inspirationEnabled) {
        nextContent = migrateLegacyInspirationSection(nextContent, useProvidedDailySections ? inspiration : '');
        const existingInspiration = readMarkedBlockBody(nextContent, INSPIRATION_START_MARKER, INSPIRATION_END_MARKER);
        const nextInspiration = useProvidedDailySections ? inspiration.trim() || existingInspiration : existingInspiration;
        nextContent = upsertManagedBlockIfChanged(
          nextContent, INSPIRATION_START_MARKER, INSPIRATION_END_MARKER,
          buildInspirationBlock(nextInspiration, templates), upsertMarkedBlock,
        );
      }
      if (tasksEnabled) {
        const taskBlockStart = nextContent.indexOf(TASK_START_MARKER);
        const taskBlockEnd = nextContent.indexOf(TASK_END_MARKER);
        const existingTaskBlock = taskBlockStart !== -1 && taskBlockEnd > taskBlockStart
          ? nextContent.slice(taskBlockStart, taskBlockEnd + TASK_END_MARKER.length) : '';
        const nextTaskBlock = preserveTaskSyncTimestamp(existingTaskBlock, buildTaskBlock(date, tasks, templates));
        nextContent = upsertManagedBlockIfChanged(
          nextContent, TASK_START_MARKER, TASK_END_MARKER, nextTaskBlock, upsertMarkedBlock,
        );
      }

      const enabledMarkers: Array<[string, string, string]> = [];
      if (workEnabled) enabledMarkers.push(['DAILYTODO:WORK', WORK_START_MARKER, WORK_END_MARKER]);
      if (inspirationEnabled) enabledMarkers.push(['DAILYTODO:INSPIRATION', INSPIRATION_START_MARKER, INSPIRATION_END_MARKER]);
      if (tasksEnabled) enabledMarkers.push(['DAILYTODO:TASKS', TASK_START_MARKER, TASK_END_MARKER]);
      return {
        date,
        filePath,
        nextContent,
        didWrite: nextContent !== existingFileContent,
        stamp: snapshot.stamp,
        markerWarnings: getMarkerWarnings(existingFileContent ?? '', enabledMarkers),
      };
    });
  }

  function commitDailyNoteSync(plans: ObsidianDailyNoteSyncPlan[], selected: string) {
    const ordered = [...plans].sort((left, right) => Number(left.date === selected) - Number(right.date === selected));
    for (const plan of ordered) {
      if (!plan.didWrite) continue;
      const result = writeTextFileAtomicIfUnchanged(plan.filePath, plan.nextContent, plan.stamp);
      if (!result.ok) throw new Error(result.reason);
    }
  }

  function syncOneDailyNote(
    tasks: ObsidianSyncTask[],
    selected: string,
    dailyWork = '',
    inspiration = '',
    useProvidedDailySections = false,
  ) {
    const [plan] = prepareDailyNoteSync(
      tasks,
      [selected],
      selected,
      useProvidedDailySections ? dailyWork : '',
      useProvidedDailySections ? inspiration : '',
    );
    commitDailyNoteSync([plan], selected);
    return { filePath: plan.filePath, nextContent: plan.nextContent, didWrite: plan.didWrite };
  }

  return {
    getDailyFilePath,
    triggerOverviewUpdate,
    readDailyNoteFileIfPresent,
    prepareDailyNoteSync,
    commitDailyNoteSync,
    syncOneDailyNote,
  };
}
