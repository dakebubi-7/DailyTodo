import type { getShellText } from '../../i18n';
import type { AiReviewSettings } from '../../../shared/aiReview/aiReviewSettings';
import { Field, ToggleRow } from './SettingsControls';

type SettingsText = ReturnType<typeof getShellText>['settings'];
type WeekOption = { label: string; value: number };

interface AiReviewTimerSettingsSectionProps {
  text: SettingsText;
  zh: boolean;
  aiReviewSettings: AiReviewSettings;
  weekOptions: WeekOption[];
  updateAiReview: <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) => void;
  updateAiReviewInput: <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) => void;
}

export function AiReviewTimerSettingsSection({
  text,
  zh,
  aiReviewSettings,
  weekOptions,
  updateAiReview,
  updateAiReviewInput,
}: AiReviewTimerSettingsSectionProps) {
  return (
    <>
      <section className="settings-zone">
        <h3>{zh ? '个人自动生成' : 'Personal auto generation'}</h3>
        <ToggleRow
          title={text.aiReview.weeklyTimerEnable}
          description={text.aiReview.weeklyTimerEnableHint}
          checked={aiReviewSettings.weeklyTimerEnabled}
          onChange={(value) => updateAiReview('weeklyTimerEnabled', value)}
        />
        <div className="settings-grid settings-compact-grid">
          <label className="settings-field">
            <span><strong>{text.aiReview.weeklyTimerWeekday}</strong></span>
            <select value={aiReviewSettings.weeklyTimerWeekday} onChange={(event) => updateAiReview('weeklyTimerWeekday', Number(event.target.value))}>
              {weekOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <Field label={text.aiReview.timerTime} value={aiReviewSettings.weeklyTimerTime} onChange={(value) => updateAiReviewInput('weeklyTimerTime', value)} />
        </div>
        <ToggleRow
          title={text.aiReview.monthlyTimerEnable}
          description={text.aiReview.monthlyTimerEnableHint}
          checked={aiReviewSettings.monthlyTimerEnabled}
          onChange={(value) => updateAiReview('monthlyTimerEnabled', value)}
        />
        <div className="settings-grid settings-compact-grid">
          <Field label={text.aiReview.monthlyTimerDay} value={String(aiReviewSettings.monthlyTimerDay)} onChange={(value) => updateAiReviewInput('monthlyTimerDay', Number(value) || 1)} />
          <Field label={text.aiReview.timerTime} value={aiReviewSettings.monthlyTimerTime} onChange={(value) => updateAiReviewInput('monthlyTimerTime', value)} />
        </div>
      </section>

      <section className="settings-zone">
        <h3>{zh ? '对外自动生成' : 'External auto generation'}</h3>
        <ToggleRow
          title={zh ? '对外周报自动生成' : 'External weekly auto generation'}
          description={zh ? '按设定时间生成上一周的脱敏对外周报。' : 'Generate an anonymized external weekly report on schedule.'}
          checked={aiReviewSettings.externalWeeklyTimerEnabled}
          onChange={(value) => updateAiReview('externalWeeklyTimerEnabled', value)}
        />
        <div className="settings-grid settings-compact-grid">
          <label className="settings-field">
            <span><strong>{text.aiReview.weeklyTimerWeekday}</strong></span>
            <select value={aiReviewSettings.externalWeeklyTimerWeekday} onChange={(event) => updateAiReview('externalWeeklyTimerWeekday', Number(event.target.value))}>
              {weekOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <Field label={text.aiReview.timerTime} value={aiReviewSettings.externalWeeklyTimerTime} onChange={(value) => updateAiReviewInput('externalWeeklyTimerTime', value)} />
        </div>
        <ToggleRow
          title={zh ? '对外月报自动生成' : 'External monthly auto generation'}
          description={zh ? '按设定时间生成上个月的脱敏对外月报。' : 'Generate an anonymized external monthly report on schedule.'}
          checked={aiReviewSettings.externalMonthlyTimerEnabled}
          onChange={(value) => updateAiReview('externalMonthlyTimerEnabled', value)}
        />
        <div className="settings-grid settings-compact-grid">
          <Field label={text.aiReview.monthlyTimerDay} value={String(aiReviewSettings.externalMonthlyTimerDay)} onChange={(value) => updateAiReviewInput('externalMonthlyTimerDay', Number(value) || 1)} />
          <Field label={text.aiReview.timerTime} value={aiReviewSettings.externalMonthlyTimerTime} onChange={(value) => updateAiReviewInput('externalMonthlyTimerTime', value)} />
        </div>
        <ToggleRow
          title={zh ? '对外报告轻量脱敏' : 'Light anonymization for external reports'}
          description={zh ? '默认开启，生成对外周报/月报时弱化私人细节和敏感表述。' : 'Enabled by default to soften private details in external reports.'}
          checked={aiReviewSettings.anonymizeExternalReports}
          onChange={(value) => updateAiReview('anonymizeExternalReports', value)}
        />
      </section>
    </>
  );
}
