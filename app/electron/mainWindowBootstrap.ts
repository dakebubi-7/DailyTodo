import type { BrowserWindow } from 'electron';
import type { AppBehaviorSettings, ObsidianTemplateSettings } from '../shared/appSettings';
import type {
  AiReviewProfileResolution,
  AiReviewReportKind,
  AiReviewSettings,
} from '../shared/aiReview/aiReviewSettings';
import type {
  AiReviewRunDiagnostic,
  AiReviewRunFinalStatus,
  AiReviewRunReportKind,
  AiReviewStageDiagnostic,
} from '../shared/aiReview/runDiagnostics';
import type { SectionConfig } from '../shared/aiReview/sectionConfig';
import type { DailySourceRule } from '../shared/aiReview/sourceMaterials';
import type { ChatMessage, LlmResult } from '../shared/llm/openaiClient';
import type { CompanionSettings } from '../shared/obsidianCompanion';
import type { RendererRoute } from '../shared/rendererRoute';
import type { WindowMode } from '../shared/windowMode';
import { type SetupMainBrowserWindowOptions } from './mainWindowFactory';
import { registerMainWindowEventHandlers } from './mainWindowEvents';
import {
  createMainWindowIpcRegistrations,
  type TaskMenuPayload,
} from './mainWindowIpcRegistration';
import type { PersistWindowStateOptions } from './mainWindowPersistence';
import type { SettingsModeState } from './settingsModeState';
import type { UserHiddenState } from './userHiddenState';
import type {
  ElectronStoreLike,
  ElectronTask,
  InspectDailyResult,
  VaultStatus,
} from './sharedTypes';

type EnsureReportLlmAvailableResult =
  | {
    ok: true;
    callLlm(messages: ChatMessage[]): Promise<LlmResult>;
    resolution: AiReviewProfileResolution;
  }
  | {
    ok: false;
    error: string;
    resolution: AiReviewProfileResolution;
  };

export type CreateMainWindowBootstrapOptions = {
  win: BrowserWindow;
  store: ElectronStoreLike;
  diag(message: string): void;
  scheduleAiTimers(): void;
  createTray(): void;
  loadRenderer(win: BrowserWindow, route: RendererRoute): void;
  getTaskMenuWindow(): BrowserWindow | null;
  openTaskMenuWindow(payload: TaskMenuPayload): void;
  closeTaskMenuWindow(): void;
  getTaskMenuPayload(): import('./taskContextMenuIpc').TaskMenuPayload | null;
  setTaskMenuPayload(payload: import('./taskContextMenuIpc').TaskMenuPayload | null): void;
  getMainWindow(): BrowserWindow | null;
  stopDesktopGuard(): void;
  userHidden: Pick<UserHiddenState, 'isHidden'>;
  getWindowMode(): WindowMode;
  isQuitting(): boolean;
  hideMainWindow(): void;
  getAppSettings(): AppBehaviorSettings;
  markQuitting(): void;
  persistWindowState(win: BrowserWindow, options?: PersistWindowStateOptions): void;
  compactModeKey: string;
  autoStartKey: string;
  settingsMode: SettingsModeState;
  setWindowMode(win: BrowserWindow, mode: WindowMode): void;
  setAppSettings(value: unknown): AppBehaviorSettings;
  reapplyWindowZOrder(win: BrowserWindow): void;
  getCompanionSettings(): CompanionSettings;
  setCompanionSettings(settings: unknown): void;
  getAiReviewSettings(): AiReviewSettings;
  setAiReviewSettings(value: unknown): AiReviewSettings;
  getObsidianTemplateSettings(): ObsidianTemplateSettings;
  setObsidianTemplateSettings(value: unknown): ObsidianTemplateSettings;
  getReviewSections(): SectionConfig[];
  setReviewSections(value: unknown): SectionConfig[];
  runReviewForDate(date: string, tasks: ElectronTask[], force?: boolean): unknown;
  inspectDailyAiContent(date: string): InspectDailyResult;
  getDateKey(date?: unknown): string;
  getVaultPath(): string | undefined;
  getVaultStatus(): VaultStatus;
  getDailyFilePath(date?: string): string;
  buildDailySourceRules(dailyPath: string): DailySourceRule[];
  getDailySourceRules(): DailySourceRule[];
  getLlmCaller(): (messages: ChatMessage[]) => Promise<LlmResult>;
  ensureReportLlmAvailable(reportKind: AiReviewReportKind): EnsureReportLlmAvailableResult;
  emitAiReviewProgress(
    reportKind: AiReviewRunReportKind,
    key: AiReviewStageDiagnostic['key'],
    label: string,
    status: AiReviewStageDiagnostic['status'],
    message?: string,
  ): void;
  stage(
    key: AiReviewStageDiagnostic['key'],
    label: string,
    status: AiReviewStageDiagnostic['status'],
    durationMs?: number,
    message?: string,
  ): AiReviewStageDiagnostic;
  createDiagnostic(params: {
    reportKind: AiReviewRunReportKind;
    startedAt: number;
    finalStatus: AiReviewRunFinalStatus;
    resolution?: AiReviewProfileResolution;
    stages: AiReviewStageDiagnostic[];
    llmResults?: LlmResult[];
    sourceChars?: number;
    error?: string;
  }): AiReviewRunDiagnostic;
  extractDocxText(buffer: Buffer): Promise<string>;
  zh(text: string): string;
  obsidianPathKey: string;
  getDefaultVaultPath(): string | undefined;
  syncTasksToObsidian(tasks: unknown, date?: unknown, dailyWork?: unknown, inspiration?: unknown, beforeTasks?: unknown): unknown;
  previewTasksToObsidian(tasks: unknown, date?: unknown, dailyWork?: unknown, inspiration?: unknown, beforeTasks?: unknown): unknown;
  buildDailyTemplate(date: string): string;
  triggerOverviewUpdate(filePath: string): void;
};

export function createMainWindowBootstrap(options: CreateMainWindowBootstrapOptions): SetupMainBrowserWindowOptions {
  const {
  win,
  store,
  diag,
  scheduleAiTimers,
  createTray,
  loadRenderer,
  getTaskMenuWindow,
  openTaskMenuWindow,
  closeTaskMenuWindow,
  getTaskMenuPayload,
  setTaskMenuPayload,
  getMainWindow,
  stopDesktopGuard,
  userHidden,
  getWindowMode,
  isQuitting,
  hideMainWindow,
  getAppSettings,
  markQuitting,
  persistWindowState,
  compactModeKey,
  autoStartKey,
  settingsMode,
  setWindowMode,
  setAppSettings,
  reapplyWindowZOrder,
  getCompanionSettings,
  setCompanionSettings,
  getAiReviewSettings,
  setAiReviewSettings,
  getObsidianTemplateSettings,
  setObsidianTemplateSettings,
  getReviewSections,
  setReviewSections,
  runReviewForDate,
  inspectDailyAiContent,
  getDateKey,
  getVaultPath,
  getVaultStatus,
  getDailyFilePath,
  buildDailySourceRules,
  getDailySourceRules,
  getLlmCaller,
  ensureReportLlmAvailable,
  emitAiReviewProgress,
  stage,
  createDiagnostic,
  extractDocxText,
  zh,
  obsidianPathKey,
  getDefaultVaultPath,
  syncTasksToObsidian,
  previewTasksToObsidian,
  buildDailyTemplate,
  triggerOverviewUpdate,
  } = options;

  return {
    scheduleAiTimers,
    createTray: () => {
      createTray();
      diag('tray created');
    },
    loadMainRenderer: () => loadRenderer(win, { view: 'main' }),
    registerMainWindowEvents: () => registerMainWindowEventHandlers({
      win,
      diag,
      stopDesktopGuard,
      userHidden,
      getWindowMode,
      isQuitting,
      hideMainWindow,
      getAppSettings,
      markQuitting,
      persistWindowState,
      settingsMode,
    }),
    ...createMainWindowIpcRegistrations(options),
  };
}
