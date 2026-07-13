import type { CSSProperties } from 'react';
import type { AppBehaviorSettings } from '../../../shared/appSettings';
import type { getShellText } from '../../i18n';
import type { PersonalizationSettings } from '../../types/personalization';
import { THEME_PRESETS, type ThemePreset } from '../../types/themePresets';
import { RangeControl } from './SettingsControls';
import {
  OPACITY_SLIDER_MAX,
  OPACITY_SLIDER_MIN,
  getThemeRecommendation,
  glassOpacityValue,
  opacityValue,
  withUnifiedGlassOpacity,
} from './appearanceSettings';

type SettingsText = ReturnType<typeof getShellText>['settings'];

type ThemePresetPreviewStyle = CSSProperties & {
  '--tp-accent': string;
  '--tp-secondary': string;
  '--tp-radius': string;
};

function getThemePresetPreviewStyle(preset: ThemePreset): ThemePresetPreviewStyle {
  return {
    '--tp-accent': preset.settings.accentColor,
    '--tp-secondary': preset.settings.secondaryColor,
    '--tp-radius': `${Math.max(6, preset.settings.radius - 4)}px`,
  };
}

interface AppearanceSettingsSectionProps {
  text: SettingsText;
  settings: PersonalizationSettings;
  appSettings: AppBehaviorSettings;
  onChange: (settings: PersonalizationSettings) => void;
  onApplyTheme: (preset: ThemePreset) => void;
  onResetTheme: () => void;
}

export function AppearanceSettingsSection({
  text,
  settings,
  appSettings,
  onChange,
  onApplyTheme,
  onResetTheme,
}: AppearanceSettingsSectionProps) {
  const zh = appSettings.language === 'zh-CN';
  const recommendation = getThemeRecommendation(settings);
  const resetToThemeDefaultTitle = zh ? '双击恢复当前主题默认值' : 'Double-click to reset to the current theme default';
  const updatePersonalization = <K extends keyof PersonalizationSettings>(key: K, value: PersonalizationSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <>
      <section className="settings-section">
        <h3>{zh ? '外观风格' : 'Appearance Style'}</h3>
        <div className="theme-preset-grid">
          {THEME_PRESETS.filter(preset =>
            preset.id === 'minimal' ||
            preset.id === 'neumorphism' ||
            preset.id === 'watercolor' ||
            preset.id === 'invisible'
          ).map((preset) => {
            const active = settings.themeId === preset.id;
            const label = zh ? preset.labelZh : preset.labelEn;
            return (
              <button
                key={preset.id}
                type="button"
                className={`theme-preset-card ${active ? 'theme-preset-active' : ''} ${preset.dark ? 'theme-preset-dark' : ''}`}
                onClick={() => {
                  onApplyTheme(preset);
                }}
                aria-pressed={active}
                aria-label={label}
                title={label}
                style={getThemePresetPreviewStyle(preset)}
              >
                <span className="theme-preset-thumb" aria-hidden="true">
                  <span className="theme-preset-bar" />
                  <span className="theme-preset-dot" />
                </span>
                <span className="theme-preset-name">{label}</span>
              </button>
            );
          })}
        </div>
        <div className="settings-action-row">
          <button type="button" className="settings-reset-button" onClick={onResetTheme}>
            {zh ? '恢复当前主题默认设置' : 'Reset current theme defaults'}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3>{text.globalAppearance}</h3>
        <div className="settings-preview-list">
          <p>{text.globalAppearanceHint}</p>
        </div>
        <div className="settings-grid">
          <RangeControl
            label={zh ? '全局字体' : 'Global Font'}
            hint={zh ? '整体放大或缩小文字；双击恢复当前主题默认值' : 'Scale all text; double-click to reset to the current theme default'}
            value={settings.fontScale ?? 100}
            min={80}
            max={130}
            unit="%"
            defaultValue={recommendation.fontScale ?? 100}
            resetTitle={resetToThemeDefaultTitle}
            onChange={(value) => updatePersonalization('fontScale', value)}
          />
          <RangeControl
            label={zh ? '玻璃透明度' : 'Glass opacity'}
            hint={zh ? '统一调整窗口、卡片、输入框、菜单和弹窗透明度；双击恢复当前主题默认值' : 'Adjust windows, cards, inputs, menus, and dialogs together; double-click to reset to the current theme default'}
            value={glassOpacityValue(settings)}
            min={OPACITY_SLIDER_MIN}
            max={OPACITY_SLIDER_MAX}
            unit="%"
            defaultValue={opacityValue(recommendation, 'windowOpacity')}
            resetTitle={resetToThemeDefaultTitle}
            onChange={(value) => onChange(withUnifiedGlassOpacity(settings, value))}
          />
          <RangeControl
            label={zh ? '模糊强度' : 'Blur strength'}
            hint={zh ? '调整毛玻璃背景的模糊程度；双击恢复当前主题默认值' : 'Adjust frosted-glass blur strength; double-click to reset to the current theme default'}
            value={settings.blurStrength}
            min={0}
            max={80}
            unit="px"
            defaultValue={recommendation.blurStrength}
            resetTitle={resetToThemeDefaultTitle}
            onChange={(value) => updatePersonalization('blurStrength', value)}
          />
          <RangeControl
            label={text.radius}
            hint={resetToThemeDefaultTitle}
            value={settings.radius}
            min={4}
            max={36}
            unit="px"
            defaultValue={recommendation.radius}
            resetTitle={resetToThemeDefaultTitle}
            onChange={(value) => updatePersonalization('radius', value)}
          />
        </div>
      </section>

      <section className="settings-section">
        <h3>{text.colors}</h3>
        <div className="settings-color-grid">
          <label className="settings-color">
            <span>{zh ? '主色' : 'Primary'}</span>
            <input type="color" value={settings.accentColor} onChange={(event) => updatePersonalization('accentColor', event.target.value)} />
          </label>
          <label className="settings-color">
            <span>{zh ? '强调色' : 'Secondary'}</span>
            <input type="color" value={settings.secondaryColor} onChange={(event) => updatePersonalization('secondaryColor', event.target.value)} />
          </label>
        </div>
      </section>
    </>
  );
}
