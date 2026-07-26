import { registerAiReviewBackfillIpcHandlers } from './aiReviewBackfillIpc';
import { registerAiReviewDailyRunInspectIpcHandlers } from './aiReviewDailyRunInspectIpc';
import { registerAiReviewDailyBatchIpcHandlers } from './aiReviewDailyBatchIpc';
import { registerAiReviewExternalReportIpcHandlers } from './aiReviewExternalReportIpc';
import type { RegisterAiReviewIpcHandlersOptions } from './aiReviewIpcRegistrationTypes';
import { registerAiReviewMonthlyReportIpcHandlers } from './aiReviewMonthlyReportIpc';
import { registerAiReviewSettingsSectionsIpcHandlers } from './aiReviewSettingsSectionsIpc';
import { registerAiReviewSourceMaterialsIpcHandlers } from './aiReviewSourceMaterialsIpc';
import { registerAiReviewTemplateToolsIpcHandlers } from './aiReviewTemplateToolsIpc';
import { registerAiReviewWeeklyReportIpcHandlers } from './aiReviewWeeklyReportIpc';

export function registerAiReviewIpcHandlers({
  win,
  getAppSettings,
  getAiReviewSettings,
  setAiReviewSettings,
  getObsidianTemplateSettings,
  getReviewSections,
  setReviewSections,
  scheduleAiTimers,
  runReviewForDate,
  getDailyReviewBatch,
  runDailyReviewBatch,
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
}: RegisterAiReviewIpcHandlersOptions): void {
  registerAiReviewSettingsSectionsIpcHandlers({
    getAiReviewSettings,
    setAiReviewSettings,
    getReviewSections,
    setReviewSections,
    scheduleAiTimers,
  });
  registerAiReviewDailyRunInspectIpcHandlers({
    getDateKey,
    runReviewForDate,
    inspectDailyAiContent,
  });
  registerAiReviewDailyBatchIpcHandlers({
    getDateKey,
    getDailyReviewBatch,
    runDailyReviewBatch,
  });
  registerAiReviewBackfillIpcHandlers({
    getAppSettings,
    getAiReviewSettings,
    getDailyFilePath,
    getReviewSections,
    getObsidianTemplateSettings,
    getLlmCaller,
  });
  registerAiReviewWeeklyReportIpcHandlers({
    getAiReviewSettings,
    getObsidianTemplateSettings,
    getVaultStatus,
    getDateKey,
    getDailySourceRules,
    ensureReportLlmAvailable,
    emitAiReviewProgress,
    stage,
    createDiagnostic,
  });
  registerAiReviewMonthlyReportIpcHandlers({
    getAiReviewSettings,
    getObsidianTemplateSettings,
    getVaultStatus,
    getDateKey,
    getDailySourceRules,
    ensureReportLlmAvailable,
    emitAiReviewProgress,
    stage,
    createDiagnostic,
  });
  registerAiReviewExternalReportIpcHandlers({
    getAiReviewSettings,
    getObsidianTemplateSettings,
    getVaultStatus,
    getDateKey,
    getDailySourceRules,
    getLlmCaller,
  });
  registerAiReviewSourceMaterialsIpcHandlers({
    getVaultStatus,
    getAiReviewSettings,
    getObsidianTemplateSettings,
    getDateKey,
    buildDailySourceRules,
  });
  registerAiReviewTemplateToolsIpcHandlers({
    win,
    getAiReviewSettings,
    getReviewSections,
    getLlmCaller,
    getVaultPath,
    extractDocxText,
    zh,
  });
}
