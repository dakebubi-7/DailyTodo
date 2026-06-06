import { CompanionRule, CompanionSettings, SyncPlan, WriteMode } from '../../shared/obsidianCompanion';

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

function updateRule(settings: CompanionSettings, ruleId: string, updater: (rule: CompanionRule) => CompanionRule) {
  return {
    ...settings,
    rules: settings.rules.map((rule) => (rule.id === ruleId ? updater(rule) : rule)),
  };
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

      <section className="companion-section">
        <h3>Rules</h3>
        {settings.rules.map((rule) => (
          <div key={rule.id} className="companion-rule-row">
            <label className="companion-rule-toggle">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={(event) =>
                  onChange(updateRule(settings, rule.id, (candidate) => ({ ...candidate, enabled: event.target.checked })))
                }
              />
              <span>{rule.name}</span>
            </label>

            <label className="companion-field">
              <span>Target</span>
              <input
                value={rule.write.target}
                onChange={(event) =>
                  onChange(updateRule(settings, rule.id, (candidate) => ({
                    ...candidate,
                    write: { ...candidate.write, target: event.target.value },
                  })))
                }
              />
            </label>

            <label className="companion-field">
              <span>Section</span>
              <input
                value={rule.write.section || ''}
                onChange={(event) =>
                  onChange(updateRule(settings, rule.id, (candidate) => ({
                    ...candidate,
                    write: { ...candidate.write, section: event.target.value || undefined },
                  })))
                }
              />
            </label>

            <div className="companion-rule-controls">
              <label className="companion-field">
                <span>Mode</span>
                <select
                  value={rule.write.mode}
                  onChange={(event) =>
                    onChange(updateRule(settings, rule.id, (candidate) => ({
                      ...candidate,
                      write: { ...candidate.write, mode: event.target.value as WriteMode },
                    })))
                  }
                >
                  <option value="append">append</option>
                  <option value="managed-block">managed-block</option>
                </select>
              </label>

              <label className="companion-field">
                <span>Priority</span>
                <input
                  type="number"
                  value={rule.priority}
                  onChange={(event) =>
                    onChange(updateRule(settings, rule.id, (candidate) => ({
                      ...candidate,
                      priority: Number(event.target.value),
                    })))
                  }
                />
              </label>

              <label className="companion-field">
                <span>After match</span>
                <select
                  value={rule.afterMatch}
                  onChange={(event) =>
                    onChange(updateRule(settings, rule.id, (candidate) => ({
                      ...candidate,
                      afterMatch: event.target.value === 'stop' ? 'stop' : 'continue',
                    })))
                  }
                >
                  <option value="continue">continue</option>
                  <option value="stop">stop</option>
                </select>
              </label>
            </div>
          </div>
        ))}
      </section>

      <section className="companion-section">
        <h3>Templates</h3>
        {settings.templates.map((template) => (
          <label key={template.id} className="companion-template-editor">
            <span>{template.name}</span>
            <textarea
              value={template.body}
              onChange={(event) =>
                onChange({
                  ...settings,
                  templates: settings.templates.map((candidate) =>
                    candidate.id === template.id ? { ...candidate, body: event.target.value } : candidate
                  ),
                })
              }
            />
          </label>
        ))}
      </section>

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
