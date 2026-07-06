import { useState } from 'react';
import { getShellText } from '../../i18n';
import {
  AiReviewSettings,
  AiProfile,
  createDefaultAiProfile,
} from '../../../shared/aiReview/aiReviewSettings';
import type { AiReviewProgressEvent, AiReviewRunDiagnostic } from '../../../shared/aiReview/runDiagnostics';
import { Field } from './SettingsControls';

type AiReviewText = ReturnType<typeof getShellText>['settings']['aiReview'];

export type GenerationAction = 'daily' | 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly';

export function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function previousWeekDate() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return formatLocalDate(date);
}

export function previousMonthStart() {
  const date = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  return formatLocalDate(date);
}

export function resultMessage(text: AiReviewText, result: { ok: boolean; error?: string; filePath?: string; truncated?: boolean }) {
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

export function progressDisplay(currentProgress: AiReviewProgressEvent | null, fallback: string) {
  return progressStatusLabel(currentProgress) || fallback;
}

const AI_PROGRESS_PERCENT: Record<string, number> = {
  inspectDaily: 12,
  prepareMaterials: 28,
  buildPrompt: 44,
  requestAi: 68,
  writeObsidian: 88,
  confirmResult: 100,
};

function progressPercent(currentProgress: AiReviewProgressEvent | null) {
  if (!currentProgress) return 0;
  if (currentProgress.status === 'failed') {
    if (currentProgress.stageKey === 'confirmResult') return 92;
    return AI_PROGRESS_PERCENT[currentProgress.stageKey] ?? 8;
  }
  if (currentProgress.status === 'completed' && currentProgress.stageKey === 'confirmResult') return 100;
  return AI_PROGRESS_PERCENT[currentProgress.stageKey] ?? 8;
}

export function GenerationProgress({ currentProgress, fallback }: { currentProgress: AiReviewProgressEvent | null; fallback: string }) {
  const percent = progressPercent(currentProgress);
  const label = progressDisplay(currentProgress, fallback);
  return (
    <div className="settings-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={label}>
      <div className="settings-progress-track">
        <div className="settings-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <small>{label}</small>
    </div>
  );
}

export function initialProgressForAction(action: GenerationAction): AiReviewProgressEvent {
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

export function DiagnosticCard({ diagnostic, onClose }: { diagnostic: AiReviewRunDiagnostic; onClose: () => void }) {
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

export function finishProgress(action: GenerationAction, ok: boolean): AiReviewProgressEvent {
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
            <button type="button" className="ai-account-close" onClick={onClose} aria-label={text.close}>✓</button>
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
                  {p.id === activeId ? '●' : '○'}{p.name || p.id}
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

export function AiAccountZone({ text, settings, onChange }: { text: AiReviewText; settings: AiReviewSettings; onChange: (settings: AiReviewSettings) => void }) {
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
