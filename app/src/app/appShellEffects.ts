import { clampFontScale } from './appPersonalization';
import {
  areNativeGlassHostSignaturesEqual,
  createDisabledInvisibleGlassSettings,
  createInvisibleGlassSettings,
  getNativeGlassHostSignature,
  type InvisibleGlassSettings,
} from '../../shared/invisibleGlass';

export function syncSettingsMode(settingsOpen: boolean): void {
  void window.electronAPI?.setSettingsMode?.(settingsOpen);
}

export function syncDocumentThemeClasses(isDark: boolean, textureEnabled: boolean): void {
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('texture-disabled', !textureEnabled);
}

export function syncDocumentFontScale(fontScale: number | undefined): void {
  const scale = clampFontScale(fontScale);
  document.documentElement.style.fontSize = `${(14 * scale) / 100}px`;
}

export function syncAlwaysOnTopPreference(alwaysOnTop: boolean | undefined): void {
  void window.electronAPI?.setWindowMode?.(alwaysOnTop ? 'onTop' : 'normal');
}

export function buildInvisibleGlassSettings(
  isInvisibleTheme: boolean,
  windowOpacity: number | undefined,
  blurStrength: number | undefined,
): InvisibleGlassSettings {
  if (!isInvisibleTheme) return createDisabledInvisibleGlassSettings();
  return createInvisibleGlassSettings({
    enabled: true,
    opacity: windowOpacity,
    blurStrength,
  });
}

export function syncInvisibleGlassTheme(
  isInvisibleTheme: boolean,
  windowOpacity?: number,
  blurStrength?: number,
): void {
  void window.electronAPI?.setInvisibleGlass?.(
    buildInvisibleGlassSettings(isInvisibleTheme, windowOpacity, blurStrength),
  );
}

export function syncNativeWindowRadius(radius: number | undefined): void {
  void window.electronAPI?.setNativeWindowRadius?.(radius);
}

export function getPerformanceFrostShellAttributes(active: boolean): Record<string, string> {
  return active ? { 'data-performance-frost': 'true' } : {};
}

export function getDesktopGlassShellAttributes(mode: unknown): Record<string, string> {
  return mode === 'desktop' ? { 'data-window-mode': 'desktop' } : {};
}

/**
 * Only re-apply native acrylic when theme/opacity/host-blur state changes.
 * Host acrylic is off at blur 0 (true clear) and on above 0; continuous densify stays CSS-only.
 */
export function shouldSyncInvisibleGlassSettings(
  previous: InvisibleGlassSettings | null,
  next: InvisibleGlassSettings,
): boolean {
  if (!previous) return true;
  return !areNativeGlassHostSignaturesEqual(
    getNativeGlassHostSignature(previous),
    getNativeGlassHostSignature(next),
  );
}
