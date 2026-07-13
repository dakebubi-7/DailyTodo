import { getShellText } from '../../i18n';
import { AiProfile, isAiProvider } from '../../../shared/aiReview/aiReviewSettings';
import { Field } from './SettingsControls';
import {
  AI_ACCOUNT_PRESETS,
  getAiAccountPresetId,
  normalizeAiAccountMaxTokens,
  normalizeAiAccountTimeout,
} from './aiAccountManagerModel';

type AiReviewText = ReturnType<typeof getShellText>['settings']['aiReview'];

export function AiAccountDetails({
  text,
  editing,
  activeId,
  profileCount,
  fetchedModels,
  modelStatus,
  fetchingModels,
  onUpdate,
  onUpdateInput,
  onSetActive,
  onDelete,
  onClose,
  onFetchModels,
}: {
  text: AiReviewText;
  editing: AiProfile;
  activeId: string;
  profileCount: number;
  fetchedModels: string[];
  modelStatus: string;
  fetchingModels: boolean;
  onUpdate: (id: string, patch: Partial<AiProfile>) => void;
  onUpdateInput: (id: string, patch: Partial<AiProfile>) => void;
  onSetActive: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onFetchModels: () => void;
}) {
  const activePreset = getAiAccountPresetId(editing.baseUrl);

  return (
    <div className="ai-account-detail settings-grid">
      <Field label={text.accountName} hint={text.accountNameHint} value={editing.name} onChange={(value) => onUpdateInput(editing.id, { name: value })} />
      <label className="settings-field">
        <span><strong>{text.preset}</strong><small>{text.presetHint}</small></span>
        <select value={activePreset} onChange={(event) => {
          const preset = AI_ACCOUNT_PRESETS.find((item) => item.id === event.target.value);
          if (preset) onUpdate(editing.id, { baseUrl: preset.baseUrl, provider: preset.provider, model: preset.model });
        }}>
          {AI_ACCOUNT_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
          <option value="custom">{text.presetCustom}</option>
        </select>
      </label>
      <label className="settings-field">
        <span><strong>{text.provider}</strong><small>{text.providerHint}</small></span>
        <select value={editing.provider} onChange={(event) => {
          if (isAiProvider(event.target.value)) onUpdate(editing.id, { provider: event.target.value });
        }}>
          <option value="auto">{text.providerAuto}</option><option value="openai">{text.providerOpenai}</option>
          <option value="anthropic">{text.providerAnthropic}</option><option value="gemini">{text.providerGemini}</option>
        </select>
      </label>
      <Field label={text.baseUrl} hint={text.baseUrlHint} value={editing.baseUrl} onChange={(value) => onUpdateInput(editing.id, { baseUrl: value })} />
      <label className="settings-field">
        <span><strong>{text.apiKey}</strong><small>{text.apiKeyHint}</small></span>
        <input type="password" value={editing.apiKey} onChange={(event) => onUpdateInput(editing.id, { apiKey: event.target.value })} />
      </label>
      <Field label={text.model} hint={text.modelHint} value={editing.model} onChange={(value) => onUpdateInput(editing.id, { model: value })} />
      <div className="settings-field">
        <span><strong>{text.modelFetch}</strong><small>{text.modelFetchHint}</small></span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="settings-reset-button" disabled={fetchingModels || !editing.apiKey || !editing.baseUrl} onClick={onFetchModels}>
            {fetchingModels ? text.modelFetching : text.modelFetch}
          </button>
          {fetchedModels.length > 0 && <select value={fetchedModels.includes(editing.model) ? editing.model : ''} onChange={(event) => event.target.value && onUpdate(editing.id, { model: event.target.value })} style={{ flex: '1 1 180px' }} aria-label={text.modelFetch}>
            <option value="">{text.modelPick}</option>
            {fetchedModels.map((model) => <option key={model} value={model}>{model}</option>)}
          </select>}
        </div>
        {modelStatus && <small style={{ wordBreak: 'break-all' }}>{modelStatus}</small>}
      </div>
      <label className="settings-field">
        <span><strong>{text.requestTimeout}</strong><small>{text.requestTimeoutHint}</small></span>
        <input type="number" min={10} max={600} value={editing.timeoutSeconds} onChange={(event) => {
          const timeoutSeconds = normalizeAiAccountTimeout(Number(event.target.value));
          if (timeoutSeconds !== null) onUpdate(editing.id, { timeoutSeconds });
        }} />
      </label>
      <label className="settings-field">
        <span><strong>{text.maxTokens}</strong><small>{text.maxTokensHint}</small></span>
        <input type="number" min={256} max={32768} step={256} value={editing.maxTokens ?? 8192} onChange={(event) => {
          const maxTokens = normalizeAiAccountMaxTokens(Number(event.target.value));
          if (maxTokens !== null) onUpdate(editing.id, { maxTokens });
        }} />
      </label>
      <Field label={text.accountNote} hint={text.accountNoteHint} value={editing.note ?? ''} onChange={(value) => onUpdateInput(editing.id, { note: value })} />
      <p className="ai-account-balance">{text.balancePlaceholder}</p>
      <div className="ai-account-detail-actions">
        <button type="button" className="settings-reset-button" disabled={editing.id === activeId} onClick={() => { onSetActive(editing.id); onClose(); }}>
          {editing.id === activeId ? text.accountIsActive : text.setActive}
        </button>
        <button type="button" className="settings-reset-button" disabled={profileCount <= 1} onClick={() => onDelete(editing.id)}>{text.accountDelete}</button>
      </div>
    </div>
  );
}
