import { ipcMain } from 'electron';
import type { AiReviewSettings } from '../shared/aiReview/aiReviewSettings';
import type { SectionConfig } from '../shared/aiReview/sectionConfig';
import { areStoreValuesEqual } from './storeValueEquality';

export type RegisterAiReviewSettingsSectionsIpcHandlersOptions = {
  getAiReviewSettings(): AiReviewSettings;
  setAiReviewSettings(value: unknown): AiReviewSettings;
  getReviewSections(): SectionConfig[];
  setReviewSections(value: unknown): SectionConfig[];
  scheduleAiTimers(): void;
};

export function registerAiReviewSettingsSectionsIpcHandlers({
  getAiReviewSettings,
  setAiReviewSettings,
  getReviewSections,
  setReviewSections,
  scheduleAiTimers,
}: RegisterAiReviewSettingsSectionsIpcHandlersOptions): void {
  ipcMain.handle('aiReview:getSettings', () => getAiReviewSettings());
  ipcMain.handle('aiReview:setSettings', (_event, value: unknown) => {
    const current = getAiReviewSettings();
    const next = setAiReviewSettings(value);
    if (!areStoreValuesEqual(current, next)) {
      scheduleAiTimers();
    }
    return next;
  });
  ipcMain.handle('aiReview:getSections', () => getReviewSections());
  ipcMain.handle('aiReview:setSections', (_event, value: unknown) => {
    return setReviewSections(value);
  });
}
