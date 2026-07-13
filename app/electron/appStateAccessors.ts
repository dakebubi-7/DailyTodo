import {
  APP_SETTINGS_KEY,
  OBSIDIAN_TEMPLATE_SETTINGS_KEY,
  normalizeAppSettings,
  normalizeObsidianTemplateSettings,
  type AppBehaviorSettings,
  type ObsidianTemplateSettings,
} from '../shared/appSettings';
import { normalizeCompanionSettings } from '../shared/obsidianCompanionDefaults';
import type { CompanionSettings } from '../shared/obsidianCompanion';
import {
  AI_REVIEW_SETTINGS_KEY,
  normalizeAiReviewSettings,
  resolveActiveProfile,
  type AiReviewSettings,
} from '../shared/aiReview/aiReviewSettings';
import { normalizeSections, type SectionConfig } from '../shared/aiReview/sectionConfig';
import { type DailySourceRule } from '../shared/aiReview/sourceMaterials';
import { callChatCompletion, type ChatMessage } from '../shared/llm/openaiClient';
import type { ElectronStoreLike } from './sharedTypes';
import { areStoreValuesEqual } from './storeValueEquality';
import { createObsidianVaultAccessors } from './obsidianVaultAccessors';

const COMPANION_SETTINGS_KEY = 'obsidianCompanionSettings';
const AI_REVIEW_SECTIONS_KEY = 'aiReviewSections';

type CreateAppStateAccessorsOptions = {
  store: ElectronStoreLike;
  isDevelopmentBuild(): boolean;
  devObsidianPath: string;
  zh(text: string): string;
};

export function createAppStateAccessors({
  store,
  isDevelopmentBuild,
  devObsidianPath,
  zh,
}: CreateAppStateAccessorsOptions) {
  const { getDefaultVaultPath, getVaultPath, getVaultStatus } = createObsidianVaultAccessors({
    store,
    isDevelopmentBuild,
    devObsidianPath,
    zh,
  });

  function getCompanionSettings(): CompanionSettings {
    const existing = store.get(COMPANION_SETTINGS_KEY);
    return normalizeCompanionSettings(existing, getVaultPath());
  }

  function setCompanionSettings(value: unknown) {
    const settings = normalizeCompanionSettings(value, getVaultPath());
    if (areStoreValuesEqual(store.get(COMPANION_SETTINGS_KEY), settings)) return;
    store.set(COMPANION_SETTINGS_KEY, settings);
  }

  function getAppSettings(): AppBehaviorSettings {
    return normalizeAppSettings(store.get(APP_SETTINGS_KEY));
  }

  function setAppSettings(value: unknown): AppBehaviorSettings {
    const settings = normalizeAppSettings(value);
    if (areStoreValuesEqual(store.get(APP_SETTINGS_KEY), settings)) return settings;
    store.set(APP_SETTINGS_KEY, settings);
    return settings;
  }

  function getObsidianTemplateSettings(): ObsidianTemplateSettings {
    return normalizeObsidianTemplateSettings(store.get(OBSIDIAN_TEMPLATE_SETTINGS_KEY));
  }

  function setObsidianTemplateSettings(value: unknown): ObsidianTemplateSettings {
    const settings = normalizeObsidianTemplateSettings(value);
    if (areStoreValuesEqual(store.get(OBSIDIAN_TEMPLATE_SETTINGS_KEY), settings)) return settings;
    store.set(OBSIDIAN_TEMPLATE_SETTINGS_KEY, settings);
    return settings;
  }

  function getAiReviewSettings(): AiReviewSettings {
    return normalizeAiReviewSettings(store.get(AI_REVIEW_SETTINGS_KEY));
  }

  function setAiReviewSettings(value: unknown): AiReviewSettings {
    const settings = normalizeAiReviewSettings(value);
    const current = getAiReviewSettings();
    if (areStoreValuesEqual(current, settings)) return current;
    store.set(AI_REVIEW_SETTINGS_KEY, settings);
    return settings;
  }

  function getReviewSections(): SectionConfig[] {
    return normalizeSections(store.get(AI_REVIEW_SECTIONS_KEY));
  }

  function setReviewSections(value: unknown): SectionConfig[] {
    const sections = normalizeSections(value);
    if (areStoreValuesEqual(store.get(AI_REVIEW_SECTIONS_KEY), sections)) return sections;
    store.set(AI_REVIEW_SECTIONS_KEY, sections);
    return sections;
  }

  function buildDailySourceRules(dailyPath: string): DailySourceRule[] {
    return [{ id: 'daily-note-path', label: 'Daily', path: dailyPath, enabled: Boolean(dailyPath.trim()) }];
  }

  function getDailySourceRules(): DailySourceRule[] {
    return buildDailySourceRules(getObsidianTemplateSettings().dailyPath);
  }

  function getLlmCaller() {
    const settings = getAiReviewSettings();
    const profile = resolveActiveProfile(settings);
    return (messages: ChatMessage[]) =>
      callChatCompletion(
        {
          baseUrl: profile.baseUrl,
          apiKey: profile.apiKey,
          model: profile.model,
          maxTokens: profile.maxTokens,
        },
        messages,
        { timeoutMs: profile.timeoutSeconds * 1000, provider: profile.provider },
      );
  }

  return {
    getDefaultVaultPath,
    getVaultPath,
    getVaultStatus,
    getCompanionSettings,
    setCompanionSettings,
    getAppSettings,
    setAppSettings,
    getObsidianTemplateSettings,
    setObsidianTemplateSettings,
    getAiReviewSettings,
    setAiReviewSettings,
    getReviewSections,
    setReviewSections,
    buildDailySourceRules,
    getDailySourceRules,
    getLlmCaller,
  };
}
