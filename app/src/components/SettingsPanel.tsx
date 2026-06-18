import { CSSProperties, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AppBehaviorSettings,
  AppLanguage,
  ObsidianTemplateSettings,
} from '../../shared/appSettings';
import { PersonalizationSettings, OPACITY_KEYS, OpacityKey } from '../types/personalization';
import { Task } from '../types/task';
import { THEME_PRESETS, ThemePreset } from '../types/themePresets';
import { getShellText } from '../i18n';
import {
  AiReviewSettings,
  AiProfile,
  WeeklySourceMode,
  MonthlySourceMode,
  createDefaultAiReviewSettings,
  createDefaultAiProfile,
} from '../../shared/aiReview/aiReviewSettings';
import type { SyncPreview } from '../../shared/obsidianTemplates';
import type { AiReviewProgressEvent, AiReviewRunDiagnostic } from '../../shared/aiReview/runDiagnostics';

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
function RangeControl({
  label,
  hint,
  value,
  min,
  max,
  unit = '',
  onChange,
  defaultValue,
  resetTitle,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
  defaultValue?: number;
  resetTitle?: string;
}) {
  const handleReset = () => {
    if (typeof defaultValue === 'number') onChange(defaultValue);
  };
  const title = typeof defaultValue === 'number' ? resetTitle : undefined;

  return (
    <label className="settings-control" onDoubleClick={handleReset} title={title}>
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <div className="settings-range-row">
        <input
          className="settings-range-input"
          type="range"
          min={min}
          max={max}
          value={value}
          onDoubleClick={handleReset}
          onChange={(event) => onChange(Number(event.target.value))}
          title={title}
        />
        <b>{value}{unit}</b>
      </div>
    </label>
  );
}

/** 当前主题的推荐设置（用于透明度建议与"恢复建议值"）。 */
function getThemeRecommendation(settings: PersonalizationSettings): PersonalizationSettings {
  const preset =
    THEME_PRESETS.find((item) => item.id === settings.themeId) ||
    THEME_PRESETS.find((item) => item.id === 'minimal');
  return preset?.settings || settings;
}

/** 读取某个透明度字段，按旧数据兼容规则回退到 control/panel。 */
function opacityValue(settings: PersonalizationSettings, key: OpacityKey): number {
  return settings[key] ?? settings.controlOpacity ?? settings.panelOpacity;
}

/** 全局玻璃透明度以窗口透明度为主，缺失时回退到内容透明度。 */
function glassOpacityValue(settings: PersonalizationSettings): number {
  return settings.windowOpacity ?? settings.panelOpacity;
}

function withUnifiedGlassOpacity(settings: PersonalizationSettings, value: number): PersonalizationSettings {
  const next = { ...settings };
  for (const key of OPACITY_KEYS) {
    next[key] = value;
  }
  return next;
}

const OPACITY_SLIDER_MIN = 20;
const OPACITY_SLIDER_MAX = 100;

function Field({
  label,
  value,
  onChange,
  multiline = false,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="settings-field">
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      {multiline ? (
        <textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function AutoStartToggle() {
  const [autoStart, setAutoStart] = useState(false);

  useEffect(() => {
    window.electronAPI?.getAutoStart().then(setAutoStart);
  }, []);

  const handleChange = (enabled: boolean) => {
    window.electronAPI?.setAutoStart(enabled).then((ok) => {
      if (ok) setAutoStart(enabled);
    });
  };

  return (
    <button
      type="button"
      className={`settings-switch-row ${autoStart ? 'settings-switch-on' : ''}`}
      onClick={() => handleChange(!autoStart)}
      aria-pressed={autoStart}
    >
      <span>
        <strong>开机自启</strong>
        <small>启动系统时自动运行 Daily Todo</small>
      </span>
      <i aria-hidden="true" />
    </button>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`settings-switch-row ${checked ? 'settings-switch-on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <i aria-hidden="true" />
    </button>
  );
}

type AiReviewText = ReturnType<typeof getShellText>['settings']['aiReview'];
type GenerationAction = 'daily' | 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly';
type ReportProfileKey = 'dailyReviewProfileId' | 'weeklyReportProfileId' | 'monthlyReportProfileId';

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function previousWeekDate() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return formatLocalDate(date);
}

function previousMonthStart() {
  const date = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  return formatLocalDate(date);
}

function resultMessage(text: AiReviewText, result: { ok: boolean; error?: string; filePath?: string; truncated?: boolean }) {
  if (!result.ok) return `${text.genFailed}${result.error ?? '未知错误'}`;
  const prefix = result.truncated ? text.genTruncated : text.genSuccess;
  return `${prefix}${result.filePath ?? '完成'}`;
}

function progressStatusLabel(event: AiReviewProgressEvent | null) {
  if (!event) return '';
  if (event.message) return event.message;
  if (event.stageKey === 'requestAi') return '正在请求 AI / Requesting AI';
  return event.label;
}

function progressDisplay(currentProgress: AiReviewProgressEvent | null, fallback: string) {
  return progressStatusLabel(currentProgress) || fallback;
}

function initialProgressForAction(action: GenerationAction): AiReviewProgressEvent {
  const reportKind = action === 'daily' ? 'daily' : action.includes('Monthly') ? 'monthly' : 'weekly';
  return {
    reportKind,
    stageKey: 'prepareMaterials',
    label: '准备素材',
    status: 'running',
    message: '准备真实进度',
    at: new Date().toISOString(),
  };
}

function DiagnosticCard({ diagnostic, onClose }: { diagnostic: AiReviewRunDiagnostic; onClose: () => void }) {
  const usage = diagnostic.usage;
  return (
    <div className="settings-preview-list settings-generation-status">
      <div className="settings-row-header">
        <strong>运行诊断</strong>
        <button type="button" className="settings-reset-button" onClick={onClose}>关闭</button>
      </div>
      <p>{diagnostic.profile.profileName || diagnostic.profile.model} · {diagnostic.profile.provider} · {diagnostic.finalStatus}</p>
      <p>{usage && usage.source !== 'missing' ? `Token：${usage.totalTokens ?? '-'}（输入 ${usage.promptTokens ?? '-'} / 输出 ${usage.completionTokens ?? '-'}）` : '服务未返回 token 用量'}</p>
      {diagnostic.error && <p>{diagnostic.error}</p>}
    </div>
  );
}

function finishProgress(action: GenerationAction, ok: boolean): AiReviewProgressEvent {
  return {
    reportKind: action === 'daily' ? 'daily' : action.includes('Monthly') ? 'monthly' : 'weekly',
    stageKey: 'confirmResult',
    label: ok ? '完成' : '失败',
    status: ok ? 'completed' : 'failed',
    message: ok ? '完成' : '失败',
    at: new Date().toISOString(),
  };
}

const AI_PRESETS: Array<{ id: string; label: string; baseUrl: string; provider: AiProfile['provider']; model: string }> = [
  { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', provider: 'auto', model: 'deepseek-chat' },
  { id: 'openai', label: 'OpenAI (GPT)', baseUrl: 'https://api.openai.com/v1', provider: 'auto', model: 'gpt-4o-mini' },
  { id: 'glm', label: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', provider: 'auto', model: 'glm-4-flash' },
  { id: 'minimax', label: 'MiniMax', baseUrl: 'https://api.minimax.chat/v1', provider: 'auto', model: 'abab6.5s-chat' },
  { id: 'claude', label: 'Claude (Anthropic)', baseUrl: 'https://api.anthropic.com', provider: 'anthropic', model: 'claude-3-5-haiku-latest' },
  { id: 'gemini', label: 'Gemini (Google)', baseUrl: 'https://generativelanguage.googleapis.com', provider: 'gemini', model: 'gemini-1.5-flash' },
];

/** CC Switch 式账号管理弹窗：左侧账号列表，右侧选中账号的完整设置。 */
function AiAccountManager({
  text,
  profiles,
  activeId,
  editingId,
  onSelectEditing,
  onSetActive,
  onUpdate,
  onAdd,
  onDuplicate,
  onDelete,
  onClose,
}: {
  text: AiReviewText;
  profiles: AiProfile[];
  activeId: string;
  editingId: string;
  onSelectEditing: (id: string) => void;
  onSetActive: (id: string) => void;
  onUpdate: (id: string, patch: Partial<AiProfile>) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const editing =
    profiles.find((p) => p.id === editingId) ?? profiles.find((p) => p.id === activeId) ?? profiles[0];
  const activePreset = AI_PRESETS.find((p) => p.baseUrl === editing.baseUrl)?.id ?? 'custom';

  // 一键拉模型：按账号 id 缓存结果，切换账号时各看各的。
  const [modelsByProfile, setModelsByProfile] = useState<Record<string, string[]>>({});
  const [modelStatus, setModelStatus] = useState('');
  const [fetchingModels, setFetchingModels] = useState(false);
  const fetchedModels = modelsByProfile[editing.id] ?? [];

  const fetchModels = async () => {
    setFetchingModels(true);
    setModelStatus(text.modelFetching);
    try {
      const res = await window.electronAPI?.aiReview.listModels({
        baseUrl: editing.baseUrl,
        apiKey: editing.apiKey,
        provider: editing.provider,
      });
      if (!res || !res.ok) {
        setModelStatus(`${text.modelFetchFailed}${res?.error ?? ''}`);
        return;
      }
      setModelsByProfile((prev) => ({ ...prev, [editing.id]: res.models }));
      setModelStatus(`${text.modelFetchOk}${res.models.length}`);
    } catch (error) {
      setModelStatus(`${text.modelFetchFailed}${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setFetchingModels(false);
    }
  };

  return (
    <div className="ai-account-backdrop" onClick={onClose}>
      <div className="ai-account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-account-header">
          <div>
            <h3>{text.manageTitle}</h3>
            {editing && <p>{editing.name || editing.model || editing.id}</p>}
          </div>
          <div className="ai-account-header-actions">
            <button type="button" className="settings-reset-button" onClick={onAdd}>{text.accountAdd}</button>
            <button type="button" className="settings-reset-button" onClick={() => onDuplicate(editing.id)}>{text.accountCopy}</button>
            <button
              type="button"
              className="settings-reset-button"
              disabled={editing.id === activeId}
              onClick={() => onSetActive(editing.id)}
            >
              {editing.id === activeId ? text.accountIsActive : text.setActive}
            </button>
            <button
              type="button"
              className="settings-reset-button settings-danger-button"
              disabled={profiles.length <= 1}
              onClick={() => onDelete(editing.id)}
            >
              {text.accountDelete}
            </button>
            <button type="button" className="ai-account-close" onClick={onClose} aria-label={text.close}>✕</button>
          </div>
        </div>
        <div className="ai-account-body">
          <div className="ai-account-list">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`ai-account-item ${p.id === editing.id ? 'ai-account-item-selected' : ''}`}
                onClick={() => onSelectEditing(p.id)}
              >
                <span className="ai-account-item-name">
                  {p.id === activeId ? '● ' : '○ '}{p.name || p.id}
                </span>
                <small>{p.model}</small>
              </button>
            ))}
            <div className="ai-account-list-actions">
              <button type="button" className="settings-reset-button" onClick={onAdd}>{text.accountAdd}</button>
              <button type="button" className="settings-reset-button" onClick={() => onDuplicate(editing.id)}>{text.accountCopy}</button>
            </div>
          </div>

          <div className="ai-account-detail settings-grid">
            <Field
              label={text.accountName}
              hint={text.accountNameHint}
              value={editing.name}
              onChange={(v) => onUpdate(editing.id, { name: v })}
            />
            <label className="settings-field">
              <span>
                <strong>{text.preset}</strong>
                <small>{text.presetHint}</small>
              </span>
              <select
                value={activePreset}
                onChange={(event) => {
                  const preset = AI_PRESETS.find((p) => p.id === event.target.value);
                  if (preset) onUpdate(editing.id, { baseUrl: preset.baseUrl, provider: preset.provider, model: preset.model });
                }}
              >
                {AI_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
                <option value="custom">{text.presetCustom}</option>
              </select>
            </label>
            <label className="settings-field">
              <span>
                <strong>{text.provider}</strong>
                <small>{text.providerHint}</small>
              </span>
              <select
                value={editing.provider}
                onChange={(event) => onUpdate(editing.id, { provider: event.target.value as AiProfile['provider'] })}
              >
                <option value="auto">{text.providerAuto}</option>
                <option value="openai">{text.providerOpenai}</option>
                <option value="anthropic">{text.providerAnthropic}</option>
                <option value="gemini">{text.providerGemini}</option>
              </select>
            </label>
            <Field
              label={text.baseUrl}
              hint={text.baseUrlHint}
              value={editing.baseUrl}
              onChange={(v) => onUpdate(editing.id, { baseUrl: v })}
            />
            <label className="settings-field">
              <span>
                <strong>{text.apiKey}</strong>
                <small>{text.apiKeyHint}</small>
              </span>
              <input
                type="password"
                value={editing.apiKey}
                onChange={(event) => onUpdate(editing.id, { apiKey: event.target.value })}
              />
            </label>
            <Field
              label={text.model}
              hint={text.modelHint}
              value={editing.model}
              onChange={(v) => onUpdate(editing.id, { model: v })}
            />
            <div className="settings-field">
              <span>
                <strong>{text.modelFetch}</strong>
                <small>{text.modelFetchHint}</small>
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="settings-reset-button"
                  disabled={fetchingModels || !editing.apiKey || !editing.baseUrl}
                  onClick={fetchModels}
                >
                  {fetchingModels ? text.modelFetching : text.modelFetch}
                </button>
                {fetchedModels.length > 0 && (
                  <select
                    value={fetchedModels.includes(editing.model) ? editing.model : ''}
                    onChange={(e) => e.target.value && onUpdate(editing.id, { model: e.target.value })}
                    style={{ flex: '1 1 180px' }}
                    aria-label={text.modelFetch}
                  >
                    <option value="">{text.modelPick}</option>
                    {fetchedModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                )}
              </div>
              {modelStatus && <small style={{ wordBreak: 'break-all' }}>{modelStatus}</small>}
            </div>
            <label className="settings-field">
              <span>
                <strong>{text.requestTimeout}</strong>
                <small>{text.requestTimeoutHint}</small>
              </span>
              <input
                type="number"
                min={10}
                max={600}
                value={editing.timeoutSeconds}
                onChange={(event) => {
                  const raw = Number(event.target.value);
                  if (!Number.isFinite(raw)) return;
                  onUpdate(editing.id, { timeoutSeconds: Math.min(600, Math.max(10, Math.round(raw))) });
                }}
              />
            </label>
            <label className="settings-field">
              <span>
                <strong>{text.maxTokens}</strong>
                <small>{text.maxTokensHint}</small>
              </span>
              <input
                type="number"
                min={256}
                max={32768}
                step={256}
                value={editing.maxTokens ?? 8192}
                onChange={(event) => {
                  const raw = Number(event.target.value);
                  if (!Number.isFinite(raw)) return;
                  onUpdate(editing.id, { maxTokens: Math.min(32768, Math.max(256, Math.round(raw))) });
                }}
              />
            </label>
            <Field
              label={text.accountNote}
              hint={text.accountNoteHint}
              value={editing.note ?? ''}
              onChange={(v) => onUpdate(editing.id, { note: v })}
            />
            <p className="ai-account-balance">{text.balancePlaceholder}</p>
            <div className="ai-account-detail-actions">
              <button
                type="button"
                className="settings-reset-button"
                disabled={editing.id === activeId}
                onClick={() => {
                  onSetActive(editing.id);
                  onClose();
                }}
              >
                {editing.id === activeId ? text.accountIsActive : text.setActive}
              </button>
              <button
                type="button"
                className="settings-reset-button"
                disabled={profiles.length <= 1}
                onClick={() => onDelete(editing.id)}
              >
                {text.accountDelete}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 轻量 AI 账号区，仅展示当前账号 + 管理按钮，不依赖 AiReviewSection 的复杂状态。 */
function AiAccountZone({ text, settings, onChange }: { text: AiReviewText; settings: AiReviewSettings; onChange: (settings: AiReviewSettings) => void }) {
  const [showManager, setShowManager] = useState(false);
  const [editingId, setEditingId] = useState('');

  const profiles = settings.profiles?.length ? settings.profiles : [];
  const active = profiles.find((p) => p.id === settings.activeProfileId) ?? profiles[0];

  const saveSettings = (next: AiReviewSettings) => {
    onChange(next);
    window.electronAPI?.aiReview.setSettings(next);
  };

  return (
    <>
      <div className="settings-field ai-account-inline-row">
        <span className="ai-account-inline-copy">
          <strong>{text.account}</strong>
          <small>{text.accountHint}</small>
        </span>
        <div className="ai-account-inline-actions">
          <select
            value={active?.id ?? ''}
            onChange={(event) => saveSettings({ ...settings, activeProfileId: event.target.value })}
            aria-label={text.currentAccount}
          >
            {profiles.length === 0 && <option value="">—</option>}
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.name || profile.model || profile.id}</option>
            ))}
          </select>
          <button
            type="button"
            className="settings-reset-button"
            onClick={() => { setEditingId(active?.id ?? ''); setShowManager(true); }}
          >
            {text.manageAccounts ?? '管理'}
          </button>
        </div>
      </div>
      {showManager && (
        <AiAccountManager
          text={text}
          profiles={profiles}
          activeId={active?.id ?? ''}
          editingId={editingId}
          onSelectEditing={setEditingId}
          onSetActive={(id) => saveSettings({ ...settings, activeProfileId: id })}
          onUpdate={(id, patch) => saveSettings({ ...settings, profiles: profiles.map((p) => p.id === id ? { ...p, ...patch } : p) })}
          onAdd={() => {
            const newP: AiProfile = { ...createDefaultAiProfile(), name: text.accountNewName ?? '新账号' };
            saveSettings({ ...settings, profiles: [...profiles, newP], activeProfileId: newP.id });
            setEditingId(newP.id);
          }}
          onDuplicate={(id) => {
            const src = profiles.find((p) => p.id === id);
            if (!src) return;
            const newId = Math.random().toString(36).slice(2);
            saveSettings({ ...settings, profiles: [...profiles, { ...src, id: newId, name: `${src.name} ${text.accountCopySuffix ?? '副本'}` }] });
            setEditingId(newId);
          }}
          onDelete={(id) => {
            if (profiles.length <= 1) return;
            const next = profiles.filter((p) => p.id !== id);
            saveSettings({ ...settings, profiles: next, activeProfileId: next[0]?.id ?? '' });
            setEditingId(next[0]?.id ?? '');
          }}
          onClose={() => setShowManager(false)}
        />
      )}
    </>
  );
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

  const updateApp = <K extends keyof AppBehaviorSettings>(key: K, value: AppBehaviorSettings[K]) => {
    onAppSettingsChange({ ...appSettings, [key]: value });
  };

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
        const result = await window.electronAPI?.aiReview.runForDate(selectedDate, tasks);
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
        <div className="settings-section-content">
          <section className="settings-zone">
            <h3>{zh ? '模板' : text.settingsZones.templateSettings}</h3>
            {[
              { label: zh ? '日报模板' : 'Daily template', kind: 'daily' as const },
              { label: zh ? '个人周报模板' : 'Personal weekly template', kind: 'personalWeekly' as const },
              { label: zh ? '个人月报模板' : 'Personal monthly template', kind: 'personalMonthly' as const },
              { label: zh ? '对外周报模板' : 'External weekly template', kind: 'externalWeekly' as const },
              { label: zh ? '对外月报模板' : 'External monthly template', kind: 'externalMonthly' as const },
            ].map(({ label, kind }) => (
              <div className="settings-field" key={kind}>
                <span><strong>{label}</strong></span>
                <button
                  type="button"
                  className="settings-reset-button"
                  onClick={() => onEditTemplate?.(kind)}
                >
                  {zh ? '编辑 →' : 'Edit →'}
                </button>
              </div>
            ))}
          </section>
        </div>
      )}

      {section === 'schedule' && (
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
              {generationStatus && <div className="settings-preview-list settings-generation-status"><p>{generationStatus}</p>{currentProgress && <small>{progressStatusLabel(currentProgress)}</small>}</div>}
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
        <>
          <section className="settings-section">
            <h3>{text.language}</h3>
            <label className="settings-field">
              <span>
                <strong>{zh ? '语言' : 'Language'}</strong>
                <small>{text.languageHint}</small>
              </span>
              <select value={appSettings.language} onChange={(event) => updateApp('language', event.target.value as AppLanguage)}>
                <option value="zh-CN">中文</option>
                <option value="en-US">English</option>
              </select>
            </label>
          </section>

          <section className="settings-section">
            <h3>{zh ? '窗口行为' : 'Window Behavior'}</h3>
            <AutoStartToggle />
            <ToggleRow
              title={zh ? '关闭时最小化到托盘' : 'Minimize to tray on close'}
              description={zh ? '点关闭按钮时隐藏到系统托盘；关闭后仍可从托盘恢复。' : 'Hide the app to the system tray when the close button is clicked.'}
              checked={appSettings.minimizeToTrayOnClose}
              onChange={(value) => updateApp('minimizeToTrayOnClose', value)}
            />
            <ToggleRow
              title={zh ? '启动时窗口置顶' : 'Always on top on start'}
              description={zh ? '应用启动时自动置顶' : 'Keep window always on top'}
              checked={settings.alwaysOnTop ?? false}
              onChange={(value) => onChange({ ...settings, alwaysOnTop: value })}
            />
          </section>
        </>
      )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
