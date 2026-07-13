import { ipcMain } from 'electron';
import {
  normalizeAiReviewSettings,
  type AiReviewSettings,
} from '../shared/aiReview/aiReviewSettings';
import type { SectionConfig } from '../shared/aiReview/sectionConfig';
import {
  maskAiReviewSettingsSecretsForRenderer,
  mergeAiReviewSettingsSecretsFromRenderer,
} from './aiReviewSecrets';
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
  ipcMain.handle('aiReview:getSettings', () => maskAiReviewSettingsSecretsForRenderer(getAiReviewSettings()));
  ipcMain.handle('aiReview:setSettings', (_event, value: unknown) => {
    const current = getAiReviewSettings();
    // Renderer may send masked placeholders; restore real keys from main-process storage.
    const normalized = normalizeAiReviewSettings(value);
    const withSecrets = mergeAiReviewSettingsSecretsFromRenderer(normalized, current);
    const next = setAiReviewSettings(withSecrets);
    if (!areStoreValuesEqual(current, next)) {
      scheduleAiTimers();
    }
    return maskAiReviewSettingsSecretsForRenderer(next);
  });
  ipcMain.handle('aiReview:getSections', () => getReviewSections());
  ipcMain.handle('aiReview:setSections', (_event, value: unknown) => {
    return setReviewSections(value);
  });
}
