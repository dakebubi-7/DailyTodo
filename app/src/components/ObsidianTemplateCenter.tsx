import { useState } from 'react';
import type { ObsidianTemplateSettings } from '../../shared/appSettings';
import {
  OBSIDIAN_TEMPLATE_MODULE_IDS,
  OBSIDIAN_TEMPLATE_MODULE_LABELS,
  OBSIDIAN_TEMPLATE_PRESETS,
  applyObsidianTemplatePreset,
  modulesFromDailyTemplate,
  updateTemplateModule,
  type ObsidianTemplateModuleId,
} from '../../shared/obsidianTemplateCenter';
import type { RecognizedObsidianTemplateDraft } from '../../shared/obsidianTemplateRecognition';
import { getShellText } from '../i18n';

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

function draftToSettings(current: ObsidianTemplateSettings, draft: RecognizedObsidianTemplateDraft): ObsidianTemplateSettings {
  return OBSIDIAN_TEMPLATE_MODULE_IDS.reduce(
    (settings, moduleId) => updateTemplateModule(settings, moduleId, draft.modules[moduleId]),
    {
      ...current,
      dailyPath: draft.dailyNotePath || current.dailyPath,
    },
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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const [status, setStatus] = useState('');
  const [recognizedDraft, setRecognizedDraft] = useState<RecognizedObsidianTemplateDraft | null>(null);
  const modules = modulesFromDailyTemplate(templates.dailyTemplate);

  const chooseFile = async () => {
    try {
      const result = await window.electronAPI?.obsidianTemplate.pickTemplateFile();
      if (!result || result.canceled) return;
      if (!result.ok) {
        setStatus(`${zh ? '读取模板失败：' : 'Failed to read template: '}${result.error ?? ''}`);
        return;
      }
      setDraftText(result.text ?? '');
      setStatus(result.fileName ? `${zh ? '已读取：' : 'Loaded: '}${result.fileName}` : '');
    } catch (error) {
      setStatus(`${zh ? '读取模板失败：' : 'Failed to read template: '}${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const recognize = async () => {
    if (!draftText.trim()) return;
    setRecognizing(true);
    setRecognizedDraft(null);
    setStatus(zh ? '正在识别模板……' : 'Recognizing template...');
    try {
      const result = await window.electronAPI?.obsidianTemplate.recognize(draftText);
      if (!result || !result.ok) {
        setStatus(`${zh ? '识别失败：' : 'Recognition failed: '}${result?.error ?? ''}`);
        return;
      }
      setRecognizedDraft(result.draft);
      setStatus(
        result.draft.unmatched
          ? (zh ? '识别不够确定，已生成保守草稿。' : 'Low confidence; conservative draft created.')
          : (zh ? '已生成模板草稿。' : 'Template draft ready.'),
      );
    } catch (error) {
      setStatus(`${zh ? '识别失败：' : 'Recognition failed: '}${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRecognizing(false);
    }
  };

  const applyDraft = () => {
    if (!recognizedDraft) return;
    onChange(draftToSettings(templates, recognizedDraft));
    setRecognizedDraft(null);
    setDraftText('');
    setStatus(zh ? '已应用到设置。' : 'Applied to settings.');
  };

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
        <h3>{zh ? '模板风格' : 'Template Style'}</h3>
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
        <h3>{zh ? '记录模块' : 'Sections'}</h3>
        <div className="template-module-list">
          {OBSIDIAN_TEMPLATE_MODULE_IDS.map((moduleId: ObsidianTemplateModuleId) => {
            const module = modules[moduleId];
            const label = OBSIDIAN_TEMPLATE_MODULE_LABELS[moduleId];
            const fixed = moduleId === 'work' || moduleId === 'inspiration' || moduleId === 'tasks';
            return (
              <div key={moduleId} className="template-module-row">
                <label className="toggle-row compact-toggle-row">
                  <input
                    type="checkbox"
                    checked={fixed || module.enabled}
                    disabled={fixed}
                    onChange={(event) => onChange(updateTemplateModule(templates, moduleId, { enabled: event.target.checked }))}
                  />
                  <span>{zh ? label.zh : label.en}</span>
                </label>
                <input
                  value={module.title}
                  onChange={(event) => onChange(updateTemplateModule(templates, moduleId, { title: event.target.value }))}
                  aria-label={`${zh ? label.zh : label.en} title`}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="settings-section">
        <h3>{zh ? 'AI 识别模板' : 'AI Template Import'}</h3>
        <div className="settings-preview-list">
          <p>
            {zh
              ? '粘贴你的 Obsidian 模板，或选择 .md 文件，AI 会整理成 DailyTodo 可维护的模块。'
              : 'Paste an Obsidian template or choose a .md file. AI will map it to DailyTodo sections.'}
          </p>
        </div>
        <textarea
          className="template-import-textarea"
          rows={6}
          value={draftText}
          onChange={(event) => setDraftText(event.target.value)}
          placeholder={zh ? '在这里粘贴 Obsidian Markdown 模板……' : 'Paste Obsidian Markdown template here...'}
        />
        <div className="settings-action-row">
          <button type="button" className="settings-reset-button" onClick={chooseFile}>
            {zh ? '选择 .md 文件' : 'Choose .md File'}
          </button>
          <button type="button" className="settings-reset-button" onClick={recognize} disabled={recognizing || !draftText.trim()}>
            {recognizing ? (zh ? '识别中……' : 'Recognizing...') : (zh ? 'AI 识别' : 'Recognize')}
          </button>
        </div>
        {status && <p className="settings-status-text">{status}</p>}
        {recognizedDraft && (
          <div className="template-recognition-preview">
            <h4>{zh ? '识别草稿' : 'Recognized Draft'}</h4>
            <ul>
              {OBSIDIAN_TEMPLATE_MODULE_IDS.map((moduleId) => (
                <li key={moduleId}>
                  {recognizedDraft.modules[moduleId].enabled ? '启用' : '关闭'} {recognizedDraft.modules[moduleId].title}
                </li>
              ))}
            </ul>
            {recognizedDraft.dailyNotePath && (
              <p>
                {zh ? '推荐路径：' : 'Suggested path: '}
                {recognizedDraft.dailyNotePath}
              </p>
            )}
            {recognizedDraft.missingCoreFields.length > 0 && (
              <p className="settings-status-text">
                {text.missingCore.replace('{fields}', recognizedDraft.missingCoreFields.join('、'))}
              </p>
            )}
            {recognizedDraft.unmappedSections.length > 0 && (
              <div>
                <strong>{zh ? '未识别内容' : 'Unmapped content'}</strong>
                <ul>
                  {recognizedDraft.unmappedSections.map((section, index) => (
                    <li key={`${section.title}-${index}`}>
                      {section.title}：{section.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {recognizedDraft.notes.map((note, index) => (
              <p key={index}>{note}</p>
            ))}
            <button type="button" className="settings-reset-button" onClick={applyDraft}>
              {zh ? '应用到设置' : 'Apply to Settings'}
            </button>
          </div>
        )}
      </section>

      <section className="settings-section">
        <button type="button" className="settings-reset-button" onClick={() => setAdvancedOpen((open) => !open)}>
          {advancedOpen
            ? (zh ? `收起${text.advancedDaily}` : `Hide ${text.advancedDaily}`)
            : text.advancedDaily}
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
          <button type="button" className="settings-reset-button" onClick={onPreviewSync}>{zh ? '预览同步' : 'Preview Sync'}</button>
          <button type="button" className="settings-reset-button" onClick={onResetTemplates}>{text.restoreDefault}</button>
        </div>
      </section>
    </div>
  );
}
