import type { ChatMessage } from '../llm/openaiClient';
import type { TaskHandoff } from '../../src/types/task';

export type HandoffTaskContext = {
  id: string;
  text: string;
  nextStep?: string;
  carryoverContext?: Pick<TaskHandoff, 'nextStep' | 'progressSummary' | 'blocker'>;
};

export type BuildHandoffMessagesParams = {
  date: string;
  task: HandoffTaskContext;
};

export type DailyReviewTaskContext = {
  id: string;
  text: string;
  completed: boolean;
  review?: {
    status: 'done' | 'partial' | 'blocked';
    percent: number;
    summary: string;
    unknowns: string;
    nextStep: string;
    reviewedAt: string;
  };
  carryoverContext?: Pick<TaskHandoff, 'nextStep' | 'progressSummary' | 'blocker'>;
  wasFocus: boolean;
};

export type BuildDailyReviewMessagesParams = {
  sourceDate: string;
  task: DailyReviewTaskContext;
};

export type AiDailyReviewSuggestion = {
  progressSummary: string;
  blocker: string;
  suggestedAction?: string;
  shouldCarryForward: boolean;
  createdAt: string;
};

const HandoffStatuses = new Set<TaskHandoff['status']>(['done', 'partial', 'blocked', 'in-progress']);
const VagueNextSteps = new Set(['continue', 'continue working', '继续', '继续推进', '推进一下', '处理一下']);

function readJsonObject(content: string): Record<string, unknown> | undefined {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1] ?? trimmed;
  try {
    const parsed: unknown = JSON.parse(fenced);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined;
  } catch {
    return undefined;
  }
}

function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length <= maxLength;
}

function isHandoffStatus(value: unknown): value is TaskHandoff['status'] {
  return HandoffStatuses.has(value as TaskHandoff['status']);
}

function isMeaningfulNextStep(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.length >= 4 && !VagueNextSteps.has(normalized);
}

function isOptionalBoundedString(value: unknown, maxLength: number): value is string | undefined {
  return value === undefined || isBoundedString(value, maxLength);
}

export function parseAiHandoff(content: string, createdAt = new Date().toISOString()): TaskHandoff | undefined {
  const value = readJsonObject(content);
  if (!value) return undefined;
  const { status, progressSummary, blocker, nextStep: rawNextStep, shouldCarryForward } = value;
  if (!isHandoffStatus(status)) return undefined;
  if (!isBoundedString(progressSummary, 40) || !isBoundedString(blocker, 60) || !isBoundedString(rawNextStep, 35)) return undefined;
  if (typeof shouldCarryForward !== 'boolean') return undefined;
  const nextStep = rawNextStep.trim();
  if (shouldCarryForward && !isMeaningfulNextStep(nextStep)) return undefined;
  return {
    status,
    progressSummary: progressSummary.trim(),
    blocker: blocker.trim(),
    nextStep,
    shouldCarryForward,
    createdAt,
    source: 'ai',
  };
}

export function parseAiDailyReviewSuggestion(
  content: string,
  createdAt = new Date().toISOString(),
): AiDailyReviewSuggestion | undefined {
  const value = readJsonObject(content);
  if (!value) return undefined;
  const { progressSummary, blocker, suggestedAction: rawSuggestedAction, shouldCarryForward } = value;
  if (
    !isBoundedString(progressSummary, 160)
    || !isBoundedString(blocker, 160)
    || !isOptionalBoundedString(rawSuggestedAction, 180)
    || typeof shouldCarryForward !== 'boolean'
  ) return undefined;
  const suggestedAction = rawSuggestedAction?.trim();
  if (shouldCarryForward && !suggestedAction) return undefined;
  return {
    progressSummary: progressSummary.trim(),
    blocker: blocker.trim(),
    ...(suggestedAction ? { suggestedAction } : {}),
    shouldCarryForward,
    createdAt,
  };
}

export function buildHandoffMessages({ date, task }: BuildHandoffMessagesParams): ChatMessage[] {
  const context = task.carryoverContext;
  const system = [
    'Return only a JSON object. Do not use Markdown or code fences.',
    'Required keys: status, progressSummary, blocker, nextStep, shouldCarryForward.',
    'status must be one of done, partial, blocked, in-progress.',
    'Maximum lengths: progressSummary 40 characters, blocker 60 characters, nextStep 35 characters.',
    'When shouldCarryForward is true, nextStep must name a specific concrete action.',
  ].join('\n');
  const user = [
    `Date: ${date}`,
    `Task: ${task.text}`,
    task.nextStep ? `Current next step: ${task.nextStep}` : '',
    context?.progressSummary ? `Previous progress: ${context.progressSummary}` : '',
    context?.blocker ? `Previous blocker: ${context.blocker}` : '',
    context?.nextStep ? `Previous handoff next step: ${context.nextStep}` : '',
  ].filter(Boolean).join('\n');
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

export function buildDailyReviewMessages({ sourceDate, task }: BuildDailyReviewMessagesParams): ChatMessage[] {
  const review = task.review;
  const context = task.carryoverContext;
  const system = [
    'Return only a JSON object. Do not use Markdown or code fences.',
    'Required keys: progressSummary, blocker, suggestedAction, shouldCarryForward.',
    'progressSummary and blocker must be concise strings. suggestedAction must be a concise string or an empty string.',
    'shouldCarryForward must be a boolean.',
    'Treat the user completion record as primary evidence. Preserve its meaning. Do not invent facts, deliverables, tests, or scope.',
    'Return no suggested action when the task is genuinely complete and has no user-stated continuation.',
    'Return one result for this task only.',
  ].join('\n');
  const user = [
    `Source date: ${sourceDate}`,
    `Task: ${task.text}`,
    `Task state: ${task.completed ? 'completed stage' : 'open'}`,
    review ? `Completion status: ${review.status}` : 'Completion status: no new record',
    review ? `Completion: ${review.percent}%` : '',
    review?.summary ? `User progress: ${review.summary}` : '',
    review?.unknowns ? `User blockers or unknowns: ${review.unknowns}` : '',
    review?.nextStep ? `User next step: ${review.nextStep}` : '',
    context?.progressSummary ? `Previous carryover progress: ${context.progressSummary}` : '',
    context?.blocker ? `Previous carryover blocker: ${context.blocker}` : '',
    context?.nextStep ? `Previous carryover next step: ${context.nextStep}` : '',
    `Yesterday's Focus: ${task.wasFocus ? 'yes' : 'no'}`,
  ].filter(Boolean).join('\n');
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
