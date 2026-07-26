import { ipcMain } from 'electron';
import type { DailyTodoBackupArtifact } from './backupService';

type BackupServiceLike = {
  backupDirectory: string;
  exportArtifact(targetPath: string): string;
  readArtifactFile(filePath: string): DailyTodoBackupArtifact;
  previewArtifact(value: unknown): unknown;
  restoreArtifact(
    value: unknown,
    options?: { createRecoveryPoint?: boolean },
  ): { recoveryPath?: string };
};

type RegisterBackupIpcHandlersOptions = {
  backup: BackupServiceLike;
  chooseRestoreFile(): Promise<string | undefined>;
  chooseExportFile(): Promise<string | undefined>;
  openBackupDirectory(): Promise<string>;
  relaunch(): void;
  quit(): void;
  createToken(): string;
};

function readRestoreRequest(value: unknown): { token: string; confirmed: boolean } | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const request = value as Record<string, unknown>;
  return typeof request.token === 'string' && request.confirmed === true
    ? { token: request.token, confirmed: true }
    : undefined;
}

export function registerBackupIpcHandlers({
  backup,
  chooseRestoreFile,
  chooseExportFile,
  openBackupDirectory,
  relaunch,
  quit,
  createToken,
}: RegisterBackupIpcHandlersOptions): void {
  const pendingRestores = new Map<string, DailyTodoBackupArtifact>();

  ipcMain.handle('backup:chooseRestore', async () => {
    const filePath = await chooseRestoreFile();
    if (!filePath) return { ok: false };
    try {
      const artifact = backup.readArtifactFile(filePath);
      const token = createToken();
      pendingRestores.set(token, artifact);
      return { ok: true, token, preview: backup.previewArtifact(artifact) };
    } catch {
      return { ok: false, error: 'The selected backup could not be validated.' };
    }
  });

  ipcMain.handle('backup:restore', async (_event, request: unknown) => {
    const confirmation = readRestoreRequest(request);
    if (!confirmation) return { ok: false };
    const artifact = pendingRestores.get(confirmation.token);
    if (!artifact) return { ok: false, error: 'The restore confirmation expired.' };
    pendingRestores.delete(confirmation.token);
    try {
      backup.restoreArtifact(artifact, { createRecoveryPoint: true });
      relaunch();
      quit();
      return { ok: true };
    } catch {
      return { ok: false, error: 'DailyTodo could not restore this backup.' };
    }
  });

  ipcMain.handle('backup:export', async () => {
    const targetPath = await chooseExportFile();
    if (!targetPath) return { ok: false };
    try {
      backup.exportArtifact(targetPath);
      return { ok: true };
    } catch {
      return { ok: false, error: 'DailyTodo could not export this backup.' };
    }
  });

  ipcMain.handle('backup:openFolder', async () => {
    await openBackupDirectory();
    return { ok: true };
  });
}
