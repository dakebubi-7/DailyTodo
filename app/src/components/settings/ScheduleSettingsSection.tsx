import type { AppBehaviorSettings } from '../../../shared/appSettings';
import type { getShellText } from '../../i18n';
import { Field, ToggleRow } from './SettingsControls';

type SettingsText = ReturnType<typeof getShellText>['settings'];

interface ScheduleSettingsSectionProps {
  text: SettingsText;
  appSettings: AppBehaviorSettings;
  selectedDate: string;
  completedCount: number;
  onClearCompleted: () => void;
  onAppSettingsChange: (settings: AppBehaviorSettings) => void;
}

export function ScheduleSettingsSection({
  text,
  appSettings,
  selectedDate,
  completedCount,
  onClearCompleted,
  onAppSettingsChange,
}: ScheduleSettingsSectionProps) {
  const updateApp = <K extends keyof AppBehaviorSettings>(key: K, value: AppBehaviorSettings[K]) => {
    onAppSettingsChange({ ...appSettings, [key]: value });
  };

  return (
    <>
      <section className="settings-section">
        <h3>{text.rollover}</h3>
        <Field label="Rollover time" hint={text.rolloverHint} value={appSettings.rolloverTime} onChange={(value) => updateApp('rolloverTime', value)} />
        <ToggleRow
          title={text.autoCarry}
          description={text.autoCarryHint}
          checked={appSettings.autoCarryForward}
          onChange={(value) => updateApp('autoCarryForward', value)}
        />
        <div className="settings-preview-list">
          <p>{text.carryRule}</p>
        </div>
      </section>

      <section className="settings-section">
        <h3>{appSettings.language === 'zh-CN' ? '清理已完成' : 'Clear Completed'}</h3>
        <div className="settings-preview-list">
          <p>
            {appSettings.language === 'zh-CN'
              ? '只把当前日期的已完成任务从应用列表中隐藏，任务本身和 Obsidian 记录都会完整保留。'
              : 'Only hides completed tasks of the current date from the app list. The tasks and their Obsidian records stay intact.'}
          </p>
        </div>
        <button
          type="button"
          className="settings-reset-button"
          onClick={onClearCompleted}
          disabled={completedCount === 0}
        >
          {appSettings.language === 'zh-CN'
            ? `清理「${selectedDate}」的已完成（${completedCount}）`
            : `Clear completed on ${selectedDate} (${completedCount})`}
        </button>
      </section>
    </>
  );
}
