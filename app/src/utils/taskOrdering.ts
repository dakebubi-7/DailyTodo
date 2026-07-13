import type { Task, TabType, TaskSource } from '../types/task';
import {
  isTaskSource,
  type TaskListDateOrder,
  type TaskListOrderByDate,
} from './taskOrderPersistence';
import { DEFAULT_SOURCE_ORDER } from './taskDisplayOrdering';

export {
  isTaskSource,
  parseTaskListOrderByDate,
  type TaskListDateOrder,
  type TaskListOrderByDate,
} from './taskOrderPersistence';

export {
  DEFAULT_SOURCE_ORDER,
  getSourceOrderForDate,
  getTaskSource,
  sortTasksForDisplay,
} from './taskDisplayOrdering';

export const TASK_LIST_ORDER_KEY = 'taskListOrderByDate';

export interface TaskDragFilterState {
  activeTab: TabType;
  searchQuery: string;
  showOpenOnly: boolean;
  priorityFilter: 'all' | Task['priority'];
}

export function moveSourceInOrder(sourceOrder: TaskSource[], activeSource: TaskSource, overSource: TaskSource): TaskSource[] {
  const normalized = [...sourceOrder.filter(isTaskSource), ...DEFAULT_SOURCE_ORDER.filter((source) => !sourceOrder.includes(source))];
  const activeIndex = normalized.indexOf(activeSource);
  const overIndex = normalized.indexOf(overSource);
  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return normalized;
  const next = [...normalized];
  const [moved] = next.splice(activeIndex, 1);
  next.splice(overIndex, 0, moved);
  return next;
}

export function buildTaskOrderAfterMove(tasks: Task[], previousOrder: string[], activeId: string, overId: string): string[] {
  const taskIds = tasks.map((task) => task.id);
  const taskIdSet = new Set(taskIds);
  const activeIsNew = !previousOrder.includes(activeId);
  const overIsNew = !previousOrder.includes(overId);
  const normalized = activeIsNew || overIsNew
    ? taskIds
    : previousOrder.filter((id) => taskIdSet.has(id));
  const activeIndex = normalized.indexOf(activeId);
  const overIndex = normalized.indexOf(overId);
  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return normalized;
  const next = [...normalized];
  const [moved] = next.splice(activeIndex, 1);
  next.splice(overIndex, 0, moved);
  return next;
}

function cleanDateOrder(
  dateOrder: TaskListDateOrder,
  taskId: string,
): TaskListDateOrder | undefined | null {
  const savedTaskOrderBySource = dateOrder.taskOrderBySource;
  let changed = false;
  let hasSavedOrder = false;

  if (dateOrder.sourceOrder?.length) {
    for (const source of dateOrder.sourceOrder) {
      if (!isTaskSource(source)) {
        changed = true;
        break;
      }
    }
  } else if (dateOrder.sourceOrder) {
    changed = true;
  }

  if (savedTaskOrderBySource) {
    for (const source in savedTaskOrderBySource) {
      if (!Object.hasOwn(savedTaskOrderBySource, source)) continue;
      if (!isTaskSource(source)) {
        changed = true;
        continue;
      }
      const savedIds = savedTaskOrderBySource[source];
      if (!savedIds?.length) {
        changed = true;
        continue;
      }
      hasSavedOrder = true;
      for (const id of savedIds) {
        if (id === taskId) {
          changed = true;
          break;
        }
      }
    }
  }

  if (!dateOrder.sourceOrder?.length && !hasSavedOrder) changed = true;
  if (!changed) return null;

  const taskOrderBySource: Partial<Record<TaskSource, string[]>> = {};
  if (savedTaskOrderBySource) {
    for (const source in savedTaskOrderBySource) {
      if (!Object.hasOwn(savedTaskOrderBySource, source) || !isTaskSource(source)) continue;
      const savedIds = savedTaskOrderBySource[source];
      if (!savedIds?.length) continue;
      const ids: string[] = [];
      for (const id of savedIds) {
        if (id !== taskId) ids.push(id);
      }
      if (ids.length) taskOrderBySource[source] = ids;
    }
  }

  const cleaned: TaskListDateOrder = {};
  if (dateOrder.sourceOrder?.length) {
    const sourceOrder: TaskSource[] = [];
    for (const source of dateOrder.sourceOrder) {
      if (isTaskSource(source)) sourceOrder.push(source);
    }
    if (sourceOrder.length) cleaned.sourceOrder = sourceOrder;
  }
  if (Object.keys(taskOrderBySource).length) cleaned.taskOrderBySource = taskOrderBySource;
  if (!cleaned.sourceOrder?.length && !cleaned.taskOrderBySource) return undefined;
  return cleaned;
}

export function removeTaskIdFromOrder(orderByDate: TaskListOrderByDate, taskId: string): TaskListOrderByDate {
  let next: TaskListOrderByDate | undefined;

  for (const date in orderByDate) {
    if (!Object.hasOwn(orderByDate, date)) continue;
    const cleaned = cleanDateOrder(orderByDate[date], taskId);
    if (cleaned === null) continue;
    if (!next) next = { ...orderByDate };
    if (cleaned) {
      next[date] = cleaned;
    } else {
      delete next[date];
    }
  }
  return next || orderByDate;
}

export function isTaskDragDisabled(state: TaskDragFilterState) {
  return state.activeTab !== 'today' || Boolean(state.searchQuery.trim()) || state.showOpenOnly || state.priorityFilter !== 'all';
}
