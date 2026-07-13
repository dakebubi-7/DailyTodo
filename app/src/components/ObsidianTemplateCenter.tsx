import type { ObsidianTemplateSettings } from '../../shared/appSettings';
import {
  OBSIDIAN_TEMPLATE_PRESETS,
  applyObsidianTemplatePreset,
} from '../../shared/obsidianTemplateCenter';
import { getShellText } from '../i18n';
import { ObsidianTemplateImportSection } from './obsidianTemplateCenter/ObsidianTemplateImportSection';
import { ObsidianTemplateModulesSection } from './obsidianTemplateCenter/ObsidianTemplateModulesSection';
import { useObsidianTemplateCenterState } from './useObsidianTemplateCenterState';

type Language = 'zh-CN' | 'en-US';
type TemplateSourceText = ReturnType<typeof getShellText>['settings']['templateSources'];

interface ObsidianTemplateCenterProps {
  language: Language;
  text: TemplateSourceText;
  templates: ObsidianTemplateSettings;
  onChange: (settings: ObsidianTemplateSettings) => void;
  onPreviewSync: () => void;
  onResetTemplates: () => void;
}

function Field({
  label,
  hint,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="settings-field">
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

export function ObsidianTemplateCenter({
  language,
  text,
  templates,
  onChange,
  onPreviewSync,
  onResetTemplates,
}: ObsidianTemplateCenterProps) {
  const zh = language === 'zh-CN';
  const {
    advancedOpen,
    applyDraft,
    chooseFile,
    draftText,
    recognize,
    recognizedDraft,
    recognizing,
    setAdvancedOpen,
    setDraftText,
    status,
  } = useObsidianTemplateCenterState({ language, templates, onChange });
  return (
    <div className="obsidian-template-center">
      <section className="settings-section">
        <h3>{text.dailyTemplateTitle}</h3>
        <Field
          label={text.dailyNotePath}
          hint={text.dailyNotePathHint}
          value={templates.dailyPath}
          onChange={(value) => onChange({ ...templates, dailyPath: value })}
        />
      </section>

      <section className="settings-section">
        <h3>{zh ? '\u6a21\u677f\u98ce\u683c' : 'Template Style'}</h3>
        <div className="template-preset-grid">
          {OBSIDIAN_TEMPLATE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="template-preset-card"
              onClick={() => onChange(applyObsidianTemplatePreset(templates, preset.id))}
            >
              <strong>{zh ? preset.label.zh : preset.label.en}</strong>
              <small>{zh ? preset.description.zh : preset.description.en}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h3>{zh ? '\u8bb0\u5f55\u6a21\u5757' : 'Sections'}</h3>
        <ObsidianTemplateModulesSection language={language} templates={templates} onChange={onChange} />
      </section>

      <ObsidianTemplateImportSection
        language={language}
        text={text}
        draftText={draftText}
        setDraftText={setDraftText}
        chooseFile={chooseFile}
        recognize={recognize}
        recognizing={recognizing}
        status={status}
        recognizedDraft={recognizedDraft}
        applyDraft={applyDraft}
      />
      <section className="settings-section">
        <button type="button" className="settings-reset-button" onClick={() => setAdvancedOpen((open) => !open)}>
          {advancedOpen ? (zh ? `鏀惰捣${text.advancedDaily}` : `Hide ${text.advancedDaily}`) : text.advancedDaily}
        </button>
        {advancedOpen && (
          <div className="template-advanced-fields">
            {templates.dailyTemplate.customBlocks.map((block) => (
              <Field
                key={block.id}
                label={block.name}
                value={block.prompt}
                onChange={(value) => onChange({
                  ...templates,
                  dailyTemplate: {
                    ...templates.dailyTemplate,
                    customBlocks: templates.dailyTemplate.customBlocks.map((item) =>
                      item.id === block.id ? { ...item, prompt: value } : item,
                    ),
                  },
                })}
                multiline
              />
            ))}
          </div>
        )}
        <div className="settings-action-row">
          <button type="button" className="settings-reset-button" onClick={onPreviewSync}>{zh ? '棰勮鍚屾' : 'Preview Sync'}</button>
          <button type="button" className="settings-reset-button" onClick={onResetTemplates}>{text.restoreDefault}</button>
        </div>
      </section>
    </div>
  );
}
