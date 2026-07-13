import { Task, TabType } from '../types/task';
import {
  TaskListOrderByDate,
  getSourceOrderForDate,
  sortTasksForDisplay,
} from '../utils/taskOrdering';
import { isDateKey } from '../../shared/taskRollover';
import { getTaskDate } from './taskTransforms';

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
  const filteredTasks: Task[] = [];
  let selectedDateTaskCount = 0;
  const taskCommandBuckets: Task[][] = [[], [], [], [], [], []];
  const allDates = new Set([currentDate]);
  let completedCount = 0;
  let todayCount = 0;

  for (const task of allTasks) {
    const taskDate = getTaskDate(task, currentDate);
    allDates.add(taskDate);
    if (task.cleared) continue;

    let matchesSelectedDate = taskDate === selectedDate;
    let matchesCurrentDate = selectedDate === currentDate
      ? matchesSelectedDate
      : taskDate === currentDate;
    if (!matchesSelectedDate || !matchesCurrentDate) {
      for (const scheduledDate of task.scheduledDates || []) {
        if (!isDateKey(scheduledDate)) continue;
        if (!matchesSelectedDate && scheduledDate === selectedDate) matchesSelectedDate = true;
        if (!matchesCurrentDate && scheduledDate === currentDate) matchesCurrentDate = true;
        if (matchesSelectedDate && matchesCurrentDate) break;
      }
    }

    if (matchesSelectedDate) {
      selectedDateTaskCount += 1;
      if (task.completed) completedCount += 1;
      taskCommandBuckets[
        (task.completed ? 3 : 0) + taskCommandPriorityOrder[task.priority]
      ].push(task);
    }
    if (matchesCurrentDate) todayCount += 1;

    if (priorityFilter !== 'all' && task.priority !== priorityFilter) continue;
    if (
      activeTab === 'all' ||
      (activeTab === 'today' && matchesSelectedDate) ||
      (activeTab === 'completed' && matchesSelectedDate && task.completed)
    ) {
      filteredTasks.push(task);
    }
  }

  const sourceOrderForSelectedDate = getSourceOrderForDate(taskListOrderByDate, selectedDate);
  const sortedTasks = sortTasksForDisplay(
    filteredTasks,
    selectedDate,
    taskListOrderByDate,
    sourceOrderForSelectedDate,
  );
  const selectedDateTaskCommands: Task[] = [];
  for (const bucket of taskCommandBuckets) {
    selectedDateTaskCommands.push(...bucket);
  }

  return {
    sortedTasks,
    selectedDateTaskCommands,
    completedCount,
    totalCount: selectedDateTaskCount,
    todayCount,
    allDates: Array.from(allDates).sort((a, b) => b.localeCompare(a)),
    sourceOrderForSelectedDate,
  };
}
