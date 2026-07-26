import fs from 'node:fs';
import path from 'node:path';
import {
  APP_SETTINGS_KEY,
  normalizeAppSettings,
  normalizeObsidianTemplateSettings,
  type AppBehaviorSettings,
  type ObsidianTemplateSettings,
} from '../shared/appSettings';
import {
  AI_REVIEW_SETTINGS_KEY,
  normalizeAiReviewSettings,
  type AiReviewSettings,
} from '../shared/aiReview/aiReviewSettings';
import { normalizeCompanionSettings } from '../shared/obsidianCompanionDefaults';
import type { CompanionSettings } from '../shared/obsidianCompanion';
import { RENDERER_STORE_KEYS } from '../shared/rendererStoreKeys';
import { filterValidTasks } from '../shared/taskValidation';
import { isObjectRecord } from '../shared/unknownValueGuards';
import type { SectionConfig } from '../shared/aiReview/sectionConfig';
import type { ElectronStoreLike } from './sharedTypes';

export const BACKUP_FORMAT = 'dailytodo-logical-backup';
export const BACKUP_FORMAT_VERSION = 2;
export const BACKUP_DIRECTORY_NAME = 'backups';

const COMPANION_SETTINGS_KEY = 'obsidianCompanionSettings';
const AI_REVIEW_SECTIONS_KEY = 'aiReviewSections';
const DAILY_REVIEW_BATCHES_KEY = 'dailyReviewBatches';
const MAIN_STORE_KEYS = ['windowState', 'compactMode', 'autoStart'] as const;
const UI_PREFERENCE_KEYS = new Set([
  'activeTab',
  'lastActiveDay',
  'selectedDate',
  'dailyWorkOpen',
  'dailyInspirationOpen',
  'taskSearchQuery',
  'taskSearchOpen',
  'taskOpenOnly',
  'taskPriorityFilter',
  'personalizationSettings',
  'themeOpacityOverrides',
  'isDark',
]);

type BackupKind = 'automatic' | 'pre-restore' | 'export';

export type DailyTodoBackupArtifact = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_FORMAT_VERSION;
  createdAt: string;
  kind: BackupKind;
  state: DailyTodoBackupState;
};

type DailyTodoBackupState = {
  rendererState: Record<string, unknown>;
  uiPreferences: Record<string, unknown>;
  appSettings: AppBehaviorSettings;
  integrations: { companionSettings: CompanionSettings };
  templates: { obsidian: ObsidianTemplateSettings };
  aiReview: {
    settings: AiReviewSettings;
    sections: SectionConfig[];
    dailyBatches: unknown;
  };
  mainState: Record<string, unknown>;
};

type LegacyBackupArtifact = {
  format?: unknown;
  version?: unknown;
  createdAt?: unknown;
  kind?: unknown;
  state?: unknown;
};

export type BackupPreview = {
  version: typeof BACKUP_FORMAT_VERSION;
  createdAt: string;
  kind: BackupKind;
  taskCount: number;
  hasUiPreferences: boolean;
  hasDailyReviewBatches: boolean;
};

type CreateBackupServiceOptions = {
  store: ElectronStoreLike;
  backupDirectory: string;
  getAppSettings(): AppBehaviorSettings;
  setAppSettings(value: unknown): AppBehaviorSettings;
  getObsidianTemplateSettings(): ObsidianTemplateSettings;
  setObsidianTemplateSettings(value: unknown): ObsidianTemplateSettings;
  getCompanionSettings(): CompanionSettings;
  setCompanionSettings(value: unknown): void;
  getAiReviewSettings(): AiReviewSettings;
  setAiReviewSettings(value: unknown): AiReviewSettings;
  getReviewSections(): SectionConfig[];
  setReviewSections(value: unknown): SectionConfig[];
  now?(): Date;
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readRecord(value: unknown): Record<string, unknown> {
  return isObjectRecord(value) ? value : {};
}

function readBackupKind(value: unknown): BackupKind {
  return value === 'automatic' || value === 'pre-restore' || value === 'export' ? value : 'export';
}

function redactAiReviewSettings(settings: AiReviewSettings): AiReviewSettings {
  return {
    ...settings,
    apiKey: '',
    profiles: settings.profiles.map((profile) => ({ ...profile, apiKey: '' })),
  };
}

function redactObsidianTemplateSettings(settings: ObsidianTemplateSettings): ObsidianTemplateSettings {
  return { ...settings, obsidianPath: '' };
}

function redactCompanionSettings(settings: CompanionSettings): CompanionSettings {
  return { ...settings, vaultPath: '', mobileInboxPath: '' };
}

function isSafeRendererValue(key: string, value: unknown): boolean {
  if (key === 'tasks') return Array.isArray(value) && filterValidTasks(value).length === value.length;
  return value === undefined || isObjectRecord(value) || Array.isArray(value)
    || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number';
}

function normalizeRendererState(value: unknown): Record<string, unknown> {
  const source = readRecord(value);
  const state: Record<string, unknown> = {};
  for (const key of RENDERER_STORE_KEYS) {
    const entry = source[key];
    if (!isSafeRendererValue(key, entry)) continue;
    if (key === 'tasks') {
      state[key] = filterValidTasks(entry);
      continue;
    }
    if (entry !== undefined) state[key] = cloneJson(entry);
  }
  return state;
}

function splitRendererState(state: Record<string, unknown>) {
  const rendererState: Record<string, unknown> = {};
  const uiPreferences: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(state)) {
    if (UI_PREFERENCE_KEYS.has(key)) uiPreferences[key] = value;
    else rendererState[key] = value;
  }
  return { rendererState, uiPreferences };
}

function normalizeMainState(value: unknown): Record<string, unknown> {
  const source = readRecord(value);
  const state: Record<string, unknown> = {};
  for (const key of MAIN_STORE_KEYS) {
    const entry = source[key];
    if (entry !== undefined) state[key] = cloneJson(entry);
  }
  return state;
}

function isDailyTodoBackupArtifact(value: unknown): value is DailyTodoBackupArtifact {
  if (!isObjectRecord(value)) return false;
  const state = readRecord(value.state);
  return (
    value.format === BACKUP_FORMAT
    && value.version === BACKUP_FORMAT_VERSION
    && typeof value.createdAt === 'string'
    && (value.kind === 'automatic' || value.kind === 'pre-restore' || value.kind === 'export')
    && isObjectRecord(state.rendererState)
    && isObjectRecord(state.uiPreferences)
    && isObjectRecord(state.appSettings)
    && isObjectRecord(state.integrations)
    && isObjectRecord(state.templates)
    && isObjectRecord(state.aiReview)
    && isObjectRecord(state.mainState)
  );
}

function migrateArtifact(value: unknown): DailyTodoBackupArtifact {
  const candidate = value as LegacyBackupArtifact;
  if (!isObjectRecord(candidate) || candidate.format !== BACKUP_FORMAT) {
    throw new Error('Invalid DailyTodo backup artifact.');
  }
  if (candidate.version === BACKUP_FORMAT_VERSION && isDailyTodoBackupArtifact(candidate)) {
    return cloneJson(candidate);
  }
  if (candidate.version !== 1 || !isObjectRecord(candidate.state) || typeof candidate.createdAt !== 'string') {
    throw new Error('Invalid DailyTodo backup artifact.');
  }

  const legacyState = candidate.state;
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_FORMAT_VERSION,
    createdAt: candidate.createdAt,
    kind: readBackupKind(candidate.kind),
    state: {
      rendererState: readRecord(legacyState.rendererState),
      uiPreferences: readRecord(legacyState.uiPreferences),
      appSettings: normalizeAppSettings(legacyState.appSettings),
      integrations: {
        companionSettings: redactCompanionSettings(normalizeCompanionSettings(
          readRecord(legacyState.integrations).companionSettings,
          '',
        )),
      },
      templates: {
        obsidian: redactObsidianTemplateSettings(normalizeObsidianTemplateSettings(
          readRecord(legacyState.templates).obsidian,
        )),
      },
      aiReview: {
        settings: redactAiReviewSettings(normalizeAiReviewSettings(readRecord(legacyState.aiReview).settings)),
        sections: Array.isArray(readRecord(legacyState.aiReview).sections)
          ? cloneJson(readRecord(legacyState.aiReview).sections as SectionConfig[])
          : [],
        dailyBatches: cloneJson(readRecord(legacyState.aiReview).dailyBatches),
      },
      mainState: readRecord(legacyState.mainState),
    },
  };
}

function backupFileName(kind: BackupKind, date: Date) {
  const timestamp = date.toISOString().replace(/[:.]/g, '-');
  return `${kind}-${timestamp}.dailytodo-backup.json`;
}

function writeArtifact(directory: string, artifact: DailyTodoBackupArtifact): string {
  fs.mkdirSync(directory, { recursive: true });
  const filePath = path.join(directory, backupFileName(artifact.kind, new Date(artifact.createdAt)));
  fs.writeFileSync(filePath, JSON.stringify(artifact, null, 2), 'utf8');
  return filePath;
}

function retainNewestAutomaticBackups(directory: string): void {
  const automaticBackups = fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.startsWith('automatic-') && entry.name.endsWith('.dailytodo-backup.json'))
    .map((entry) => ({ path: path.join(directory, entry.name), modifiedAt: fs.statSync(path.join(directory, entry.name)).mtimeMs }))
    .sort((left, right) => right.modifiedAt - left.modifiedAt);
  for (const backup of automaticBackups.slice(3)) fs.unlinkSync(backup.path);
}

export function createBackupService({
  store,
  backupDirectory,
  getAppSettings,
  setAppSettings,
  getObsidianTemplateSettings,
  setObsidianTemplateSettings,
  getCompanionSettings,
  setCompanionSettings,
  getAiReviewSettings,
  setAiReviewSettings,
  getReviewSections,
  setReviewSections,
  now = () => new Date(),
}: CreateBackupServiceOptions) {
  function createArtifact(kind: BackupKind): DailyTodoBackupArtifact {
    const rendererEntries: Record<string, unknown> = {};
    for (const key of RENDERER_STORE_KEYS) rendererEntries[key] = store.get(key);
    const mainEntries: Record<string, unknown> = {};
    for (const key of MAIN_STORE_KEYS) mainEntries[key] = store.get(key);
    const { rendererState, uiPreferences } = splitRendererState(normalizeRendererState(rendererEntries));

    return {
      format: BACKUP_FORMAT,
      version: BACKUP_FORMAT_VERSION,
      createdAt: now().toISOString(),
      kind,
      state: {
        rendererState,
        uiPreferences,
        appSettings: cloneJson(normalizeAppSettings(getAppSettings())),
        integrations: { companionSettings: redactCompanionSettings(getCompanionSettings()) },
        templates: { obsidian: redactObsidianTemplateSettings(getObsidianTemplateSettings()) },
        aiReview: {
          settings: redactAiReviewSettings(getAiReviewSettings()),
          sections: cloneJson(getReviewSections()),
          dailyBatches: cloneJson(store.get(DAILY_REVIEW_BATCHES_KEY) || {}),
        },
        mainState: normalizeMainState(mainEntries),
      },
    };
  }

  function createAutomaticRecoveryPoint(): string | undefined {
    const date = now().toISOString().slice(0, 10);
    const hasToday = fs.existsSync(backupDirectory) && fs.readdirSync(backupDirectory)
      .some((entry) => entry.startsWith(`automatic-${date}`));
    if (hasToday) return undefined;
    const filePath = writeArtifact(backupDirectory, createArtifact('automatic'));
    retainNewestAutomaticBackups(backupDirectory);
    return filePath;
  }

  function exportArtifact(targetPath: string): string {
    const artifact = createArtifact('export');
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, JSON.stringify(artifact, null, 2), 'utf8');
    return targetPath;
  }

  function previewArtifact(value: unknown): BackupPreview {
    const artifact = migrateArtifact(value);
    const tasks = filterValidTasks(artifact.state.rendererState.tasks);
    return {
      version: artifact.version,
      createdAt: artifact.createdAt,
      kind: artifact.kind,
      taskCount: tasks.length,
      hasUiPreferences: Object.keys(artifact.state.uiPreferences).length > 0,
      hasDailyReviewBatches: Object.keys(readRecord(artifact.state.aiReview.dailyBatches)).length > 0,
    };
  }

  function readArtifactFile(filePath: string): DailyTodoBackupArtifact {
    try {
      return migrateArtifact(JSON.parse(fs.readFileSync(filePath, 'utf8')));
    } catch {
      throw new Error('Invalid DailyTodo backup artifact.');
    }
  }

  function restoreArtifact(
    value: unknown,
    options: { createRecoveryPoint?: boolean } = {},
  ): { recoveryPath?: string } {
    const artifact = migrateArtifact(value);
    const recoveryPath = options.createRecoveryPoint === true
      ? writeArtifact(backupDirectory, createArtifact('pre-restore'))
      : undefined;
    const rendererState = normalizeRendererState({
      ...artifact.state.rendererState,
      ...artifact.state.uiPreferences,
    });
    for (const key of RENDERER_STORE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(rendererState, key)) store.set(key, rendererState[key]);
    }
    for (const [key, entry] of Object.entries(normalizeMainState(artifact.state.mainState))) {
      store.set(key, entry);
    }
    setAppSettings(artifact.state.appSettings);
    setObsidianTemplateSettings(redactObsidianTemplateSettings(artifact.state.templates.obsidian));
    setCompanionSettings(redactCompanionSettings(artifact.state.integrations.companionSettings));
    setAiReviewSettings(redactAiReviewSettings(artifact.state.aiReview.settings));
    setReviewSections(artifact.state.aiReview.sections);
    store.set(DAILY_REVIEW_BATCHES_KEY, cloneJson(readRecord(artifact.state.aiReview.dailyBatches)));
    return { recoveryPath };
  }

  return {
    backupDirectory,
    createArtifact,
    createAutomaticRecoveryPoint,
    exportArtifact,
    previewArtifact,
    readArtifactFile,
    restoreArtifact,
  };
}

export const BACKUP_STORE_KEYS = {
  appSettings: APP_SETTINGS_KEY,
  aiReviewSettings: AI_REVIEW_SETTINGS_KEY,
  companionSettings: COMPANION_SETTINGS_KEY,
  aiReviewSections: AI_REVIEW_SECTIONS_KEY,
  dailyReviewBatches: DAILY_REVIEW_BATCHES_KEY,
};
