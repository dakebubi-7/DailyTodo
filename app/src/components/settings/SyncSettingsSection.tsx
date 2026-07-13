import type { ObsidianTemplateSettings } from '../../../shared/appSettings';
import type { SyncPreview } from '../../../shared/obsidianTemplates';
import type { getShellText } from '../../i18n';
import { ToggleRow } from './SettingsControls';

type SettingsText = ReturnType<typeof getShellText>['settings'];
type SyncTemplatePathField = 'dailyPath' | 'weeklyPath' | 'monthlyPath' | 'externalWeeklyPath' | 'externalMonthlyPath';

interface SyncSettingsSectionProps {
  zh: boolean;
  text: SettingsText;
  obsidianTemplates: ObsidianTemplateSettings;
  obsidianPath: string;
  syncPreview: SyncPreview | null;
  onObsidianTemplatesChange: (settings: ObsidianTemplateSettings) => void;
  onChooseObsidian: () => void;
  onPreviewSync: () => void;
}

export function SyncSettingsSection({
  zh,
  text,
  obsidianTemplates,
  obsidianPath,
  syncPreview,
  onObsidianTemplatesChange,
  onChooseObsidian,
  onPreviewSync,
}: SyncSettingsSectionProps) {
  const pathEntries: Array<{ label: string; field: SyncTemplatePathField; defaultVal: string }> = [
    { label: zh ? '日报路径' : 'Daily note path', field: 'dailyPath', defaultVal: 'logs/daily/{{date}}.md' },
    { label: zh ? '个人周报路径' : 'Personal weekly path', field: 'weeklyPath', defaultVal: 'logs/weekly/personal/{{year}}-W{{week}}.md' },
    { label: zh ? '个人月报路径' : 'Personal monthly path', field: 'monthlyPath', defaultVal: 'logs/monthly/personal/{{year}}-{{month}}.md' },
    { label: zh ? '对外周报路径' : 'External weekly path', field: 'externalWeeklyPath', defaultVal: 'logs/weekly/external/{{year}}-W{{week}}.md' },
    { label: zh ? '对外月报路径' : 'External monthly path', field: 'externalMonthlyPath', defaultVal: 'logs/monthly/external/{{year}}-{{month}}.md' },
  ];

  return (
    <div className="settings-section-content">
      <section className="settings-zone">
        <h3>{text.settingsZones.obsidianSync}</h3>
        <div className="settings-field">
          <span>
            <strong>{text.vaultPath}</strong>
          </span>
          <div className="settings-field-row">
            <span>{obsidianPath || text.noVault}</span>
            <button type="button" className="settings-reset-button" onClick={onChooseObsidian}>{text.chooseVault}</button>
          </div>
        </div>
        {pathEntries.map(({ label, field, defaultVal }) => (
          <label className="settings-field" key={field}>
            <span><strong>{label}</strong></span>
            <input
              className="settings-input"
              value={obsidianTemplates[field] || defaultVal}
              onChange={(e) => onObsidianTemplatesChange({ ...obsidianTemplates, [field]: e.target.value })}
              placeholder={defaultVal}
            />
          </label>
        ))}
        <div className="settings-action-row">
          <button type="button" className="settings-reset-button" onClick={onPreviewSync}>
            {zh ? '预览今日同步' : 'Preview today sync'}
          </button>
        </div>
        {syncPreview && (
          <div className="settings-preview-list">
            <p>{zh ? `将处理 ${syncPreview.files.length} 个文件，${syncPreview.taskCount} 个任务。` : `Will process ${syncPreview.files.length} files and ${syncPreview.taskCount} tasks.`}</p>
          </div>
        )}
      </section>

      <section className="settings-zone">
        <h3>{text.syncDeleted}</h3>
        <ToggleRow
          title={text.syncDeleted}
          description={text.syncDeletedHint}
          checked={obsidianTemplates.syncDeletedReviewsToObsidian}
          onChange={(value) => onObsidianTemplatesChange({ ...obsidianTemplates, syncDeletedReviewsToObsidian: value })}
        />
        <ToggleRow
          title={text.confirmDelete}
          description={text.confirmDeleteHint}
          checked={obsidianTemplates.confirmBeforeDeletingReview}
          onChange={(value) => onObsidianTemplatesChange({ ...obsidianTemplates, confirmBeforeDeletingReview: value })}
        />
      </section>
    </div>
  );
}
