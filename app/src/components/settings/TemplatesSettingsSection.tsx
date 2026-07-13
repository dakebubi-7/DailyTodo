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
    { label: zh ? '日报模板' : 'Daily template', kind: 'daily' },
    { label: zh ? '个人周报模板' : 'Personal weekly template', kind: 'personalWeekly' },
    { label: zh ? '个人月报模板' : 'Personal monthly template', kind: 'personalMonthly' },
    { label: zh ? '对外周报模板' : 'External weekly template', kind: 'externalWeekly' },
    { label: zh ? '对外月报模板' : 'External monthly template', kind: 'externalMonthly' },
  ];

  return (
    <div className="settings-section-content">
      <section className="settings-zone">
        <h3>{text.settingsZones.templateSettings}</h3>
        {templateEntries.map(({ label, kind }) => (
          <div className="settings-field" key={kind}>
            <span><strong>{label}</strong></span>
            <button
              type="button"
              className="settings-reset-button"
              onClick={() => onEditTemplate?.(kind)}
            >
              {zh ? '编辑 ->' : 'Edit ->'}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
