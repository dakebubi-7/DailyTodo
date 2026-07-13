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

function haveSameOrder(left: readonly string[] | undefined, right: readonly string[]): boolean {
  if (!left || left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
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
  const currentDateOrder = orderByDate[date];

  if (haveSameOrder(currentDateOrder?.sourceOrder, nextSourceOrder)) {
    return orderByDate;
  }

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
  const bucketTasks: Task[] = [];
  const bucketIds = new Set<string>();
  const sourceTaskIds = new Set<string>();

  for (const task of allTasks) {
    if (
      task.cleared ||
      !taskMatchesDate(task, date, currentDate) ||
      getTaskSource(task) !== source
    ) {
      continue;
    }

    sourceTaskIds.add(task.id);
    if (task.completed === completed) {
      bucketTasks.push(task);
      bucketIds.add(task.id);
    }
  }

  const previousOrder = dateOrder.taskOrderBySource?.[source] || [];
  const nextBucketOrder = buildTaskOrderAfterMove(bucketTasks, previousOrder, activeId, overId);
  const preservedOtherBucketOrder = previousOrder.filter((id) => sourceTaskIds.has(id) && !bucketIds.has(id));
  const nextSourceOrder = [...nextBucketOrder, ...preservedOtherBucketOrder];

  if (haveSameOrder(dateOrder.taskOrderBySource?.[source], nextSourceOrder)) {
    return orderByDate;
  }

  return {
    ...orderByDate,
    [date]: {
      ...dateOrder,
      taskOrderBySource: {
        ...(dateOrder.taskOrderBySource || {}),
        [source]: nextSourceOrder,
      },
    },
  };
}
