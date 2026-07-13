import { app, dialog, ipcMain, type BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import {
  resolveActiveProfile,
  type AiReviewSettings,
} from '../shared/aiReview/aiReviewSettings';
import { buildRecognizeReportMessages, parseRecognizedReportPrompt, type ReportTemplateTarget } from '../shared/aiReview/recognizeReportTemplate';
import { buildRecognizeMessages, parseRecognizedSections } from '../shared/aiReview/recognizeTemplate';
import type { SectionConfig } from '../shared/aiReview/sectionConfig';
import { parseTemplateFile } from '../shared/aiReview/templateFile';
import type { ChatMessage, LlmProvider, LlmResult } from '../shared/llm/openaiClient';
import { listModels } from '../shared/llm/openaiClient';
import {
  AI_REVIEW_DISABLED_ERROR,
  PICK_TEMPLATE_FILE_FILTER,
  PICK_TEMPLATE_FILE_TITLE,
  RECOGNIZE_REPORT_PROMPT_ERROR,
  REPORT_TEMPLATE_REQUIRED_ERROR,
  TEMPLATE_CONTENT_REQUIRED_ERROR,
} from './aiReviewIpcMessages';
import { isObjectRecord } from './unknownValueGuards';

export type RegisterAiReviewTemplateToolsIpcHandlersOptions = {
  win: BrowserWindow;
  getAiReviewSettings(): AiReviewSettings;
  getReviewSections(): SectionConfig[];
  getLlmCaller(): (messages: ChatMessage[]) => Promise<LlmResult>;
  getVaultPath(): string | undefined;
  extractDocxText(buffer: Buffer): Promise<string>;
  zh(text: string): string;
};

export function registerAiReviewTemplateToolsIpcHandlers({
  win,
  getAiReviewSettings,
  getReviewSections,
  getLlmCaller,
  getVaultPath,
  extractDocxText,
  zh,
}: RegisterAiReviewTemplateToolsIpcHandlersOptions): void {
  ipcMain.handle('aiReview:recognizeTemplate', async (_event, rawTemplate: unknown) => {
    const fallback = getReviewSections();
    if (typeof rawTemplate !== 'string' || !rawTemplate.trim()) {
      return { ok: false, error: TEMPLATE_CONTENT_REQUIRED_ERROR, sections: fallback, unmatched: true };
    }

    const settings = getAiReviewSettings();
    if (!settings.enabled || !resolveActiveProfile(settings).apiKey) {
      return { ok: false, error: AI_REVIEW_DISABLED_ERROR, sections: fallback, unmatched: true };
    }

    const llm = await getLlmCaller()(buildRecognizeMessages(rawTemplate));
    if (!llm.ok) {
      return { ok: false, error: llm.error, sections: fallback, unmatched: true };
    }

    const parsed = parseRecognizedSections(llm.content, fallback);
    return { ok: true, sections: parsed.sections, confidence: parsed.confidence, unmatched: parsed.unmatched };
  });

  ipcMain.handle('aiReview:recognizeReportTemplate', async (_event, target: unknown, rawTemplate: unknown) => {
    if (typeof rawTemplate !== 'string' || !rawTemplate.trim()) {
      return { ok: false, error: REPORT_TEMPLATE_REQUIRED_ERROR, prompt: '' };
    }

    const settings = getAiReviewSettings();
    if (!settings.enabled || !resolveActiveProfile(settings).apiKey) {
      return { ok: false, error: AI_REVIEW_DISABLED_ERROR, prompt: '' };
    }

    const safeTarget: ReportTemplateTarget =
      target === 'personalMonthly' || target === 'externalWeekly' || target === 'externalMonthly'
        ? target
        : 'personalWeekly';
    const llm = await getLlmCaller()(buildRecognizeReportMessages(rawTemplate, safeTarget));
    if (!llm.ok) {
      return { ok: false, error: llm.error, prompt: '' };
    }

    const prompt = parseRecognizedReportPrompt(llm.content);
    if (!prompt) {
      return { ok: false, error: RECOGNIZE_REPORT_PROMPT_ERROR, prompt: '' };
    }

    return { ok: true, target: safeTarget, prompt };
  });

  ipcMain.handle('aiReview:listModels', async (
    _event,
    cfg: unknown,
  ) => {
    const modelListConfig = isObjectRecord(cfg) ? cfg : undefined;
    const baseUrl = typeof modelListConfig?.baseUrl === 'string' ? modelListConfig.baseUrl : '';
    const apiKey = typeof modelListConfig?.apiKey === 'string' ? modelListConfig.apiKey : '';
    const rawProvider = modelListConfig?.provider;
    const provider: LlmProvider | 'auto' =
      rawProvider === 'openai' ||
      rawProvider === 'anthropic' ||
      rawProvider === 'gemini' ||
      rawProvider === 'auto'
        ? rawProvider
        : 'auto';
    return listModels({ baseUrl, apiKey, model: '' }, { provider, timeoutMs: 20_000 });
  });

  ipcMain.handle('aiReview:pickTemplateFile', async () => {
    const result = await dialog.showOpenDialog(win, {
      title: zh(PICK_TEMPLATE_FILE_TITLE),
      defaultPath: getVaultPath() || app.getPath('documents'),
      properties: ['openFile'],
      filters: [{ name: zh(PICK_TEMPLATE_FILE_FILTER), extensions: ['md', 'txt', 'docx'] }],
    });
    if (result.canceled || !result.filePaths[0]) {
      return { ok: false, canceled: true };
    }

    const filePath = result.filePaths[0];
    if (typeof filePath !== 'string') {
      return { ok: false, error: 'Template path must be a string.' };
    }
    const fileName = path.basename(filePath);
    try {
      if (!fs.statSync(filePath).isFile()) {
        return { ok: false, error: 'Template path must be a file.' };
      }
      const buffer = fs.readFileSync(filePath);
      const parsed = await parseTemplateFile(buffer, fileName, extractDocxText);
      if (!parsed.ok) {
        return { ok: false, error: parsed.error };
      }
      return { ok: true, text: parsed.text, fileName };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
