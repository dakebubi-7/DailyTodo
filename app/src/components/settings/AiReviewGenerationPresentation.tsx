import type { AiReviewProgressEvent, AiReviewRunDiagnostic } from '../../../shared/aiReview/runDiagnostics';
import { getShellText } from '../../i18n';

type AiReviewText = ReturnType<typeof getShellText>['settings']['aiReview'];

export type GenerationAction = 'daily' | 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly';

export function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function previousWeekDate() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return formatLocalDate(date);
}

export function previousMonthStart() {
  const date = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  return formatLocalDate(date);
}

export function resultMessage(text: AiReviewText, result: { ok: boolean; error?: string; filePath?: string; truncated?: boolean }) {
  if (!result.ok) return `${text.genFailed}${result.error ?? '未知错误'}`;
  const prefix = result.truncated ? text.genTruncated : text.genSuccess;
  return `${prefix}${result.filePath ?? '完成'}`;
}

function progressStatusLabel(event: AiReviewProgressEvent | null) {
  if (!event) return '';
  if (event.message) return event.message;
  if (event.stageKey === 'requestAi') return '正在请求 AI / Requesting AI';
  return event.label;
}

export function progressDisplay(currentProgress: AiReviewProgressEvent | null, fallback: string) {
  return progressStatusLabel(currentProgress) || fallback;
}

const AI_PROGRESS_PERCENT: Record<string, number> = {
  inspectDaily: 12,
  prepareMaterials: 28,
  buildPrompt: 44,
  requestAi: 68,
  writeObsidian: 88,
  confirmResult: 100,
};

function progressPercent(currentProgress: AiReviewProgressEvent | null) {
  if (!currentProgress) return 0;
  if (currentProgress.status === 'failed') {
    if (currentProgress.stageKey === 'confirmResult') return 92;
    return AI_PROGRESS_PERCENT[currentProgress.stageKey] ?? 8;
  }
  if (currentProgress.status === 'completed' && currentProgress.stageKey === 'confirmResult') return 100;
  return AI_PROGRESS_PERCENT[currentProgress.stageKey] ?? 8;
}

export function GenerationProgress({ currentProgress, fallback }: { currentProgress: AiReviewProgressEvent | null; fallback: string }) {
  const percent = progressPercent(currentProgress);
  const label = progressDisplay(currentProgress, fallback);
  return (
    <div className="settings-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={label}>
      <div className="settings-progress-track">
        <div className="settings-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <small>{label}</small>
    </div>
  );
}

export function initialProgressForAction(action: GenerationAction): AiReviewProgressEvent {
  const reportKind = action === 'daily' ? 'daily' : action.includes('Monthly') ? 'monthly' : 'weekly';
  return {
    reportKind,
    stageKey: 'prepareMaterials',
    label: '准备素材',
    status: 'running',
    message: '准备真实进度',
    at: new Date().toISOString(),
  };
}

export function DiagnosticCard({ diagnostic, onClose }: { diagnostic: AiReviewRunDiagnostic; onClose: () => void }) {
  const usage = diagnostic.usage;
  return (
    <div className="settings-preview-list settings-generation-status">
      <div className="settings-row-header">
        <strong>运行诊断</strong>
        <button type="button" className="settings-reset-button" onClick={onClose}>关闭</button>
      </div>
      <p>{diagnostic.profile.profileName || diagnostic.profile.model} · {diagnostic.profile.provider} · {diagnostic.finalStatus}</p>
      <p>{usage && usage.source !== 'missing' ? `Token：${usage.totalTokens ?? '-'}（输入 ${usage.promptTokens ?? '-'} / 输出 ${usage.completionTokens ?? '-'}）` : '服务未返回 token 用量'}</p>
      {diagnostic.error && <p>{diagnostic.error}</p>}
    </div>
  );
}

export function finishProgress(action: GenerationAction, ok: boolean): AiReviewProgressEvent {
  return {
    reportKind: action === 'daily' ? 'daily' : action.includes('Monthly') ? 'monthly' : 'weekly',
    stageKey: 'confirmResult',
    label: ok ? '完成' : '失败',
    status: ok ? 'completed' : 'failed',
    message: ok ? '完成' : '失败',
    at: new Date().toISOString(),
  };
}
