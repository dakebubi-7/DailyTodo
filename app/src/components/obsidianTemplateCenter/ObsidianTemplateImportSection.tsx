import { OBSIDIAN_TEMPLATE_MODULE_IDS } from '../../../shared/obsidianTemplateCenter';
import type { RecognizedObsidianTemplateDraft } from '../../../shared/obsidianTemplateRecognition';
import type { getShellText } from '../../i18n';

type Language = 'zh-CN' | 'en-US';
type TemplateSourceText = ReturnType<typeof getShellText>['settings']['templateSources'];

interface ObsidianTemplateImportSectionProps {
  language: Language;
  text: TemplateSourceText;
  draftText: string;
  setDraftText: (value: string) => void;
  chooseFile: () => void;
  recognize: () => void;
  recognizing: boolean;
  status: string;
  recognizedDraft: RecognizedObsidianTemplateDraft | null;
  applyDraft: () => void;
}

export function ObsidianTemplateImportSection({
  language,
  text,
  draftText,
  setDraftText,
  chooseFile,
  recognize,
  recognizing,
  status,
  recognizedDraft,
  applyDraft,
}: ObsidianTemplateImportSectionProps) {
  const zh = language === 'zh-CN';

  return (
    <section className="settings-section">
      <h3>{zh ? '\u0041\u0049 \u6a21\u677f\u5bfc\u5165' : 'AI Template Import'}</h3>
      <div className="settings-preview-list">
        <p>
          {zh
            ? '\u7c98\u8d34 Obsidian \u6a21\u677f\u6216\u9009\u62e9 .md \u6587\u4ef6\uff0cAI \u4f1a\u5c06\u5176\u6620\u5c04\u4e3a DailyTodo \u533a\u5757\u3002'
            : 'Paste an Obsidian template or choose a .md file. AI will map it to DailyTodo sections.'}
        </p>
      </div>
      <textarea
        className="template-import-textarea"
        rows={6}
        value={draftText}
        onChange={(event) => setDraftText(event.target.value)}
        placeholder={zh ? '\u5728\u6b64\u7c98\u8d34 Obsidian Markdown \u6a21\u677f...' : 'Paste Obsidian Markdown template here...'}
      />
      <div className="settings-action-row">
        <button type="button" className="settings-reset-button" onClick={chooseFile}>
          {zh ? '\u9009\u62e9 .md \u6587\u4ef6' : 'Choose .md File'}
        </button>
        <button type="button" className="settings-reset-button" onClick={recognize} disabled={recognizing || !draftText.trim()}>
          {recognizing ? (zh ? '\u6b63\u5728\u8bc6\u522b...' : 'Recognizing...') : (zh ? 'AI \u8bc6\u522b' : 'Recognize')}
        </button>
      </div>
      {status && <p className="settings-status-text">{status}</p>}
      {recognizedDraft && (
        <div className="template-recognition-preview">
          <h4>{zh ? '\u8bc6\u522b\u8349\u7a3f' : 'Recognized Draft'}</h4>
          <ul>
            {OBSIDIAN_TEMPLATE_MODULE_IDS.map((moduleId) => (
              <li key={moduleId}>
                {recognizedDraft.modules[moduleId].enabled ? (zh ? '\u542f\u7528' : 'Enabled') : (zh ? '\u5173\u95ed' : 'Disabled')} {recognizedDraft.modules[moduleId].title}
              </li>
            ))}
          </ul>
          {recognizedDraft.dailyNotePath && <p>{zh ? '\u5efa\u8bae\u8def\u5f84: ' : 'Suggested path: '}{recognizedDraft.dailyNotePath}</p>}
          {recognizedDraft.missingCoreFields.length > 0 && (
            <p className="settings-status-text">
              {text.missingCore.replace('{fields}', recognizedDraft.missingCoreFields.join(', '))}
            </p>
          )}
          {recognizedDraft.unmappedSections.length > 0 && (
            <div>
              <strong>{zh ? '\u672a\u6620\u5c04\u5185\u5bb9' : 'Unmapped content'}</strong>
              <ul>
                {recognizedDraft.unmappedSections.map((section, index) => (
                  <li key={`${section.title}-${index}`}>{section.title}{zh ? ': ' : ': '}{section.reason}</li>
                ))}
              </ul>
            </div>
          )}
          {recognizedDraft.notes.map((note, index) => <p key={index}>{note}</p>)}
          <button type="button" className="settings-reset-button" onClick={applyDraft}>{zh ? '\u5e94\u7528\u5230\u8bbe\u7f6e' : 'Apply to Settings'}</button>
        </div>
      )}
    </section>
  );
}
