import type { Task, TaskSource } from '../types/task';
import {
  TaskListOrderByDate,
  buildTaskOrderAfterMove,
  getSourceOrderForDate,
  getTaskSource,
  moveSourceInOrder,
  removeTaskIdFromOrder,
} from '../utils/taskOrdering';
import { taskMatchesDate } from './taskTransforms';

export interface ReorderTasksWithinSourceInput {
  date: string;
  currentDate: string;
  source: TaskSource;
  completed: boolean;
  activeId: string;
  overId: string;
}

export function removeTaskFromTaskOrderState(
  orderByDate: TaskListOrderByDate,
  taskId: string,
): TaskListOrderByDate {
  return removeTaskIdFromOrder(orderByDate, taskId);
}

export function reorderSourceGroupsForDate(
  orderByDate: TaskListOrderByDate,
  date: string,
  activeSource: TaskSource,
  overSource: TaskSource,
): TaskListOrderByDate {
  const currentOrder = getSourceOrderForDate(orderByDate, date);
  const nextSourceOrder = moveSourceInOrder(currentOrder, activeSource, overSource);

  return {
    ...orderByDate,
    [date]: {
      ...(orderByDate[date] || {}),
      sourceOrder: nextSourceOrder,
    },
  };
}

export function reorderTasksWithinSourceForDate(
  orderByDate: TaskListOrderByDate,
  allTasks: Task[],
  {
    date,
    currentDate,
    source,
    completed,
    activeId,
    overId,
  }: ReorderTasksWithinSourceInput,
): TaskListOrderByDate {
  const dateOrder = orderByDate[date] || {};
  const sourceTasks = allTasks.filter((task) => (
    !task.cleared &&
    taskMatchesDate(task, date, currentDate) &&
    getTaskSource(task) === source
  ));
  const bucketTasks = sourceTasks.filter((task) => task.completed === completed);
  const bucketIds = new Set(bucketTasks.map((task) => task.id));
  const sourceTaskIds = new Set(sourceTasks.map((task) => task.id));
  const previousOrder = dateOrder.taskOrderBySource?.[source] || [];
  const nextBucketOrder = buildTaskOrderAfterMove(bucketTasks, previousOrder, activeId, overId);
  const preservedOtherBucketOrder = previousOrder.filter((id) => sourceTaskIds.has(id) && !bucketIds.has(id));

  return {
    ...orderByDate,
    [date]: {
      ...dateOrder,
      taskOrderBySource: {
        ...(dateOrder.taskOrderBySource || {}),
        [source]: [...nextBucketOrder, ...preservedOtherBucketOrder],
      },
    },
  };
}
