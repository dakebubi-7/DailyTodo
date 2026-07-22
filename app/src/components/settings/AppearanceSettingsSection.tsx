import type { CSSProperties } from 'react';
import type { AppBehaviorSettings } from '../../../shared/appSettings';
import type { getShellText } from '../../i18n';
import type { PersonalizationSettings } from '../../types/personalization';
import { THEME_PRESETS, type ThemePreset } from '../../types/themePresets';
import { applyInvisibleGlassCssPreview } from '../../app/invisibleGlassPreview';
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
  const resetToThemeDefaultTitle = text.resetToThemeDefault;
  const isInvisibleTheme = settings.themeId === 'invisible';

  const updatePersonalization = <K extends keyof PersonalizationSettings>(key: K, value: PersonalizationSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const previewInvisibleBlur = (value: number) => {
    // Continuous frost densify is CSS; the committed setting synchronizes native glass.
    applyInvisibleGlassCssPreview({
      blurStrength: value,
      baseOpacity: settings.windowOpacity,
    });
  };

  const previewInvisibleOpacity = (value: number) => {
    applyInvisibleGlassCssPreview({
      windowOpacity: value,
      blurStrength: settings.blurStrength,
    });
  };

  return (
    <>
      <section className="settings-section">
        <h3>{text.appearanceStyle}</h3>
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
            {text.resetCurrentThemeDefaults}
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
            label={text.globalFont}
            hint={text.globalFontHint}
            value={settings.fontScale ?? 100}
            min={80}
            max={130}
            unit="%"
            defaultValue={recommendation.fontScale ?? 100}
            resetTitle={resetToThemeDefaultTitle}
            onChange={(value) => updatePersonalization('fontScale', value)}
          />
          <RangeControl
            label={text.glassOpacity}
            hint={text.glassOpacityHint}
            value={glassOpacityValue(settings)}
            min={OPACITY_SLIDER_MIN}
            max={OPACITY_SLIDER_MAX}
            unit="%"
            defaultValue={opacityValue(recommendation, 'windowOpacity')}
            resetTitle={resetToThemeDefaultTitle}
            onPreview={isInvisibleTheme ? previewInvisibleOpacity : undefined}
            onChange={(value) => onChange(withUnifiedGlassOpacity(settings, value))}
          />
          <RangeControl
            label={text.blur}
            hint={text.blurHint}
            value={settings.blurStrength}
            min={0}
            max={100}
            unit="%"
            defaultValue={recommendation.blurStrength}
            resetTitle={resetToThemeDefaultTitle}
            onPreview={isInvisibleTheme ? previewInvisibleBlur : undefined}
            onChange={(value) => updatePersonalization('blurStrength', value)}
          />
          <RangeControl
            label={text.radius}
            hint={resetToThemeDefaultTitle}
            value={settings.radius}
            min={0}
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
            <span>{text.primaryColor}</span>
            <input type="color" value={settings.accentColor} onChange={(event) => updatePersonalization('accentColor', event.target.value)} />
          </label>
          <label className="settings-color">
            <span>{text.secondaryColor}</span>
            <input type="color" value={settings.secondaryColor} onChange={(event) => updatePersonalization('secondaryColor', event.target.value)} />
          </label>
        </div>
      </section>
    </>
  );
}
