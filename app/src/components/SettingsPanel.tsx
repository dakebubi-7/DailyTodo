import { CSSProperties, ReactNode, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AppBehaviorSettings,
  AppLanguage,
  ObsidianTemplateSettings,
  createDefaultObsidianTemplateSettings,
} from '../../shared/appSettings';
import { SyncPreview } from '../../shared/obsidianTemplates';
import { PersonalizationSettings } from '../types/personalization';
import { Task } from '../types/task';
import { THEME_PRESETS, ThemePreset } from '../types/themePresets';
import { getShellText } from '../i18n';
import {
  AiReviewSettings,
  AiProfile,
  createDefaultAiReviewSettings,
  createDefaultAiProfile,
  resolveActiveProfile,
} from '../../shared/aiReview/aiReviewSettings';
import {
  selectProfile,
  updateProfile,
  addProfile,
  duplicateProfile,
  deleteProfile,
} from '../../shared/aiReview/profileOps';
import {
  SectionConfig,
  SectionType,
  createDefaultSections,
} from '../../shared/aiReview/sectionConfig';
import { isoWeekKey, isoWeekToMonday } from '../../shared/aiReview/weekly';

type SettingsSection = 'root' | 'personalization' | 'obsidian' | 'rollover' | 'ai-review' | 'general' | 'developer' | 'theme-minimal' | 'theme-neumorphism' | 'theme-watercolor' | 'theme-invisible' | 'window';

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
  onChange: (settings: PersonalizationSettings) => void;
  onAppSettingsChange: (settings: AppBehaviorSettings) => void;
  onObsidianTemplatesChange: (settings: ObsidianTemplateSettings) => void;
  onChooseObsidian: () => void;
  onPreviewSync: () => void;
  onResetTemplates: () => void;
  onClose: () => void;
  onOpenCompanionSettings: () => void;
}

type NavSection = 'personalization' | 'window' | 'obsidian' | 'rollover' | 'ai-review' | 'general' | 'developer';

const sectionEntries: Array<{ key: NavSection; title: string; description: string }> = [
  { key: 'personalization', title: 'Personalization', description: '外观、透明度、密度和动效。' },
  { key: 'window', title: 'Window', description: '窗口行为、置顶、自启动。' },
  { key: 'obsidian', title: 'Obsidian Sync', description: '路径、删除同步、模板中心和预览。' },
  { key: 'rollover', title: 'Daily Rollover', description: '业务日期和任务结转规则。' },
  { key: 'ai-review', title: 'AI Review', description: 'API 配置、定时生成和复盘段落。' },
  { key: 'general', title: 'General', description: '语言等低频偏好。' },
  { key: 'developer', title: 'Developer', description: '高级模板、调试入口和代码结构说明。' },
];

function RangeControl({
  label,
  hint,
  value,
  min,
  max,
  unit = '',
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="settings-control">
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <div className="settings-range-row">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <b>{value}{unit}</b>
      </div>
    </label>
  );
}

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

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
/** 报告周期默认值：上一周(ISO 周键) + 上个月(月键)。用户可在选择器里改。 */
function defaultReportPeriods(now: Date): { week: string; month: string } {
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // 上月最后一天
  return {
    week: isoWeekKey(ymd(lastWeek)),
    month: `${prevMonthEnd.getFullYear()}-${pad2(prevMonthEnd.getMonth() + 1)}`,
  };
}

/** 可折叠区块：标题行点按展开/收起。默认收起，账号区块传 defaultOpen。 */
function Collapsible({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="settings-section">
      <button
        type="button"
        className="settings-collapsible-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <h3>{title}</h3>
        <span className="settings-collapsible-caret" aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="settings-collapsible-body">{children}</div>}
    </section>
  );
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
          <h3>{text.manageTitle}</h3>
          <button type="button" className="ai-account-close" onClick={onClose} aria-label={text.close}>✕</button>
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


function AiReviewSection({ text, tasks }: { text: AiReviewText; tasks: Task[] }) {
  const [settings, setSettings] = useState<AiReviewSettings>(() => createDefaultAiReviewSettings());
  const [sections, setSections] = useState<SectionConfig[]>(() => createDefaultSections());
  const [openPrompt, setOpenPrompt] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<string>('');
  const [templateDraft, setTemplateDraft] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const [recognizeStatus, setRecognizeStatus] = useState<string>('');
  const [recognizedSections, setRecognizedSections] = useState<SectionConfig[] | null>(null);
  // 报告模板展开 + 认报告模板（个人周/月 + 对外周/月 各一套）
  const [openTemplate, setOpenTemplate] = useState<'weekly' | 'monthly' | 'ext-weekly' | 'ext-monthly' | null>(null);
  const [reportDraft, setReportDraft] = useState<{ weekly: string; monthly: string; 'ext-weekly': string; 'ext-monthly': string }>({ weekly: '', monthly: '', 'ext-weekly': '', 'ext-monthly': '' });
  const [reportRecognizing, setReportRecognizing] = useState<'weekly' | 'monthly' | 'ext-weekly' | 'ext-monthly' | null>(null);
  const [reportRecognizeStatus, setReportRecognizeStatus] = useState<{ weekly: string; monthly: string; 'ext-weekly': string; 'ext-monthly': string }>({ weekly: '', monthly: '', 'ext-weekly': '', 'ext-monthly': '' });
  const [reportRecognized, setReportRecognized] = useState<{ weekly: string | null; monthly: string | null; 'ext-weekly': string | null; 'ext-monthly': string | null }>({ weekly: null, monthly: null, 'ext-weekly': null, 'ext-monthly': null });
  // 报告周期：默认上一周期(上周/上月)，用户可改。生成时换算成该周期内的一个日期传给主进程。
  const [weekPeriod, setWeekPeriod] = useState(() => defaultReportPeriods(new Date()).week);
  const [monthPeriod, setMonthPeriod] = useState(() => defaultReportPeriods(new Date()).month);
  const weekDate = isoWeekToMonday(weekPeriod);
  const monthDate = `${monthPeriod}-01`;

  useEffect(() => {
    let active = true;
    window.electronAPI?.aiReview.getSettings().then((value) => {
      if (active) setSettings(value);
    });
    window.electronAPI?.aiReview.getSections().then((value) => {
      if (active && value.length) setSections(value);
    });
    return () => {
      active = false;
    };
  }, []);

  // 持久化：函数式更新 + fire-and-forget 保存（不再用 IPC 返回值回写覆盖，根治并发竞态）。
  const persist = (updater: (prev: AiReviewSettings) => AiReviewSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      void window.electronAPI?.aiReview.setSettings(next);
      return next;
    });
  };

  const updateSettings = <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) => {
    persist((prev) => ({ ...prev, [key]: value }));
  };

  // 轻量多账号：当前生效账号 + 增删改/切换/复制（数据变换走 shared/profileOps 纯函数）。
  const active = resolveActiveProfile(settings);
  const profiles = settings.profiles.length ? settings.profiles : [active];

  const [manageOpen, setManageOpen] = useState(false);
  const [editingId, setEditingId] = useState('');

  const openManager = () => {
    setEditingId(active.id);
    setManageOpen(true);
  };
  const handleSelectProfile = (id: string) => persist((prev) => selectProfile(prev, id));
  const handleUpdateProfile = (id: string, patch: Partial<AiProfile>) => persist((prev) => updateProfile(prev, id, patch));
  const handleAddProfile = () => {
    const p: AiProfile = { ...createDefaultAiProfile(), name: text.accountNewName };
    setEditingId(p.id);
    persist((prev) => addProfile(prev, p));
  };
  const handleDuplicateProfile = (id: string) => {
    const newId = createDefaultAiProfile().id;
    setEditingId(newId);
    persist((prev) => {
      const src = prev.profiles.find((p) => p.id === id);
      return duplicateProfile(prev, id, newId, `${src?.name ?? ''} ${text.accountCopySuffix}`.trim());
    });
  };
  const handleDeleteProfile = (id: string) => {
    const fallback = createDefaultAiProfile();
    persist((prev) => deleteProfile(prev, id, fallback));
  };

  const updateSection = <K extends keyof SectionConfig>(markerKey: SectionConfig['markerKey'], key: K, value: SectionConfig[K]) => {
    const next = sections.map((s) => (s.markerKey === markerKey ? { ...s, [key]: value } : s));
    setSections(next);
    window.electronAPI?.aiReview.setSections(next).then((saved) => {
      if (saved.length) setSections(saved);
    });
  };

  const runReport = async (
    kind: 'weekly' | 'monthly' | 'ext-weekly' | 'ext-monthly',
    run: () => Promise<{ ok: boolean; filePath?: string; error?: string; truncated?: boolean }>,
  ) => {
    setBusy(kind);
    setReportStatus(text.generating);
    try {
      const result = await run();
      if (!result.ok) {
        setReportStatus(`${text.genFailed}${result.error ?? ''}`);
      } else {
        const prefix = result.truncated ? text.genTruncated : text.genSuccess;
        setReportStatus(`${prefix}${result.filePath ?? ''}`);
      }
    } catch (error) {
      setReportStatus(`${text.genFailed}${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(null);
    }
  };

  // 「选文件」识别：弹文件框读出纯文本，回填到对应草稿框（保留粘贴，二者并存）。
  const pickTemplateFile = async (
    fill: (text: string) => void,
    setStatus: (status: string) => void,
  ) => {
    try {
      const res = await window.electronAPI?.aiReview.pickTemplateFile();
      if (!res || res.canceled) return;
      if (!res.ok) {
        setStatus(`${text.recognizeFileFailed}${res.error ?? ''}`);
        return;
      }
      fill(res.text ?? '');
      setStatus('');
    } catch (error) {
      setStatus(`${text.recognizeFileFailed}${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const recognizeTemplate = async () => {    if (!templateDraft.trim()) return;
    setRecognizing(true);
    setRecognizeStatus(text.recognizing);
    setRecognizedSections(null);
    try {
      const result = await window.electronAPI?.aiReview.recognizeTemplate(templateDraft);
      if (!result || !result.ok) {
        setRecognizeStatus(`${text.genFailed}${result?.error ?? ''}`);
        return;
      }
      setRecognizedSections(result.sections);
      setRecognizeStatus(result.unmatched ? text.recognizeUnmatched : text.recognizeReady);
    } catch (error) {
      setRecognizeStatus(`${text.genFailed}${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRecognizing(false);
    }
  };

  const applyRecognized = () => {
    if (!recognizedSections) return;
    setSections(recognizedSections);
    window.electronAPI?.aiReview.setSections(recognizedSections).then((saved) => {
      if (saved.length) setSections(saved);
    });
    setRecognizedSections(null);
    setRecognizeStatus('');
    setTemplateDraft('');
  };

  const rc = text.reportConfig;

  const recognizeReport = async (kind: 'weekly' | 'monthly' | 'ext-weekly' | 'ext-monthly') => {
    const draft = reportDraft[kind];
    if (!draft.trim()) return;
    setReportRecognizing(kind);
    setReportRecognizeStatus((s) => ({ ...s, [kind]: rc.recognizing }));
    setReportRecognized((s) => ({ ...s, [kind]: null }));
    try {
      const apiKind = kind === 'monthly' || kind === 'ext-monthly' ? 'monthly' : 'weekly';
      const result = await window.electronAPI?.aiReview.recognizeReportTemplate(apiKind, draft);
      if (!result || !result.ok) {
        setReportRecognizeStatus((s) => ({ ...s, [kind]: `${rc.recognizeFailed}${result?.error ?? ''}` }));
        return;
      }
      setReportRecognized((s) => ({ ...s, [kind]: result.prompt }));
      setReportRecognizeStatus((s) => ({ ...s, [kind]: rc.recognizeOk }));
    } catch (error) {
      setReportRecognizeStatus((s) => ({ ...s, [kind]: `${rc.recognizeFailed}${error instanceof Error ? error.message : String(error)}` }));
    } finally {
      setReportRecognizing(null);
    }
  };

  const applyReportPrompt = (kind: 'weekly' | 'monthly' | 'ext-weekly' | 'ext-monthly') => {
    const prompt = reportRecognized[kind];
    if (!prompt) return;
    const key =
      kind === 'weekly'
        ? 'weeklyPrompt'
        : kind === 'monthly'
          ? 'monthlyPrompt'
          : kind === 'ext-weekly'
            ? 'externalWeeklyPrompt'
            : 'externalMonthlyPrompt';
    updateSettings(key, prompt);
    setReportRecognized((s) => ({ ...s, [kind]: null }));
    setReportRecognizeStatus((s) => ({ ...s, [kind]: '' }));
    setReportDraft((s) => ({ ...s, [kind]: '' }));
    setOpenTemplate(kind);
  };

  return (
    <>
      <Collapsible title={text.title} defaultOpen>
        <ToggleRow
          title={text.enable}
          description={text.enableHint}
          checked={settings.enabled}
          onChange={(value) => updateSettings('enabled', value)}
        />
        <div className="settings-field" style={{ marginTop: 12 }}>
          <span>
            <strong>{text.account}</strong>
            <small>{text.accountHint}</small>
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={active.id}
              onChange={(event) => handleSelectProfile(event.target.value)}
              style={{ flex: '1 1 180px' }}
              aria-label={text.currentAccount}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name || p.id}</option>
              ))}
            </select>
            <button type="button" className="settings-reset-button" onClick={openManager}>{text.manage}</button>
          </div>
          <small className="ai-account-summary">
            {active.provider} · {active.model || '—'} · {active.baseUrl || '—'}
          </small>
        </div>
        <div className="settings-grid">
          <label className="settings-field">
            <span>
              <strong>{text.backfillDays}</strong>
              <small>{text.backfillDaysHint}</small>
            </span>
            <input
              type="number"
              min={1}
              max={60}
              value={settings.backfillDays}
              onChange={(event) => {
                const raw = Number(event.target.value);
                if (!Number.isFinite(raw)) return;
                const clamped = Math.min(60, Math.max(1, Math.round(raw)));
                updateSettings('backfillDays', clamped);
              }}
            />
          </label>
        </div>
      </Collapsible>

      <Collapsible title={text.timer}>
        <ToggleRow
          title={text.timerEnable}
          description={text.timerEnableHint}
          checked={settings.timerEnabled}
          onChange={(value) => updateSettings('timerEnabled', value)}
        />
        <label className="settings-field">
          <span>
            <strong>{text.timerTime}</strong>
            <small>{text.timerTimeHint}</small>
          </span>
          <input
            type="time"
            value={settings.timerTime}
            disabled={!settings.timerEnabled}
            onChange={(event) => updateSettings('timerTime', event.target.value)}
          />
        </label>

        <ToggleRow
          title={text.weeklyTimerEnable}
          description={text.weeklyTimerEnableHint}
          checked={settings.weeklyTimerEnabled}
          onChange={(value) => updateSettings('weeklyTimerEnabled', value)}
        />
        <div className="settings-grid">
          <label className="settings-field">
            <span><strong>{text.weeklyTimerWeekday}</strong></span>
            <select
              value={settings.weeklyTimerWeekday}
              disabled={!settings.weeklyTimerEnabled}
              onChange={(event) => updateSettings('weeklyTimerWeekday', Number(event.target.value))}
            >
              {text.weekdays.map((w, i) => (
                <option key={i} value={i}>{w}</option>
              ))}
            </select>
          </label>
          <label className="settings-field">
            <span><strong>{text.timerTime}</strong></span>
            <input
              type="time"
              value={settings.weeklyTimerTime}
              disabled={!settings.weeklyTimerEnabled}
              onChange={(event) => updateSettings('weeklyTimerTime', event.target.value)}
            />
          </label>
        </div>

        <ToggleRow
          title={text.monthlyTimerEnable}
          description={text.monthlyTimerEnableHint}
          checked={settings.monthlyTimerEnabled}
          onChange={(value) => updateSettings('monthlyTimerEnabled', value)}
        />
        <div className="settings-grid">
          <label className="settings-field">
            <span><strong>{text.monthlyTimerDay}</strong></span>
            <input
              type="number"
              min={1}
              max={31}
              value={settings.monthlyTimerDay}
              disabled={!settings.monthlyTimerEnabled}
              onChange={(event) => {
                const raw = Number(event.target.value);
                if (!Number.isFinite(raw)) return;
                updateSettings('monthlyTimerDay', Math.min(31, Math.max(1, Math.round(raw))));
              }}
            />
          </label>
          <label className="settings-field">
            <span><strong>{text.timerTime}</strong></span>
            <input
              type="time"
              value={settings.monthlyTimerTime}
              disabled={!settings.monthlyTimerEnabled}
              onChange={(event) => updateSettings('monthlyTimerTime', event.target.value)}
            />
          </label>
        </div>
      </Collapsible>

      <Collapsible title={text.sectionsTitle}>
        <div className="settings-preview-list">
          <p>{text.sectionsHint}</p>
        </div>
        {sections.map((sectionConfig) => {
          const isPromptOpen = openPrompt === sectionConfig.markerKey;
          return (
            <div key={sectionConfig.markerKey} className="settings-grid">
              <Field
                label={text.sectionTitle}
                value={sectionConfig.title}
                onChange={(value) => updateSection(sectionConfig.markerKey, 'title', value)}
              />
              <label className="settings-field">
                <span>
                  <strong>{text.sectionType}</strong>
                </span>
                <select
                  value={sectionConfig.type}
                  onChange={(event) => updateSection(sectionConfig.markerKey, 'type', event.target.value as SectionType)}
                >
                  <option value={SectionType.Ai}>{text.typeAi}</option>
                  <option value={SectionType.Deterministic}>{text.typeDeterministic}</option>
                </select>
              </label>
              <button
                type="button"
                className="settings-reset-button"
                onClick={() => setOpenPrompt(isPromptOpen ? null : sectionConfig.markerKey)}
                aria-expanded={isPromptOpen}
              >
                {isPromptOpen ? text.hidePrompt : text.showPrompt}
              </button>
              {isPromptOpen && (
                <Field
                  label={text.prompt}
                  value={sectionConfig.prompt}
                  multiline
                  onChange={(value) => updateSection(sectionConfig.markerKey, 'prompt', value)}
                />
              )}
            </div>
          );
        })}
      </Collapsible>

      <Collapsible title={text.reportsTitle}>
        <div className="settings-preview-list">
          <p>{text.reportsHint}</p>
        </div>
        <div className="settings-grid" style={{ marginBottom: '0.5rem' }}>
          <label className="settings-field">
            <span>
              <strong>{text.weekPeriod}</strong>
              <small>{text.weekPeriodHint}</small>
            </span>
            <input type="week" value={weekPeriod} onChange={(e) => setWeekPeriod(e.target.value)} />
          </label>
          <label className="settings-field">
            <span>
              <strong>{text.monthPeriod}</strong>
              <small>{text.monthPeriodHint}</small>
            </span>
            <input type="month" value={monthPeriod} onChange={(e) => setMonthPeriod(e.target.value)} />
          </label>
        </div>
        <div className="settings-actions-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            className="settings-reset-button"
            disabled={busy !== null}
            onClick={() => runReport('weekly', () => window.electronAPI!.aiReview.generateWeekly(weekDate, tasks))}
          >
            {busy === 'weekly' ? text.generating : text.genWeekly}
          </button>
          <button
            type="button"
            className="settings-reset-button"
            disabled={busy !== null}
            onClick={() => runReport('monthly', () => window.electronAPI!.aiReview.generateMonthly(monthDate, tasks))}
          >
            {busy === 'monthly' ? text.generating : text.genMonthly}
          </button>
          <button
            type="button"
            className="settings-reset-button"
            disabled={busy !== null}
            onClick={() => runReport('ext-weekly', () => window.electronAPI!.aiReview.generateExternal('weekly', weekDate))}
          >
            {busy === 'ext-weekly' ? text.generating : text.genExternalWeekly}
          </button>
          <button
            type="button"
            className="settings-reset-button"
            disabled={busy !== null}
            onClick={() => runReport('ext-monthly', () => window.electronAPI!.aiReview.generateExternal('monthly', monthDate))}
          >
            {busy === 'ext-monthly' ? text.generating : text.genExternalMonthly}
          </button>
        </div>
        {reportStatus && (
          <p className="settings-status" style={{ marginTop: '0.5rem', wordBreak: 'break-all' }}>{reportStatus}</p>
        )}
      </Collapsible>

      <Collapsible title={rc.title}>
        <div className="settings-preview-list">
          <p>{rc.hint}</p>
        </div>
        <div className="settings-grid">
          <Field label={rc.weeklyDir} value={settings.weeklyDir} placeholder="logs/weekly-review" onChange={(v) => updateSettings('weeklyDir', v)} />
          <Field label={rc.monthlyDir} value={settings.monthlyDir} placeholder="logs/monthly-review" onChange={(v) => updateSettings('monthlyDir', v)} />
          <Field label={rc.extWeeklyDir} value={settings.externalWeeklyDir} placeholder="exports/weekly-reports" onChange={(v) => updateSettings('externalWeeklyDir', v)} />
          <Field label={rc.extMonthlyDir} value={settings.externalMonthlyDir} placeholder="exports/monthly-reports" onChange={(v) => updateSettings('externalMonthlyDir', v)} />
        </div>

        {([
          {
            kind: 'weekly' as const,
            promptLabel: rc.weeklyPrompt,
            promptValue: settings.weeklyPrompt,
            recognizeLabel: rc.recognizeWeekly,
            settingKey: 'weeklyPrompt' as const,
          },
          {
            kind: 'monthly' as const,
            promptLabel: rc.monthlyPrompt,
            promptValue: settings.monthlyPrompt,
            recognizeLabel: rc.recognizeMonthly,
            settingKey: 'monthlyPrompt' as const,
          },
          {
            kind: 'ext-weekly' as const,
            promptLabel: rc.extWeeklyPrompt,
            promptValue: settings.externalWeeklyPrompt,
            recognizeLabel: rc.recognizeExtWeekly,
            settingKey: 'externalWeeklyPrompt' as const,
          },
          {
            kind: 'ext-monthly' as const,
            promptLabel: rc.extMonthlyPrompt,
            promptValue: settings.externalMonthlyPrompt,
            recognizeLabel: rc.recognizeExtMonthly,
            settingKey: 'externalMonthlyPrompt' as const,
          },
        ]).map(({ kind, promptLabel, promptValue, recognizeLabel, settingKey }) => {
          const isOpen = openTemplate === kind;
          return (
            <div key={kind} className="settings-grid" style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                className="settings-reset-button"
                onClick={() => setOpenTemplate(isOpen ? null : kind)}
                aria-expanded={isOpen}
              >
                {promptLabel}: {isOpen ? rc.hideTemplate : rc.showTemplate}
              </button>
              {isOpen && (
                <>
                  <Field
                    label={promptLabel}
                    value={promptValue}
                    multiline
                    onChange={(v) => updateSettings(settingKey, v)}
                  />
                  <label className="settings-field">
                    <span><strong>{recognizeLabel}</strong></span>
                    <textarea
                      rows={3}
                      placeholder={rc.recognizePlaceholder}
                      value={reportDraft[kind]}
                      onChange={(e) => setReportDraft((s) => ({ ...s, [kind]: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="settings-reset-button"
                      disabled={reportRecognizing === kind || !reportDraft[kind].trim()}
                      onClick={() => recognizeReport(kind)}
                    >
                      {reportRecognizing === kind ? rc.recognizing : rc.recognizeRun}
                    </button>
                    <button
                      type="button"
                      className="settings-reset-button"
                      disabled={reportRecognizing === kind}
                      onClick={() =>
                        pickTemplateFile(
                          (t) => setReportDraft((s) => ({ ...s, [kind]: t })),
                          (status) => setReportRecognizeStatus((s) => ({ ...s, [kind]: status })),
                        )
                      }
                    >
                      {rc.recognizeFile}
                    </button>
                    {reportRecognized[kind] && (
                      <button type="button" className="settings-reset-button" onClick={() => applyReportPrompt(kind)}>
                        {rc.recognizeApply}
                      </button>
                    )}
                  </div>
                  {reportRecognizeStatus[kind] && (
                    <p className="settings-status" style={{ wordBreak: 'break-all' }}>{reportRecognizeStatus[kind]}</p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </Collapsible>

      <Collapsible title={text.recognizeTitle}>
        <div className="settings-preview-list">
          <p>{text.recognizeHint}</p>
        </div>
        <textarea
          className="settings-textarea"
          rows={4}
          placeholder={text.recognizePlaceholder}
          value={templateDraft}
          onChange={(event) => setTemplateDraft(event.target.value)}
          style={{ width: '100%' }}
        />
        <div className="settings-actions-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="settings-reset-button"
            disabled={recognizing || !templateDraft.trim()}
            onClick={recognizeTemplate}
          >
            {recognizing ? text.recognizing : text.recognizeButton}
          </button>
          <button
            type="button"
            className="settings-reset-button"
            disabled={recognizing}
            onClick={() => pickTemplateFile(setTemplateDraft, setRecognizeStatus)}
          >
            {text.recognizeFile}
          </button>
          {recognizedSections && (
            <button type="button" className="settings-reset-button" onClick={applyRecognized}>
              {text.recognizeApply}
            </button>
          )}
        </div>
        {recognizeStatus && (
          <p className="settings-status" style={{ marginTop: '0.5rem' }}>{recognizeStatus}</p>
        )}
      </Collapsible>

      {manageOpen && (
        <AiAccountManager
          text={text}
          profiles={profiles}
          activeId={active.id}
          editingId={editingId}
          onSelectEditing={setEditingId}
          onSetActive={handleSelectProfile}
          onUpdate={handleUpdateProfile}
          onAdd={handleAddProfile}
          onDuplicate={handleDuplicateProfile}
          onDelete={handleDeleteProfile}
          onClose={() => setManageOpen(false)}
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
  onChange,
  onAppSettingsChange,
  onObsidianTemplatesChange,
  onChooseObsidian,
  onPreviewSync,
  onResetTemplates,
  onClose,
  onOpenCompanionSettings,
}: SettingsPanelProps) {
  const [section, setSection] = useState<SettingsSection>('root');
  const defaultTemplates = useMemo(() => createDefaultObsidianTemplateSettings(), []);
  const text = getShellText(appSettings.language).settings;

  useEffect(() => {
    if (isOpen) setSection('root');
  }, [isOpen]);

  if (!isOpen) return null;

  const updatePersonalization = <K extends keyof PersonalizationSettings>(key: K, value: PersonalizationSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const updateApp = <K extends keyof AppBehaviorSettings>(key: K, value: AppBehaviorSettings[K]) => {
    onAppSettingsChange({ ...appSettings, [key]: value });
  };

  const updateTemplate = <K extends keyof ObsidianTemplateSettings>(key: K, value: ObsidianTemplateSettings[K]) => {
    onObsidianTemplatesChange({ ...obsidianTemplates, [key]: value });
  };

  const title = section === 'root'
    ? text.title
    : sectionEntries.find((entry) => entry.key === section)?.title || '设置';

  return (
    <motion.aside
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="settings-panel"
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <div className="settings-panel-header">
        <div>
          {section !== 'root' && (
            <button type="button" className="settings-back-button" onClick={() => setSection('root')}>
              {text.back}
            </button>
          )}
          <h2>{title}</h2>
          <p>{text.intro}</p>
        </div>
        <button onClick={onClose} className="settings-icon-button" aria-label={text.close} title={text.close}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {section === 'root' && (
        <div className="settings-nav-list">
          {sectionEntries.map((entry) => (
            <button key={entry.key} type="button" className="settings-nav-item" onClick={() => setSection(entry.key)}>
              <span>
                <strong>{text.sections[entry.key][0]}</strong>
                <small>{text.sections[entry.key][1]}</small>
              </span>
              <b>›</b>
            </button>
          ))}
        </div>
      )}

      {section === 'personalization' && (
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
                    {active && (
                      <button
                        className="theme-preset-edit"
                        title={appSettings.language === 'zh-CN' ? '调整透明度' : 'Adjust Opacity'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSection(`theme-${preset.id}` as SettingsSection);
                        }}
                        aria-label={appSettings.language === 'zh-CN' ? '调整透明度' : 'Adjust Opacity'}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="settings-section">
            <h3>{appSettings.language === 'zh-CN' ? '字体大小' : 'Font Size'}</h3>
            <div className="settings-grid">
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '全局字体' : 'Global Font'}
                hint={appSettings.language === 'zh-CN' ? '整体放大或缩小文字，100 为默认' : 'Scale all text, 100 = default'}
                value={settings.fontScale ?? 100}
                min={80}
                max={130}
                unit="%"
                onChange={(value) => updatePersonalization('fontScale', value)}
              />
            </div>
          </section>
        </>
      )}

      {section === 'theme-minimal' && (
        <>
          <button className="settings-back-button" onClick={() => setSection('personalization')}>
            ← {appSettings.language === 'zh-CN' ? '返回外观设置' : 'Back to Appearance'}
          </button>

          <section className="settings-section">
            <h3>{appSettings.language === 'zh-CN' ? '极简纯白 - 透明度' : 'Minimal White - Opacity'}</h3>
            <div className="settings-grid">
              <RangeControl label={text.windowOpacity} hint={text.windowOpacityHint} value={settings.windowOpacity} min={0} max={100} unit="%" onChange={(value) => updatePersonalization('windowOpacity', value)} />
              <RangeControl label={text.panelOpacity} hint={text.panelOpacityHint} value={settings.panelOpacity} min={0} max={100} unit="%" onChange={(value) => updatePersonalization('panelOpacity', value)} />
              <RangeControl label={text.blur} value={settings.blurStrength} min={0} max={36} unit="px" onChange={(value) => updatePersonalization('blurStrength', value)} />
              <RangeControl label={text.radius} value={settings.radius} min={4} max={36} unit="px" onChange={(value) => updatePersonalization('radius', value)} />
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

      {section === 'theme-neumorphism' && (
        <>
          <button className="settings-back-button" onClick={() => setSection('personalization')}>
            ← {appSettings.language === 'zh-CN' ? '返回外观设置' : 'Back to Appearance'}
          </button>

          <section className="settings-section">
            <h3>{appSettings.language === 'zh-CN' ? '新拟态 - 基础透明度' : 'Neumorphism - Basic Opacity'}</h3>
            <div className="settings-grid">
              <RangeControl label={text.windowOpacity} hint={text.windowOpacityHint} value={settings.windowOpacity} min={0} max={100} unit="%" onChange={(value) => updatePersonalization('windowOpacity', value)} />
              <RangeControl label={text.panelOpacity} hint={text.panelOpacityHint} value={settings.panelOpacity} min={0} max={100} unit="%" onChange={(value) => updatePersonalization('panelOpacity', value)} />
              <RangeControl label={text.blur} value={settings.blurStrength} min={0} max={36} unit="px" onChange={(value) => updatePersonalization('blurStrength', value)} />
              <RangeControl label={text.radius} value={settings.radius} min={4} max={36} unit="px" onChange={(value) => updatePersonalization('radius', value)} />
            </div>
          </section>

          <section className="settings-section">
            <h3>{appSettings.language === 'zh-CN' ? '新拟态 - 高级透明度' : 'Neumorphism - Advanced Opacity'}</h3>
            <div className="settings-grid">
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '顶部区域' : 'Top Area'}
                hint={appSettings.language === 'zh-CN' ? '标题栏和头部' : 'Title bar and header'}
                value={settings.topOpacity ?? 90}
                min={0}
                max={100}
                unit="%"
                onChange={(value) => updatePersonalization('topOpacity', value)}
              />
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '任务卡片' : 'Task Cards'}
                hint={appSettings.language === 'zh-CN' ? '任务列表卡片' : 'Task list cards'}
                value={settings.cardOpacity ?? 86}
                min={0}
                max={100}
                unit="%"
                onChange={(value) => updatePersonalization('cardOpacity', value)}
              />
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '按钮输入框' : 'Controls'}
                hint={appSettings.language === 'zh-CN' ? '按钮和输入框' : 'Buttons and inputs'}
                value={settings.controlOpacity ?? 90}
                min={0}
                max={100}
                unit="%"
                onChange={(value) => updatePersonalization('controlOpacity', value)}
              />
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '弹出菜单' : 'Menus'}
                hint={appSettings.language === 'zh-CN' ? '设置面板和日历' : 'Settings and calendar'}
                value={settings.menuOpacity ?? 96}
                min={0}
                max={100}
                unit="%"
                onChange={(value) => updatePersonalization('menuOpacity', value)}
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

      {section === 'theme-watercolor' && (
        <>
          <button className="settings-back-button" onClick={() => setSection('personalization')}>
            ← {appSettings.language === 'zh-CN' ? '返回外观设置' : 'Back to Appearance'}
          </button>

          <section className="settings-section">
            <h3>{appSettings.language === 'zh-CN' ? '水彩画风 - 基础透明度' : 'Watercolor - Basic Opacity'}</h3>
            <div className="settings-grid">
              <RangeControl label={text.windowOpacity} hint={text.windowOpacityHint} value={settings.windowOpacity} min={0} max={100} unit="%" onChange={(value) => updatePersonalization('windowOpacity', value)} />
              <RangeControl label={text.panelOpacity} hint={text.panelOpacityHint} value={settings.panelOpacity} min={0} max={100} unit="%" onChange={(value) => updatePersonalization('panelOpacity', value)} />
              <RangeControl label={text.blur} value={settings.blurStrength} min={0} max={36} unit="px" onChange={(value) => updatePersonalization('blurStrength', value)} />
              <RangeControl label={text.radius} value={settings.radius} min={4} max={36} unit="px" onChange={(value) => updatePersonalization('radius', value)} />
            </div>
          </section>

          <section className="settings-section">
            <h3>{appSettings.language === 'zh-CN' ? '水彩画风 - 高级透明度' : 'Watercolor - Advanced Opacity'}</h3>
            <div className="settings-grid">
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '顶部区域' : 'Top Area'}
                hint={appSettings.language === 'zh-CN' ? '标题栏和头部' : 'Title bar and header'}
                value={settings.topOpacity ?? 80}
                min={0}
                max={100}
                unit="%"
                onChange={(value) => updatePersonalization('topOpacity', value)}
              />
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '任务卡片' : 'Task Cards'}
                hint={appSettings.language === 'zh-CN' ? '任务列表卡片' : 'Task list cards'}
                value={settings.cardOpacity ?? 75}
                min={0}
                max={100}
                unit="%"
                onChange={(value) => updatePersonalization('cardOpacity', value)}
              />
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '按钮输入框' : 'Controls'}
                hint={appSettings.language === 'zh-CN' ? '按钮和输入框' : 'Buttons and inputs'}
                value={settings.controlOpacity ?? 60}
                min={0}
                max={100}
                unit="%"
                onChange={(value) => updatePersonalization('controlOpacity', value)}
              />
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '弹出菜单' : 'Menus'}
                hint={appSettings.language === 'zh-CN' ? '设置面板和日历' : 'Settings and calendar'}
                value={settings.menuOpacity ?? 90}
                min={0}
                max={100}
                unit="%"
                onChange={(value) => updatePersonalization('menuOpacity', value)}
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

      {section === 'theme-invisible' && (
        <>
          <button className="settings-back-button" onClick={() => setSection('personalization')}>
            ← {appSettings.language === 'zh-CN' ? '返回外观设置' : 'Back to Appearance'}
          </button>

          <section className="settings-section">
            <h3>{appSettings.language === 'zh-CN' ? '无感 - 透明度' : 'Invisible - Opacity'}</h3>
            <div className="settings-grid">
              <RangeControl label={text.windowOpacity} hint={appSettings.language === 'zh-CN' ? '越低越透明，推荐 2-5' : 'Lower = more transparent, 2-5 recommended'} value={settings.windowOpacity} min={0} max={100} unit="%" onChange={(value) => updatePersonalization('windowOpacity', value)} />
              <RangeControl label={text.panelOpacity} hint={text.panelOpacityHint} value={settings.panelOpacity} min={0} max={100} unit="%" onChange={(value) => updatePersonalization('panelOpacity', value)} />
              <RangeControl label={text.blur} value={settings.blurStrength} min={0} max={48} unit="px" onChange={(value) => updatePersonalization('blurStrength', value)} />
              <RangeControl label={text.radius} value={settings.radius} min={4} max={36} unit="px" onChange={(value) => updatePersonalization('radius', value)} />
            </div>
          </section>

          <section className="settings-section">
            <h3>{appSettings.language === 'zh-CN' ? '无感 - 高级透明度' : 'Invisible - Advanced Opacity'}</h3>
            <div className="settings-grid">
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '顶部区域' : 'Top Area'}
                hint={appSettings.language === 'zh-CN' ? '标题栏和头部' : 'Title bar and header'}
                value={settings.topOpacity ?? 2}
                min={0}
                max={100}
                unit="%"
                onChange={(value) => updatePersonalization('topOpacity', value)}
              />
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '任务卡片' : 'Task Cards'}
                hint={appSettings.language === 'zh-CN' ? '任务列表卡片' : 'Task list cards'}
                value={settings.cardOpacity ?? 3}
                min={0}
                max={100}
                unit="%"
                onChange={(value) => updatePersonalization('cardOpacity', value)}
              />
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '按钮输入框' : 'Controls'}
                hint={appSettings.language === 'zh-CN' ? '按钮和输入框' : 'Buttons and inputs'}
                value={settings.controlOpacity ?? 2}
                min={0}
                max={100}
                unit="%"
                onChange={(value) => updatePersonalization('controlOpacity', value)}
              />
              <RangeControl
                label={appSettings.language === 'zh-CN' ? '弹出菜单' : 'Menus'}
                hint={appSettings.language === 'zh-CN' ? '设置面板和日历，建议 85+ 保证可用' : 'Settings and calendar, 85+ recommended'}
                value={settings.menuOpacity ?? 85}
                min={0}
                max={100}
                unit="%"
                onChange={(value) => updatePersonalization('menuOpacity', value)}
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

      {section === 'window' && (
        <>
          <section className="settings-section">
            <h3>{appSettings.language === 'zh-CN' ? '窗口行为' : 'Window Behavior'}</h3>
            <AutoStartToggle />
            <ToggleRow
              title={appSettings.language === 'zh-CN' ? '启动时窗口置顶' : 'Always on top on start'}
              description={appSettings.language === 'zh-CN' ? '应用启动时自动置顶' : 'Keep window always on top'}
              checked={settings.alwaysOnTop ?? false}
              onChange={(value) => onChange({ ...settings, alwaysOnTop: value })}
            />
          </section>
        </>
      )}

      {section === 'obsidian' && (
        <>
          <section className="settings-section">
            <h3>{text.paths}</h3>
            <div className="settings-preview-list">
              <p><strong>{text.vaultPath}</strong></p>
              <p>{obsidianPath || text.noVault}</p>
              <button type="button" className="settings-reset-button" onClick={onChooseObsidian}>{text.chooseVault}</button>
            </div>
            <Field label="Daily note target path" value={obsidianTemplates.dailyNotePath} onChange={(value) => updateTemplate('dailyNotePath', value)} />
            <Field
              label="Legacy task export path"
              hint="RC sync no longer writes this file by default. Existing task export files are left untouched."
              value={obsidianTemplates.taskExportPath}
              onChange={(value) => updateTemplate('taskExportPath', value)}
            />
          </section>

          <section className="settings-section">
            <h3>{text.deleteSync}</h3>
            <ToggleRow
              title={text.syncDeleted}
              description={text.syncDeletedHint}
              checked={appSettings.syncDeletedReviewsToObsidian}
              onChange={(value) => updateApp('syncDeletedReviewsToObsidian', value)}
            />
            <ToggleRow
              title={text.confirmDelete}
              description={text.confirmDeleteHint}
              checked={appSettings.confirmBeforeDeletingReview}
              onChange={(value) => updateApp('confirmBeforeDeletingReview', value)}
            />
          </section>

          <section className="settings-section">
            <h3>{text.templateCenter}</h3>
            <div className="settings-grid">
              <Field label="Work section title" value={obsidianTemplates.workSectionTitle} onChange={(value) => updateTemplate('workSectionTitle', value)} />
              <Field label="Inspiration section title" value={obsidianTemplates.inspirationSectionTitle} onChange={(value) => updateTemplate('inspirationSectionTitle', value)} />
              <Field label="Task section title" value={obsidianTemplates.taskSectionTitle} onChange={(value) => updateTemplate('taskSectionTitle', value)} />
              <Field label="Review section title" value={obsidianTemplates.reviewSectionTitle} onChange={(value) => updateTemplate('reviewSectionTitle', value)} />
              <Field label="Tomorrow task section title" value={obsidianTemplates.tomorrowTaskSectionTitle} onChange={(value) => updateTemplate('tomorrowTaskSectionTitle', value)} />
              <Field label="Reusable knowledge section title" value={obsidianTemplates.reusableKnowledgeSectionTitle} onChange={(value) => updateTemplate('reusableKnowledgeSectionTitle', value)} />
            </div>
            <Field label="Task line template" value={obsidianTemplates.taskLineTemplate} onChange={(value) => updateTemplate('taskLineTemplate', value)} />
            <Field label="Completion review template" value={obsidianTemplates.completionReviewTemplate} onChange={(value) => updateTemplate('completionReviewTemplate', value)} multiline />
            <div className="settings-action-row">
              <button type="button" className="settings-reset-button" onClick={onPreviewSync}>{text.previewSync}</button>
              <button type="button" className="settings-reset-button" onClick={onResetTemplates}>{text.resetTemplates}</button>
            </div>
          </section>

          {syncPreview && (
            <section className="settings-section">
              <h3>{text.syncPreview}</h3>
              <div className="settings-preview-list">
                <p>文件：{syncPreview.files.map((file) => `${file.action} ${file.filePath}`).join('；')}</p>
                <p>管理区块：{syncPreview.managedBlocks.map((block) => `${block.action} ${block.marker}`).join('；')}</p>
                <p>任务 {syncPreview.taskCount} 条，完成记录 {syncPreview.completionRecordCount} 条。</p>
                <p>{syncPreview.deletedReviewWillDisappear ? text.deletedReview : text.noDeletedReview}</p>
              </div>
            </section>
          )}
        </>
      )}

      {section === 'rollover' && (
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

      {section === 'ai-review' && (
        <AiReviewSection text={text.aiReview} tasks={tasks} />
      )}

      {section === 'general' && (
        <section className="settings-section">
          <h3>{text.language}</h3>
          <label className="settings-field">
            <span>
              <strong>Language</strong>
              <small>{text.languageHint}</small>
            </span>
            <select value={appSettings.language} onChange={(event) => updateApp('language', event.target.value as AppLanguage)}>
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
            </select>
          </label>
        </section>
      )}

      {section === 'developer' && (
        <>
          <section className="settings-section">
            <h3>{text.developerTools}</h3>
            <div className="settings-action-row">
              <button type="button" className="settings-reset-button" onClick={onOpenCompanionSettings}>{text.advancedCompanion}</button>
              <button type="button" className="settings-reset-button" onClick={() => onObsidianTemplatesChange(defaultTemplates)}>{text.resetDraft}</button>
            </div>
            <div className="settings-preview-list">
              <p>{text.developerRisk}</p>
              <p>{text.codeGuide}</p>
            </div>
          </section>
        </>
      )}
    </motion.aside>
  );
}
