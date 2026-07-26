import { useState } from 'react';
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

type RestoreBackupSelection = {
  token: string;
  preview: {
    version: number;
    createdAt: string;
    kind: string;
    taskCount: number;
    hasUiPreferences: boolean;
    hasDailyReviewBatches: boolean;
  };
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getIpcError(result: unknown, fallback: string): string {
  return isObjectRecord(result) && typeof result.error === 'string' ? result.error : fallback;
}

function isSuccessfulIpcResult(result: unknown): boolean {
  return isObjectRecord(result) && result.ok === true;
}

function isRestoreBackupSelection(result: unknown): result is RestoreBackupSelection {
  if (!isObjectRecord(result) || result.ok !== true || typeof result.token !== 'string' || !isObjectRecord(result.preview)) {
    return false;
  }
  const { preview } = result;
  return typeof preview.version === 'number'
    && typeof preview.createdAt === 'string'
    && typeof preview.kind === 'string'
    && typeof preview.taskCount === 'number'
    && typeof preview.hasUiPreferences === 'boolean'
    && typeof preview.hasDailyReviewBatches === 'boolean';
}

export function GeneralSettingsSection({
  text,
  settings,
  appSettings,
  onChange,
  onAppSettingsChange,
}: GeneralSettingsSectionProps) {
  const zh = appSettings.language === 'zh-CN';
  const [restoreSelection, setRestoreSelection] = useState<RestoreBackupSelection | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const updateApp = <K extends keyof AppBehaviorSettings>(key: K, value: AppBehaviorSettings[K]) => {
    onAppSettingsChange({ ...appSettings, [key]: value });
  };

  const runRecoveryAction = async (action: () => Promise<unknown> | unknown, successMessage: string) => {
    setRecoveryStatus(null);
    setRecoveryError(null);
    try {
      const result = await action();
      if (isSuccessfulIpcResult(result)) {
        setRecoveryStatus(successMessage);
        return;
      }
      setRecoveryError(getIpcError(result, zh ? '\u6b64\u529f\u80fd\u5728\u5f53\u524d\u73af\u5883\u4e0d\u53ef\u7528\u3002' : 'This action is unavailable in the current environment.'));
    } catch {
      setRecoveryError(zh ? '\u6b64\u64cd\u4f5c\u672a\u80fd\u5b8c\u6210\u3002' : 'DailyTodo could not complete this action.');
    }
  };

  const chooseRestoreBackup = async () => {
    setRecoveryStatus(null);
    setRecoveryError(null);
    setRestoreSelection(null);
    try {
      const result = await window.electronAPI?.chooseRestoreBackup();
      if (isRestoreBackupSelection(result)) {
        setRestoreSelection(result);
        setRecoveryStatus(zh
          ? '\u5df2\u9a8c\u8bc1\u5907\u4efd\u3002'
          : 'Backup preview ready.');
        return;
      }
      if (isObjectRecord(result) && result.ok === false && typeof result.error === 'string') {
        setRecoveryError(result.error);
      }
    } catch {
      setRecoveryError(zh ? '\u672a\u80fd\u9a8c\u8bc1\u6240\u9009\u5907\u4efd\u3002' : 'DailyTodo could not validate the selected backup.');
    }
  };

  const restoreAndRestart = async () => {
    if (!restoreSelection) return;
    await runRecoveryAction(
      () => window.electronAPI?.restoreBackup({ token: restoreSelection.token, confirmed: true }),
      zh ? '\u6b63\u5728\u6062\u590d\u5907\u4efd\u5e76\u91cd\u65b0\u542f\u52a8\u3002' : 'Restoring backup and restarting DailyTodo.',
    );
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
          title={zh ? '关闭时退出 DailyTodo' : 'Close exits DailyTodo'}
          description={zh ? '默认情况下，关闭和最小化都会隐藏到系统托盘。' : 'By default, close and minimize both hide DailyTodo to the system tray.'}
          checked={appSettings.closeToExit}
          onChange={(value) => updateApp('closeToExit', value)}
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

      <section className="settings-section">
        <h3>{zh ? '\u5907\u4efd\u4e0e\u652f\u6301' : 'Backup & Support'}</h3>
        <div className="settings-preview-list">
          <p>{zh ? '\u5907\u4efd\u4e0d\u5305\u542b API \u5bc6\u94a5\u6216 Obsidian \u6587\u4ef6\u3002' : 'Backups exclude API keys and Obsidian files.'}</p>
        </div>
        <div className="settings-action-row settings-action-row-wide">
          <button
            type="button"
            className="settings-reset-button"
            onClick={() => runRecoveryAction(
              () => window.electronAPI?.exportBackup(),
              zh ? '\u5df2\u5bfc\u51fa\u5907\u4efd\u3002' : 'Backup exported.',
            )}
          >
            {zh ? '\u5bfc\u51fa\u5907\u4efd' : 'Export backup'}
          </button>
          <button type="button" className="settings-reset-button" onClick={chooseRestoreBackup}>
            {zh ? '\u6062\u590d\u5907\u4efd' : 'Restore backup'}
          </button>
          <button
            type="button"
            className="settings-reset-button"
            onClick={() => runRecoveryAction(
              () => window.electronAPI?.openBackupFolder(),
              zh ? '\u5df2\u6253\u5f00\u6062\u590d\u76ee\u5f55\u3002' : 'Recovery folder opened.',
            )}
          >
            {zh ? '\u6253\u5f00\u6062\u590d\u76ee\u5f55' : 'Open recovery folder'}
          </button>
          <button
            type="button"
            className="settings-reset-button"
            onClick={() => runRecoveryAction(
              () => window.electronAPI?.openDiagnosticsFolder(),
              zh ? '\u5df2\u6253\u5f00\u8bca\u65ad\u76ee\u5f55\u3002' : 'Diagnostics folder opened.',
            )}
          >
            {zh ? '\u6253\u5f00\u8bca\u65ad\u76ee\u5f55' : 'Open diagnostics folder'}
          </button>
          <button
            type="button"
            className="settings-reset-button"
            onClick={() => runRecoveryAction(
              () => window.electronAPI?.exportSupportBundle(),
              zh ? '\u5df2\u5bfc\u51fa\u652f\u6301\u5305\u3002' : 'Support bundle exported.',
            )}
          >
            {zh ? '\u5bfc\u51fa\u652f\u6301\u5305' : 'Export support bundle'}
          </button>
        </div>
        {restoreSelection && (
          <div className="settings-preview-list">
            <p>{zh
              ? `\u8fd9\u4e2a\u5907\u4efd\u5305\u542b ${restoreSelection.preview.taskCount} \u4e2a\u4efb\u52a1\u3002`
              : `This backup contains ${restoreSelection.preview.taskCount} tasks.`}</p>
            <button type="button" className="settings-reset-button settings-danger-button" onClick={restoreAndRestart}>
              {zh ? '\u6062\u590d\u5e76\u91cd\u65b0\u542f\u52a8' : 'Restore and restart'}
            </button>
          </div>
        )}
        {recoveryStatus && <p role="status" aria-live="polite">{recoveryStatus}</p>}
        {recoveryError && <p role="alert">{recoveryError}</p>}
      </section>
    </>
  );
}
