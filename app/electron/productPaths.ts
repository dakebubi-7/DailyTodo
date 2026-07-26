import fs from 'node:fs';
import path from 'node:path';
import { isObjectRecord } from '../shared/unknownValueGuards';

export const SUPPORT_BUNDLE_FORMAT = 'dailytodo-support-bundle';
export const SUPPORT_BUNDLE_VERSION = 1;

type ProductPathsServiceOptions = {
  getAppVersion(): string;
  getAppSettings(): unknown;
  getAiReviewSettings(): unknown;
  getCompanionSettings(): unknown;
  getObsidianTemplateSettings(): unknown;
  now?(): Date;
  platform?: string;
  arch?: string;
};

function readRecord(value: unknown): Record<string, unknown> {
  return isObjectRecord(value) ? value : {};
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function createAppSettingsSummary(value: unknown): Record<string, unknown> {
  const settings = readRecord(value);
  const summary: Record<string, unknown> = {};
  const stringKeys = ['language', 'taskHistoryRange'] as const;
  const booleanKeys = [
    'mainTaskCompletionReviewEnabled',
    'subtaskCompletionReviewEnabled',
    'confirmBeforeDeletingReview',
    'minimizeToTrayOnClose',
    'closeToExit',
    'edgeAutoHide',
  ] as const;

  for (const key of stringKeys) {
    const entry = readString(settings[key]);
    if (entry !== undefined) summary[key] = entry;
  }
  for (const key of booleanKeys) {
    const entry = readBoolean(settings[key]);
    if (entry !== undefined) summary[key] = entry;
  }
  return summary;
}

function createAiReviewSummary(value: unknown): Record<string, unknown> {
  const settings = readRecord(value);
  return {
    enabled: settings.enabled === true,
    profileCount: Array.isArray(settings.profiles) ? settings.profiles.length : 0,
  };
}

function createIntegrationSummary(
  companionValue: unknown,
  templateValue: unknown,
): Record<string, boolean> {
  const companion = readRecord(companionValue);
  const templates = readRecord(templateValue);
  return {
    companionConfigured: Boolean(readString(companion.vaultPath) || readString(companion.mobileInboxPath)),
    obsidianTemplatesConfigured: Boolean(readString(templates.obsidianPath)),
  };
}

export function createProductPathsService({
  getAppVersion,
  getAppSettings,
  getAiReviewSettings,
  getCompanionSettings,
  getObsidianTemplateSettings,
  now = () => new Date(),
  platform = process.platform,
  arch = process.arch,
}: ProductPathsServiceOptions) {
  function createSupportBundle() {
    return {
      format: SUPPORT_BUNDLE_FORMAT,
      version: SUPPORT_BUNDLE_VERSION,
      createdAt: now().toISOString(),
      application: {
        version: getAppVersion(),
        platform,
        arch,
      },
      settings: {
        app: createAppSettingsSummary(getAppSettings()),
        aiReview: createAiReviewSummary(getAiReviewSettings()),
        integrations: createIntegrationSummary(
          getCompanionSettings(),
          getObsidianTemplateSettings(),
        ),
      },
    };
  }

  function exportSupportBundle(targetPath: string): string {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, JSON.stringify(createSupportBundle(), null, 2), 'utf8');
    return targetPath;
  }

  return {
    createSupportBundle,
    exportSupportBundle,
  };
}
