import { ipcMain } from 'electron';
import fs from 'fs';
import type { AppBehaviorSettings, ObsidianTemplateSettings } from '../shared/appSettings';
import { resolveActiveProfile, type AiReviewSettings } from '../shared/aiReview/aiReviewSettings';
import type { SectionConfig } from '../shared/aiReview/sectionConfig';
import type { ChatMessage, LlmResult } from '../shared/llm/openaiClient';
import { getBusinessDateKey, shiftDateKey } from '../shared/taskRollover';
import { backfillReviews } from './aiReview/backfill';
import { isAiReviewTaskArray } from './aiReviewTaskPayload';

export type RegisterAiReviewBackfillIpcHandlersOptions = {
  getAppSettings(): AppBehaviorSettings;
  getAiReviewSettings(): AiReviewSettings;
  getDailyFilePath(date?: string): string;
  getReviewSections(): SectionConfig[];
  getObsidianTemplateSettings(): ObsidianTemplateSettings;
  getLlmCaller(): (messages: ChatMessage[]) => Promise<LlmResult>;
};

export function registerAiReviewBackfillIpcHandlers({
  getAppSettings,
  getAiReviewSettings,
  getDailyFilePath,
  getReviewSections,
  getObsidianTemplateSettings,
  getLlmCaller,
}: RegisterAiReviewBackfillIpcHandlersOptions): void {
  ipcMain.handle('aiReview:backfill', async (_event, tasks: unknown) => {
    if (!isAiReviewTaskArray(tasks)) {
      return { processed: [], filled: [], errors: [{ date: '', error: 'AI Review tasks contain malformed entries.' }] };
    }
    const settings = getAiReviewSettings();
    if (!settings.enabled || !resolveActiveProfile(settings).apiKey) {
      return { processed: [], filled: [], errors: [] };
    }
    const rollover = getAppSettings().rolloverTime;
    const today = getBusinessDateKey(new Date(), rollover);
    const dates = Array.from({ length: settings.backfillDays }, (_, index) => shiftDateKey(today, -index));
    return backfillReviews({
      dates,
      resolveFilePath: (date) => getDailyFilePath(date),
      tasksForDate: () => tasks,
      sections: getReviewSections(),
      customBlocks: getObsidianTemplateSettings().dailyTemplate.customBlocks.filter((block) => block.aiGenerate),
      callLlm: getLlmCaller(),
      fileExists: (filePath) => fs.existsSync(filePath),
    });
  });
}
