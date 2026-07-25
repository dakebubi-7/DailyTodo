import { AppBehaviorSettings } from '../../shared/appSettings';
import { shiftDateKey, shouldCarryTaskForward } from '../../shared/taskRollover';
import { Task } from '../types/task';
import { getTaskDate, normalizeTask } from './taskTransforms';

export type TaskCarryoverLedger = Record<string, string[]>;

export interface TaskCarryoverResult {
  tasks: Task[];
  ledger: TaskCarryoverLedger;
}

export interface ApplyBusinessDateCarryoverInput {
  tasks: Task[];
  targetDate: string;
  ledger: TaskCarryoverLedger;
  settings: AppBehaviorSettings;
}

function buildCarryoverTask(task: Task, targetDate: string): Task {
  const sourceDate = getTaskDate(task);
  const suffix = `（继承自 ${sourceDate}）`;
  const baseText = task.text.includes(suffix) ? task.text : `${task.text}${suffix}`;

  return {
    id: crypto.randomUUID(),
    text: baseText,
    completed: false,
    priority: task.priority,
    source: task.source,
    createdAt: new Date().toISOString(),
    taskDate: targetDate,
    isToday: true,
    carriedFromDate: sourceDate,
    carriedFromTaskId: task.id,
    carryoverContext: task.handoff,
  };
}

export function carryForwardTasks(
  tasks: Task[],
  targetDate: string,
  ledger: TaskCarryoverLedger,
  settings: AppBehaviorSettings,
): TaskCarryoverResult {
  if (!settings.autoCarryForward) return { tasks, ledger };

  const sourceDate = shiftDateKey(targetDate, -1);
  const carriedIds = new Set(ledger[targetDate] || []);
  const carriedFromTaskIds = new Set<string>();
  const candidateTasks: Task[] = [];
  for (const task of tasks) {
    if (task.taskDate === targetDate && task.carriedFromTaskId) {
      carriedFromTaskIds.add(task.carriedFromTaskId);
    }
    if (
      getTaskDate(task) === sourceDate &&
      shouldCarryTaskForward(task) &&
      !carriedIds.has(task.id)
    ) {
      candidateTasks.push(task);
    }
  }
  const nextCarryovers: Task[] = [];
  const nextCarriedIds: string[] = [];
  for (const task of candidateTasks) {
    if (carriedFromTaskIds.has(task.id)) continue;
    nextCarryovers.push(buildCarryoverTask(task, targetDate));
    nextCarriedIds.push(task.id);
  }

  if (!nextCarryovers.length) {
    return { tasks, ledger };
  }

  return {
    tasks: [...nextCarryovers, ...tasks],
    ledger: {
      ...ledger,
      [targetDate]: [...carriedIds, ...nextCarriedIds],
    },
  };
}

export function applyBusinessDateCarryover({
  tasks,
  targetDate,
  ledger,
  settings,
}: ApplyBusinessDateCarryoverInput): TaskCarryoverResult {
  let normalizedTasks = tasks;
  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    const normalizedTask = normalizeTask(task, targetDate);
    if (normalizedTask === task) continue;
    if (normalizedTasks === tasks) normalizedTasks = tasks.slice();
    normalizedTasks[index] = normalizedTask;
  }
  const carryoverResult = carryForwardTasks(normalizedTasks, targetDate, ledger, settings);

  return {
    tasks: carryoverResult.tasks,
    ledger: carryoverResult.ledger,
  };
}
