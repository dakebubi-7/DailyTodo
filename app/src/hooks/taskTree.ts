import type { Task } from '../types/task';

export function mapTaskTree(tasks: Task[], targetId: string, updater: (task: Task) => Task): Task[] {
  let nextTasks = tasks;

  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    let nextTask = task;

    if (task.id === targetId) {
      nextTask = updater(task);
    } else if (task.subtasks?.length) {
      const nextSubtasks = mapTaskTree(task.subtasks, targetId, updater);
      if (nextSubtasks !== task.subtasks) nextTask = { ...task, subtasks: nextSubtasks };
    }

    if (nextTask !== task) {
      if (nextTasks === tasks) nextTasks = tasks.slice();
      nextTasks[index] = nextTask;
    }
  }

  return nextTasks;
}

export function removeTaskFromTree(tasks: Task[], targetId: string): Task[] {
  let nextTasks: Task[] | null = null;

  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    if (task.id === targetId) {
      if (!nextTasks) nextTasks = tasks.slice(0, index);
      continue;
    }

    let nextTask = task;
    if (task.subtasks?.length) {
      const nextSubtasks = removeTaskFromTree(task.subtasks, targetId);
      if (nextSubtasks !== task.subtasks) nextTask = { ...task, subtasks: nextSubtasks };
    }

    if (nextTask !== task && !nextTasks) nextTasks = tasks.slice(0, index);
    if (nextTasks) nextTasks.push(nextTask);
  }

  return nextTasks || tasks;
}
