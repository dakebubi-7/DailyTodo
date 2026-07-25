import { getTaskDate, shiftDateKey } from '../taskRollover';

export interface TomorrowProjectionTask {
  id?: string;
  text?: string;
  completed: boolean;
  cleared?: boolean;
  taskDate?: string;
  createdAt?: string;
  carriedFromDate?: string;
  carriedFromTaskId?: string;
  nextStep?: string;
  carryoverContext?: { nextStep?: string };
}

type TomorrowProjectionEntry = {
  task: TomorrowProjectionTask;
  carried: boolean;
};

function isOpenTask(task: TomorrowProjectionTask) {
  return !task.completed && !task.cleared;
}

function bestTaskText(task: TomorrowProjectionTask) {
  return task.carryoverContext?.nextStep?.trim()
    || task.nextStep?.trim()
    || task.text?.trim()
    || '';
}

function logicalTaskKey(task: TomorrowProjectionTask, fallbackIndex: number) {
  return task.carriedFromTaskId || task.id || `task-${fallbackIndex}`;
}

export function projectTomorrowTasks(tasks: TomorrowProjectionTask[], reviewDate: string): TomorrowProjectionEntry[] {
  const nextDate = shiftDateKey(reviewDate, 1);
  const nextDayCarryovers = tasks.filter((task) =>
    isOpenTask(task)
    && getTaskDate(task, reviewDate) === nextDate
    && task.carriedFromDate === reviewDate,
  );
  const carryoverBySourceId = new Map(
    nextDayCarryovers
      .filter((task): task is TomorrowProjectionTask & { carriedFromTaskId: string } => Boolean(task.carriedFromTaskId))
      .map((task) => [task.carriedFromTaskId, task]),
  );
  const entries: TomorrowProjectionEntry[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index]!;
    if (!isOpenTask(task) || getTaskDate(task, reviewDate) !== reviewDate) continue;
    const key = logicalTaskKey(task, index);
    if (seen.has(key)) continue;
    const carryover = task.id ? carryoverBySourceId.get(task.id) : undefined;
    entries.push({ task: carryover ?? task, carried: Boolean(carryover) });
    seen.add(key);
  }

  for (let index = 0; index < nextDayCarryovers.length; index += 1) {
    const carryover = nextDayCarryovers[index]!;
    const key = logicalTaskKey(carryover, index);
    if (seen.has(key)) continue;
    entries.push({ task: carryover, carried: true });
    seen.add(key);
  }

  return entries;
}

export function renderTomorrowProjection(tasks: TomorrowProjectionTask[], reviewDate: string) {
  const lines = projectTomorrowTasks(tasks, reviewDate)
    .map(({ task, carried }) => {
      const text = bestTaskText(task);
      if (!text) return '';
      return `- [ ] ${text} \uff08${carried ? '\u5df2\u7ed3\u8f6c' : '\u5f85\u7ed3\u8f6c'}\uff09`;
    })
    .filter(Boolean);
  return lines.length ? lines.join('\n') : '- [ ] ';
}
