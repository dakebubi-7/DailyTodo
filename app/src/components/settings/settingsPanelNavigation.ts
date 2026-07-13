export type SettingsSection = 'appearance' | 'sync' | 'templates' | 'aiReview' | 'schedule' | 'general';

export interface SettingsSectionEntry {
  key: SettingsSection;
  title: string;
  description: string;
  primary?: boolean;
}

export interface SettingsNavSection {
  title: string;
  entries: SettingsSectionEntry[];
}

const COMMON_SECTIONS: SettingsSection[] = ['appearance', 'sync', 'templates', 'aiReview'];
const SYSTEM_SECTIONS: SettingsSection[] = ['schedule', 'general'];

export function getSettingsSectionEntries(zh: boolean): SettingsSectionEntry[] {
  return [
    {
      key: 'appearance',
      title: zh ? '\u5916\u89c2' : 'Appearance',
      description: zh ? '\u4e3b\u9898\u3001\u900f\u660e\u5ea6\u3001\u5706\u89d2\u4e0e\u5b57\u4f53' : 'Theme, opacity, radius, and font',
      primary: true,
    },
    {
      key: 'sync',
      title: zh ? '\u540c\u6b65' : 'Sync',
      description: zh ? '\u4ed3\u5e93\u4f4d\u7f6e\u4e0e\u65e5\u62a5/\u5468\u62a5/\u6708\u62a5\u8def\u5f84' : 'Vault and note paths',
      primary: true,
    },
    {
      key: 'templates',
      title: zh ? '\u6a21\u677f' : 'Templates',
      description: zh ? '\u65e5\u62a5\u3001\u4e2a\u4eba\u62a5\u544a\u3001\u5bf9\u5916\u62a5\u544a\u6a21\u677f' : 'Daily and report templates',
      primary: true,
    },
    {
      key: 'aiReview',
      title: zh ? 'AI \u590d\u76d8' : 'AI Review',
      description: zh ? '\u8d26\u53f7\u3001\u6a21\u578b\u3001\u7acb\u5373\u751f\u6210\u4e0e\u8131\u654f' : 'Accounts, models, generation, and anonymization',
      primary: true,
    },
    {
      key: 'schedule',
      title: zh ? '\u65e5\u7a0b' : 'Schedule',
      description: zh ? '\u7ed3\u8f6c\u65f6\u95f4\u3001\u81ea\u52a8\u751f\u6210\u65f6\u95f4\u4e0e\u6e05\u7406' : 'Rollover, timers, and cleanup',
    },
    {
      key: 'general',
      title: zh ? '\u901a\u7528' : 'General',
      description: zh ? '\u8bed\u8a00\u3001\u7a97\u53e3\u4e0e\u542f\u52a8\u884c\u4e3a' : 'Language, window, and startup behavior',
    },
  ];
}

export function getSettingsNavSections(zh: boolean): SettingsNavSection[] {
  const sectionEntries = getSettingsSectionEntries(zh);
  return [
    {
      title: zh ? '\u5e38\u7528' : 'Common',
      entries: sectionEntries.filter((entry) => COMMON_SECTIONS.includes(entry.key)),
    },
    {
      title: zh ? '\u7cfb\u7edf' : 'System',
      entries: sectionEntries.filter((entry) => SYSTEM_SECTIONS.includes(entry.key)),
    },
  ];
}

export function getSettingsSectionMeta(section: SettingsSection, zh: boolean): SettingsSectionEntry | undefined {
  return getSettingsSectionEntries(zh).find((entry) => entry.key === section);
}
