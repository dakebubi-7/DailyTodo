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

function shouldCarryParentForward(task: Task) {
  return shouldCarryTaskForward(task) || Boolean(task.subtasks?.some(shouldCarryTaskForward));
}

function buildCarryoverSubtasks(task: Task, parentTaskId: string, targetDate: string, createdAt: string) {
  const subtasks: Task[] = [];
  for (const subtask of task.subtasks || []) {
    if (!shouldCarryTaskForward(subtask)) continue;
    subtasks.push({
      id: crypto.randomUUID(),
      text: subtask.text,
      completed: false,
      priority: subtask.priority,
      source: subtask.source,
      createdAt,
      taskDate: targetDate,
      isToday: true,
      parentTaskId,
      ...(subtask.handoff ? { carryoverContext: subtask.handoff } : {}),
    });
  }
  return subtasks;
}

function buildCarryoverTask(task: Task, targetDate: string): Task {
  const sourceDate = getTaskDate(task);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const subtasks = buildCarryoverSubtasks(task, id, targetDate, createdAt);

  return {
    id,
    text: task.text,
    completed: false,
    priority: task.priority,
    source: task.source,
    createdAt,
    taskDate: targetDate,
    isToday: true,
    carriedFromDate: sourceDate,
    carriedFromTaskId: task.id,
    carryoverContext: task.handoff,
    ...(subtasks.length ? {
      subtasks,
      subtaskCarryoverProgress: {
        total: task.subtasks?.length || 0,
        remaining: subtasks.length,
      },
    } : {}),
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
      shouldCarryParentForward(task) &&
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
