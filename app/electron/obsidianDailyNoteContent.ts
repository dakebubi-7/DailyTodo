import type { ObsidianTemplateSettings } from '../shared/appSettings';
import {
  INSPIRATION_END_MARKER,
  INSPIRATION_START_MARKER,
  TASK_END_MARKER,
  TASK_START_MARKER,
  WORK_END_MARKER,
  WORK_START_MARKER,
  buildDailyNoteFromTemplate,
  buildInspirationBlock as buildTemplateInspirationBlock,
  buildTaskBlock as buildTemplateTaskBlock,
  buildTaskLines as buildTemplateTaskLines,
  buildWorkBlock as buildTemplateWorkBlock,
  readMarkedBlockBody as readTemplateMarkedBlockBody,
  replaceManagedBlock,
} from '../shared/obsidianTemplates';
import type { ElectronTask } from './sharedTypes';
import { createObsidianBlogDraftBuilder } from './obsidianBlogDraft';

type ObsidianDailyNoteTask = ElectronTask;

type CreateObsidianDailyNoteContentHelpersOptions = {
  getDateKey(date?: string): string;
  getTaskDate(task: ObsidianDailyNoteTask): string;
  getTemplates(): ObsidianTemplateSettings;
  zh(text: string): string;
};

export function createObsidianDailyNoteContentHelpers({
  getDateKey,
  getTaskDate,
  getTemplates,
  zh,
}: CreateObsidianDailyNoteContentHelpersOptions) {
  const { buildBlogDraft } = createObsidianBlogDraftBuilder({
    getDateKey,
    getTaskDate,
    getTemplates,
    zh,
  });

  function buildTaskLines(
    tasks: ObsidianDailyNoteTask[],
    date: string,
    templates = getTemplates(),
  ) {
    const selected = getDateKey(date);
    return buildTemplateTaskLines(tasks, selected, templates);
  }

  function buildTaskBlock(
    date: string,
    tasks: ObsidianDailyNoteTask[],
    templates = getTemplates(),
  ) {
    const selected = getDateKey(date);
    return buildTemplateTaskBlock(selected, tasks, templates);
  }

  function buildWorkBlock(dailyWork = '', templates = getTemplates()) {
    return buildTemplateWorkBlock(dailyWork, templates);
  }

  function buildInspirationBlock(inspiration = '', templates = getTemplates()) {
    return buildTemplateInspirationBlock(inspiration, templates);
  }

  function buildDailyTemplate(
    date: string,
    dailyWork = '',
    inspiration = '',
    templates = getTemplates(),
  ) {
    const selected = getDateKey(date);
    return buildDailyNoteFromTemplate({
      date: selected,
      tasks: [],
      dailyWork,
      dailyInspiration: inspiration,
      templates,
    });
  }

  function migrateLegacyInspirationSection(existing: string, inspiration = '') {
    if (existing.includes(INSPIRATION_START_MARKER)) return existing;

    const headings = [`## ${zh('\u788e\u788e\u5ff5')}`, `## ${zh('\u7075\u611f\u95ea\u5ff5')}`];
    const match = headings
      .map((heading) => ({ heading, start: existing.indexOf(heading) }))
      .filter((item) => item.start !== -1)
      .sort((a, b) => a.start - b.start)[0];

    if (!match) return `${existing.trimEnd()}\n\n${buildInspirationBlock(inspiration)}\n`;

    const nextHeading = existing.indexOf('\n## ', match.start + match.heading.length);
    const before = existing.slice(0, match.start).trimEnd();
    const legacySection = existing
      .slice(match.start + match.heading.length, nextHeading === -1 ? undefined : nextHeading)
      .trim();
    const after = nextHeading === -1 ? '' : existing.slice(nextHeading).trimStart();
    const migratedInspiration = inspiration.trim() || (legacySection === '-' ? '' : legacySection);

    return [before, buildInspirationBlock(migratedInspiration), after].filter(Boolean).join('\n\n') + '\n';
  }

  function upsertMarkedBlock(existing: string, startMarker: string, endMarker: string, block: string) {
    return replaceManagedBlock(existing, startMarker, endMarker, block);
  }

  function readMarkedBlockBody(existing: string, startMarker: string, endMarker: string) {
    return readTemplateMarkedBlockBody(existing, startMarker, endMarker);
  }

  function removeUnmarkedWorkSections(existing: string) {
    const workHeading = `## ${zh('\u4eca\u65e5\u5de5\u4f5c')}`;
    let content = existing;
    let searchFrom = 0;

    while (true) {
      const start = content.indexOf(workHeading, searchFrom);
      if (start === -1) return content;

      const markerStart = content.lastIndexOf(WORK_START_MARKER, start);
      const markerEnd = content.indexOf(WORK_END_MARKER, start);
      const insideMarkedBlock = markerStart !== -1 && markerEnd !== -1 && markerStart < start && start < markerEnd;

      if (insideMarkedBlock) {
        searchFrom = start + workHeading.length;
        continue;
      }

      const nextHeading = content.indexOf('\n## ', start + workHeading.length);
      const before = content.slice(0, start).trimEnd();
      const after = nextHeading === -1 ? '' : content.slice(nextHeading).trimStart();
      content = [before, after].filter(Boolean).join('\n\n') + '\n';
      searchFrom = before.length;
    }
  }

  function migrateLegacyWorkSection(existing: string, dailyWork = '') {
    const workHeading = `## ${zh('\u4eca\u65e5\u5de5\u4f5c')}`;
    if (existing.includes(WORK_START_MARKER)) return removeUnmarkedWorkSections(existing);

    const start = existing.indexOf(workHeading);
    if (start === -1) return existing;

    const nextHeading = existing.indexOf('\n## ', start + workHeading.length);
    const before = existing.slice(0, start).trimEnd();
    const legacySection = existing.slice(start + workHeading.length, nextHeading === -1 ? undefined : nextHeading).trim();
    const after = nextHeading === -1 ? '' : existing.slice(nextHeading).trimStart();
    const migratedWork = dailyWork.trim() || (legacySection === '-' ? '' : legacySection);

    return [before, buildWorkBlock(migratedWork), after].filter(Boolean).join('\n\n') + '\n';
  }

  return {
    buildTaskLines,
    buildTaskBlock,
    buildWorkBlock,
    buildInspirationBlock,
    buildDailyTemplate,
    migrateLegacyInspirationSection,
    upsertMarkedBlock,
    readMarkedBlockBody,
    migrateLegacyWorkSection,
    buildBlogDraft,
  };
}
