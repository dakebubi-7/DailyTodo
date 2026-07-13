import { clampFontScale } from './appPersonalization';

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
