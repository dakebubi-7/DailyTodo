import type { CSSProperties } from 'react';
import type { PersonalizationSettings } from '../types/personalization';
import {
  resolveCssAssistBlurPx,
  resolveInvisibleFrostMix,
  resolveInvisibleSurfaceAlpha,
  resolveInvisibleVeilAlpha,
} from '../../shared/invisibleGlass';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createAppViewportStyle(
  personalization: PersonalizationSettings,
  isInvisibleTheme: boolean
): CSSProperties {
  const windowOpacity = clamp(personalization.windowOpacity / 100, 0, 1);
  const panelOpacity = isInvisibleTheme ? windowOpacity : clamp(personalization.panelOpacity / 100, 0, 1);
  const topOpacity = isInvisibleTheme ? windowOpacity : clamp((personalization.topOpacity ?? 90) / 100, 0, 1);
  const cardOpacity = isInvisibleTheme ? windowOpacity : clamp((personalization.cardOpacity ?? 86) / 100, 0, 1);
  const controlOpacity = isInvisibleTheme ? windowOpacity : clamp((personalization.controlOpacity ?? 90) / 100, 0, 1);
  const menuOpacity = isInvisibleTheme ? windowOpacity : clamp((personalization.menuOpacity ?? 96) / 100, 0, 1);
  const inputOpacity = isInvisibleTheme
    ? windowOpacity
    : clamp((personalization.inputOpacity ?? personalization.controlOpacity ?? personalization.panelOpacity) / 100, 0, 1);
  const dialogOpacity = isInvisibleTheme
    ? windowOpacity
    : clamp((personalization.dialogOpacity ?? personalization.menuOpacity ?? 94) / 100, 0, 1);
  const settingsPanelOpacity = isInvisibleTheme
    ? windowOpacity
    : clamp((personalization.settingsPanelOpacity ?? personalization.menuOpacity ?? 92) / 100, 0, 1);
  const blurStrength = clamp(personalization.blurStrength, 0, 100);
  // Invisible theme: keep CSS blur off. Live backdrop-filter over Win10 acrylic freezes window drag.
  const cssAssistBlurPx = isInvisibleTheme ? 0 : resolveCssAssistBlurPx(blurStrength);
  const invisibleFrostMix = isInvisibleTheme ? resolveInvisibleFrostMix(blurStrength) : 0;
  const invisibleSurfaceAlpha = isInvisibleTheme
    ? resolveInvisibleSurfaceAlpha(personalization.windowOpacity, blurStrength)
    : windowOpacity;
  const invisibleVeilAlpha = isInvisibleTheme ? resolveInvisibleVeilAlpha(blurStrength) : 0;
  const shellRadius = clamp(personalization.radius, 0, 36);
  const cardRadius = clamp(personalization.radius - 4, 0, 28);
  const controlRadius = clamp(personalization.radius - 8, 0, 24);
  const glassSaturation = clamp(1.08 + (1 - Math.min(windowOpacity, panelOpacity)) * 0.32, 1.08, 1.4);

  const style = {
    '--personal-accent': personalization.accentColor,
    '--personal-secondary': personalization.secondaryColor,
    '--window-opacity': windowOpacity,
    '--panel-opacity': panelOpacity,
    '--top-opacity': topOpacity,
    '--card-opacity': cardOpacity,
    '--control-opacity': controlOpacity,
    '--menu-opacity': menuOpacity,
    '--input-opacity': inputOpacity,
    '--dialog-opacity': dialogOpacity,
    '--settings-panel-opacity': settingsPanelOpacity,
    '--readable-surface-opacity': clamp(panelOpacity + 0.16, 0.62, 0.98),
    '--glass-saturation': glassSaturation,
    '--blur-strength': `${cssAssistBlurPx}px`,
    '--invisible-frost-mix': invisibleFrostMix,
    '--invisible-surface-alpha': invisibleSurfaceAlpha,
    '--invisible-veil-alpha': invisibleVeilAlpha,
    '--shell-radius': `${shellRadius}px`,
    '--card-radius': `${cardRadius}px`,
    '--control-radius': `${controlRadius}px`,
  } satisfies CSSProperties;

  return style;
}
