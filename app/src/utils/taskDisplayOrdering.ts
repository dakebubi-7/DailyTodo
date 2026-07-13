import type { Task, TaskSource } from '../types/task';
import type { TaskListOrderByDate } from './taskOrderPersistence';
import { isTaskSource } from './taskOrderPersistence';

export const DEFAULT_SOURCE_ORDER: TaskSource[] = ['personal', 'external'];

const priorityOrder: Record<Task['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function getTaskSource(task: Task): TaskSource {
  return task.source || 'personal';
}

export function getSourceOrderForDate(orderByDate: TaskListOrderByDate, date: string): TaskSource[] {
  const saved = orderByDate[date]?.sourceOrder;
  if (!saved?.length) return DEFAULT_SOURCE_ORDER;

  let hasPersonal = false;
  let hasExternal = false;
  let needsNormalization = false;
  for (const source of saved) {
    if (source === 'personal') {
      hasPersonal = true;
    } else if (source === 'external') {
      hasExternal = true;
    } else {
      needsNormalization = true;
    }
  }

  if (!hasPersonal && !hasExternal) return DEFAULT_SOURCE_ORDER;
  if (!needsNormalization && hasPersonal && hasExternal) {
    return saved[0] === 'personal' && saved[1] === 'external' && saved.length === 2
      ? DEFAULT_SOURCE_ORDER
      : saved;
  }

  const normalized: TaskSource[] = [];
  for (const source of saved) {
    if (isTaskSource(source)) normalized.push(source);
  }
  if (!hasPersonal) normalized.push('personal');
  if (!hasExternal) normalized.push('external');
  return normalized;
}

function byDefaultTaskOrder(a: Task, b: Task) {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  const priorityDelta = priorityOrder[a.priority] - priorityOrder[b.priority];
  if (priorityDelta !== 0) return priorityDelta;
  return 0;
}

function sortMissingTasksByPriority(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    const priorityDelta = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDelta !== 0) return priorityDelta;
    return 0;
  });
}

function insertMissingTasksByPriority(orderedTasks: Task[], missingTasks: Task[]) {
  const missingByPriority: Record<Task['priority'], Task[]> = {
    high: [],
    medium: [],
    low: [],
  };
  for (const task of missingTasks) {
    missingByPriority[task.priority].push(task);
  }

  const result: Task[] = [];
  let priorityIndex = 0;
  const priorities: Task['priority'][] = ['high', 'medium', 'low'];
  for (const task of orderedTasks) {
    while (priorityIndex < priorities.length && priorityOrder[priorities[priorityIndex]] < priorityOrder[task.priority]) {
      result.push(...missingByPriority[priorities[priorityIndex]]);
      priorityIndex += 1;
    }
    result.push(task);
  }
  while (priorityIndex < priorities.length) {
    result.push(...missingByPriority[priorities[priorityIndex]]);
    priorityIndex += 1;
  }
  return result;
}

function sortCompletionBucket(tasks: Task[], manualOrder?: string[]) {
  if (!manualOrder?.length) return sortMissingTasksByPriority(tasks);

  const taskById = new Map<string, Task>();
  for (const task of tasks) {
    taskById.set(task.id, task);
  }

  const orderedTasks: Task[] = [];
  const orderedIds = new Set<string>();
  for (const id of manualOrder) {
    const task = taskById.get(id);
    if (!task) continue;
    orderedTasks.push(task);
    orderedIds.add(task.id);
  }

  const missingTasks: Task[] = [];
  for (const task of tasks) {
    if (!orderedIds.has(task.id)) missingTasks.push(task);
  }

  return insertMissingTasksByPriority(orderedTasks, missingTasks);
}

function sortSourceTasks(tasks: Task[], manualOrder?: string[]) {
  const openTasks: Task[] = [];
  const doneTasks: Task[] = [];
  for (const task of tasks) {
    (task.completed ? doneTasks : openTasks).push(task);
  }
  return [
    ...sortCompletionBucket(openTasks, manualOrder),
    ...sortCompletionBucket(doneTasks, manualOrder),
  ];
}

export function sortTasksForDisplay(
  tasks: Task[],
  selectedDate: string,
  orderByDate: TaskListOrderByDate,
  sourceOrder = getSourceOrderForDate(orderByDate, selectedDate),
) {
  const dateOrder = orderByDate[selectedDate];
  if (!dateOrder?.taskOrderBySource?.personal && tasks.every((task) => getTaskSource(task) === 'personal')) {
    return [...tasks].sort(byDefaultTaskOrder);
  }

  const knownSources = new Set(sourceOrder);
  const tasksBySource = new Map<TaskSource, Task[]>();
  const sourcesInTasks: TaskSource[] = [];
  for (const task of tasks) {
    const source = getTaskSource(task);
    const sourceTasks = tasksBySource.get(source);
    if (sourceTasks) {
      sourceTasks.push(task);
    } else {
      tasksBySource.set(source, [task]);
      sourcesInTasks.push(source);
    }
  }
  const orderedSources = [
    ...sourceOrder,
    ...sourcesInTasks.filter((source) => !knownSources.has(source)),
  ];

  const sortedTasks: Task[] = [];
  for (const source of orderedSources) {
    const sourceTasks = tasksBySource.get(source) || [];
    if (!sourceTasks.length) continue;
    const manualOrder = dateOrder?.taskOrderBySource?.[source];
    const sortedSourceTasks = manualOrder?.length
      ? sortSourceTasks(sourceTasks, manualOrder)
      : [...sourceTasks].sort(byDefaultTaskOrder);
    sortedTasks.push(...sortedSourceTasks);
  }
  return sortedTasks;
}
