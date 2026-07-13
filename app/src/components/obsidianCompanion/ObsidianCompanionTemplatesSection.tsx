import { CompanionSettings } from '../../../shared/obsidianCompanion';

interface ObsidianCompanionTemplatesSectionProps {
  settings: CompanionSettings;
  onChange: (settings: CompanionSettings) => void;
}

export function ObsidianCompanionTemplatesSection({ settings, onChange }: ObsidianCompanionTemplatesSectionProps) {
  return (
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
  );
}
