import {
  DEFAULT_PERSONALIZATION,
  OPACITY_KEYS,
  type LayoutDensity,
  type PersonalizationSettings,
  type ThemeOpacityOverride,
} from '../types/personalization';
import { THEME_PRESETS, matchThemePreset } from '../types/themePresets';
import { isObjectRecord } from '../../shared/unknownValueGuards';

function isLayoutDensity(value: unknown): value is LayoutDensity {
  return value === 'comfortable' || value === 'balanced' || value === 'compact';
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function parseStoredThemeOpacityOverride(value: unknown): ThemeOpacityOverride | undefined {
  if (!isObjectRecord(value)) return undefined;
  const override: ThemeOpacityOverride = {};
  for (const key of OPACITY_KEYS) {
    const next = readNumber(value[key]);
    if (next !== undefined) override[key] = next;
  }
  return Object.keys(override).length ? override : undefined;
}

export function parseStoredThemeOpacityOverrides(value: unknown): Record<string, ThemeOpacityOverride> {
  if (!isObjectRecord(value)) return {};
  const next: Record<string, ThemeOpacityOverride> = {};
  Object.entries(value).forEach(([themeId, override]) => {
    const parsed = parseStoredThemeOpacityOverride(override);
    if (parsed) next[themeId] = parsed;
  });
  return next;
}

export function normalizeLoadedPersonalization(value: unknown): PersonalizationSettings | null {
  if (!isObjectRecord(value)) return null;

  const loaded: PersonalizationSettings = {
    ...DEFAULT_PERSONALIZATION,
    windowOpacity: readNumber(value.windowOpacity) ?? DEFAULT_PERSONALIZATION.windowOpacity,
    panelOpacity: readNumber(value.panelOpacity) ?? DEFAULT_PERSONALIZATION.panelOpacity,
    blurStrength: readNumber(value.blurStrength) ?? DEFAULT_PERSONALIZATION.blurStrength,
    radius: readNumber(value.radius) ?? DEFAULT_PERSONALIZATION.radius,
    accentColor: readString(value.accentColor) ?? DEFAULT_PERSONALIZATION.accentColor,
    secondaryColor: readString(value.secondaryColor) ?? DEFAULT_PERSONALIZATION.secondaryColor,
    layoutDensity: isLayoutDensity(value.layoutDensity) ? value.layoutDensity : DEFAULT_PERSONALIZATION.layoutDensity,
    texture: readBoolean(value.texture) ?? DEFAULT_PERSONALIZATION.texture,
    animations: readBoolean(value.animations) ?? DEFAULT_PERSONALIZATION.animations,
    themeId: readString(value.themeId),
    topOpacity: readNumber(value.topOpacity) ?? DEFAULT_PERSONALIZATION.topOpacity,
    cardOpacity: readNumber(value.cardOpacity) ?? DEFAULT_PERSONALIZATION.cardOpacity,
    controlOpacity: readNumber(value.controlOpacity) ?? DEFAULT_PERSONALIZATION.controlOpacity,
    menuOpacity: readNumber(value.menuOpacity) ?? DEFAULT_PERSONALIZATION.menuOpacity,
    inputOpacity: readNumber(value.inputOpacity) ?? DEFAULT_PERSONALIZATION.inputOpacity,
    dialogOpacity: readNumber(value.dialogOpacity) ?? DEFAULT_PERSONALIZATION.dialogOpacity,
    settingsPanelOpacity: readNumber(value.settingsPanelOpacity) ?? DEFAULT_PERSONALIZATION.settingsPanelOpacity,
    alwaysOnTop: readBoolean(value.alwaysOnTop),
    fontScale: readNumber(value.fontScale) ?? DEFAULT_PERSONALIZATION.fontScale,
  };
  if (!loaded.themeId) loaded.themeId = matchThemePreset(loaded) || undefined;
  if (loaded.themeId && !THEME_PRESETS.some((preset) => preset.id === loaded.themeId)) loaded.themeId = undefined;
  return loaded;
}
