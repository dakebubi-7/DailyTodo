import type { AppBehaviorSettings, AppLanguage } from '../../../shared/appSettings';
import type { getShellText } from '../../i18n';
import type { PersonalizationSettings } from '../../types/personalization';
import { AutoStartToggle, ToggleRow } from './SettingsControls';

type SettingsText = ReturnType<typeof getShellText>['settings'];

interface GeneralSettingsSectionProps {
  text: SettingsText;
  settings: PersonalizationSettings;
  appSettings: AppBehaviorSettings;
  onChange: (settings: PersonalizationSettings) => void;
  onAppSettingsChange: (settings: AppBehaviorSettings) => void;
}

export function GeneralSettingsSection({
  text,
  settings,
  appSettings,
  onChange,
  onAppSettingsChange,
}: GeneralSettingsSectionProps) {
  const zh = appSettings.language === 'zh-CN';
  const updateApp = <K extends keyof AppBehaviorSettings>(key: K, value: AppBehaviorSettings[K]) => {
    onAppSettingsChange({ ...appSettings, [key]: value });
  };

  return (
    <>
      <section className="settings-section">
        <h3>{text.language}</h3>
        <label className="settings-field">
          <span>
            <strong>{zh ? '璇█' : 'Language'}</strong>
            <small>{text.languageHint}</small>
          </span>
          <select value={appSettings.language} onChange={(event) => updateApp('language', event.target.value as AppLanguage)}>
            <option value="zh-CN">涓枃</option>
            <option value="en-US">English</option>
          </select>
        </label>
      </section>

      <section className="settings-section">
        <h3>{zh ? '瀹屾垚璁板綍' : 'Completion Records'}</h3>
        <ToggleRow
          title={zh ? '涓讳换鍔″畬鎴愭椂濉啓瀹屾垚璁板綍' : 'Ask for main task completion record'}
          description={zh ? '寮€鍚悗锛屼富浠诲姟鐐瑰嚮瀹屾垚鏃朵細鍏堝～鍐欏畬鎴愭儏鍐碉紱鍏抽棴鍚庣洿鎺ュ畬鎴愩€?' : 'When enabled, completing a main task opens the completion record dialog.'}
          checked={appSettings.mainTaskCompletionReviewEnabled}
          onChange={(value) => updateApp('mainTaskCompletionReviewEnabled', value)}
        />
        <ToggleRow
          title={zh ? '瀛愪换鍔″畬鎴愭椂濉啓瀹屾垚璁板綍' : 'Ask for subtask completion record'}
          description={zh ? '寮€鍚悗锛屽瓙浠诲姟鐐瑰嚮瀹屾垚鏃朵細鍏堝～鍐欏畬鎴愭儏鍐碉紱鍏抽棴鍚庣洿鎺ュ畬鎴愩€?' : 'When enabled, completing a subtask opens the completion record dialog.'}
          checked={appSettings.subtaskCompletionReviewEnabled}
          onChange={(value) => updateApp('subtaskCompletionReviewEnabled', value)}
        />
      </section>

      <section className="settings-section">
        <h3>{zh ? '绐楀彛琛屼负' : 'Window Behavior'}</h3>
        <AutoStartToggle />
        <ToggleRow
          title={zh ? '鍏抽棴鏃舵渶灏忓寲鍒版墭鐩?' : 'Minimize to tray on close'}
          description={zh ? '鐐瑰叧闂寜閽椂闅愯棌鍒扮郴缁熸墭鐩橈紱鍏抽棴鍚庝粛鍙粠鎵樼洏鎭㈠銆?' : 'Hide the app to the system tray when the close button is clicked.'}
          checked={appSettings.minimizeToTrayOnClose}
          onChange={(value) => updateApp('minimizeToTrayOnClose', value)}
        />
        <ToggleRow
          title={zh ? '鍚姩鏃剁獥鍙ｇ疆椤?' : 'Always on top on start'}
          description={zh ? '搴旂敤鍚姩鏃惰嚜鍔ㄧ疆椤?' : 'Keep window always on top'}
          checked={settings.alwaysOnTop ?? false}
          onChange={(value) => onChange({ ...settings, alwaysOnTop: value })}
        />
      </section>
    </>
  );
}
