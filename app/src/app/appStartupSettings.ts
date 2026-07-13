import type { Dispatch, SetStateAction } from 'react';
import type { AppUiStateLoadHandlers } from './appUiStatePersistence';
import { loadAppUiState } from './appUiStatePersistence';
import type { ObsidianTemplateSettings } from '../../shared/appSettings';
import { areObsidianTemplateSettingsEqual, createDefaultObsidianTemplateSettings } from '../../shared/appSettings';
import type { CompanionSettings } from '../../shared/obsidianCompanion';
import { areCompanionSettingsEqual, createDefaultCompanionSettings } from '../../shared/obsidianCompanionDefaults';

export interface LoadAppStartupSettingsOptions {
  getCompanionSettings: () => Promise<CompanionSettings>;
  getObsidianTemplateSettings: () => Promise<ObsidianTemplateSettings>;
  setCompanionSettingsState: Dispatch<SetStateAction<CompanionSettings>>;
  setObsidianTemplatesState: Dispatch<SetStateAction<ObsidianTemplateSettings>>;
}

export function loadAppStartupSettings({
  getCompanionSettings,
  getObsidianTemplateSettings,
  setCompanionSettingsState,
  setObsidianTemplatesState,
}: LoadAppStartupSettingsOptions): void {
  const setCompanionSettingsIfChanged = (next: CompanionSettings) => {
    setCompanionSettingsState((previous) => (
      areCompanionSettingsEqual(previous, next) ? previous : next
    ));
  };

  const setObsidianTemplatesIfChanged = (next: ObsidianTemplateSettings) => {
    setObsidianTemplatesState((previous) => (
      areObsidianTemplateSettingsEqual(previous, next) ? previous : next
    ));
  };

  getCompanionSettings()
    .then(setCompanionSettingsIfChanged)
    .catch(() => setCompanionSettingsIfChanged(createDefaultCompanionSettings()));

  getObsidianTemplateSettings()
    .then(setObsidianTemplatesIfChanged)
    .catch(() => setObsidianTemplatesIfChanged(createDefaultObsidianTemplateSettings()));
}

export interface LoadAppStartupStateOptions {
  uiState: AppUiStateLoadHandlers;
  startupSettings: LoadAppStartupSettingsOptions;
}

export function loadAppStartupState({ uiState, startupSettings }: LoadAppStartupStateOptions): void {
  loadAppUiState(uiState);
  loadAppStartupSettings(startupSettings);
}
