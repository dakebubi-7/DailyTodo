import fs from 'fs';
import type { ObsidianTemplateSettings } from '../shared/appSettings';
import type { AiReviewProfileResolution, AiReviewReportKind } from '../shared/aiReview/aiReviewSettings';
import type { SectionConfig } from '../shared/aiReview/sectionConfig';
import type { AiReviewRunDiagnostic, AiReviewRunFinalStatus, AiReviewStageDiagnostic } from '../shared/aiReview/runDiagnostics';
import type { ChatMessage, LlmResult } from '../shared/llm/openaiClient';
import { buildHandoffMessages, parseAiHandoff } from '../shared/aiReview/handoff';
import { getTaskDate } from '../shared/taskRollover';
import { runReviewForFile } from './aiReview/runner';
import { inspectDailyAiContentWithSnapshot } from './aiReviewDailyContentInspection';
import { createDailyAiReviewProgress } from './aiReviewDailyProgress';
import type { ElectronTask, InspectDailyResult } from './sharedTypes';

type AiReviewHandoffSuggestion = {
  taskId: string;
  handoff: NonNullable<ElectronTask['handoff']>;
};

type AiReviewDailyRunnerTask = ElectronTask;

type EnsureReportLlmAvailableResult =
  | {
    ok: true;
    callLlm(messages: ChatMessage[]): Promise<LlmResult>;
    resolution: AiReviewProfileResolution;
  }
  | {
    ok: false;
    error: string;
    resolution?: AiReviewProfileResolution;
  };

type CreateAiReviewDailyRunnerOptions = {
  getDailyFilePath(date?: string): string;
  getTemplates(): ObsidianTemplateSettings;
  getReviewSections(): SectionConfig[];
  ensureReportLlmAvailable(reportKind: AiReviewReportKind): EnsureReportLlmAvailableResult;
  emitAiReviewProgress(
    reportKind: 'daily',
    stageKey: AiReviewStageDiagnostic['key'],
    label: string,
    status: AiReviewStageDiagnostic['status'],
    message?: string
  ): void;
  stage(
    key: AiReviewStageDiagnostic['key'],
    label: string,
    status: AiReviewStageDiagnostic['status'],
    durationMs?: number,
    message?: string
  ): AiReviewStageDiagnostic;
  createDiagnostic(params: {
    reportKind: 'daily';
    startedAt: number;
    finalStatus: AiReviewRunFinalStatus;
    resolution?: AiReviewProfileResolution;
    stages: AiReviewStageDiagnostic[];
    llmResults?: LlmResult[];
    sourceChars?: number;
    error?: string;
    warning?: string;
  }): AiReviewRunDiagnostic;
};

export function createAiReviewDailyRunner({
  getDailyFilePath,
  getTemplates,
  getReviewSections,
  ensureReportLlmAvailable,
  emitAiReviewProgress,
  stage,
  createDiagnostic,
}: CreateAiReviewDailyRunnerOptions) {
  function inspectDailyAiContent(date: string): InspectDailyResult {
    const { snapshot: _snapshot, ...inspection } = inspectDailyAiContentWithSnapshot(getDailyFilePath, date);
    return inspection;
  }

  async function runReviewForDate(date: string, tasks: AiReviewDailyRunnerTask[], force = false) {
    const startedAt = Date.now();
    const progress = createDailyAiReviewProgress({ emit: emitAiReviewProgress, createStage: stage });
    const { labels, messages } = progress;
    progress.emit('inspectDaily', 'running', messages.inspectDailyRunning);
    const llm = ensureReportLlmAvailable('daily');
    if (!llm.ok) {
      progress.emitUnavailable(llm.error);
      const diagnostic = createDiagnostic({
        reportKind: 'daily',
        startedAt,
        finalStatus: 'accountUnavailable',
        resolution: llm.resolution,
        stages: [stage('requestAi', labels.requestAi, 'failed', undefined, llm.error)],
        error: llm.error,
      });
      return { ok: false, error: llm.error, filledMarkers: [], skippedMarkers: [], failedMarkers: [], handoffs: [], diagnostic };
    }

    const prepareStart = Date.now();
    const filePath = getDailyFilePath(date);
    const inspection = inspectDailyAiContentWithSnapshot(getDailyFilePath, date);
    const inspectionMessage = inspection.error ?? (inspection.hasAiContent ? messages.aiContentFound : messages.aiContentNotFound);
    progress.record('inspectDaily', inspection.error ? 'failed' : 'completed', Date.now() - startedAt, inspectionMessage);
    if (inspection.error) {
      const error = `读取日记失败：${inspection.error}`;
      const diagnostic = createDiagnostic({
        reportKind: 'daily',
        startedAt,
        finalStatus: 'noSourceMaterials',
        resolution: llm.resolution,
        stages: progress.stages,
        error,
      });
      return { ok: false, error, filledMarkers: [], skippedMarkers: [], failedMarkers: [], handoffs: [], diagnostic };
    }

    progress.emit('prepareMaterials', 'running', messages.prepareMaterialsRunning);
    if (!fs.existsSync(filePath)) {
      progress.record('prepareMaterials', 'failed', Date.now() - prepareStart, messages.dailyNoteMissing);
      const diagnostic = createDiagnostic({
        reportKind: 'daily',
        startedAt,
        finalStatus: 'noSourceMaterials',
        resolution: llm.resolution,
        stages: progress.stages,
        error: messages.dailyNoteMissing,
      });
      return { ok: false, error: messages.dailyNoteMissing, filledMarkers: [], skippedMarkers: [], failedMarkers: [], handoffs: [], diagnostic };
    }

    const sourceChars = inspection.snapshot?.content.length ?? 0;
    const customBlocks = getTemplates().dailyTemplate.customBlocks.filter((block) => block.aiGenerate);
    const prepareMaterialsMessage = `日记 ${sourceChars} 字符，${customBlocks.length} 个自定义 AI 块`;
    progress.record('prepareMaterials', 'completed', Date.now() - prepareStart, prepareMaterialsMessage);

    progress.record('buildPrompt', 'completed', undefined, messages.buildPrompt);

    const llmResults: LlmResult[] = [];
    const requestStart = Date.now();
    const result = await runReviewForFile({
      filePath,
      initialSnapshot: inspection.snapshot,
      date,
      tasks,
      sections: getReviewSections(),
      customBlocks,
      force,
      callLlm: async (chatMessages) => {
        progress.emit('requestAi', 'running', messages.waitForModelRunning);
        const value = await llm.callLlm(chatMessages);
        progress.emit('requestAi', value.ok ? 'completed' : 'failed', value.ok ? messages.waitForModelCompleted : value.error);
        llmResults.push(value);
        return value;
      },
    });

    progress.record('requestAi', progress.getRequestStatus(llmResults), Date.now() - requestStart, llmResults.length ? undefined : '没有需要 AI 填写的复盘块');

    const handoffs: AiReviewHandoffSuggestion[] = [];
    const handoffWarnings: string[] = [];
    if (result.ok) {
      for (const task of tasks) {
        if (
          task.completed
          || task.cleared
          || getTaskDate(task, date) !== date
          || (task.focusDate !== date && !task.carryoverContext)
        ) continue;
        let handoffResult: LlmResult;
        try {
          handoffResult = await llm.callLlm(buildHandoffMessages({ date, task }));
        } catch (error) {
          handoffResult = { ok: false, error: error instanceof Error ? error.message : String(error) };
        }
        llmResults.push(handoffResult);
        if (!handoffResult.ok) {
          handoffWarnings.push(`${task.text}: ${handoffResult.error}`);
          continue;
        }
        const handoff = parseAiHandoff(handoffResult.content);
        if (!handoff) {
          handoffWarnings.push(`${task.text}: AI 交接建议格式无效`);
          continue;
        }
        handoffs.push({ taskId: task.id, handoff });
      }
    }

    const warning = [result.warning, ...handoffWarnings].filter(Boolean).join('; ') || undefined;
    const writeStatus = result.ok ? 'completed' : 'failed';
    const writeMessage = result.ok ? (warning ?? messages.writeObsidianCompleted) : result.error;
    progress.record('writeObsidian', writeStatus, undefined, writeMessage);

    progress.record('confirmResult', warning ? 'warning' : result.ok ? 'completed' : 'failed', undefined, result.ok ? (warning ?? messages.confirmResultCompleted) : result.error);
    const diagnostic = createDiagnostic({
      reportKind: 'daily',
      startedAt,
      finalStatus: warning && result.ok ? 'completedWithWarning' : progress.getFinalStatus(result.ok, llmResults),
      resolution: llm.resolution,
      stages: progress.stages,
      llmResults,
      sourceChars,
      error: result.error,
      warning,
    });
    return { ...result, ...(warning ? { warning } : {}), handoffs, diagnostic };
  }

  return {
    inspectDailyAiContent,
    runReviewForDate,
  };
}
