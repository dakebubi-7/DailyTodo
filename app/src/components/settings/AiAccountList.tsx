import { getShellText } from '../../i18n';
import { AiProfile } from '../../../shared/aiReview/aiReviewSettings';

type AiReviewText = ReturnType<typeof getShellText>['settings']['aiReview'];

export function AiAccountList({
  text,
  profiles,
  activeId,
  editingId,
  onSelectEditing,
  onAdd,
  onDuplicate,
}: {
  text: AiReviewText;
  profiles: AiProfile[];
  activeId: string;
  editingId: string;
  onSelectEditing: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
}) {
  return (
    <div className="ai-account-list">
      {profiles.map((profile) => (
        <button
          key={profile.id}
          type="button"
          className={`ai-account-item ${profile.id === editingId ? 'ai-account-item-selected' : ''}`}
          onClick={() => onSelectEditing(profile.id)}
        >
          <span className="ai-account-item-name">
            {profile.id === activeId ? '● ' : '○ '}{profile.name || profile.id}
          </span>
          <small>{profile.model}</small>
        </button>
      ))}
      <div className="ai-account-list-actions">
        <button type="button" className="settings-reset-button" onClick={onAdd}>{text.accountAdd}</button>
        <button type="button" className="settings-reset-button" onClick={() => onDuplicate(editingId)}>{text.accountCopy}</button>
      </div>
    </div>
  );
}
