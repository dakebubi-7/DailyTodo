import { useState } from 'react';
import { getShellText } from '../../i18n';
import { AiProfile } from '../../../shared/aiReview/aiReviewSettings';
import { readListModelsResult } from '../../../shared/llm/openaiClient';
import { AiAccountDetails } from './AiAccountDetails';
import { AiAccountList } from './AiAccountList';

type AiReviewText = ReturnType<typeof getShellText>['settings']['aiReview'];

export function AiAccountManager({
  text,
  profiles,
  activeId,
  editingId,
  onSelectEditing,
  onSetActive,
  onUpdate,
  onUpdateInput,
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
  onUpdateInput: (id: string, patch: Partial<AiProfile>) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const editing = profiles.find((profile) => profile.id === editingId)
    ?? profiles.find((profile) => profile.id === activeId)
    ?? profiles[0];
  const [modelsByProfile, setModelsByProfile] = useState<Record<string, string[]>>({});
  const [modelStatus, setModelStatus] = useState('');
  const [fetchingModels, setFetchingModels] = useState(false);
  const fetchedModels = editing ? modelsByProfile[editing.id] ?? [] : [];

  const fetchModels = async () => {
    if (!editing) return;
    setFetchingModels(true);
    setModelStatus(text.modelFetching);
    try {
      const result = readListModelsResult(await window.electronAPI?.aiReview.listModels({
        baseUrl: editing.baseUrl,
        apiKey: editing.apiKey,
        provider: editing.provider,
      }));
      if (!result || !result.ok) {
        setModelStatus(`${text.modelFetchFailed}${result?.error ?? ''}`);
        return;
      }
      setModelsByProfile((previous) => ({ ...previous, [editing.id]: result.models }));
      setModelStatus(`${text.modelFetchOk}${result.models.length}`);
    } catch (error) {
      setModelStatus(`${text.modelFetchFailed}${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setFetchingModels(false);
    }
  };

  return (
    <div className="ai-account-backdrop" onClick={onClose}>
      <div className="ai-account-modal" onClick={(event) => event.stopPropagation()}>
        <div className="ai-account-header">
          <div>
            <h3>{text.manageTitle}</h3>
            <p>{editing ? (editing.name || editing.model || editing.id) : text.accountAdd}</p>
          </div>
          <div className="ai-account-header-actions">
            <button type="button" className="settings-reset-button" onClick={onAdd}>{text.accountAdd}</button>
            <button type="button" className="settings-reset-button" disabled={!editing} onClick={() => editing && onDuplicate(editing.id)}>{text.accountCopy}</button>
            <button type="button" className="settings-reset-button" disabled={!editing || editing.id === activeId} onClick={() => editing && onSetActive(editing.id)}>
              {editing?.id === activeId ? text.accountIsActive : text.setActive}
            </button>
            <button type="button" className="settings-reset-button settings-danger-button" disabled={!editing || profiles.length <= 1} onClick={() => editing && onDelete(editing.id)}>
              {text.accountDelete}
            </button>
            <button type="button" className="ai-account-close" onClick={onClose} aria-label={text.close}>✓</button>
          </div>
        </div>
        <div className="ai-account-body">
          <AiAccountList
            text={text}
            profiles={profiles}
            activeId={activeId}
            editingId={editing?.id ?? ''}
            onSelectEditing={onSelectEditing}
            onAdd={onAdd}
            onDuplicate={onDuplicate}
          />
          {editing ? (
            <AiAccountDetails
              text={text}
              editing={editing}
              activeId={activeId}
              profileCount={profiles.length}
              fetchedModels={fetchedModels}
              fetchingModels={fetchingModels}
              modelStatus={modelStatus}
              onUpdate={onUpdate}
              onUpdateInput={onUpdateInput}
              onFetchModels={fetchModels}
              onSetActive={onSetActive}
              onDelete={onDelete}
              onClose={onClose}
            />
          ) : (
            <div className="ai-account-detail ai-account-empty-state">
              <strong>{text.accountAdd}</strong>
              <span>{text.manageTitle}</span>
              <button type="button" className="settings-reset-button" onClick={onAdd}>{text.accountAdd}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
