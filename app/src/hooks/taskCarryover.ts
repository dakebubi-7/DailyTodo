import { v4 as uuidv4 } from 'uuid';
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
    id: uuidv4(),
    text: baseText,
    completed: false,
    priority: task.priority,
    source: task.source,
    createdAt: new Date().toISOString(),
    taskDate: targetDate,
    isToday: true,
    carriedFromDate: sourceDate,
    carriedFromTaskId: task.id,
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
  const inheritedTasks = tasks.filter((task) => (
    getTaskDate(task) === sourceDate &&
    shouldCarryTaskForward(task) &&
    !carriedIds.has(task.id) &&
    !tasks.some((candidate) => candidate.taskDate === targetDate && candidate.carriedFromTaskId === task.id)
  ));

  if (!inheritedTasks.length) {
    return { tasks, ledger };
  }

  return {
    tasks: [...inheritedTasks.map((task) => buildCarryoverTask(task, targetDate)), ...tasks],
    ledger: {
      ...ledger,
      [targetDate]: [...carriedIds, ...inheritedTasks.map((task) => task.id)],
    },
  };
}

export function applyBusinessDateCarryover({
  tasks,
  targetDate,
  ledger,
  settings,
}: ApplyBusinessDateCarryoverInput): TaskCarryoverResult {
  const normalizedTasks = tasks.map((task) => normalizeTask(task, targetDate));
  const carryoverResult = carryForwardTasks(normalizedTasks, targetDate, ledger, settings);

  return {
    tasks: carryoverResult.tasks.map((task) => normalizeTask(task, targetDate)),
    ledger: carryoverResult.ledger,
  };
}
