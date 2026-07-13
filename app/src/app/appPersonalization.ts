import type { Dispatch, SetStateAction } from 'react';
import type {
  PersonalizationSettings,
  ThemeOpacityOverride,
} from '../types/personalization';
import { type ThemePreset } from '../types/themePresets';
import {
  arePersonalizationSettingsEqual,
  areThemeOpacityOverridesEqual,
  createPersonalizationForThemePreset,
  getThemeDefaultsReset,
  rememberThemeOverride,
} from './personalizationSettings';

export {
  PERSONALIZATION_KEY,
  THEME_OVERRIDES_KEY,
  clampFontScale,
  arePersonalizationSettingsEqual,
  parseStoredThemeOpacityOverrides,
  normalizeLoadedPersonalization,
  seedThemeOverridesFromPersonalization,
  mergeStoredThemeOverrides,
  mergeLoadedThemeOverrides,
  createPersonalizationForThemePreset,
  getThemeDefaultsReset,
  rememberThemeOverride,
} from './personalizationSettings';

interface AppPersonalizationActionDeps {
  personalization: PersonalizationSettings;
  activeThemeId: string | null | undefined;
  themeOverrides: Record<string, ThemeOpacityOverride>;
  setPersonalization: Dispatch<SetStateAction<PersonalizationSettings>>;
  setThemeOverrides: Dispatch<SetStateAction<Record<string, ThemeOpacityOverride>>>;
  toggleDarkMode: () => void;
}

export function createAppPersonalizationActions({
  personalization,
  activeThemeId,
  themeOverrides,
  setPersonalization,
  setThemeOverrides,
  toggleDarkMode,
}: AppPersonalizationActionDeps) {
  return {
    applyThemePreset: (preset: ThemePreset) => {
      const nextPersonalization = createPersonalizationForThemePreset(preset, themeOverrides);
      if (arePersonalizationSettingsEqual(personalization, nextPersonalization)) return;
      setPersonalization(nextPersonalization);
    },
    resetCurrentThemeDefaults: () => {
      const reset = getThemeDefaultsReset(personalization, activeThemeId, themeOverrides);
      if (!reset) return;
      if (
        arePersonalizationSettingsEqual(personalization, reset.nextPersonalization)
        && areThemeOpacityOverridesEqual(themeOverrides, reset.nextThemeOverrides)
      ) return;
      setThemeOverrides(reset.nextThemeOverrides);
      setPersonalization(reset.nextPersonalization);
    },
    changePersonalization: (next: PersonalizationSettings) => {
      if (arePersonalizationSettingsEqual(personalization, next)) return;
      setPersonalization(next);
      setThemeOverrides((prev) => rememberThemeOverride(prev, next));
    },
    toggleDarkModeAction: () => toggleDarkMode(),
  };
}
