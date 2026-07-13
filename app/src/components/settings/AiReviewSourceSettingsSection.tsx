import type { getShellText } from '../../i18n';
import {
  normalizeMonthlySourceMode,
  normalizeWeeklySourceMode,
  type AiReviewSettings,
  type MonthlySourceMode,
  type WeeklySourceMode,
} from '../../../shared/aiReview/aiReviewSettings';
import { Field, ToggleRow } from './SettingsControls';

type SettingsText = ReturnType<typeof getShellText>['settings'];
type WeeklySourceOption = { value: WeeklySourceMode; label: string; hint: string };
type MonthlySourceOption = { value: MonthlySourceMode; label: string; hint: string };

interface AiReviewSourceSettingsSectionProps {
  text: SettingsText;
  zh: boolean;
  aiReviewSettings: AiReviewSettings;
  weeklySourceOptions: WeeklySourceOption[];
  monthlySourceOptions: MonthlySourceOption[];
  updateAiReview: <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) => void;
  updateAiReviewInput: <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) => void;
}

export function AiReviewSourceSettingsSection({
  text,
  zh,
  aiReviewSettings,
  weeklySourceOptions,
  monthlySourceOptions,
  updateAiReview,
  updateAiReviewInput,
}: AiReviewSourceSettingsSectionProps) {
  return (
    <>
      <section className="settings-inline-section">
        <h3>{zh ? '周报/月报素材来源' : 'Report source detail'}</h3>
        <div className="settings-preview-list">
          <p>{zh ? '选择 AI 生成周报和月报时读取哪些素材。' : 'Choose which materials AI reads when generating weekly and monthly reports.'}</p>
        </div>
        <div className="settings-grid settings-compact-grid">
          <label className="settings-field">
            <span>
              <strong>{zh ? '个人周报素材' : 'Personal weekly source'}</strong>
              <small>{weeklySourceOptions.find((option) => option.value === aiReviewSettings.weeklySourceMode)?.hint}</small>
            </span>
            <select
              value={aiReviewSettings.weeklySourceMode}
              onChange={(event) => updateAiReview('weeklySourceMode', normalizeWeeklySourceMode(event.target.value))}
            >
              {weeklySourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="settings-field">
            <span>
              <strong>{zh ? '个人月报素材' : 'Personal monthly source'}</strong>
              <small>{monthlySourceOptions.find((option) => option.value === aiReviewSettings.monthlySourceMode)?.hint}</small>
            </span>
            <select
              value={aiReviewSettings.monthlySourceMode}
              onChange={(event) => updateAiReview('monthlySourceMode', normalizeMonthlySourceMode(event.target.value))}
            >
              {monthlySourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="settings-field">
            <span>
              <strong>{zh ? '对外周报素材' : 'External weekly source'}</strong>
              <small>{weeklySourceOptions.find((option) => option.value === aiReviewSettings.externalWeeklySourceMode)?.hint}</small>
            </span>
            <select
              value={aiReviewSettings.externalWeeklySourceMode}
              onChange={(event) => updateAiReview('externalWeeklySourceMode', normalizeWeeklySourceMode(event.target.value))}
            >
              {weeklySourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="settings-field">
            <span>
              <strong>{zh ? '对外月报素材' : 'External monthly source'}</strong>
              <small>{monthlySourceOptions.find((option) => option.value === aiReviewSettings.externalMonthlySourceMode)?.hint}</small>
            </span>
            <select
              value={aiReviewSettings.externalMonthlySourceMode}
              onChange={(event) => updateAiReview('externalMonthlySourceMode', normalizeMonthlySourceMode(event.target.value))}
            >
              {monthlySourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </section>
      <div className="settings-grid">
        <Field
          label={text.aiReview.requestTimeout}
          hint={text.aiReview.requestTimeoutHint}
          value={String(aiReviewSettings.timeoutSeconds)}
          onChange={(value) => updateAiReviewInput('timeoutSeconds', Number(value) || 90)}
        />
        <Field
          label={text.aiReview.timerTime}
          hint={text.aiReview.timerTimeHint}
          value={aiReviewSettings.timerTime}
          onChange={(value) => updateAiReviewInput('timerTime', value)}
        />
      </div>
      <ToggleRow
        title={text.aiReview.startupBackfillEnable}
        description={text.aiReview.startupBackfillEnableHint}
        checked={aiReviewSettings.startupBackfillEnabled}
        onChange={(value) => updateAiReview('startupBackfillEnabled', value)}
      />
      <div className="settings-grid">
        <Field
          label={text.aiReview.backfillDays}
          hint={text.aiReview.backfillDaysHint}
          value={String(aiReviewSettings.backfillDays)}
          onChange={(value) => updateAiReviewInput('backfillDays', Number(value) || 7)}
        />
      </div>
      <ToggleRow
        title={text.aiReview.timerEnable}
        description={text.aiReview.timerEnableHint}
        checked={aiReviewSettings.timerEnabled}
        onChange={(value) => updateAiReview('timerEnabled', value)}
      />
    </>
  );
}
