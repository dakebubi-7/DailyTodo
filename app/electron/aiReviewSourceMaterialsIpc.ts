import { ipcMain } from 'electron';
import { type AiReviewSettings } from '../shared/aiReview/aiReviewSettings';
import { monthKey } from '../shared/aiReview/monthly';
import {
  collectDailySourcesForDates,
  collectMonthlySources,
  type DailySourceRule,
} from '../shared/aiReview/sourceMaterials';
import type { ObsidianTemplateSettings } from '../shared/appSettings';
import { getWeekDates } from './aiReviewIpcHelpers';
import { AI_REVIEW_REPORT_KIND_ERROR, isAiReviewReportKind } from './aiReviewReportKind';
import type { VaultStatus } from './sharedTypes';

export type RegisterAiReviewSourceMaterialsIpcHandlersOptions = {
  getVaultStatus(): VaultStatus;
  getAiReviewSettings(): AiReviewSettings;
  getObsidianTemplateSettings(): ObsidianTemplateSettings;
  getDateKey(date?: unknown): string;
  buildDailySourceRules(dailyPath: string): DailySourceRule[];
};

export function registerAiReviewSourceMaterialsIpcHandlers({
  getVaultStatus,
  getAiReviewSettings,
  getObsidianTemplateSettings,
  getDateKey,
  buildDailySourceRules,
}: RegisterAiReviewSourceMaterialsIpcHandlersOptions): void {
  ipcMain.handle('aiReview:testSourceMaterials', async (_event, kind: unknown, date: unknown) => {
    if (!isAiReviewReportKind(kind)) {
      return { ok: false, error: AI_REVIEW_REPORT_KIND_ERROR, sources: [] };
    }
    const vaultStatus = getVaultStatus();
    if (!vaultStatus.ok || !vaultStatus.vaultPath) {
      return { ok: false, error: vaultStatus.reason, sources: [] };
    }

    const settings = getAiReviewSettings();
    const templateSettings = getObsidianTemplateSettings();
    const selected = getDateKey(date);
    if (kind === 'weekly') {
      const { dates } = getWeekDates(selected);
      const sources = collectDailySourcesForDates({
        vaultPath: vaultStatus.vaultPath,
        dates,
        rules: buildDailySourceRules(templateSettings.dailyPath),
      });
      return { ok: true, sources: sources.map((source) => ({ label: source.label, filePath: source.filePath })) };
    }

    const month = monthKey(selected);
    const sources = collectMonthlySources({
      vaultPath: vaultStatus.vaultPath,
      month,
      weeklyPathTemplate: templateSettings.weeklyPath,
      dailyRules: buildDailySourceRules(templateSettings.dailyPath),
      mode: settings.monthlySourceMode,
    });
    return { ok: true, sources: sources.map((source) => ({ label: source.label, filePath: source.filePath })) };
  });
}
