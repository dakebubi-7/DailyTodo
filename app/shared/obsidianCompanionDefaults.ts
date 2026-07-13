import {
  CompanionPreset,
  CompanionRule,
  CompanionSettings,
  CompanionTemplate,
  isCompanionRule,
  isCompanionTemplate,
} from './obsidianCompanion';
import { isObjectRecord } from './unknownValueGuards';

export const DEFAULT_COMPANION_TEMPLATES: CompanionTemplate[] = [
  {
    id: 'daily-task-line',
    name: 'Daily task line',
    body: '- [ ] {{content}} {{tags}}',
  },
  {
    id: 'daily-inspiration-line',
    name: 'Daily inspiration line',
    body: '- {{time}} {{content}} {{tags}}',
  },
  {
    id: 'daily-work-block',
    name: 'Daily work block',
    body: '{{content}}',
  },
];

export const DEFAULT_COMPANION_RULES: CompanionRule[] = [
  {
    id: 'tasks-to-daily-note',
    name: 'Tasks to daily note',
    enabled: true,
    priority: 100,
    when: { type: 'task' },
    write: {
      target: 'logs/daily/DailyTodo/{{date}}.md',
      section: '## Daily Tasks',
      templateId: 'daily-task-line',
      mode: 'append',
    },
    afterMatch: 'continue',
  },
  {
    id: 'inspiration-to-daily-note',
    name: 'Inspiration to daily note',
    enabled: true,
    priority: 90,
    when: { type: 'inspiration' },
    write: {
      target: 'logs/daily/DailyTodo/{{date}}.md',
      section: '## Inspiration',
      templateId: 'daily-inspiration-line',
      mode: 'append',
    },
    afterMatch: 'continue',
  },
  {
    id: 'work-to-daily-note',
    name: 'Work notes to daily note',
    enabled: true,
    priority: 80,
    when: { type: 'work' },
    write: {
      target: 'logs/daily/DailyTodo/{{date}}.md',
      section: '## Work Notes',
      templateId: 'daily-work-block',
      mode: 'managed-block',
    },
    afterMatch: 'continue',
  },
];

export const DEFAULT_COMPANION_PRESETS: CompanionPreset[] = [
  {
    id: 'minimal-daily-notes',
    name: 'Minimal Daily Notes',
    description: 'Append tasks, work, and inspiration to one DailyTodo note per day.',
    rules: DEFAULT_COMPANION_RULES,
    templates: DEFAULT_COMPANION_TEMPLATES,
  },
  {
    id: 'inbox-first',
    name: 'Inbox First',
    description: 'Send mobile and uncategorized notes to an Obsidian inbox.',
    templates: DEFAULT_COMPANION_TEMPLATES,
    rules: [
      {
        id: 'mobile-notes-to-inbox',
        name: 'Mobile notes to inbox',
        enabled: true,
        priority: 100,
        when: { source: 'mobile-inbox' },
        write: {
          target: 'Inbox/DailyTodo.md',
          section: '## Mobile Inbox',
          templateId: 'daily-inspiration-line',
          mode: 'append',
        },
        afterMatch: 'stop',
      },
    ],
  },
];

export function createDefaultCompanionSettings(vaultPath = ''): CompanionSettings {
  return {
    vaultPath,
    mobileInboxPath: '',
    presetId: 'minimal-daily-notes',
    syncMode: 'manual',
    previewBeforeWrite: true,
    rules: DEFAULT_COMPANION_RULES,
    templates: DEFAULT_COMPANION_TEMPLATES,
  };
}

export function normalizeCompanionSettings(value: unknown, vaultPath = ''): CompanionSettings {
  const defaults = createDefaultCompanionSettings(vaultPath);
  if (!isObjectRecord(value)) return defaults;

  const candidate: Record<string, unknown> = value;
  return {
    vaultPath: typeof candidate.vaultPath === 'string' ? candidate.vaultPath : defaults.vaultPath,
    mobileInboxPath: typeof candidate.mobileInboxPath === 'string' ? candidate.mobileInboxPath : defaults.mobileInboxPath,
    presetId: typeof candidate.presetId === 'string' ? candidate.presetId : defaults.presetId,
    syncMode:
      candidate.syncMode === 'manual' || candidate.syncMode === 'on-change' || candidate.syncMode === 'interval'
        ? candidate.syncMode
        : defaults.syncMode,
    previewBeforeWrite:
      typeof candidate.previewBeforeWrite === 'boolean' ? candidate.previewBeforeWrite : defaults.previewBeforeWrite,
    rules: Array.isArray(candidate.rules) && candidate.rules.every(isCompanionRule) ? candidate.rules : defaults.rules,
    templates:
      Array.isArray(candidate.templates) && candidate.templates.every(isCompanionTemplate)
        ? candidate.templates
        : defaults.templates,
  };
}

function areCompanionValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => areCompanionValuesEqual(value, right[index]));
  }

  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);
  return leftEntries.length === rightEntries.length
    && leftEntries.every(([key, value]) => (
      Object.prototype.hasOwnProperty.call(right, key)
        && areCompanionValuesEqual(value, Object.getOwnPropertyDescriptor(right, key)?.value)
    ));
}

export function areCompanionSettingsEqual(left: CompanionSettings, right: CompanionSettings): boolean {
  return areCompanionValuesEqual(left, right);
}
