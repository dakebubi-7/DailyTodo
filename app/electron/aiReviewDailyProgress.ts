import type { AiReviewRunFinalStatus, AiReviewStageDiagnostic } from '../shared/aiReview/runDiagnostics';
import type { LlmResult } from '../shared/llm/openaiClient';

type DailyProgressOptions = {
  emit(
    reportKind: 'daily',
    stageKey: AiReviewStageDiagnostic['key'],
    label: string,
    status: AiReviewStageDiagnostic['status'],
    message?: string,
  ): void;
  createStage(
    key: AiReviewStageDiagnostic['key'],
    label: string,
    status: AiReviewStageDiagnostic['status'],
    durationMs?: number,
    message?: string,
  ): AiReviewStageDiagnostic;
};

const labels = {
  inspectDaily: '检查日报',
  requestAi: '请求 AI',
  prepareMaterials: '整理素材',
  buildPrompt: '提交提示词',
  waitForModel: '等待模型返回',
  writeObsidian: '写入 Obsidian',
  confirmResult: '确认结果',
} as const;

const messages = {
  inspectDailyRunning: '检查日报文件和 AI 生成内容',
  prepareMaterialsRunning: '整理任务、今日工作和灵感随笔素材',
  dailyNoteMissing: '日记文件不存在，请先同步/创建当天日记后再生成复盘',
  buildPrompt: '将提示词提交给 AI 前完成组装',
  waitForModelRunning: '等待模型返回复盘内容',
  waitForModelCompleted: '已收到 AI 内容',
  writeObsidianCompleted: '日报复盘已写入或无需写入',
  confirmResultCompleted: '生成完成',
  aiContentFound: '发现已有 AI 内容',
  aiContentNotFound: '未发现 AI 内容',
} as const;

export function createDailyAiReviewProgress({ emit, createStage }: DailyProgressOptions) {
  const stages: AiReviewStageDiagnostic[] = [];

  function emitStage(
    key: AiReviewStageDiagnostic['key'],
    status: AiReviewStageDiagnostic['status'],
    message?: string,
  ) {
    emit('daily', key, getLabel(key), status, message);
  }

  function record(
    key: AiReviewStageDiagnostic['key'],
    status: AiReviewStageDiagnostic['status'],
    durationMs?: number,
    message?: string,
  ) {
    const value = createStage(key, getLabel(key), status, durationMs, message);
    stages.push(value);
    emitStage(key, status, message);
    return value;
  }

  return {
    labels,
    messages,
    stages,
    emit: emitStage,
    emitUnavailable(message: string) {
      emit('daily', 'requestAi', labels.requestAi, 'failed', message);
    },
    record,
    getRequestStatus(llmResults: LlmResult[]) {
      return llmResults.some((item) => !item.ok) ? 'failed' : 'completed' as const;
    },
    getFinalStatus(resultOk: boolean, llmResults: LlmResult[]): AiReviewRunFinalStatus {
      if (!resultOk) return 'writeFailed';
      return llmResults.some((item) => !item.ok) ? 'completedWithWarning' : 'completed';
    },
  };
}

function getLabel(key: AiReviewStageDiagnostic['key']): string {
  if (key === 'requestAi') return labels.waitForModel;
  return labels[key as keyof typeof labels] ?? key;
}
