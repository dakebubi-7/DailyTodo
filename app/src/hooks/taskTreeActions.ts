import type { Task, TaskSource } from '../types/task';
import type { ArchivedObsidianTask } from '../../shared/obsidianTaskArchive';
import { retainDeletedTask } from '../../shared/obsidianTaskArchive';
import { findTaskInTree } from '../utils/taskTree';
import {
  applyTodayFocusSelection,
  applyTodayFocusState,
  reconcileTodayFocusCompletion,
  type TodayFocusState,
} from '../../shared/todayFocus';
import {
  applyConfirmedDailyReviewAdoption,
  type ConfirmedDailyReviewAdoptionInput,
} from '../../shared/dailyReviewAdoption';
import { removeTaskFromTree, mapTaskTree } from './taskTree';
import {
  addSubtaskToTask,
  changeTaskPriority,
  clearCompletedTasks,
  createTask,
  editTaskText,
  toggleTaskCollapseState,
  toggleTaskCompletion,
  updateTaskFields,
} from './taskMutations';

type CreateTaskTreeActionHandlersOptions = {
  currentDate: string;
  selectedDate: string;
  setAllTasks(updater: (previous: Task[]) => Task[]): void;
  setArchivedObsidianTasks(updater: (previous: ArchivedObsidianTask[]) => ArchivedObsidianTask[]): void;
  persistArchivedObsidianTasks(value: ArchivedObsidianTask[]): void;
  createId(): string;
  getTimestamp(): string;
};

export type DailyReviewSuggestionAdoption = Omit<
  ConfirmedDailyReviewAdoptionInput<Task>,
  'tasks' | 'focusDate' | 'adoptedAt'
>;

function toggleTaskAndReconcileFocus(previous: Task[], id: string, timestamp: string, currentDate: string): Task[] {
  let nextCompleted: boolean | undefined;
  const toggled = mapTaskTree(previous, id, (task) => {
    const nextTask = toggleTaskCompletion(task, timestamp);
    nextCompleted = nextTask.completed;
    return nextTask;
  });
  return nextCompleted === undefined
    ? previous
    : reconcileTodayFocusCompletion(toggled, currentDate, id, nextCompleted);
}

function completeTaskAndReconcileFocus(previous: Task[], id: string, timestamp: string, currentDate: string): Task[] {
  let wasFound = false;
  const completed = mapTaskTree(previous, id, (task) => {
    wasFound = true;
    return task.completed ? task : toggleTaskCompletion(task, timestamp);
  });
  return wasFound
    ? reconcileTodayFocusCompletion(completed, currentDate, id, true)
    : previous;
}

export function createTaskTreeActionHandlers({
  currentDate,
  selectedDate,
  setAllTasks,
  setArchivedObsidianTasks,
  persistArchivedObsidianTasks,
  createId,
  getTimestamp,
}: CreateTaskTreeActionHandlersOptions) {
  return {
    addTask(text: string, priority: Task['priority'] = 'medium', source: TaskSource = 'personal', taskDate = selectedDate) {
      const newTask = createTask({
        id: createId(), text, priority, source, createdAt: getTimestamp(), taskDate, currentDate,
      });
      setAllTasks((previous) => [newTask, ...previous]);
    },
    toggleTask(id: string) {
      setAllTasks((previous) => toggleTaskAndReconcileFocus(previous, id, getTimestamp(), currentDate));
    },
    deleteTask(id: string) {
      setAllTasks((previous) => {
        const task = findTaskInTree(previous, id);
        if (!task) return previous;
        setArchivedObsidianTasks((archived) => {
          const next = retainDeletedTask(archived, task, getTimestamp());
          if (next !== archived) persistArchivedObsidianTasks(next);
          return next;
        });
        return removeTaskFromTree(previous, id);
      });
    },
    editTask(id: string, text: string) {
      setAllTasks((previous) => mapTaskTree(previous, id, (task) => editTaskText(task, text)));
    },
    updateTask(id: string, updates: Partial<Task>) {
      setAllTasks((previous) => mapTaskTree(previous, id, (task) => updateTaskFields(task, updates)));
    },
    addSubtask(parentId: string, text: string) {
      const trimmed = text.trim();
      if (!trimmed) return;
      setAllTasks((previous) => mapTaskTree(previous, parentId, (task) => addSubtaskToTask(task, {
        id: createId(), text: trimmed, createdAt: getTimestamp(),
      })));
    },
    toggleSubtask(subtaskId: string) {
      setAllTasks((previous) => toggleTaskAndReconcileFocus(previous, subtaskId, getTimestamp(), currentDate));
    },
    deleteSubtask(subtaskId: string) {
      setAllTasks((previous) => {
        const task = findTaskInTree(previous, subtaskId);
        if (!task) return previous;
        setArchivedObsidianTasks((archived) => {
          const next = retainDeletedTask(archived, task, getTimestamp());
          if (next !== archived) persistArchivedObsidianTasks(next);
          return next;
        });
        return removeTaskFromTree(previous, subtaskId);
      });
    },
    toggleTaskCollapse(taskId: string) {
      setAllTasks((previous) => mapTaskTree(previous, taskId, toggleTaskCollapseState));
    },
    changePriority(id: string, priority: Task['priority']) {
      setAllTasks((previous) => changeTaskPriority(previous, id, priority));
    },
    setTodayFocus(selectedTaskIds: string[]) {
      setAllTasks((previous) => {
        const result = applyTodayFocusSelection(previous, currentDate, selectedTaskIds);
        return result.tasks;
      });
    },
    setTodayFocusState(taskId: string, state: TodayFocusState, reason?: string) {
      setAllTasks((previous) => {
        const stateResult = applyTodayFocusState(previous, currentDate, taskId, state, reason);
        if (!stateResult.ok) return stateResult.tasks;
        return state === 'completed'
          ? completeTaskAndReconcileFocus(stateResult.tasks, taskId, getTimestamp(), currentDate)
          : stateResult.tasks;
      });
    },
    adoptDailyReviewSuggestion(adoption: DailyReviewSuggestionAdoption) {
      setAllTasks((previous) => {
        const result = applyConfirmedDailyReviewAdoption({
          ...adoption,
          tasks: previous,
          focusDate: currentDate,
          adoptedAt: getTimestamp(),
        });
        return result.tasks;
      });
    },
    clearCompleted() {
      setAllTasks((previous) => clearCompletedTasks(previous, selectedDate, currentDate));
    },
  };
}
