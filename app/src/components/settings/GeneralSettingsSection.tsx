import { isAppLanguage, isTaskHistoryRange, type AppBehaviorSettings } from '../../../shared/appSettings';
import type { getShellText } from '../../i18n';
import type { PersonalizationSettings } from '../../types/personalization';
import { InputKeybindingsSettingsSection } from './InputKeybindingsSettingsSection';
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
            <strong>{zh ? '语言' : 'Language'}</strong>
            <small>{text.languageHint}</small>
          </span>
          <select
            value={appSettings.language}
            onChange={(event) => {
              if (!isAppLanguage(event.target.value)) return;
              updateApp('language', event.target.value);
            }}
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
        </label>
      </section>

      <section className="settings-section">
        <h3>{text.historyRange}</h3>
        <label className="settings-field">
          <span>
            <strong>{text.historyRange}</strong>
            <small>{text.historyRangeHint}</small>
          </span>
          <select
            value={appSettings.taskHistoryRange}
            onChange={(event) => {
              if (!isTaskHistoryRange(event.target.value)) return;
              updateApp('taskHistoryRange', event.target.value);
            }}
          >
            <option value="two-months">{text.historyRangeTwoMonths}</option>
            <option value="three-months">{text.historyRangeThreeMonths}</option>
            <option value="six-months">{text.historyRangeSixMonths}</option>
            <option value="all">{text.historyRangeAll}</option>
            <option value="custom">{text.historyRangeCustom}</option>
          </select>
        </label>
        {appSettings.taskHistoryRange === 'custom' && (
          <label className="settings-field">
            <span>
              <strong>{text.historyRangeStartDate}</strong>
              <small>{text.historyRangeStartDateHint}</small>
            </span>
            <input
              type="date"
              value={appSettings.taskHistoryStartDate || ''}
              onChange={(event) => updateApp('taskHistoryStartDate', event.target.value || undefined)}
            />
          </label>
        )}
      </section>

      <section className="settings-section">
        <h3>{zh ? '完成记录' : 'Completion Records'}</h3>
        <ToggleRow
          title={zh ? '主任务完成时填写完成记录' : 'Ask for main task completion record'}
          description={zh ? '开启后，点击完成主任务时会先填写完成情况；关闭后直接完成。' : 'When enabled, completing a main task opens the completion record dialog.'}
          checked={appSettings.mainTaskCompletionReviewEnabled}
          onChange={(value) => updateApp('mainTaskCompletionReviewEnabled', value)}
        />
        <ToggleRow
          title={zh ? '子任务完成时填写完成记录' : 'Ask for subtask completion record'}
          description={zh ? '开启后，点击完成子任务时会先填写完成情况；关闭后直接完成。' : 'When enabled, completing a subtask opens the completion record dialog.'}
          checked={appSettings.subtaskCompletionReviewEnabled}
          onChange={(value) => updateApp('subtaskCompletionReviewEnabled', value)}
        />
        <ToggleRow
          title={text.confirmDelete}
          description={zh ? '删除 DailyTodo 本地完成记录前进行确认；已有的 Obsidian 历史记录会保留。' : 'Confirm before removing a local completion record; existing Obsidian history is kept.'}
          checked={appSettings.confirmBeforeDeletingReview}
          onChange={(value) => updateApp('confirmBeforeDeletingReview', value)}
        />
      </section>

      <InputKeybindingsSettingsSection
        text={text}
        settings={appSettings.inputKeybindings}
        onChange={(inputKeybindings) => updateApp('inputKeybindings', inputKeybindings)}
      />
      <section className="settings-section">
        <h3>{zh ? '窗口行为' : 'Window Behavior'}</h3>
        <AutoStartToggle />
        <ToggleRow
          title={zh ? '关闭时最小化到托盘' : 'Minimize to tray on close'}
          description={zh ? '点击关闭按钮时隐藏到系统托盘；关闭后仍可从托盘恢复。' : 'Hide the app to the system tray when the close button is clicked.'}
          checked={appSettings.minimizeToTrayOnClose}
          onChange={(value) => updateApp('minimizeToTrayOnClose', value)}
        />
        <ToggleRow
          title={text.edgeAutoHide}
          description={text.edgeAutoHideHint}
          checked={appSettings.edgeAutoHide}
          onChange={(value) => updateApp('edgeAutoHide', value)}
        />
        <ToggleRow
          title={zh ? '启动时窗口置顶' : 'Always on top on start'}
          description={zh ? '应用启动时自动置顶窗口。' : 'Keep window always on top'}
          checked={settings.alwaysOnTop ?? false}
          onChange={(value) => onChange({ ...settings, alwaysOnTop: value })}
        />
      </section>
    </>
  );
}
