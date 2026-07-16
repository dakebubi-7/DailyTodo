export interface AppShellClassNameOptions {
  themeClass: string;
  layoutDensity: string;
  texture: boolean;
  animations: boolean;
  compactMode: boolean;
}

export function getAppViewportClassName(isLoaded: boolean) {
  return `app-viewport transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`;
}

export function getAppShellThemeValue(activeThemeId: string | null) {
  return activeThemeId || 'custom';
}

export function getAppShellClassName({
  themeClass,
  layoutDensity,
  texture,
  animations,
  compactMode,
}: AppShellClassNameOptions) {
  return `app-shell ${themeClass} density-${layoutDensity} ${texture ? 'texture-on' : 'texture-off'} ${animations ? 'motion-on' : 'motion-off'} ${compactMode ? 'task-priority-mode' : ''} relative flex h-full flex-col overflow-hidden border border-white/45 text-zinc-900 dark:border-white/10 dark:text-zinc-100`;
}

export function getAppShellLowOpacityFlag(isInvisibleTheme: boolean, windowOpacity: number) {
  return isInvisibleTheme || windowOpacity <= 40 ? 'true' : undefined;
}
