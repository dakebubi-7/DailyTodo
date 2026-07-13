import type {
  PersonalizationSettings,
  ThemeOpacityOverride,
} from '../types/personalization';
import {
  OPACITY_KEYS,
  extractOpacityOverride,
} from '../types/personalization';
import { THEME_PRESETS, type ThemePreset } from '../types/themePresets';
import { parseStoredThemeOpacityOverrides } from './personalizationLoadSettings';

export {
  normalizeLoadedPersonalization,
  parseStoredThemeOpacityOverrides,
} from './personalizationLoadSettings';

export const PERSONALIZATION_KEY = 'personalizationSettings';
export const THEME_OVERRIDES_KEY = 'themeOpacityOverrides';

export function clampFontScale(value: number | undefined) {
  return Math.min(130, Math.max(80, value ?? 100));
}

export function arePersonalizationSettingsEqual(
  left: PersonalizationSettings,
  right: PersonalizationSettings,
): boolean {
  return left.windowOpacity === right.windowOpacity
    && left.panelOpacity === right.panelOpacity
    && left.blurStrength === right.blurStrength
    && left.radius === right.radius
    && left.accentColor === right.accentColor
    && left.secondaryColor === right.secondaryColor
    && left.layoutDensity === right.layoutDensity
    && left.texture === right.texture
    && left.animations === right.animations
    && left.themeId === right.themeId
    && left.topOpacity === right.topOpacity
    && left.cardOpacity === right.cardOpacity
    && left.controlOpacity === right.controlOpacity
    && left.menuOpacity === right.menuOpacity
    && left.inputOpacity === right.inputOpacity
    && left.dialogOpacity === right.dialogOpacity
    && left.settingsPanelOpacity === right.settingsPanelOpacity
    && left.alwaysOnTop === right.alwaysOnTop
    && left.fontScale === right.fontScale;
}

export function areThemeOpacityOverridesEqual(
  left: Record<string, ThemeOpacityOverride>,
  right: Record<string, ThemeOpacityOverride>,
): boolean {
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);
  return leftEntries.length === rightEntries.length
    && leftEntries.every(([themeId, leftOverride]) => {
      const rightOverride = right[themeId];
      if (!rightOverride) return false;
      return OPACITY_KEYS.every((key) => leftOverride[key] === rightOverride[key]);
    });
}

export function seedThemeOverridesFromPersonalization(
  previous: Record<string, ThemeOpacityOverride>,
  settings: PersonalizationSettings,
): Record<string, ThemeOpacityOverride> {
  const themeId = settings.themeId;
  if (!themeId) return previous;
  return { [themeId]: extractOpacityOverride(settings), ...previous };
}

export function mergeStoredThemeOverrides(
  previous: Record<string, ThemeOpacityOverride>,
  stored: unknown,
): Record<string, ThemeOpacityOverride> {
  return { ...previous, ...parseStoredThemeOpacityOverrides(stored) };
}

export function mergeLoadedThemeOverrides(
  previous: Record<string, ThemeOpacityOverride>,
  personalization: PersonalizationSettings | null,
  stored: unknown,
): Record<string, ThemeOpacityOverride> {
  const seeded = personalization ? seedThemeOverridesFromPersonalization(previous, personalization) : previous;
  const merged = mergeStoredThemeOverrides(seeded, stored);
  return areThemeOpacityOverridesEqual(previous, merged) ? previous : merged;
}

export function createPersonalizationForThemePreset(
  preset: ThemePreset,
  themeOverrides: Record<string, ThemeOpacityOverride>,
): PersonalizationSettings {
  const remembered = themeOverrides[preset.id];
  return remembered ? { ...preset.settings, ...remembered } : preset.settings;
}

export interface ThemeDefaultsReset {
  nextPersonalization: PersonalizationSettings;
  nextThemeOverrides: Record<string, ThemeOpacityOverride>;
}

export function getThemeDefaultsReset(
  personalization: PersonalizationSettings,
  activeThemeId: string | null | undefined,
  themeOverrides: Record<string, ThemeOpacityOverride>,
): ThemeDefaultsReset | null {
  const themeId = personalization.themeId || activeThemeId;
  const preset = THEME_PRESETS.find((item) => item.id === themeId) || THEME_PRESETS.find((item) => item.id === 'minimal');
  if (!preset) return null;
  const next = { ...themeOverrides };
  delete next[preset.id];
  return { nextPersonalization: preset.settings, nextThemeOverrides: next };
}

export function rememberThemeOverride(
  previous: Record<string, ThemeOpacityOverride>,
  next: PersonalizationSettings,
): Record<string, ThemeOpacityOverride> {
  const themeId = next.themeId;
  if (!themeId) return previous;
  return { ...previous, [themeId]: extractOpacityOverride(next) };
}
