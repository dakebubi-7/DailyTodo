import { app, dialog, ipcMain, shell, type BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { resolveActiveProfile, type AiReviewSettings } from '../shared/aiReview/aiReviewSettings';
import {
  buildRecognizeObsidianTemplateMessages,
  parseRecognizedObsidianTemplateDraft,
  validateObsidianTemplateRecognitionInput,
} from '../shared/obsidianTemplateRecognition';
import type { ChatMessage, LlmResult } from '../shared/llm/openaiClient';
import type { ElectronStoreLike, VaultStatus } from './sharedTypes';

type RegisterObsidianIpcHandlersOptions = {
  win: BrowserWindow;
  store: ElectronStoreLike;
  obsidianPathKey: string;
  getDefaultVaultPath(): string | undefined;
  getVaultPath(): string | undefined;
  getVaultStatus(): VaultStatus;
  getAiReviewSettings(): AiReviewSettings;
  getLlmCaller(): (messages: ChatMessage[]) => Promise<LlmResult>;
  syncTasksToObsidian(tasks: unknown, date?: unknown, dailyWork?: unknown, inspiration?: unknown, beforeTasks?: unknown): unknown;
  previewTasksToObsidian(tasks: unknown, date?: unknown, dailyWork?: unknown, inspiration?: unknown, beforeTasks?: unknown): unknown;
  getDateKey(date?: string): string;
  getDailyFilePath(date?: string): string;
  buildDailyTemplate(date: string): string;
  triggerOverviewUpdate(filePath: string): void;
  zh(text: string): string;
};

export function registerObsidianIpcHandlers({
  win,
  store,
  obsidianPathKey,
  getDefaultVaultPath,
  getVaultPath,
  getVaultStatus,
  getAiReviewSettings,
  getLlmCaller,
  syncTasksToObsidian,
  previewTasksToObsidian,
  getDateKey,
  getDailyFilePath,
  buildDailyTemplate,
  triggerOverviewUpdate,
  zh,
}: RegisterObsidianIpcHandlersOptions): void {
  const getStoredObsidianPath = () => {
    const storedPath = store.get(obsidianPathKey);
    return typeof storedPath === 'string' ? storedPath : getDefaultVaultPath();
  };

  ipcMain.handle('obsidianTemplate:recognize', async (_event, rawTemplate: unknown) => {
    const input = validateObsidianTemplateRecognitionInput(rawTemplate);
    if (!input.ok) return { ok: false, error: input.error, draft: null };

    const settings = getAiReviewSettings();
    if (!settings.enabled || !resolveActiveProfile(settings).apiKey) {
      return { ok: false, error: 'AI 澶嶇洏鏈惎鐢ㄦ垨缂哄皯 Key', draft: null };
    }

    const llm = await getLlmCaller()(buildRecognizeObsidianTemplateMessages(input.rawTemplate));
    if (!llm.ok) return { ok: false, error: llm.error, draft: null };

    const draft = parseRecognizedObsidianTemplateDraft(llm.content);
    return { ok: true, draft };
  });

  ipcMain.handle('obsidianTemplate:pickTemplateFile', async () => {
    const result = await dialog.showOpenDialog(win, {
      title: zh('\u9009\u62e9 Obsidian \u6a21\u677f\u6587\u4ef6\uff08.md\uff09'),
      defaultPath: getVaultPath() || app.getPath('documents'),
      properties: ['openFile'],
      filters: [{ name: zh('Markdown \u6a21\u677f'), extensions: ['md'] }],
    });
    if (result.canceled || !result.filePaths[0]) return { ok: false, canceled: true };

    const filePath = result.filePaths[0];
    if (typeof filePath !== 'string') {
      return { ok: false, error: zh('Template path must be a string.') };
    }
    const fileName = path.basename(filePath);
    try {
      if (!fs.statSync(filePath).isFile()) {
        return { ok: false, error: zh('Template path must be a file.') };
      }
      const text = fs.readFileSync(filePath, 'utf-8').trim();
      if (!text) return { ok: false, error: '\u6587\u4ef6\u5185\u5bb9\u4e3a\u7a7a' };
      return { ok: true, text, fileName };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('obsidian:getPath', () => getStoredObsidianPath());

  ipcMain.handle('obsidian:choosePath', async () => {
    const result = await dialog.showOpenDialog(win, {
      title: zh('\u9009\u62e9 Obsidian \u4ed3\u5e93\u6216\u7528\u4e8e\u4fdd\u5b58\u6bcf\u65e5\u4efb\u52a1\u7684\u6587\u4ef6\u5939'),
      defaultPath: getVaultPath() || app.getPath('documents'),
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || !result.filePaths[0]) {
      return getStoredObsidianPath();
    }

    const filePath = result.filePaths[0];
    if (typeof filePath !== 'string') {
      return getStoredObsidianPath();
    }
    store.set(obsidianPathKey, filePath);
    return filePath;
  });

  ipcMain.handle('obsidian:syncTasks', (_event, tasks: unknown, date?: unknown, dailyWork?: unknown, inspiration?: unknown, beforeTasks?: unknown) => {
    return syncTasksToObsidian(
      tasks,
      date,
      dailyWork === undefined ? '' : dailyWork,
      inspiration === undefined ? '' : inspiration,
      beforeTasks,
    );
  });

  ipcMain.handle('obsidian:previewTasks', (_event, tasks: unknown, date?: unknown, dailyWork?: unknown, inspiration?: unknown, beforeTasks?: unknown) => {
    return previewTasksToObsidian(
      tasks,
      date,
      dailyWork === undefined ? '' : dailyWork,
      inspiration === undefined ? '' : inspiration,
      beforeTasks,
    );
  });

  ipcMain.handle('obsidian:openDailyNote', async (_event, date?: unknown) => {
    const vaultStatus = getVaultStatus();
    if (!vaultStatus.ok || !vaultStatus.vaultPath) return { ok: false, reason: vaultStatus.reason };
    if (date !== undefined && typeof date !== 'string') {
      return { ok: false, reason: zh('Selected date input must be a string.') };
    }

    const selected = getDateKey(date);
    const filePath = getDailyFilePath(selected);
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      if (fs.existsSync(filePath)) {
        if (!fs.statSync(filePath).isFile()) {
          return { ok: false, reason: zh('Daily note target must be a file.') };
        }
      } else {
        fs.writeFileSync(filePath, buildDailyTemplate(selected), 'utf-8');
      }
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : String(error) };
    }
    triggerOverviewUpdate(filePath);
    const result = await shell.openPath(filePath);
    return result ? { ok: false, reason: result } : { ok: true, filePath };
  });
}
