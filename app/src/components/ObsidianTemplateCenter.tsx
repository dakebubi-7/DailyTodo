import { useState } from 'react';
import type { ObsidianTemplateSettings } from '../../shared/appSettings';
import {
  OBSIDIAN_TEMPLATE_MODULE_IDS,
  OBSIDIAN_TEMPLATE_MODULE_LABELS,
  OBSIDIAN_TEMPLATE_PRESETS,
  applyObsidianTemplatePreset,
  updateAdvancedTemplateField,
  updateTemplateModule,
  type ObsidianTemplateModuleId,
} from '../../shared/obsidianTemplateCenter';
import type { RecognizedObsidianTemplateDraft } from '../../shared/obsidianTemplateRecognition';

type Language = 'zh-CN' | 'en-US';

interface ObsidianTemplateCenterProps {
  language: Language;
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
  const next: ObsidianTemplateSettings = {
    ...current,
    presetId: draft.presetId,
    dailyNotePath: draft.dailyNotePath || current.dailyNotePath,
    modules: draft.modules,
    taskLineTemplate: draft.taskLineTemplate || current.taskLineTemplate,
    completionReviewTemplate: draft.completionReviewTemplate || current.completionReviewTemplate,
  };

  return OBSIDIAN_TEMPLATE_MODULE_IDS.reduce(
    (settings, moduleId) => updateTemplateModule(settings, moduleId, settings.modules[moduleId]),
    next,
  );
}

export function ObsidianTemplateCenter({
  language,
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

  const setAdvanced = <K extends keyof ObsidianTemplateSettings>(key: K, value: ObsidianTemplateSettings[K]) => {
    onChange(updateAdvancedTemplateField(templates, key, value));
  };

  return (
    <div className="obsidian-template-center">
      <section className="settings-section">
        <h3>{zh ? '模板中心' : 'Template Center'}</h3>
        <Field
          label={zh ? '每日记录位置' : 'Daily note target path'}
          hint={zh ? '{{date}} 会替换成当天日期。' : '{{date}} is replaced with the date.'}
          value={templates.dailyNotePath}
          onChange={(value) => setAdvanced('dailyNotePath', value)}
        />
      </section>

      <section className="settings-section">
        <h3>{zh ? '模板风格' : 'Template Style'}</h3>
        <div className="template-preset-grid">
          {OBSIDIAN_TEMPLATE_PRESETS.map((preset) => {
            const active = templates.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`template-preset-card ${active ? 'template-preset-card-active' : ''}`}
                onClick={() => onChange(applyObsidianTemplatePreset(templates, preset.id))}
                aria-pressed={active}
              >
                <strong>{zh ? preset.label.zh : preset.label.en}</strong>
                <small>{zh ? preset.description.zh : preset.description.en}</small>
              </button>
            );
          })}
          {templates.presetId === 'custom' && (
            <div className="template-preset-card template-preset-card-active" aria-live="polite">
              <strong>{zh ? '自定义' : 'Custom'}</strong>
              <small>{zh ? '你已手动调整模板。' : 'You have manually adjusted this template.'}</small>
            </div>
          )}
        </div>
      </section>

      <section className="settings-section">
        <h3>{zh ? '记录模块' : 'Sections'}</h3>
        <div className="template-module-list">
          {OBSIDIAN_TEMPLATE_MODULE_IDS.map((moduleId: ObsidianTemplateModuleId) => {
            const module = templates.modules[moduleId];
            const label = OBSIDIAN_TEMPLATE_MODULE_LABELS[moduleId];
            return (
              <div key={moduleId} className="template-module-row">
                <label className="toggle-row compact-toggle-row">
                  <input
                    type="checkbox"
                    checked={module.enabled}
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
                  {recognizedDraft.modules[moduleId].enabled ? '✅' : '—'} {recognizedDraft.modules[moduleId].title}
                </li>
              ))}
            </ul>
            {recognizedDraft.dailyNotePath && (
              <p>
                {zh ? '推荐路径：' : 'Suggested path: '}
                {recognizedDraft.dailyNotePath}
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
            ? (zh ? '收起高级模板设置' : 'Hide Advanced Template Settings')
            : (zh ? '高级模板设置' : 'Advanced Template Settings')}
        </button>
        {advancedOpen && (
          <div className="template-advanced-fields">
            <Field
              label="Legacy task export path"
              hint="RC sync no longer writes this file by default. Existing task export files are left untouched."
              value={templates.taskExportPath}
              onChange={(value) => setAdvanced('taskExportPath', value)}
            />
            <Field label="Work section title" value={templates.workSectionTitle} onChange={(value) => setAdvanced('workSectionTitle', value)} />
            <Field label="Inspiration section title" value={templates.inspirationSectionTitle} onChange={(value) => setAdvanced('inspirationSectionTitle', value)} />
            <Field label="Task section title" value={templates.taskSectionTitle} onChange={(value) => setAdvanced('taskSectionTitle', value)} />
            <Field label="Review section title" value={templates.reviewSectionTitle} onChange={(value) => setAdvanced('reviewSectionTitle', value)} />
            <Field label="Tomorrow task section title" value={templates.tomorrowTaskSectionTitle} onChange={(value) => setAdvanced('tomorrowTaskSectionTitle', value)} />
            <Field label="Reusable knowledge section title" value={templates.reusableKnowledgeSectionTitle} onChange={(value) => setAdvanced('reusableKnowledgeSectionTitle', value)} />
            <Field label="Task line template" value={templates.taskLineTemplate} onChange={(value) => setAdvanced('taskLineTemplate', value)} />
            <Field label="Completion review template" value={templates.completionReviewTemplate} onChange={(value) => setAdvanced('completionReviewTemplate', value)} multiline />
          </div>
        )}
        <div className="settings-action-row">
          <button type="button" className="settings-reset-button" onClick={onPreviewSync}>{zh ? '预览同步' : 'Preview Sync'}</button>
          <button type="button" className="settings-reset-button" onClick={onResetTemplates}>{zh ? '重置模板' : 'Reset Templates'}</button>
        </div>
      </section>
    </div>
  );
}
