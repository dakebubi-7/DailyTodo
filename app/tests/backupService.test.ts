import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  createBackupService,
} from '../electron/backupService';

const temporaryDirectories: string[] = [];

function createTemporaryDirectory() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-backup-test-'));
  temporaryDirectories.push(directory);
  return directory;
}

function createStore(initial: Record<string, unknown>) {
  const values = new Map(Object.entries(initial));
  return {
    get: vi.fn((key: string) => values.get(key)),
    set: vi.fn((key: string, value: unknown) => values.set(key, value)),
    snapshot: () => Object.fromEntries(values),
  };
}

function createTask(id: string) {
  return {
    id,
    text: `Task ${id}`,
    completed: false,
    priority: 'high' as const,
    createdAt: '2026-07-25T08:00:00.000Z',
    taskDate: '2026-07-25',
    isToday: true,
    completionReviews: [{
      id: `${id}-review`,
      status: 'partial' as const,
      percent: 60,
      summary: 'Drafted the first version',
      unknowns: '',
      nextStep: 'Review the legal wording',
      reviewedAt: '2026-07-25T17:00:00.000Z',
    }],
  };
}

function createService(store: ReturnType<typeof createStore>, directory: string) {
  return createBackupService({
    store,
    backupDirectory: directory,
    getAppSettings: () => ({ language: 'en-US', rolloverTime: '05:00' }),
    setAppSettings: (value) => store.set('appBehaviorSettings', value),
    getObsidianTemplateSettings: () => ({
      obsidianPath: 'C:/Personal/Vault',
      dailyPath: 'logs/daily/{{date}}.md',
      weeklyPath: 'logs/weekly/{{week}}.md',
      monthlyPath: 'logs/monthly/{{month}}.md',
      externalWeeklyPath: 'logs/external-weekly/{{week}}.md',
      externalMonthlyPath: 'logs/external-monthly/{{month}}.md',
      dailyTemplate: { blocks: [] },
      weeklyTemplate: { blocks: [] },
      monthlyTemplate: { blocks: [] },
      externalWeeklyTemplate: { blocks: [] },
      externalMonthlyTemplate: { blocks: [] },
    }),
    setObsidianTemplateSettings: (value) => store.set('obsidianTemplateSettings', value),
    getCompanionSettings: () => ({
      vaultPath: 'C:/Personal/Vault',
      mobileInboxPath: 'C:/Personal/Inbox',
      presetId: 'default',
      syncMode: 'manual' as const,
      previewBeforeWrite: true,
      rules: [],
      templates: [],
    }),
    setCompanionSettings: (value) => store.set('obsidianCompanionSettings', value),
    getAiReviewSettings: () => ({
      enabled: true,
      apiKey: 'top-level-secret',
      profiles: [{ id: 'main', apiKey: 'profile-secret' }],
    }),
    setAiReviewSettings: (value) => store.set('aiReviewSettings', value),
    getReviewSections: () => [{ id: 'daily', label: 'Daily', prompt: 'Summarize' }],
    setReviewSections: (value) => store.set('aiReviewSections', value),
    now: () => new Date('2026-07-26T08:30:00.000Z'),
  });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('backup service', () => {
  it('round-trips logical local state while redacting credentials and Obsidian paths', () => {
    const directory = createTemporaryDirectory();
    const sourceStore = createStore({
      tasks: [createTask('source-task')],
      taskCarryoverLedger: { '2026-07-26': ['source-task'] },
      taskListOrderByDate: { '2026-07-26': ['source-task'] },
      personalizationSettings: { theme: 'watercolor' },
      dailyReviewBatches: { '2026-07-25': { sourceDate: '2026-07-25', items: [] } },
      windowState: { x: 10, y: 20, width: 420, height: 620 },
      compactMode: true,
    });
    const source = createService(sourceStore, directory);

    const artifact = source.createArtifact('export');

    expect(artifact).toMatchObject({
      format: BACKUP_FORMAT,
      version: BACKUP_FORMAT_VERSION,
      state: {
        rendererState: {
          tasks: [expect.objectContaining({ id: 'source-task' })],
          taskCarryoverLedger: { '2026-07-26': ['source-task'] },
        },
        uiPreferences: {
          personalizationSettings: { theme: 'watercolor' },
        },
        integrations: {
          companionSettings: expect.objectContaining({ vaultPath: '', mobileInboxPath: '' }),
        },
        templates: {
          obsidian: expect.objectContaining({ obsidianPath: '' }),
        },
        aiReview: {
          settings: expect.objectContaining({ apiKey: '', profiles: [{ id: 'main', apiKey: '' }] }),
        },
      },
    });
    expect(JSON.stringify(artifact)).not.toContain('secret');
    expect(JSON.stringify(artifact)).not.toContain('C:/Personal');

    const restoredStore = createStore({ tasks: [createTask('old-task')] });
    const restored = createService(restoredStore, directory);
    restored.restoreArtifact(artifact);

    expect(restoredStore.snapshot()).toMatchObject({
      tasks: [expect.objectContaining({ id: 'source-task' })],
      taskCarryoverLedger: { '2026-07-26': ['source-task'] },
      taskListOrderByDate: { '2026-07-26': ['source-task'] },
      personalizationSettings: { theme: 'watercolor' },
      dailyReviewBatches: { '2026-07-25': { sourceDate: '2026-07-25', items: [] } },
      compactMode: true,
      appBehaviorSettings: { language: 'en-US', rolloverTime: '05:00' },
      obsidianTemplateSettings: expect.objectContaining({ obsidianPath: '' }),
      obsidianCompanionSettings: expect.objectContaining({ vaultPath: '', mobileInboxPath: '' }),
      aiReviewSettings: expect.objectContaining({ apiKey: '' }),
    });
  });

  it('rejects malformed artifacts before any state is replaced', () => {
    const directory = createTemporaryDirectory();
    const store = createStore({ tasks: [createTask('current-task')] });
    const service = createService(store, directory);

    expect(() => service.restoreArtifact({ format: BACKUP_FORMAT, version: BACKUP_FORMAT_VERSION })).toThrow(
      'Invalid DailyTodo backup artifact.',
    );
    expect(store.snapshot().tasks).toEqual([createTask('current-task')]);
  });

  it('creates a recovery snapshot immediately before replacing local state', () => {
    const directory = createTemporaryDirectory();
    const store = createStore({ tasks: [createTask('before-restore')] });
    const service = createService(store, directory);
    const artifact = createService(createStore({ tasks: [createTask('replacement')] }), directory)
      .createArtifact('export');

    const result = service.restoreArtifact(artifact, { createRecoveryPoint: true });

    expect(result.recoveryPath).toBeDefined();
    expect(store.snapshot().tasks).toEqual([createTask('replacement')]);
    const recovery = JSON.parse(fs.readFileSync(result.recoveryPath!, 'utf8'));
    expect(recovery.state.rendererState.tasks).toEqual([createTask('before-restore')]);
  });

  it('migrates a version-one artifact before previewing or restoring it', () => {
    const directory = createTemporaryDirectory();
    const sourceStore = createStore({ tasks: [createTask('legacy-task')] });
    const source = createService(sourceStore, directory);
    const current = source.createArtifact('export');
    const legacy = {
      ...current,
      version: 1,
      state: {
        ...current.state,
        uiPreferences: undefined,
      },
    };

    const preview = source.previewArtifact(legacy);

    expect(preview).toMatchObject({
      version: BACKUP_FORMAT_VERSION,
      taskCount: 1,
      hasUiPreferences: false,
    });
  });
});
