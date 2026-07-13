import { CompanionSettings, SyncPlan } from '../../shared/obsidianCompanion';
import '../styles/obsidian-companion.css';
import { ObsidianCompanionRulesSection } from './obsidianCompanion/ObsidianCompanionRulesSection';
import { ObsidianCompanionTemplatesSection } from './obsidianCompanion/ObsidianCompanionTemplatesSection';

interface ObsidianCompanionPanelProps {
  isOpen: boolean;
  settings: CompanionSettings;
  syncPlan: SyncPlan | null;
  status: string;
  onChange: (settings: CompanionSettings) => void;
  onClose: () => void;
  onChooseVault: () => void;
  onPreview: () => void;
  onSync: () => void;
  onImportMobileInbox: () => void;
}

export function ObsidianCompanionPanel({
  isOpen,
  settings,
  syncPlan,
  status,
  onChange,
  onClose,
  onChooseVault,
  onPreview,
  onSync,
  onImportMobileInbox,
}: ObsidianCompanionPanelProps) {
  if (!isOpen) return null;

  return (
    <aside className="companion-panel" style={{ WebkitAppRegion: 'no-drag' }}>
      <header className="companion-panel-header">
        <div>
          <h2>Obsidian Companion</h2>
          <p>Rules, templates, preview, and vault publishing.</p>
        </div>
        <button onClick={onClose} className="settings-icon-button" aria-label="Close companion settings" title="Close">
          X
        </button>
      </header>

      <section className="companion-section">
        <h3>Vault</h3>
        <p className="companion-muted">{settings.vaultPath || 'No vault selected'}</p>
        <button onClick={onChooseVault}>Choose Obsidian vault</button>
      </section>

      <section className="companion-section">
        <h3>Mobile Inbox</h3>
        <label className="companion-field">
          <span>Folder path</span>
          <input
            value={settings.mobileInboxPath}
            onChange={(event) => onChange({ ...settings, mobileInboxPath: event.target.value })}
            placeholder="C:\Users\you\Inbox"
          />
        </label>
        <button onClick={onImportMobileInbox}>Import mobile inbox</button>
      </section>

      <ObsidianCompanionRulesSection settings={settings} onChange={onChange} />

      <ObsidianCompanionTemplatesSection settings={settings} onChange={onChange} />

      <section className="companion-section">
        <h3>Preview</h3>
        <div className="companion-actions">
          <button onClick={onPreview}>Preview sync</button>
          <button onClick={onSync}>Sync now</button>
        </div>
        {status && <p className="companion-status">{status}</p>}
        {syncPlan && (
          <div className="companion-preview">
            {syncPlan.errors.length > 0 && (
              <ul className="companion-error-list">
                {syncPlan.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
            <ul className="companion-preview-list">
              {syncPlan.changes.map((change, index) => (
                <li key={`${change.filePath}-${index}`}>
                  <strong>{change.action}</strong>
                  <span>{change.filePath}</span>
                  <small>{change.content}</small>
                </li>
              ))}
            </ul>
            {syncPlan.unmatchedItems.length > 0 && (
              <p className="companion-muted">{syncPlan.unmatchedItems.length} item(s) did not match any enabled rule.</p>
            )}
          </div>
        )}
      </section>
    </aside>
  );
}
