import type { Task } from '../src/types/task';

export interface ArchivedObsidianTask {
  task: Task;
  deletedAt: string;
}

export function retainDeletedTask(
  archive: ArchivedObsidianTask[],
  task: Task,
  deletedAt = new Date().toISOString(),
): ArchivedObsidianTask[] {
  if (archive.some((entry) => entry.task.id === task.id)) return archive;
  return [...archive, { task, deletedAt }];
}

function hasTaskInTree(tasks: Task[], taskId: string): boolean {
  for (const task of tasks) {
    if (task.id === taskId || (task.subtasks?.length && hasTaskInTree(task.subtasks, taskId))) return true;
  }
  return false;
}

function appendSubtaskToParent(tasks: Task[], parentId: string, subtask: Task): Task[] {
  let nextTasks = tasks;

  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    let nextTask = task;

    if (task.id === parentId) {
      nextTask = { ...task, subtasks: [...(task.subtasks || []), subtask] };
    } else if (task.subtasks?.length) {
      const nextSubtasks = appendSubtaskToParent(task.subtasks, parentId, subtask);
      if (nextSubtasks !== task.subtasks) nextTask = { ...task, subtasks: nextSubtasks };
    }

    if (nextTask !== task) {
      if (nextTasks === tasks) nextTasks = tasks.slice();
      nextTasks[index] = nextTask;
      return nextTasks;
    }
  }

  return tasks;
}

export function mergeArchivedTasksForObsidian(
  activeTasks: Task[],
  archivedTasks: ArchivedObsidianTask[],
): Task[] {
  if (!archivedTasks.length) return activeTasks;

  const archivedTaskIds = new Set<string>();
  const pendingTasks: Task[] = [];

  for (const { task } of archivedTasks) {
    if (archivedTaskIds.has(task.id)) continue;
    archivedTaskIds.add(task.id);
    pendingTasks.push(task);
  }

  let mergedTasks = activeTasks;
  let pending = pendingTasks;
  let madeProgress = true;

  while (pending.length && madeProgress) {
    madeProgress = false;
    const nextPending: Task[] = [];

    for (const task of pending) {
      if (hasTaskInTree(mergedTasks, task.id)) continue;

      if (!task.parentTaskId) {
        mergedTasks = [...mergedTasks, task];
        madeProgress = true;
        continue;
      }

      const nextTasks = appendSubtaskToParent(mergedTasks, task.parentTaskId, task);
      if (nextTasks !== mergedTasks) {
        mergedTasks = nextTasks;
        madeProgress = true;
      } else {
        nextPending.push(task);
      }
    }

    pending = nextPending;
  }

  for (const task of pending) {
    if (!hasTaskInTree(mergedTasks, task.id)) mergedTasks = [...mergedTasks, task];
  }

  return mergedTasks;
}
