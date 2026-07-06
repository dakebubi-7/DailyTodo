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
  return tasks.map((task) =>
    taskMatchesDate(task, selectedDate, currentDate) && task.completed && !task.cleared
      ? { ...task, cleared: true }
      : task
  );
}

export function changeTaskPriority(tasks: Task[], id: string, priority: Task['priority']): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, priority } : task));
}

export function editTaskText(task: Task, text: string): Task {
  return { ...task, text };
}

export function updateTaskFields(task: Task, updates: TaskFieldUpdates): Task {
  return { ...task, ...updates };
}

export function toggleTaskCollapseState(task: Task): Task {
  return { ...task, collapsed: !task.collapsed };
}
