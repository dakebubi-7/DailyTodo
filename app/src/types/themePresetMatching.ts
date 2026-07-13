import type { PersonalizationSettings } from './personalization';

export interface ThemePresetMatchCandidate {
  id: string;
  settings: PersonalizationSettings;
}

export function findMatchingThemePresetId(
  presets: readonly ThemePresetMatchCandidate[],
  settings: PersonalizationSettings,
): string | null {
  const found = presets.find((preset) => {
    const candidate = preset.settings;
    return (
      candidate.windowOpacity === settings.windowOpacity &&
      candidate.panelOpacity === settings.panelOpacity &&
      candidate.blurStrength === settings.blurStrength &&
      candidate.radius === settings.radius &&
      candidate.accentColor.toLowerCase() === settings.accentColor.toLowerCase() &&
      candidate.secondaryColor.toLowerCase() === settings.secondaryColor.toLowerCase() &&
      candidate.layoutDensity === settings.layoutDensity &&
      candidate.texture === settings.texture &&
      candidate.animations === settings.animations
    );
  });

  return found ? found.id : null;
}
