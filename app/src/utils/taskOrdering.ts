import { Task, TabType, TaskSource } from '../types/task';

export const TASK_LIST_ORDER_KEY = 'taskListOrderByDate';
export const DEFAULT_SOURCE_ORDER: TaskSource[] = ['personal', 'external'];

export interface TaskListDateOrder {
  sourceOrder?: TaskSource[];
  taskOrderBySource?: Partial<Record<TaskSource, string[]>>;
}

export type TaskListOrderByDate = Record<string, TaskListDateOrder>;

export interface TaskDragFilterState {
  activeTab: TabType;
  searchQuery: string;
  showOpenOnly: boolean;
  priorityFilter: 'all' | Task['priority'];
}

const priorityOrder: Record<Task['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function getTaskSource(task: Task): TaskSource {
  return task.source || 'personal';
}

function isTaskSource(value: unknown): value is TaskSource {
  return value === 'personal' || value === 'external';
}

export function getSourceOrderForDate(orderByDate: TaskListOrderByDate, date: string): TaskSource[] {
  const saved = orderByDate[date]?.sourceOrder?.filter(isTaskSource) || [];
  const merged = [...saved, ...DEFAULT_SOURCE_ORDER.filter((source) => !saved.includes(source))];
  return merged.length ? merged : DEFAULT_SOURCE_ORDER;
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
  const result = [...orderedTasks];
  sortMissingTasksByPriority(missingTasks).forEach((task) => {
    const insertAt = result.findIndex((existing) => priorityOrder[existing.priority] > priorityOrder[task.priority]);
    if (insertAt === -1) {
      result.push(task);
    } else {
      result.splice(insertAt, 0, task);
    }
  });
  return result;
}

function sortCompletionBucket(tasks: Task[], manualOrder?: string[]) {
  if (!manualOrder?.length) return sortMissingTasksByPriority(tasks);

  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const orderedTasks = manualOrder
    .map((id) => taskById.get(id))
    .filter((task): task is Task => Boolean(task));
  const orderedIds = new Set(orderedTasks.map((task) => task.id));
  const missingTasks = tasks.filter((task) => !orderedIds.has(task.id));

  return insertMissingTasksByPriority(orderedTasks, missingTasks);
}

function sortSourceTasks(tasks: Task[], manualOrder?: string[]) {
  const openTasks = tasks.filter((task) => !task.completed);
  const doneTasks = tasks.filter((task) => task.completed);
  return [
    ...sortCompletionBucket(openTasks, manualOrder),
    ...sortCompletionBucket(doneTasks, manualOrder),
  ];
}

export function sortTasksForDisplay(tasks: Task[], selectedDate: string, orderByDate: TaskListOrderByDate) {
  const dateOrder = orderByDate[selectedDate];
  const sourceOrder = getSourceOrderForDate(orderByDate, selectedDate);
  const knownSources = new Set(sourceOrder);
  const sourcesInTasks = tasks.map(getTaskSource).filter((source, index, all) => all.indexOf(source) === index);
  const orderedSources = [
    ...sourceOrder,
    ...sourcesInTasks.filter((source) => !knownSources.has(source)),
  ];

  return orderedSources.flatMap((source) => {
    const sourceTasks = tasks.filter((task) => getTaskSource(task) === source);
    if (!sourceTasks.length) return [];
    const manualOrder = dateOrder?.taskOrderBySource?.[source];
    return manualOrder?.length
      ? sortSourceTasks(sourceTasks, manualOrder)
      : [...sourceTasks].sort(byDefaultTaskOrder);
  });
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

export function removeTaskIdFromOrder(orderByDate: TaskListOrderByDate, taskId: string): TaskListOrderByDate {
  const next: TaskListOrderByDate = {};
  Object.entries(orderByDate).forEach(([date, dateOrder]) => {
    const taskOrderBySource: Partial<Record<TaskSource, string[]>> = {};
    (Object.keys(dateOrder.taskOrderBySource || {}) as TaskSource[]).forEach((source) => {
      const ids = dateOrder.taskOrderBySource?.[source]?.filter((id) => id !== taskId) || [];
      if (ids.length) taskOrderBySource[source] = ids;
    });

    const cleaned: TaskListDateOrder = {};
    if (dateOrder.sourceOrder?.length) cleaned.sourceOrder = dateOrder.sourceOrder.filter(isTaskSource);
    if (Object.keys(taskOrderBySource).length) cleaned.taskOrderBySource = taskOrderBySource;
    if (cleaned.sourceOrder?.length || cleaned.taskOrderBySource) next[date] = cleaned;
  });
  return next;
}

export function isTaskDragDisabled(state: TaskDragFilterState) {
  return state.activeTab !== 'today' || Boolean(state.searchQuery.trim()) || state.showOpenOnly || state.priorityFilter !== 'all';
}
