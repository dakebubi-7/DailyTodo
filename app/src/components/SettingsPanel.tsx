import { useEffect, useState } from 'react';
import {
  AppBehaviorSettings,
  ObsidianTemplateSettings,
} from '../../shared/appSettings';
import type { SyncPreview } from '../../shared/obsidianTemplates';
import { getShellText } from '../i18n';
import type { PersonalizationSettings } from '../types/personalization';
import type { Task } from '../types/task';
import type { ThemePreset } from '../types/themePresets';
import { AppearanceSettingsSection } from './settings/AppearanceSettingsSection';
import { AiReviewSettingsSection } from './settings/AiReviewSettingsSection';
import { GeneralSettingsSection } from './settings/GeneralSettingsSection';
import { ScheduleSettingsSection } from './settings/ScheduleSettingsSection';
import { SettingsPanelShell } from './settings/SettingsPanelShell';
import { SyncSettingsSection } from './settings/SyncSettingsSection';
import { TemplatesSettingsSection } from './settings/TemplatesSettingsSection';
import {
  getSettingsNavSections,
  getSettingsSectionMeta,
  type SettingsSection,
} from './settings/settingsPanelNavigation';
import { useAiReviewSettingsPanelState } from './settings/useAiReviewSettingsPanelState';

interface SettingsPanelProps {
  isOpen: boolean;
  settings: PersonalizationSettings;
  appSettings: AppBehaviorSettings;
  obsidianTemplates: ObsidianTemplateSettings;
  obsidianPath: string;
  syncPreview: SyncPreview | null;
  isDark: boolean;
  selectedDate: string;
  completedCount: number;
  tasks: Task[];
  onClearCompleted: () => void;
  onApplyTheme: (preset: ThemePreset) => void;
  onResetTheme: () => void;
  onChange: (settings: PersonalizationSettings) => void;
  onAppSettingsChange: (settings: AppBehaviorSettings) => void;
  onObsidianTemplatesChange: (settings: ObsidianTemplateSettings) => void;
  onChooseObsidian: () => void;
  onPreviewSync: () => void;
  onResetTemplates: () => void;
  onClose: () => void;
  onOpenCompanionSettings: () => void;
  onEditTemplate?: (kind: 'daily' | 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly') => void;
}

export function SettingsPanel({
  isOpen,
  settings,
  appSettings,
  obsidianTemplates,
  obsidianPath,
  syncPreview,
  selectedDate,
  completedCount,
  tasks,
  onClearCompleted,
  onApplyTheme,
  onResetTheme,
  onChange,
  onAppSettingsChange,
  onObsidianTemplatesChange,
  onChooseObsidian,
  onPreviewSync,
  onClose,
  onEditTemplate,
}: SettingsPanelProps) {
  const [section, setSection] = useState<SettingsSection>('appearance');
  const text = getShellText(appSettings.language).settings;
  const zh = appSettings.language === 'zh-CN';
  const navSections = getSettingsNavSections(zh);
  const aiReviewState = useAiReviewSettingsPanelState({
    isOpen,
    zh,
    text,
    selectedDate,
    tasks,
  });

  useEffect(() => {
    if (isOpen) {
      setSection('appearance');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const sectionMeta = getSettingsSectionMeta(section, zh);
  const title = sectionMeta?.title || text.title;
  const sectionDescription = sectionMeta?.description || text.intro;
  const navigationLabel = zh ? '\u8bbe\u7f6e\u5bfc\u822a' : 'Settings navigation';
  const sidebarHint = zh
    ? '\u9009\u62e9\u5de6\u4fa7\u5206\u7c7b\uff0c\u53f3\u4fa7\u76f4\u63a5\u8c03\u6574\u529f\u80fd\u3002'
    : 'Choose a section and adjust settings on the right.';

  return (
    <SettingsPanelShell
      sidebarTitle={text.title}
      sidebarHint={sidebarHint}
      navigationLabel={navigationLabel}
      closeLabel={text.close}
      navSections={navSections}
      section={section}
      pageTitle={title}
      pageDescription={sectionDescription}
      onSectionChange={setSection}
      onClose={onClose}
    >
      {section === 'appearance' && (
        <AppearanceSettingsSection
          text={text}
          settings={settings}
          appSettings={appSettings}
          onChange={onChange}
          onApplyTheme={onApplyTheme}
          onResetTheme={onResetTheme}
        />
      )}

      {section === 'sync' && (
        <SyncSettingsSection
          zh={zh}
          text={text}
          obsidianTemplates={obsidianTemplates}
          obsidianPath={obsidianPath}
          syncPreview={syncPreview}
          onObsidianTemplatesChange={onObsidianTemplatesChange}
          onChooseObsidian={onChooseObsidian}
          onPreviewSync={onPreviewSync}
        />
      )}

      {section === 'templates' && (
        <TemplatesSettingsSection zh={zh} text={text} onEditTemplate={onEditTemplate} />
      )}

      {section === 'schedule' && (
        <ScheduleSettingsSection
          text={text}
          appSettings={appSettings}
          selectedDate={selectedDate}
          completedCount={completedCount}
          onClearCompleted={onClearCompleted}
          onAppSettingsChange={onAppSettingsChange}
        />
      )}

      {section === 'aiReview' && (
        <AiReviewSettingsSection
          text={text}
          zh={zh}
          {...aiReviewState}
        />
      )}

      {section === 'general' && (
        <GeneralSettingsSection
          text={text}
          settings={settings}
          appSettings={appSettings}
          onChange={onChange}
          onAppSettingsChange={onAppSettingsChange}
        />
      )}
    </SettingsPanelShell>
  );
}
