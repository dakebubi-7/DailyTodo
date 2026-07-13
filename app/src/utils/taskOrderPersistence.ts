import type { TaskSource } from '../types/task';
import { isObjectRecord } from '../../shared/unknownValueGuards';

export interface TaskListDateOrder {
  sourceOrder?: TaskSource[];
  taskOrderBySource?: Partial<Record<TaskSource, string[]>>;
}

export type TaskListOrderByDate = Record<string, TaskListDateOrder>;

export function isTaskSource(value: unknown): value is TaskSource {
  return value === 'personal' || value === 'external';
}

function parseTaskListDateOrder(value: unknown): TaskListDateOrder | undefined {
  if (!isObjectRecord(value)) return undefined;

  const cleaned: TaskListDateOrder = {};
  if (Array.isArray(value.sourceOrder)) {
    const sourceOrder = value.sourceOrder.filter(isTaskSource);
    if (sourceOrder.length) cleaned.sourceOrder = sourceOrder;
  }

  if (isObjectRecord(value.taskOrderBySource)) {
    const taskOrderBySource: Partial<Record<TaskSource, string[]>> = {};
    Object.entries(value.taskOrderBySource).forEach(([source, ids]) => {
      if (!isTaskSource(source) || !Array.isArray(ids)) return;
      const parsedIds = ids.filter((id): id is string => typeof id === 'string');
      if (parsedIds.length) taskOrderBySource[source] = parsedIds;
    });
    if (Object.keys(taskOrderBySource).length) cleaned.taskOrderBySource = taskOrderBySource;
  }

  return cleaned.sourceOrder?.length || cleaned.taskOrderBySource ? cleaned : undefined;
}

export function parseTaskListOrderByDate(value: unknown): TaskListOrderByDate {
  if (!isObjectRecord(value)) return {};
  const next: TaskListOrderByDate = {};
  Object.entries(value).forEach(([date, dateOrder]) => {
    const parsed = parseTaskListDateOrder(dateOrder);
    if (parsed) next[date] = parsed;
  });
  return next;
}
