import type { Dispatch, SetStateAction } from 'react';
import type { Task, TaskSource } from '../types/task';
import type { TaskListOrderByDate } from '../utils/taskOrdering';
import {
  removeTaskFromTaskOrderState,
  reorderSourceGroupsForDate,
  reorderTasksWithinSourceForDate,
} from './taskOrderingState';

export interface TaskOrderingActionHandlersInput {
  allTasks: Task[];
  currentDate: string;
  deleteTaskFromTree: (id: string) => void;
  setTaskListOrderByDate: Dispatch<SetStateAction<TaskListOrderByDate>>;
}

export interface TaskOrderingActionHandlers {
  deleteTask: (id: string) => void;
  reorderSourceGroups: (date: string, activeSource: TaskSource, overSource: TaskSource) => void;
  reorderTasksWithinSource: (date: string, source: TaskSource, completed: boolean, activeId: string, overId: string) => void;
}

export function createTaskOrderingActionHandlers({
  allTasks,
  currentDate,
  deleteTaskFromTree,
  setTaskListOrderByDate,
}: TaskOrderingActionHandlersInput): TaskOrderingActionHandlers {
  return {
    deleteTask(id) {
      deleteTaskFromTree(id);
      setTaskListOrderByDate((previous) => removeTaskFromTaskOrderState(previous, id));
    },
    reorderSourceGroups(date, activeSource, overSource) {
      setTaskListOrderByDate((previous) => reorderSourceGroupsForDate(previous, date, activeSource, overSource));
    },
    reorderTasksWithinSource(date, source, completed, activeId, overId) {
      setTaskListOrderByDate((previous) => reorderTasksWithinSourceForDate(previous, allTasks, {
        date, currentDate, source, completed, activeId, overId,
      }));
    },
  };
}
