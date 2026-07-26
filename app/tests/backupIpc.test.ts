import { describe, expect, it, vi } from 'vitest';

const { handlers, handle } = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  const handle = vi.fn((channel: string, listener: (...args: unknown[]) => unknown) => {
    handlers.set(channel, listener);
  });
  return { handlers, handle };
});

vi.mock('electron', () => ({ ipcMain: { handle } }));

import { registerBackupIpcHandlers } from '../electron/backupIpc';

describe('backup IPC', () => {
  it('keeps artifact paths in the main process while previewing and confirming a restore', async () => {
    const readArtifactFile = vi.fn().mockReturnValue({ format: 'dailytodo-logical-backup' });
    const previewArtifact = vi.fn().mockReturnValue({ taskCount: 2, version: 2 });
    const restoreArtifact = vi.fn().mockReturnValue({ recoveryPath: 'C:/app/backups/pre-restore.json' });
    const relaunch = vi.fn();
    const quit = vi.fn();
    registerBackupIpcHandlers({
      backup: {
        backupDirectory: 'C:/app/backups',
        exportArtifact: vi.fn(),
        readArtifactFile,
        previewArtifact,
        restoreArtifact,
      },
      chooseRestoreFile: vi.fn().mockResolvedValue('C:/user/Downloads/backup.dailytodo-backup.json'),
      chooseExportFile: vi.fn(),
      openBackupDirectory: vi.fn().mockResolvedValue(''),
      relaunch,
      quit,
      createToken: () => 'restore-token',
    });

    const chooseRestore = handlers.get('backup:chooseRestore');
    const restore = handlers.get('backup:restore');
    expect(chooseRestore).toEqual(expect.any(Function));
    expect(restore).toEqual(expect.any(Function));

    await expect(chooseRestore?.({})).resolves.toEqual({
      ok: true,
      token: 'restore-token',
      preview: { taskCount: 2, version: 2 },
    });
    expect(readArtifactFile).toHaveBeenCalledWith('C:/user/Downloads/backup.dailytodo-backup.json');
    expect(previewArtifact).toHaveBeenCalledWith({ format: 'dailytodo-logical-backup' });

    await expect(restore?.({}, { token: 'restore-token', confirmed: false })).resolves.toEqual({ ok: false });
    expect(restoreArtifact).not.toHaveBeenCalled();

    await expect(restore?.({}, { token: 'restore-token', confirmed: true, path: 'C:/attacker.json' })).resolves.toEqual({
      ok: true,
    });
    expect(restoreArtifact).toHaveBeenCalledWith({ format: 'dailytodo-logical-backup' }, { createRecoveryPoint: true });
    expect(relaunch).toHaveBeenCalledOnce();
    expect(quit).toHaveBeenCalledOnce();
  });

  it('exports through a main-process picker and returns no filesystem path to the renderer', async () => {
    const exportArtifact = vi.fn();
    registerBackupIpcHandlers({
      backup: {
        backupDirectory: 'C:/app/backups',
        exportArtifact,
        readArtifactFile: vi.fn(),
        previewArtifact: vi.fn(),
        restoreArtifact: vi.fn(),
      },
      chooseRestoreFile: vi.fn(),
      chooseExportFile: vi.fn().mockResolvedValue('C:/user/Downloads/daily.dailytodo-backup.json'),
      openBackupDirectory: vi.fn().mockResolvedValue(''),
      relaunch: vi.fn(),
      quit: vi.fn(),
      createToken: () => 'unused',
    });

    const exportHandler = handlers.get('backup:export');
    await expect(exportHandler?.({})).resolves.toEqual({ ok: true });
    expect(exportArtifact).toHaveBeenCalledWith('C:/user/Downloads/daily.dailytodo-backup.json');
  });
});
