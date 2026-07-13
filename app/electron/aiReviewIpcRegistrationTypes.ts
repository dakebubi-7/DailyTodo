import type { BrowserWindow } from 'electron';
import type { AppBehaviorSettings, ObsidianTemplateSettings } from '../shared/appSettings';
import type {
  AiReviewReportKind,
  AiReviewSettings,
} from '../shared/aiReview/aiReviewSettings';
import type { DailySourceRule } from '../shared/aiReview/sourceMaterials';
import type { SectionConfig } from '../shared/aiReview/sectionConfig';
import type { ChatMessage, LlmResult } from '../shared/llm/openaiClient';
import type {
  AiReviewReportDiagnosticFactory,
  AiReviewReportLlmAvailableResult,
  AiReviewReportProgressEmitter,
  AiReviewReportStageFactory,
} from './aiReviewReportIpcTypes';
import type { ElectronTask, InspectDailyResult, VaultStatus } from './sharedTypes';

export type RegisterAiReviewIpcHandlersOptions = {
  win: BrowserWindow;
  getAppSettings(): AppBehaviorSettings;
  getAiReviewSettings(): AiReviewSettings;
  setAiReviewSettings(value: unknown): AiReviewSettings;
  getObsidianTemplateSettings(): ObsidianTemplateSettings;
  getReviewSections(): SectionConfig[];
  setReviewSections(value: unknown): SectionConfig[];
  scheduleAiTimers(): void;
  runReviewForDate(date: string, tasks: ElectronTask[], force?: boolean): unknown;
  inspectDailyAiContent(date: string): InspectDailyResult;
  getDateKey(date?: unknown): string;
  getVaultPath(): string | undefined;
  getVaultStatus(): VaultStatus;
  getDailyFilePath(date?: string): string;
  buildDailySourceRules(dailyPath: string): DailySourceRule[];
  getDailySourceRules(): DailySourceRule[];
  getLlmCaller(): (messages: ChatMessage[]) => Promise<LlmResult>;
  ensureReportLlmAvailable(reportKind: AiReviewReportKind): AiReviewReportLlmAvailableResult;
  emitAiReviewProgress: AiReviewReportProgressEmitter;
  stage: AiReviewReportStageFactory;
  createDiagnostic: AiReviewReportDiagnosticFactory;
  extractDocxText(buffer: Buffer): Promise<string>;
  zh(text: string): string;
};
