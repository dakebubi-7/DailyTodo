import { PersonalizationSettings } from './personalization';

export interface ThemePreset {
  id: string;
  labelZh: string;
  labelEn: string;
  /** 套用该主题时是否切到暗色模式 */
  dark: boolean;
  settings: PersonalizationSettings;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'forest',
    labelZh: '经典墨绿',
    labelEn: 'Classic Forest',
    dark: false,
    settings: {
      windowOpacity: 88,
      panelOpacity: 82,
      blurStrength: 10,
      radius: 12,
      accentColor: '#2D4A3E',
      secondaryColor: '#B8953E',
      layoutDensity: 'balanced',
      texture: true,
      animations: true,
      themeId: 'forest',
    },
  },
  {
    id: 'morandi',
    labelZh: '莫兰迪柔彩',
    labelEn: 'Morandi',
    dark: false,
    settings: {
      windowOpacity: 90,
      panelOpacity: 85,
      blurStrength: 14,
      radius: 16,
      accentColor: '#6E7F92',
      secondaryColor: '#A8AEB8',
      layoutDensity: 'balanced',
      texture: false,
      animations: true,
      themeId: 'morandi',
    },
  },
  {
    id: 'minimal',
    labelZh: '极简纯白',
    labelEn: 'Minimal White',
    dark: false,
    settings: {
      windowOpacity: 70,
      panelOpacity: 60,
      blurStrength: 24,
      radius: 28,
      accentColor: '#2C2C2E',
      secondaryColor: '#8E8E93',
      layoutDensity: 'comfortable',
      texture: false,
      animations: true,
      themeId: 'minimal',
    },
  },
  {
    id: 'neumorphism',
    labelZh: '新拟态',
    labelEn: 'Neumorphism',
    dark: false,
    settings: {
      windowOpacity: 95,
      panelOpacity: 95,
      blurStrength: 6,
      radius: 20,
      accentColor: '#8B9DC3',
      secondaryColor: '#DFE4EC',
      layoutDensity: 'balanced',
      texture: false,
      animations: true,
      themeId: 'neumorphism',
      topOpacity: 95,
      cardOpacity: 95,
      controlOpacity: 95,
      menuOpacity: 98,
    },
  },
  {
    id: 'invisible',
    labelZh: '无感',
    labelEn: 'Invisible',
    dark: false,
    settings: {
      windowOpacity: 32,
      panelOpacity: 30,
      blurStrength: 14,
      radius: 18,
      accentColor: '#9CA3AF',
      secondaryColor: '#C0C4CC',
      layoutDensity: 'comfortable',
      texture: false,
      animations: true,
      themeId: 'invisible',
      topOpacity: 32,
      cardOpacity: 30,
      controlOpacity: 30,
      menuOpacity: 88,
    },
  },
  {
    id: 'watercolor',
    labelZh: '水彩画风',
    labelEn: 'Watercolor',
    dark: false,
    settings: {
      windowOpacity: 85,
      panelOpacity: 80,
      blurStrength: 16,
      radius: 24,
      accentColor: '#4a6fa5',
      secondaryColor: '#7fa3c9',
      layoutDensity: 'comfortable',
      texture: true,
      animations: true,
      themeId: 'watercolor',
      topOpacity: 80,
      cardOpacity: 75,
      controlOpacity: 60,
      menuOpacity: 90,
    },
  },
];

/** 判断当前外观参数是否与某个预设完全一致(用于卡片高亮) */
export function matchThemePreset(settings: PersonalizationSettings, isDark: boolean): string | null {
  const found = THEME_PRESETS.find((preset) => {
    if (preset.dark !== isDark) return false;
    const s = preset.settings;
    return (
      s.windowOpacity === settings.windowOpacity &&
      s.panelOpacity === settings.panelOpacity &&
      s.blurStrength === settings.blurStrength &&
      s.radius === settings.radius &&
      s.accentColor.toLowerCase() === settings.accentColor.toLowerCase() &&
      s.secondaryColor.toLowerCase() === settings.secondaryColor.toLowerCase() &&
      s.layoutDensity === settings.layoutDensity &&
      s.texture === settings.texture &&
      s.animations === settings.animations
    );
  });
  return found ? found.id : null;
}
