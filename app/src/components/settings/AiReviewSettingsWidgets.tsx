import { useState } from 'react';
import { getShellText } from '../../i18n';
import {
  AiReviewSettings,
  AiProfile,
  createDefaultAiProfile,
} from '../../../shared/aiReview/aiReviewSettings';
import { AiAccountManager } from './AiAccountManager';

type AiReviewText = ReturnType<typeof getShellText>['settings']['aiReview'];

export {
  DiagnosticCard,
  finishProgress,
  GenerationProgress,
  initialProgressForAction,
  previousMonthStart,
  previousWeekDate,
  progressDisplay,
  resultMessage,
  type GenerationAction,
} from './AiReviewGenerationPresentation';

export function AiAccountZone({
  text,
  settings,
  onChange,
  onChangeInput,
}: {
  text: AiReviewText;
  settings: AiReviewSettings;
  onChange: (settings: AiReviewSettings) => void;
  onChangeInput: (settings: AiReviewSettings) => void;
}) {
  const [showManager, setShowManager] = useState(false);
  const [editingId, setEditingId] = useState('');

  const profiles = settings.profiles?.length ? settings.profiles : [];
  const active = profiles.find((p) => p.id === settings.activeProfileId) ?? profiles[0];

  const saveSettings = (next: AiReviewSettings) => {
    onChange(next);
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
          onUpdateInput={(id, patch) => onChangeInput({ ...settings, profiles: profiles.map((p) => p.id === id ? { ...p, ...patch } : p) })}
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
