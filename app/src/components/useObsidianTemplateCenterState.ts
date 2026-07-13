import { useState } from 'react';
import type { ObsidianTemplateSettings } from '../../shared/appSettings';
import {
  OBSIDIAN_TEMPLATE_MODULE_IDS,
  updateTemplateModule,
} from '../../shared/obsidianTemplateCenter';
import {
  readObsidianTemplateRecognitionResult,
  readTemplatePickerResult,
  type RecognizedObsidianTemplateDraft,
} from '../../shared/obsidianTemplateRecognition';

type Language = 'zh-CN' | 'en-US';

interface UseObsidianTemplateCenterStateOptions {
  language: Language;
  templates: ObsidianTemplateSettings;
  onChange: (settings: ObsidianTemplateSettings) => void;
}

function draftToSettings(
  current: ObsidianTemplateSettings,
  draft: RecognizedObsidianTemplateDraft,
): ObsidianTemplateSettings {
  return OBSIDIAN_TEMPLATE_MODULE_IDS.reduce(
    (settings, moduleId) => updateTemplateModule(settings, moduleId, draft.modules[moduleId]),
    { ...current, dailyPath: draft.dailyNotePath || current.dailyPath },
  );
}

export function useObsidianTemplateCenterState({
  language,
  templates,
  onChange,
}: UseObsidianTemplateCenterStateOptions) {
  const zh = language === 'zh-CN';
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const [status, setStatus] = useState('');
  const [recognizedDraft, setRecognizedDraft] = useState<RecognizedObsidianTemplateDraft | null>(null);

  const chooseFile = async () => {
    try {
      const result = readTemplatePickerResult(
        await window.electronAPI?.obsidianTemplate.pickTemplateFile()
      );
      if (!result) {
        setStatus('Failed to read template: invalid result');
        return;
      }
      if (result.canceled) return;
      if (!result.ok) {
        setStatus(`${zh ? '\u8bfb\u53d6\u6a21\u677f\u5931\u8d25\uff1a' : 'Failed to read template: '}${result.error ?? ''}`);
        return;
      }
      setDraftText(result.text ?? '');
      setStatus(result.fileName ? `${zh ? '\u5df2\u8bfb\u53d6\uff1a' : 'Loaded: '}${result.fileName}` : '');
    } catch (error) {
      setStatus(`${zh ? '\u8bfb\u53d6\u6a21\u677f\u5931\u8d25\uff1a' : 'Failed to read template: '}${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const recognize = async () => {
    if (!draftText.trim()) return;
    setRecognizing(true);
    setRecognizedDraft(null);
    setStatus(zh ? '\u6b63\u5728\u8bc6\u522b\u6a21\u677f\u2026' : 'Recognizing template...');
    try {
      const result = readObsidianTemplateRecognitionResult(
        await window.electronAPI?.obsidianTemplate.recognize(draftText)
      );
      if (!result || !result.ok) {
        setStatus(`${zh ? '\u8bc6\u522b\u5931\u8d25\uff1a' : 'Recognition failed: '}${result?.error ?? ''}`);
        return;
      }
      setRecognizedDraft(result.draft);
      setStatus(
        result.draft.unmatched
          ? (zh ? '\u8bc6\u522b\u4e0d\u591f\u786e\u5b9a\uff0c\u5df2\u751f\u6210\u4fdd\u5b88\u8349\u7a3f\u3002' : 'Low confidence; conservative draft created.')
          : (zh ? '\u5df2\u751f\u6210\u6a21\u677f\u8349\u7a3f\u3002' : 'Template draft ready.'),
      );
    } catch (error) {
      setStatus(`${zh ? '\u8bc6\u522b\u5931\u8d25\uff1a' : 'Recognition failed: '}${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRecognizing(false);
    }
  };

  const applyDraft = () => {
    if (!recognizedDraft) return;
    onChange(draftToSettings(templates, recognizedDraft));
    setRecognizedDraft(null);
    setDraftText('');
    setStatus(zh ? '\u5df2\u5e94\u7528\u5230\u8bbe\u7f6e\u3002' : 'Applied to settings.');
  };

  return {
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
  };
}
