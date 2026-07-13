import type { PersonalizationSettings } from '../types/personalization';
import { matchThemePreset } from '../types/themePresets';

export interface AppThemeState {
  activeThemeId: string | null;
  themeClass: string;
  isInvisibleTheme: boolean;
}

export function createAppThemeState(personalization: PersonalizationSettings): AppThemeState {
  const activeThemeId = personalization.themeId || matchThemePreset(personalization);

  return {
    activeThemeId,
    themeClass: activeThemeId ? `theme-${activeThemeId}` : '',
    isInvisibleTheme: activeThemeId === 'invisible',
  };
}
