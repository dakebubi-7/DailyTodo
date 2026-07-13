import type { Task, TaskSource } from '../types/task';
import { taskMatchesDate } from './taskTransforms';

export {
  appendCompletionReviewToTask,
  deleteReviewFromTask,
  findTaskReview,
  getDeleteTaskReviewConfirmationMessage,
  retainDeletedTaskReviewForObsidian,
  updateTaskReview,
} from './taskReviewMutations';
export type {
  AppendCompletionReviewInput,
  TaskReviewUpdates,
} from './taskReviewMutations';

export interface CreateTaskInput {
  id: string;
  text: string;
  priority: Task['priority'];
  source: TaskSource;
  createdAt: string;
  taskDate: string;
  currentDate: string;
}

export interface AddSubtaskInput {
  id: string;
  text: string;
  createdAt: string;
}

export type TaskFieldUpdates = Partial<Task>;

export function createTask({
  id,
  text,
  priority,
  source,
  createdAt,
  taskDate,
  currentDate,
}: CreateTaskInput): Task {
  return {
    id,
    text,
    completed: false,
    priority,
    source,
    createdAt,
    taskDate,
    isToday: taskDate === currentDate,
  };
}

export function toggleTaskCompletion(task: Task, completedAt: string): Task {
  return {
    ...task,
    completed: !task.completed,
    completedAt: !task.completed ? completedAt : undefined,
  };
}

export function addSubtaskToTask(task: Task, { id, text, createdAt }: AddSubtaskInput): Task {
  const subtask: Task = {
    id,
    text,
    completed: false,
    priority: task.priority,
    source: task.source,
    createdAt,
    taskDate: task.taskDate,
    isToday: task.isToday,
    parentTaskId: task.id,
  };

  return {
    ...task,
    collapsed: false,
    subtasks: [...(task.subtasks || []), subtask],
  };
}

export function markTaskDoneWithoutReview(task: Task, completedAt: string): Task {
  return {
    ...task,
    completed: true,
    completedAt: task.completedAt || completedAt,
  };
}

export function clearCompletedTasks(tasks: Task[], selectedDate: string, currentDate: string): Task[] {
  let nextTasks = tasks;

  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    if (!taskMatchesDate(task, selectedDate, currentDate) || !task.completed || task.cleared) continue;

    if (nextTasks === tasks) nextTasks = tasks.slice();
    nextTasks[index] = { ...task, cleared: true };
  }

  return nextTasks;
}

export function changeTaskPriority(tasks: Task[], id: string, priority: Task['priority']): Task[] {
  const taskIndex = tasks.findIndex((task) => task.id === id);
  if (taskIndex === -1 || tasks[taskIndex].priority === priority) return tasks;

  const nextTasks = tasks.slice();
  nextTasks[taskIndex] = { ...tasks[taskIndex], priority };
  return nextTasks;
}

export function editTaskText(task: Task, text: string): Task {
  if (task.text === text) return task;
  return { ...task, text };
}

function areTaskFieldValuesEqual(key: keyof Task, current: unknown, next: unknown): boolean {
  if (current === next) return true;
  if (key !== 'tags' && key !== 'scheduledDates') return false;
  if (!Array.isArray(current) || !Array.isArray(next) || current.length !== next.length) return false;
  return current.every((value, index) => value === next[index]);
}

export function updateTaskFields(task: Task, updates: TaskFieldUpdates): Task {
  const updateKeys = Object.keys(updates) as Array<keyof Task>;
  if (updateKeys.every((key) => areTaskFieldValuesEqual(key, task[key], updates[key]))) return task;
  return { ...task, ...updates };
}

export function toggleTaskCollapseState(task: Task): Task {
  return { ...task, collapsed: !task.collapsed };
}
