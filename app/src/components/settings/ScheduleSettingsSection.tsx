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
        <h3>{appSettings.language === 'zh-CN' ? '娓呯悊宸插畬鎴?' : 'Clear Completed'}</h3>
        <div className="settings-preview-list">
          <p>
            {appSettings.language === 'zh-CN'
              ? '鍙妸褰撳墠鏃ユ湡鐨勫凡瀹屾垚浠诲姟浠庡簲鐢ㄥ垪琛ㄤ腑闅愯棌锛屼换鍔℃湰韬拰 Obsidian 璁板綍閮戒細瀹屾暣淇濈暀銆?'
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
            ? `娓呯悊銆?${selectedDate}銆嶇殑宸插畬鎴愶紙${completedCount}锛塦`
            : `Clear completed on ${selectedDate} (${completedCount})`}
        </button>
      </section>
    </>
  );
}
