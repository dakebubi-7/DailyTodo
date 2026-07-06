import { OPACITY_KEYS, type OpacityKey, type PersonalizationSettings } from '../../types/personalization';
import { THEME_PRESETS } from '../../types/themePresets';

export const OPACITY_SLIDER_MIN = 20;
export const OPACITY_SLIDER_MAX = 100;

export function getThemeRecommendation(settings: PersonalizationSettings): PersonalizationSettings {
  const preset =
    THEME_PRESETS.find((item) => item.id === settings.themeId) ||
    THEME_PRESETS.find((item) => item.id === 'minimal');
  return preset?.settings || settings;
}

export function opacityValue(settings: PersonalizationSettings, key: OpacityKey): number {
  return settings[key] ?? settings.controlOpacity ?? settings.panelOpacity;
}

export function glassOpacityValue(settings: PersonalizationSettings): number {
  return settings.windowOpacity ?? settings.panelOpacity;
}

export function withUnifiedGlassOpacity(settings: PersonalizationSettings, value: number): PersonalizationSettings {
  const next = { ...settings };
  for (const key of OPACITY_KEYS) {
    next[key] = value;
  }
  return next;
}
