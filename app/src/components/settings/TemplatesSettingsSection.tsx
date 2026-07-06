import type { getShellText } from '../../i18n';

type SettingsText = ReturnType<typeof getShellText>['settings'];
export type TemplateEditKind = 'daily' | 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly';

interface TemplatesSettingsSectionProps {
  zh: boolean;
  text: SettingsText;
  onEditTemplate?: (kind: TemplateEditKind) => void;
}

export function TemplatesSettingsSection({ zh, text, onEditTemplate }: TemplatesSettingsSectionProps) {
  const templateEntries: Array<{ label: string; kind: TemplateEditKind }> = [
    { label: zh ? '鏃ユ姤妯℃澘' : 'Daily template', kind: 'daily' },
    { label: zh ? '涓汉鍛ㄦ姤妯℃澘' : 'Personal weekly template', kind: 'personalWeekly' },
    { label: zh ? '涓汉鏈堟姤妯℃澘' : 'Personal monthly template', kind: 'personalMonthly' },
    { label: zh ? '瀵瑰鍛ㄦ姤妯℃澘' : 'External weekly template', kind: 'externalWeekly' },
    { label: zh ? '瀵瑰鏈堟姤妯℃澘' : 'External monthly template', kind: 'externalMonthly' },
  ];

  return (
    <div className="settings-section-content">
      <section className="settings-zone">
        <h3>{zh ? '妯℃澘' : text.settingsZones.templateSettings}</h3>
        {templateEntries.map(({ label, kind }) => (
          <div className="settings-field" key={kind}>
            <span><strong>{label}</strong></span>
            <button
              type="button"
              className="settings-reset-button"
              onClick={() => onEditTemplate?.(kind)}
            >
              {zh ? '缂栬緫 鈫?' : 'Edit 鈫?'}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
