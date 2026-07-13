import type { Task, TabType } from '../types/task';
import { isTaskDragDisabled } from '../utils/taskOrdering';

export type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

export function isPriorityFilter(value: unknown): value is PriorityFilter {
  return value === 'all' || value === 'high' || value === 'medium' || value === 'low';
}

export interface AppTaskViewOptions {
  tasks: Task[];
  selectedDateTaskCommands: Task[];
  activeTab: TabType;
  searchQuery: string;
  showOpenOnly: boolean;
  priorityFilter: PriorityFilter;
}

export interface AppTaskView {
  visibleTasks: Task[];
  dragDisabled: boolean;
  selectedDateTasksForCommands: Task[];
}

export function createAppTaskView({
  tasks,
  selectedDateTaskCommands,
  activeTab,
  searchQuery,
  showOpenOnly,
  priorityFilter,
}: AppTaskViewOptions): AppTaskView {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const hasActiveFilter = Boolean(normalizedSearchQuery || showOpenOnly || priorityFilter !== 'all');
  const visibleTasks = hasActiveFilter
    ? tasks.filter((task) => {
      if (showOpenOnly && task.completed) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (normalizedSearchQuery && !task.text.toLowerCase().includes(normalizedSearchQuery)) return false;
      return true;
    })
    : tasks;

  return {
    visibleTasks,
    dragDisabled: isTaskDragDisabled({ activeTab, searchQuery, showOpenOnly, priorityFilter }),
    selectedDateTasksForCommands: selectedDateTaskCommands,
  };
}
