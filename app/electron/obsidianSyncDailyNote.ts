import fs from 'fs';
import path from 'path';
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
    const legacyTemplates = isObjectRecord(templates) ? templates : {};
    const dailyPath = templates.dailyPath ||
      (typeof legacyTemplates.dailyNotePath === 'string' ? legacyTemplates.dailyNotePath : undefined) ||
      'logs/daily/{{date}}.md';
    const vaultPath = getVaultPath();
    if (!vaultPath) throw new Error('Obsidian vault path is missing.');
    return resolveTemplatePath(vaultPath, dailyPath, getDateKey(date));
  }

  function triggerOverviewUpdate(filePath: string) {
    triggerObsidianOverviewUpdate(getVaultPath, filePath);
  }

  function readDailyNoteFileIfPresent(filePath: string) {
    if (!fs.existsSync(filePath)) return null;
    if (!fs.statSync(filePath).isFile()) {
      throw new Error(`Daily note target must be a file: ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf-8');
  }

  function syncOneDailyNote(
    tasks: ObsidianSyncTask[],
    selected: string,
    dailyWork = '',
    inspiration = '',
    useProvidedDailySections = false,
  ) {
    const templates = getTemplates();
    const workEnabled = readTemplateModuleEnabled(templates, 'work', true);
    const inspirationEnabled = readTemplateModuleEnabled(templates, 'inspiration', true);
    const tasksEnabled = readTemplateModuleEnabled(templates, 'tasks', true);
    const filePath = getDailyFilePath(selected);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const existingFileContent = readDailyNoteFileIfPresent(filePath);
    const existing = existingFileContent ?? buildDailyTemplate(selected, dailyWork, inspiration, templates);
    let nextContent = existing;

    if (workEnabled) {
      nextContent = migrateLegacyWorkSection(nextContent, dailyWork);
      const existingWork = readMarkedBlockBody(nextContent, WORK_START_MARKER, WORK_END_MARKER);
      const nextWork = useProvidedDailySections ? dailyWork : existingWork;
      nextContent = upsertManagedBlockIfChanged(
        nextContent,
        WORK_START_MARKER,
        WORK_END_MARKER,
        buildWorkBlock(nextWork, templates),
        upsertMarkedBlock,
      );
    }

    if (inspirationEnabled) {
      nextContent = migrateLegacyInspirationSection(nextContent, inspiration);
      const existingInspiration = readMarkedBlockBody(
        nextContent,
        INSPIRATION_START_MARKER,
        INSPIRATION_END_MARKER,
      );
      const nextInspiration = useProvidedDailySections
        ? inspiration.trim() || existingInspiration
        : existingInspiration;
      nextContent = upsertManagedBlockIfChanged(
        nextContent,
        INSPIRATION_START_MARKER,
        INSPIRATION_END_MARKER,
        buildInspirationBlock(nextInspiration, templates),
        upsertMarkedBlock,
      );
    }

    if (tasksEnabled) {
      const taskBlockStart = nextContent.indexOf(TASK_START_MARKER);
      const taskBlockEnd = nextContent.indexOf(TASK_END_MARKER);
      const existingTaskBlock = taskBlockStart !== -1 && taskBlockEnd > taskBlockStart
        ? nextContent.slice(taskBlockStart, taskBlockEnd + TASK_END_MARKER.length)
        : '';
      const nextTaskBlock = preserveTaskSyncTimestamp(
        existingTaskBlock,
        buildTaskBlock(selected, tasks, templates),
      );
      nextContent = upsertManagedBlockIfChanged(
        nextContent,
        TASK_START_MARKER,
        TASK_END_MARKER,
        nextTaskBlock,
        upsertMarkedBlock,
      );
    }

    if (nextContent !== existingFileContent) {
      writeTextFileAtomic(filePath, nextContent);
    }
    return { filePath, nextContent, didWrite: nextContent !== existingFileContent };
  }

  return {
    getDailyFilePath,
    triggerOverviewUpdate,
    readDailyNoteFileIfPresent,
    syncOneDailyNote,
  };
}
