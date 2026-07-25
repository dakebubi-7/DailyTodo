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
