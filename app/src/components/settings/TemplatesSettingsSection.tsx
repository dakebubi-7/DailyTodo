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
    { label: zh ? '\u65e5\u62a5\u6a21\u677f' : 'Daily template', kind: 'daily' },
    { label: zh ? '\u4e2a\u4eba\u5468\u62a5\u6a21\u677f' : 'Personal weekly template', kind: 'personalWeekly' },
    { label: zh ? '\u4e2a\u4eba\u6708\u62a5\u6a21\u677f' : 'Personal monthly template', kind: 'personalMonthly' },
    { label: zh ? '\u5bf9\u5916\u5468\u62a5\u6a21\u677f' : 'External weekly template', kind: 'externalWeekly' },
    { label: zh ? '\u5bf9\u5916\u6708\u62a5\u6a21\u677f' : 'External monthly template', kind: 'externalMonthly' },
  ];

  return (
    <div className="settings-section-content">
      <section className="settings-zone">
        <h3>{text.settingsZones.templateSettings}</h3>
        <div className="settings-template-list">
          {templateEntries.map(({ label, kind }) => (
            <div className="settings-template-row" key={kind}>
              <span className="settings-template-label">
                <strong>{label}</strong>
              </span>
              <button
                type="button"
                className="settings-reset-button settings-template-edit"
                onClick={() => onEditTemplate?.(kind)}
              >
                {zh ? '\u7f16\u8f91' : 'Edit'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
