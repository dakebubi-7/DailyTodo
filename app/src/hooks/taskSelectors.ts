import { Task, TabType } from '../types/task';
import {
  TaskListOrderByDate,
  getSourceOrderForDate,
  sortTasksForDisplay,
} from '../utils/taskOrdering';
import { getTaskDate, taskMatchesDate } from './taskTransforms';

export type PriorityFilter = 'all' | Task['priority'];

const taskCommandPriorityOrder: Record<Task['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export interface TaskViewStateInput {
  allTasks: Task[];
  activeTab: TabType;
  priorityFilter: PriorityFilter;
  currentDate: string;
  selectedDate: string;
  taskListOrderByDate: TaskListOrderByDate;
}

export function selectTaskViewState({
  allTasks,
  activeTab,
  priorityFilter,
  currentDate,
  selectedDate,
  taskListOrderByDate,
}: TaskViewStateInput) {
  const filteredTasks = allTasks.filter((task) => {
    if (task.cleared) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

    const matchesDate = (date: string) => taskMatchesDate(task, date, currentDate);
    switch (activeTab) {
      case 'today':
        return matchesDate(selectedDate);
      case 'completed':
        return matchesDate(selectedDate) && task.completed;
      case 'all':
      default:
        return true;
    }
  });

  const sortedTasks = sortTasksForDisplay(filteredTasks, selectedDate, taskListOrderByDate);
  const selectedDateTasks = allTasks.filter((task) => taskMatchesDate(task, selectedDate, currentDate) && !task.cleared);
  const selectedDateTaskCommands = [...selectedDateTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return taskCommandPriorityOrder[a.priority] - taskCommandPriorityOrder[b.priority];
  });

  return {
    sortedTasks,
    selectedDateTaskCommands,
    completedCount: selectedDateTasks.filter((task) => task.completed).length,
    totalCount: selectedDateTasks.length,
    todayCount: allTasks.filter((task) => taskMatchesDate(task, currentDate, currentDate) && !task.cleared).length,
    allDates: Array.from(
      new Set([...allTasks.map((task) => getTaskDate(task, currentDate)), currentDate]),
    ).sort((a, b) => b.localeCompare(a)),
    sourceOrderForSelectedDate: getSourceOrderForDate(taskListOrderByDate, selectedDate),
  };
}
