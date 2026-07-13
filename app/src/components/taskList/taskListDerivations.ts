import type { Task, TaskSource } from '../../types/task';
import { getTaskSource } from './taskListModel';

export interface TaskSourceGroup {
  source: TaskSource;
  tasks: Task[];
}

function buildSourceGroups(grouped: Map<TaskSource, Task[]>, sourceOrder: TaskSource[]): TaskSourceGroup[] {
  const sourcesInTasks = Array.from(grouped.keys());
  const sourceOrderSet = new Set(sourceOrder);
  const orderedSources: TaskSource[] = [];

  for (const source of sourceOrder) {
    if (grouped.has(source)) orderedSources.push(source);
  }
  for (const source of sourcesInTasks) {
    if (!sourceOrderSet.has(source)) orderedSources.push(source);
  }

  return orderedSources.map((source) => ({ source, tasks: grouped.get(source) || [] }));
}

function sortTagHistory(tagCounts: Map<string, number>) {
  return Array.from(tagCounts.keys()).sort((a, b) => {
    const countA = tagCounts.get(a) || 0;
    const countB = tagCounts.get(b) || 0;
    return countB - countA;
  });
}

export function getTaskTagHistory(tasks: Task[]) {
  const tagCounts = new Map<string, number>();
  tasks.forEach((task) => {
    (task.tags || []).forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return sortTagHistory(tagCounts);
}

export function getTaskSourceGroups(tasks: Task[], sourceOrder: TaskSource[]): TaskSourceGroup[] {
  const grouped = new Map<TaskSource, Task[]>();
  tasks.forEach((task) => {
    const source = getTaskSource(task);
    const sourceTasks = grouped.get(source);
    if (sourceTasks) {
      sourceTasks.push(task);
    } else {
      grouped.set(source, [task]);
    }
  });

  return buildSourceGroups(grouped, sourceOrder);
}

export function shouldShowSourceGroups(tasks: Task[]) {
  return tasks.some((task) => getTaskSource(task) === 'external');
}

export function getTaskListDerivations(tasks: Task[], sourceOrder: TaskSource[]) {
  const tagCounts = new Map<string, number>();
  let grouped: Map<TaskSource, Task[]> | undefined;
  const personalTasks: Task[] = [];
  let shouldGroupBySource = false;

  for (const task of tasks) {
    for (const tag of task.tags || []) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }

    const source = getTaskSource(task);
    if (source === 'external' && !grouped) {
      shouldGroupBySource = true;
      grouped = new Map<TaskSource, Task[]>([['personal', personalTasks]]);
    }
    if (grouped) {
      const sourceTasks = grouped.get(source);
      if (sourceTasks) {
        sourceTasks.push(task);
      } else {
        grouped.set(source, [task]);
      }
    } else {
      personalTasks.push(task);
    }
  }

  return {
    allTags: sortTagHistory(tagCounts),
    sourceGroups: grouped ? buildSourceGroups(grouped, sourceOrder) : [],
    shouldGroupBySource,
  };
}
