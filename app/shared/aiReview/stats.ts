export interface StatTask {
  completed: boolean;
  taskDate?: string;
  createdAt?: string;
}

export interface DailyStats {
  date: string;
  total: number;
  completed: number;
  completionRate: number; // 0-100 整数
}

export interface RangeStats {
  start: string;
  end: string;
  activeDays: number;
  totalCompleted: number;
  totalTasks: number;
  streak: number;
}

function dateOf(task: StatTask): string {
  return task.taskDate || task.createdAt?.slice(0, 10) || '';
}

function shiftDate(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  const d = String(next.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeDailyStats(tasks: StatTask[], date: string): DailyStats {
  const ofDay = tasks.filter((t) => dateOf(t) === date);
  const completed = ofDay.filter((t) => t.completed).length;
  const total = ofDay.length;
  return {
    date,
    total,
    completed,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function computeRangeStats(tasks: StatTask[], start: string, end: string): RangeStats {
  const inRange = tasks.filter((t) => {
    const d = dateOf(t);
    return d >= start && d <= end;
  });
  const activeDates = new Set(inRange.map(dateOf).filter(Boolean));

  let streak = 0;
  let cursor = end;
  while (activeDates.has(cursor) && cursor >= start) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }

  return {
    start,
    end,
    activeDays: activeDates.size,
    totalCompleted: inRange.filter((t) => t.completed).length,
    totalTasks: inRange.length,
    streak,
  };
}
