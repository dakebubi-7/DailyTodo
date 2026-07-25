import type { Task, TaskHandoff } from '../types/task';

export function applyAiHandoff(
  _task: Task,
  handoff: TaskHandoff,
  updateNextStep: boolean,
): Partial<Pick<Task, 'handoff' | 'nextStep'>> {
  return {
    handoff,
    ...(updateNextStep ? { nextStep: handoff.nextStep } : {}),
  };
}
