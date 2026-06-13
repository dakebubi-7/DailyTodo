export type LayoutDensity = 'comfortable' | 'balanced' | 'compact';

export interface PersonalizationSettings {
  windowOpacity: number;
  panelOpacity: number;
  blurStrength: number;
  radius: number;
  accentColor: string;
  secondaryColor: string;
  layoutDensity: LayoutDensity;
  texture: boolean;
  animations: boolean;
  themeId?: string; // 记录用户选择的主题 ID，即使参数被修改也保持主题样式
  topOpacity?: number;        // 顶部区域（标题栏、头部）
  cardOpacity?: number;        // 任务卡片
  controlOpacity?: number;     // 按钮/输入框兼容字段
  menuOpacity?: number;        // 弹出菜单（设置面板、日历等）
  inputOpacity?: number;       // 输入框
  dialogOpacity?: number;      // 弹窗
  settingsPanelOpacity?: number; // 设置面板
  alwaysOnTop?: boolean;        // 窗口置顶
  fontScale?: number;           // 全局字体缩放（百分比，100 = 默认）
}

/** 透明度相关字段：切换主题时按 themeId 单独记忆，避免每次重调。 */
export const OPACITY_KEYS = [
  'windowOpacity',
  'panelOpacity',
  'topOpacity',
  'cardOpacity',
  'controlOpacity',
  'menuOpacity',
  'inputOpacity',
  'dialogOpacity',
  'settingsPanelOpacity',
] as const;

export type OpacityKey = (typeof OPACITY_KEYS)[number];

export const OPACITY_AREAS = [
  { key: 'home', settingKey: 'windowOpacity', labelZh: '主页背景', labelEn: 'Home background' },
  { key: 'card', settingKey: 'cardOpacity', labelZh: '任务卡', labelEn: 'Task card' },
  { key: 'input', settingKey: 'inputOpacity', labelZh: '输入框', labelEn: 'Input' },
  { key: 'top', settingKey: 'topOpacity', labelZh: '顶栏按钮', labelEn: 'Top-bar buttons' },
  { key: 'dialog', settingKey: 'dialogOpacity', labelZh: '弹窗', labelEn: 'Dialogs' },
  { key: 'menu', settingKey: 'menuOpacity', labelZh: '菜单', labelEn: 'Menus' },
  { key: 'settings', settingKey: 'settingsPanelOpacity', labelZh: '设置面板', labelEn: 'Settings panel' },
] as const;

export type OpacityAreaKey = (typeof OPACITY_AREAS)[number]['key'];

/** 单个主题的透明度覆盖值（仅保存被定义过的字段）。 */
export type ThemeOpacityOverride = Partial<Pick<PersonalizationSettings, OpacityKey>>;

/** 从一份完整设置中提取已定义的透明度字段。 */
export function extractOpacityOverride(settings: PersonalizationSettings): ThemeOpacityOverride {
  const override: ThemeOpacityOverride = {};
  for (const key of OPACITY_KEYS) {
    const value = settings[key];
    if (typeof value === 'number') {
      override[key] = value;
    }
  }
  return override;
}

export const DEFAULT_PERSONALIZATION: PersonalizationSettings = {
  windowOpacity: 70,
  panelOpacity: 60,
  blurStrength: 24,
  radius: 28,
  accentColor: '#2C2C2E',
  secondaryColor: '#8E8E93',
  layoutDensity: 'comfortable',
  texture: false,
  animations: true,
  themeId: undefined,
  topOpacity: 90,
  cardOpacity: 86,
  controlOpacity: 90,
  menuOpacity: 96,
  inputOpacity: 90,
  dialogOpacity: 94,
  settingsPanelOpacity: 92,
  fontScale: 100,
};
