import { type CompanionRule, type CompanionSettings, isWriteMode } from '../../../shared/obsidianCompanion';

interface ObsidianCompanionRulesSectionProps {
  settings: CompanionSettings;
  onChange: (settings: CompanionSettings) => void;
}

function updateRule(settings: CompanionSettings, ruleId: string, updater: (rule: CompanionRule) => CompanionRule) {
  return {
    ...settings,
    rules: settings.rules.map((rule) => (rule.id === ruleId ? updater(rule) : rule)),
  };
}

export function ObsidianCompanionRulesSection({ settings, onChange }: ObsidianCompanionRulesSectionProps) {
  return (
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
                onChange={(event) => {
                  const nextMode = event.target.value;
                  if (!isWriteMode(nextMode)) return;
                  onChange(updateRule(settings, rule.id, (candidate) => ({
                    ...candidate,
                    write: { ...candidate.write, mode: nextMode },
                  })));
                }}
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
  );
}
