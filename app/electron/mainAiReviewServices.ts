import type { BrowserWindow } from 'electron';
import type { ObsidianTemplateSettings } from '../shared/appSettings';
import type { AiReviewSettings } from '../shared/aiReview/aiReviewSettings';
import type { SectionConfig } from '../shared/aiReview/sectionConfig';
import { createAiReviewDailyRunner } from './aiReviewDailyRunner';
import { createAiReviewRunnerBridge } from './aiReviewRunnerBridge';
import { createAiReviewRuntimeHelpers } from './aiReviewRuntime';
import { createAiReviewTimerScheduler } from './aiReviewTimers';
import { createMainObsidianServices } from './mainObsidianServices';
import type { VaultStatus } from './sharedTypes';

type CreateMainAiReviewServicesOptions = {
  getAiReviewSettings(): AiReviewSettings;
  getObsidianTemplateSettings(): ObsidianTemplateSettings;
  getReviewSections(): SectionConfig[];
  getVaultPath(): string | undefined;
  getVaultStatus(): VaultStatus;
  getMainWindow(): BrowserWindow | null;
  localBlogDraftDir: string;
  zh(text: string): string;
};

export function createMainAiReviewServices({
  getAiReviewSettings,
  getObsidianTemplateSettings,
  getReviewSections,
  getVaultPath,
  getVaultStatus,
  getMainWindow,
  localBlogDraftDir,
  zh,
}: CreateMainAiReviewServicesOptions) {
  const {
    ensureReportLlmAvailable,
    stage,
    emitAiReviewProgress,
    createDiagnostic,
    extractDocxText,
  } = createAiReviewRuntimeHelpers({
    getAiReviewSettings,
  });

  // The bridge preserves the deliberate delayed binding between sync and daily review services.
  const aiReviewRunnerBridge = createAiReviewRunnerBridge();

  const {
    getDateKey,
    getDailyFilePath,
    triggerOverviewUpdate,
    syncTasksToObsidian,
    previewTasksToObsidian,
    buildDailyTemplate,
  } = createMainObsidianServices({
    getVaultPath,
    getVaultStatus,
    getObsidianTemplateSettings,
    runReviewForDate: aiReviewRunnerBridge.runReviewForDate,
    localBlogDraftDir,
    zh,
  });

  const {
    inspectDailyAiContent,
    runReviewForDate,
  } = createAiReviewDailyRunner({
    getDailyFilePath,
    getTemplates: getObsidianTemplateSettings,
    getReviewSections,
    ensureReportLlmAvailable,
    emitAiReviewProgress,
    stage,
    createDiagnostic,
  });

  aiReviewRunnerBridge.setRunner(runReviewForDate);

  const { scheduleAiTimers } = createAiReviewTimerScheduler({
    getAiReviewSettings,
    getMainWindow,
  });

  return {
    ensureReportLlmAvailable,
    stage,
    emitAiReviewProgress,
    createDiagnostic,
    extractDocxText,
    getDateKey,
    getDailyFilePath,
    triggerOverviewUpdate,
    syncTasksToObsidian,
    previewTasksToObsidian,
    buildDailyTemplate,
    inspectDailyAiContent,
    runReviewForDate,
    scheduleAiTimers,
  };
}
