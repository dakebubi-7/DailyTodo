import { CSSProperties, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AppBehaviorSettings,
  ObsidianTemplateSettings,
} from '../../shared/appSettings';
import { PersonalizationSettings } from '../types/personalization';
import { Task } from '../types/task';
import { THEME_PRESETS, ThemePreset } from '../types/themePresets';
import { getShellText } from '../i18n';
import {
  AiReviewSettings,
  WeeklySourceMode,
  MonthlySourceMode,
  createDefaultAiReviewSettings,
} from '../../shared/aiReview/aiReviewSettings';
import type { SyncPreview } from '../../shared/obsidianTemplates';
import type { AiReviewProgressEvent, AiReviewRunDiagnostic } from '../../shared/aiReview/runDiagnostics';
import { Field, RangeControl, ToggleRow } from './settings/SettingsControls';
import {
  OPACITY_SLIDER_MAX,
  OPACITY_SLIDER_MIN,
  getThemeRecommendation,
  glassOpacityValue,
  opacityValue,
  withUnifiedGlassOpacity,
} from './settings/appearanceSettings';
import {
  AiAccountZone,
  DiagnosticCard,
  GenerationProgress,
  finishProgress,
  initialProgressForAction,
  previousMonthStart,
  previousWeekDate,
  progressDisplay,
  resultMessage,
  type GenerationAction,
} from './settings/AiReviewSettingsWidgets';
import { TemplatesSettingsSection } from './settings/TemplatesSettingsSection';
import { ScheduleSettingsSection } from './settings/ScheduleSettingsSection';
import { GeneralSettingsSection } from './settings/GeneralSettingsSection';

type SettingsSection = 'appearance' | 'sync' | 'templates' | 'aiReview' | 'schedule' | 'general';

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

type NavSection = SettingsSection;

type SectionEntry = { key: NavSection; title: string; description: string; primary?: boolean };
type ReportProfileKey = 'dailyReviewProfileId' | 'weeklyReportProfileId' | 'monthlyReportProfileId';

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
  const [aiReviewSettings, setAiReviewSettings] = useState<AiReviewSettings>(() => createDefaultAiReviewSettings());
  const [generationStatus, setGenerationStatus] = useState('');
  const [generatingAction, setGeneratingAction] = useState<GenerationAction | null>(null);
  const [lastDiagnostic, setLastDiagnostic] = useState<AiReviewRunDiagnostic | null>(null);
  const [currentProgress, setCurrentProgress] = useState<AiReviewProgressEvent | null>(null);
  const generationActiveRef = useRef(false);
  const progressFallbackTimerRef = useRef<number | null>(null);
  const [section, setSection] = useState<SettingsSection>('appearance');
  const text = getShellText(appSettings.language).settings;
  const zh = appSettings.language === 'zh-CN';
  const sectionEntries: SectionEntry[] = [
    { key: 'appearance', title: zh ? '外观' : 'Appearance', description: zh ? '主题、透明度、圆角与字体' : 'Theme, opacity, radius, and font', primary: true },
    { key: 'sync', title: zh ? '同步' : 'Sync', description: zh ? '仓库位置与日报/周报/月报路径' : 'Vault and note paths', primary: true },
    { key: 'templates', title: zh ? '模板' : 'Templates', description: zh ? '日报、个人报告、对外报告模板' : 'Daily and report templates', primary: true },
    { key: 'aiReview', title: zh ? 'AI 复盘' : 'AI Review', description: zh ? '账号、模型、立即生成与脱敏' : 'Accounts, models, generation, and anonymization', primary: true },
    { key: 'schedule', title: zh ? '日程' : 'Schedule', description: zh ? '结转时间、自动生成时间与清理' : 'Rollover, timers, and cleanup' },
    { key: 'general', title: zh ? '通用' : 'General', description: zh ? '语言、窗口与启动行为' : 'Language, window, and startup behavior' },
  ];
  const navSections: Array<{ title: string; entries: SectionEntry[] }> = [
    { title: zh ? '常用' : 'Common', entries: sectionEntries.filter((entry) => ['appearance', 'sync', 'templates', 'aiReview'].includes(entry.key)) },
    { title: zh ? '系统' : 'System', entries: sectionEntries.filter((entry) => ['schedule', 'general'].includes(entry.key)) },
  ];

  useEffect(() => {
    if (isOpen) setSection('appearance');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    window.electronAPI?.aiReview.getSettings().then((value) => {
      if (active) setAiReviewSettings(value);
    });
    return () => { active = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = window.electronAPI?.aiReview.onProgress?.((payload) => {
      if (!generationActiveRef.current) return;
      setCurrentProgress(payload);
    });
    return () => unsubscribe?.();
  }, [isOpen]);

  useEffect(() => () => {
    if (progressFallbackTimerRef.current) window.clearTimeout(progressFallbackTimerRef.current);
  }, []);

  if (!isOpen) return null;

  const updatePersonalization = <K extends keyof PersonalizationSettings>(key: K, value: PersonalizationSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const recommendation = getThemeRecommendation(settings);
  const resetToThemeDefaultTitle = zh ? '双击恢复当前主题默认值' : 'Double-click to reset to the current theme default';

  const title = sectionEntries.find((entry) => entry.key === section)?.title || (zh ? '设置' : 'Settings');
  const sectionDescription = sectionEntries.find((entry) => entry.key === section)?.description || text.intro;

  const saveAiReviewSettings = (next: AiReviewSettings) => {
    setAiReviewSettings(next);
    window.electronAPI?.aiReview.setSettings(next);
  };

  const updateAiReview = <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) => {
    saveAiReviewSettings({ ...aiReviewSettings, [key]: value });
  };

  const waitingForRealProgress = zh ? '等待真实进度…' : 'Waiting for real progress…';
  const confirmDailyRegeneration = zh
    ? '当前日报可能已存在。确认后会覆盖 DailyTodo 管理的 AI 复盘块并重新生成，继续吗？'
    : 'Today\'s daily review may already exist. Confirm to overwrite DailyTodo-managed AI review blocks and regenerate it.';

  const scheduleFallbackProgress = () => {
    if (progressFallbackTimerRef.current) window.clearTimeout(progressFallbackTimerRef.current);
    progressFallbackTimerRef.current = window.setTimeout(() => {
      if (!generationActiveRef.current) return;
      setCurrentProgress((current) => current ? { ...current, message: waitingForRealProgress, at: new Date().toISOString() } : current);
    }, 1200);
  };

  const runGeneration = async (action: GenerationAction) => {
    setGeneratingAction(action);
    generationActiveRef.current = true;
    setLastDiagnostic(null);
    const initialProgress = initialProgressForAction(action);
    setCurrentProgress(initialProgress);
    scheduleFallbackProgress();
    setGenerationStatus(text.aiReview.generating);
    try {
      if (action === 'daily') {
        const inspection = await window.electronAPI?.aiReview.inspectDaily(selectedDate);
        const shouldRegenerate = Boolean(inspection?.hasAiContent);
        if (shouldRegenerate && !window.confirm(confirmDailyRegeneration)) {
          setCurrentProgress(finishProgress(action, false));
          setGenerationStatus(zh ? '已取消重新生成日报' : 'Daily regeneration canceled');
          return;
        }
        const result = await window.electronAPI?.aiReview.runForDate(selectedDate, tasks, shouldRegenerate);
        if (!result) throw new Error('AI Review API unavailable');
        if (result.diagnostic) setLastDiagnostic(result.diagnostic);
        setCurrentProgress(finishProgress(action, result.ok));
        setGenerationStatus(result.ok ? `${text.aiReview.genSuccess}${selectedDate}` : `${text.aiReview.genFailed}${result.error ?? '未知错误'}`);
        return;
      }
      const result =
        action === 'personalWeekly'
          ? await window.electronAPI?.aiReview.generateWeekly(previousWeekDate(), tasks)
          : action === 'personalMonthly'
          ? await window.electronAPI?.aiReview.generateMonthly(previousMonthStart(), tasks)
          : action === 'externalWeekly'
          ? await window.electronAPI?.aiReview.generateExternal('weekly', previousWeekDate())
          : await window.electronAPI?.aiReview.generateExternal('monthly', previousMonthStart());
      if (!result) throw new Error('AI Review API unavailable');
      const diagnostic = (result as { diagnostic?: AiReviewRunDiagnostic }).diagnostic;
      if (diagnostic) setLastDiagnostic(diagnostic);
      setCurrentProgress(finishProgress(action, result.ok));
      setGenerationStatus(resultMessage(text.aiReview, result));
    } catch (error) {
      setCurrentProgress(finishProgress(action, false));
      setGenerationStatus(`${text.aiReview.genFailed}${error instanceof Error ? error.message : String(error)}`);
    } finally {
      generationActiveRef.current = false;
      if (progressFallbackTimerRef.current) window.clearTimeout(progressFallbackTimerRef.current);
      setGeneratingAction(null);
    }
  };

  const weekOptions = text.aiReview.weekdays.map((label, index) => ({ label, value: index }));
  const weeklySourceOptions: Array<{ value: WeeklySourceMode; label: string; hint: string }> = [
    {
      value: 'daily-notes',
      label: zh ? '聚合日报' : 'Daily notes',
      hint: zh ? '周报直接读取本周每日记录，细节最完整。' : 'Read every daily note in the week for the most detail.',
    },
  ];
  const monthlySourceOptions: Array<{ value: MonthlySourceMode; label: string; hint: string }> = [
    {
      value: 'weekly-then-daily',
      label: zh ? '优先周报，没有则日报' : 'Weekly first, daily fallback',
      hint: zh ? '优先使用本月周报，缺少周报时自动回退到日报。' : 'Use weekly reports first and fall back to daily notes when needed.',
    },
    {
      value: 'weekly-reports',
      label: zh ? '只使用周报' : 'Weekly reports only',
      hint: zh ? '月报只汇总已经生成的周报，适合先周报后月报。' : 'Build monthly reports only from existing weekly reports.',
    },
    {
      value: 'daily-notes',
      label: zh ? '直接聚合日报' : 'Daily notes directly',
      hint: zh ? '月报直接读取整月日报，细节最多但素材更长。' : 'Read every daily note in the month for the most source detail.',
    },
  ];

  return (
    <motion.aside
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="settings-panel"
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <div className="settings-v2-layout">
        <nav className="settings-v2-sidebar" aria-label={zh ? '设置导航' : 'Settings navigation'}>
          <div className="settings-v2-sidebar-title">
            <h2>{text.title}</h2>
            <p>{zh ? '选择左侧分类，右侧直接调整功能。' : 'Choose a section and adjust settings on the right.'}</p>
          </div>
          <div className="settings-nav-list">
            {navSections.map((group) => (
              <div key={group.title}>
                <p className="settings-nav-section-title">{group.title}</p>
                <div className="settings-nav-list">
                  {group.entries.map((entry) => (
                    <button
                      key={entry.key}
                      type="button"
                      className={`settings-nav-item ${entry.primary ? 'settings-nav-primary' : ''} ${section === entry.key ? 'settings-nav-active' : ''}`}
                      onClick={() => setSection(entry.key)}
                      aria-current={section === entry.key ? 'page' : undefined}
                    >
                      <span>
                        <strong>{entry.title}</strong>
                        <small>{entry.description}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="settings-v2-content">
          <button onClick={onClose} className="settings-floating-close settings-icon-button" aria-label={text.close} title={text.close}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="settings-v2-page">
            <div className="settings-page-title">
              <h2>{title}</h2>
              <p>{sectionDescription}</p>
            </div>
      {section === 'appearance' && (
        <>
          <section className="settings-section">
            <h3>{appSettings.language === 'zh-CN' ? '外观风格' : 'Appearance Style'}</h3>
            <div className="theme-preset-grid">
              {THEME_PRESETS.filter(preset =>
                preset.id === 'minimal' ||
                preset.id === 'neumorphism' ||
                preset.id === 'watercolor' ||
                preset.id === 'invisible'
              ).map((preset) => {
                const active = settings.themeId === preset.id;
                const label = appSettings.language === 'zh-CN' ? preset.labelZh : preset.labelEn;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`theme-preset-card ${active ? 'theme-preset-active' : ''} ${preset.dark ? 'theme-preset-dark' : ''}`}
                    onClick={() => {
                      onApplyTheme(preset);
                    }}
                    aria-pressed={active}
                    aria-label={label}
                    title={label}
                    style={{
                      '--tp-accent': preset.settings.accentColor,
                      '--tp-secondary': preset.settings.secondaryColor,
                      '--tp-radius': `${Math.max(6, preset.settings.radius - 4)}px`,
                    } as CSSProperties}
                  >
                    <span className="theme-preset-thumb" aria-hidden="true">
                      <span className="theme-preset-bar" />
                      <span className="theme-preset-dot" />
                    </span>
                    <span className="theme-preset-name">{label}</span>
                  </button>
                );
              })}
            </div>
            <div className="settings-action-row">
              <button type="button" className="settings-reset-button" onClick={onResetTheme}>
                {appSettings.language === 'zh-CN' ? '恢复当前主题默认设置' : 'Reset current theme defaults'}
              </button>
            </div>
          </section>

          <section className="settings-section">
            <h3>{text.globalAppearance}</h3>
            <div className="settings-preview-list">
              <p>{text.globalAppearanceHint}</p>
            </div>
            <div className="settings-grid">
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '全局字体' : 'Global Font'}
                hint={appSettings.language === 'zh-CN' ? '整体放大或缩小文字；双击恢复当前主题默认值' : 'Scale all text; double-click to reset to the current theme default'}
                value={settings.fontScale ?? 100}
                min={80}
                max={130}
                unit="%"
                defaultValue={recommendation.fontScale ?? 100}
                resetTitle={resetToThemeDefaultTitle}
                onChange={(value) => updatePersonalization('fontScale', value)}
              />
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '玻璃透明度' : 'Glass opacity'}
                hint={appSettings.language === 'zh-CN' ? '统一调整窗口、卡片、输入框、菜单和弹窗透明度；双击恢复当前主题默认值' : 'Adjust windows, cards, inputs, menus, and dialogs together; double-click to reset to the current theme default'}
                value={glassOpacityValue(settings)}
                min={OPACITY_SLIDER_MIN}
                max={OPACITY_SLIDER_MAX}
                unit="%"
                defaultValue={opacityValue(recommendation, 'windowOpacity')}
                resetTitle={resetToThemeDefaultTitle}
                onChange={(value) => onChange(withUnifiedGlassOpacity(settings, value))}
              />
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '模糊强度' : 'Blur strength'}
                hint={appSettings.language === 'zh-CN' ? '调整毛玻璃背景的模糊程度；双击恢复当前主题默认值' : 'Adjust frosted-glass blur strength; double-click to reset to the current theme default'}
                value={settings.blurStrength}
                min={0}
                max={80}
                unit="px"
                defaultValue={recommendation.blurStrength}
                resetTitle={resetToThemeDefaultTitle}
                onChange={(value) => updatePersonalization('blurStrength', value)}
              />
              <RangeControl
                label={text.radius}
                hint={resetToThemeDefaultTitle}
                value={settings.radius}
                min={4}
                max={36}
                unit="px"
                defaultValue={recommendation.radius}
                resetTitle={resetToThemeDefaultTitle}
                onChange={(value) => updatePersonalization('radius', value)}
              />
            </div>
          </section>

          <section className="settings-section">
            <h3>{text.colors}</h3>
            <div className="settings-color-grid">
              <label className="settings-color">
                <span>{appSettings.language === 'zh-CN' ? '主色' : 'Primary'}</span>
                <input type="color" value={settings.accentColor} onChange={(event) => updatePersonalization('accentColor', event.target.value)} />
              </label>
              <label className="settings-color">
                <span>{appSettings.language === 'zh-CN' ? '强调色' : 'Secondary'}</span>
                <input type="color" value={settings.secondaryColor} onChange={(event) => updatePersonalization('secondaryColor', event.target.value)} />
              </label>
            </div>
          </section>
        </>
      )}

      {section === 'sync' && (
        <div className="settings-section-content">
          <section className="settings-zone">
            <h3>{zh ? '同步路径' : text.settingsZones.obsidianSync}</h3>
            <div className="settings-field">
              <span>
                <strong>{text.vaultPath}</strong>
              </span>
              <div className="settings-field-row">
                <span>{obsidianPath || text.noVault}</span>
                <button type="button" className="settings-reset-button" onClick={onChooseObsidian}>{text.chooseVault}</button>
              </div>
            </div>
            {(
              [
                { label: zh ? '日报路径' : 'Daily note path', field: 'dailyPath', defaultVal: 'logs/daily/{{date}}.md' },
                { label: zh ? '个人周报路径' : 'Personal weekly path', field: 'weeklyPath', defaultVal: 'logs/weekly/personal/{{year}}-W{{week}}.md' },
                { label: zh ? '个人月报路径' : 'Personal monthly path', field: 'monthlyPath', defaultVal: 'logs/monthly/personal/{{year}}-{{month}}.md' },
                { label: zh ? '对外周报路径' : 'External weekly path', field: 'externalWeeklyPath', defaultVal: 'logs/weekly/external/{{year}}-W{{week}}.md' },
                { label: zh ? '对外月报路径' : 'External monthly path', field: 'externalMonthlyPath', defaultVal: 'logs/monthly/external/{{year}}-{{month}}.md' },
              ] as Array<{
                label: string;
                field: 'dailyPath' | 'weeklyPath' | 'monthlyPath' | 'externalWeeklyPath' | 'externalMonthlyPath';
                defaultVal: string;
              }>
            ).map(({ label, field, defaultVal }) => (
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
                <p>{zh ? `将处理 ${syncPreview.files.length} 个文件、${syncPreview.taskCount} 个任务。` : `Will process ${syncPreview.files.length} files and ${syncPreview.taskCount} tasks.`}</p>
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
        <div className="settings-section-content">
          <section className="settings-zone settings-highlight-section">
            <h3>{text.settingsZones.aiSettings}</h3>
            <ToggleRow
              title={text.aiReview.enable}
              description={text.aiReview.enableHint}
              checked={aiReviewSettings.enabled}
              onChange={(value) => updateAiReview('enabled', value)}
            />
            <AiAccountZone text={text.aiReview} settings={aiReviewSettings} onChange={saveAiReviewSettings} />

            <section className="settings-inline-section" aria-label="reportAccountRouting">
              <h3>{zh ? '报告使用账号' : 'Report account routing'}</h3>
              <div className="settings-preview-list">
                <p>{zh ? '日报、个人周报、个人月报可以分别选择 AI 账号；不选择时跟随当前默认账号。' : 'Daily, personal weekly, and personal monthly reports can each use a specific AI account, or follow the current account.'}</p>
              </div>
              <div className="settings-grid settings-compact-grid">
                {([
                  ['dailyReviewProfileId', zh ? '日报使用账号' : 'Daily review account'],
                  ['weeklyReportProfileId', zh ? '个人周报使用账号' : 'Personal weekly account'],
                  ['monthlyReportProfileId', zh ? '个人月报使用账号' : 'Personal monthly account'],
                ] as Array<[ReportProfileKey, string]>).map(([key, label]) => {
                  const value = String(aiReviewSettings[key] || '');
                  const missing = value && !aiReviewSettings.profiles.some((profile) => profile.id === value);
                  return (
                    <label className="settings-field" key={String(key)}>
                      <span>
                        <strong>{label}</strong>
                        <small>{missing ? (zh ? '账号已失效，生成时会回退默认账号' : 'Missing account; generation falls back to default') : (zh ? '留空表示跟随当前默认账号' : 'Leave empty to follow the current account')}</small>
                      </span>
                      <select value={value} onChange={(event) => updateAiReview(key, event.target.value)}>
                        <option value="">{zh ? '跟随当前账号' : 'Follow current account'} / followCurrentAccount</option>
                        {aiReviewSettings.profiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>{profile.name || profile.model}</option>
                        ))}
                        {missing && <option value={value}>{zh ? '已失效账号' : 'Missing account'} · {value}</option>}
                      </select>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="settings-inline-section settings-highlight-section">
              <h3>{zh ? '手动生成' : 'Manual generation'}</h3>
              <div className="settings-action-row settings-action-row-wide">
                {([
                  ['personalWeekly', text.aiReview.genWeekly],
                  ['personalMonthly', text.aiReview.genMonthly],
                  ['externalWeekly', text.aiReview.genExternalWeekly],
                  ['externalMonthly', text.aiReview.genExternalMonthly],
                  ['daily', zh ? '重新生成今日日报' : 'Regenerate today'],
                ] as Array<[GenerationAction, string]>).map(([action, label]) => (
                  <button
                    key={action}
                    type="button"
                    className="settings-reset-button"
                    disabled={generatingAction !== null}
                    onClick={() => runGeneration(action)}
                  >
                    {generatingAction === action ? progressDisplay(currentProgress, waitingForRealProgress) : label}
                  </button>
                ))}
              </div>
              {generationStatus && (
                <div className="settings-preview-list settings-generation-status">
                  <p>{generationStatus}</p>
                  <GenerationProgress currentProgress={currentProgress} fallback={waitingForRealProgress} />
                </div>
              )}
              {lastDiagnostic && <DiagnosticCard diagnostic={lastDiagnostic} onClose={() => setLastDiagnostic(null)} />}
            </section>

            <section className="settings-inline-section">
              <h3>{zh ? '周报/月报数据精度' : 'Report source detail'}</h3>
              <div className="settings-preview-list">
                <p>{zh ? '选择 AI 生成周报、月报时读取哪些素材。素材越细，内容越完整；素材越汇总，结果越稳定。' : 'Choose which materials AI reads when generating weekly and monthly reports.'}</p>
              </div>
              <div className="settings-grid settings-compact-grid">
                <label className="settings-field">
                  <span>
                    <strong>{zh ? '个人周报来源' : 'Personal weekly source'}</strong>
                    <small>{weeklySourceOptions.find((option) => option.value === aiReviewSettings.weeklySourceMode)?.hint}</small>
                  </span>
                  <select
                    value={aiReviewSettings.weeklySourceMode}
                    onChange={(event) => updateAiReview('weeklySourceMode', event.target.value as WeeklySourceMode)}
                  >
                    {weeklySourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="settings-field">
                  <span>
                    <strong>{zh ? '个人月报来源' : 'Personal monthly source'}</strong>
                    <small>{monthlySourceOptions.find((option) => option.value === aiReviewSettings.monthlySourceMode)?.hint}</small>
                  </span>
                  <select
                    value={aiReviewSettings.monthlySourceMode}
                    onChange={(event) => updateAiReview('monthlySourceMode', event.target.value as MonthlySourceMode)}
                  >
                    {monthlySourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="settings-field">
                  <span>
                    <strong>{zh ? '对外周报来源' : 'External weekly source'}</strong>
                    <small>{weeklySourceOptions.find((option) => option.value === aiReviewSettings.externalWeeklySourceMode)?.hint}</small>
                  </span>
                  <select
                    value={aiReviewSettings.externalWeeklySourceMode}
                    onChange={(event) => updateAiReview('externalWeeklySourceMode', event.target.value as WeeklySourceMode)}
                  >
                    {weeklySourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="settings-field">
                  <span>
                    <strong>{zh ? '对外月报来源' : 'External monthly source'}</strong>
                    <small>{monthlySourceOptions.find((option) => option.value === aiReviewSettings.externalMonthlySourceMode)?.hint}</small>
                  </span>
                  <select
                    value={aiReviewSettings.externalMonthlySourceMode}
                    onChange={(event) => updateAiReview('externalMonthlySourceMode', event.target.value as MonthlySourceMode)}
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
                onChange={(value) => updateAiReview('timeoutSeconds', Number(value) || 90)}
              />
              <Field
                label={text.aiReview.timerTime}
                hint={text.aiReview.timerTimeHint}
                value={aiReviewSettings.timerTime}
                onChange={(value) => updateAiReview('timerTime', value)}
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
                onChange={(value) => updateAiReview('backfillDays', Number(value) || 7)}
              />
            </div>
            <ToggleRow
              title={text.aiReview.timerEnable}
              description={text.aiReview.timerEnableHint}
              checked={aiReviewSettings.timerEnabled}
              onChange={(value) => updateAiReview('timerEnabled', value)}
            />
          </section>

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
              <Field label={text.aiReview.timerTime} value={aiReviewSettings.weeklyTimerTime} onChange={(value) => updateAiReview('weeklyTimerTime', value)} />
            </div>
            <ToggleRow
              title={text.aiReview.monthlyTimerEnable}
              description={text.aiReview.monthlyTimerEnableHint}
              checked={aiReviewSettings.monthlyTimerEnabled}
              onChange={(value) => updateAiReview('monthlyTimerEnabled', value)}
            />
            <div className="settings-grid settings-compact-grid">
              <Field label={text.aiReview.monthlyTimerDay} value={String(aiReviewSettings.monthlyTimerDay)} onChange={(value) => updateAiReview('monthlyTimerDay', Number(value) || 1)} />
              <Field label={text.aiReview.timerTime} value={aiReviewSettings.monthlyTimerTime} onChange={(value) => updateAiReview('monthlyTimerTime', value)} />
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
              <Field label={text.aiReview.timerTime} value={aiReviewSettings.externalWeeklyTimerTime} onChange={(value) => updateAiReview('externalWeeklyTimerTime', value)} />
            </div>
            <ToggleRow
              title={zh ? '对外月报自动生成' : 'External monthly auto generation'}
              description={zh ? '按设定时间生成上个月的脱敏对外月报。' : 'Generate an anonymized external monthly report on schedule.'}
              checked={aiReviewSettings.externalMonthlyTimerEnabled}
              onChange={(value) => updateAiReview('externalMonthlyTimerEnabled', value)}
            />
            <div className="settings-grid settings-compact-grid">
              <Field label={text.aiReview.monthlyTimerDay} value={String(aiReviewSettings.externalMonthlyTimerDay)} onChange={(value) => updateAiReview('externalMonthlyTimerDay', Number(value) || 1)} />
              <Field label={text.aiReview.timerTime} value={aiReviewSettings.externalMonthlyTimerTime} onChange={(value) => updateAiReview('externalMonthlyTimerTime', value)} />
            </div>
            <ToggleRow
              title={zh ? '对外报告轻量脱敏' : 'Light anonymization for external reports'}
              description={zh ? '默认开启，生成对外周报/月报时弱化私人细节和敏感表述。' : 'Enabled by default to soften private details in external reports.'}
              checked={aiReviewSettings.anonymizeExternalReports}
              onChange={(value) => updateAiReview('anonymizeExternalReports', value)}
            />
          </section>
        </div>
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
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
