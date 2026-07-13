import { parseScheduleTime } from './scheduleTimeParsing';

export function getNextTimerDelay(now: Date, time: string): number {
  const { hours, minutes } = parseScheduleTime(time, { hours: 23, minutes: 0 });
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return Math.max(1_000, next.getTime() - now.getTime());
}

/** 下一次「每周 weekday(0=周日..6=周六) 的 time」距现在的毫秒数。已过则顺延到下周同一天。 */
export function getNextWeeklyDelay(now: Date, weekday: number, time: string): number {
  const { hours, minutes } = parseScheduleTime(time, { hours: 9, minutes: 0 });
  const wd = ((Math.trunc(weekday) % 7) + 7) % 7;
  const next = new Date(now);
  const diff = (wd - now.getDay() + 7) % 7;
  next.setDate(now.getDate() + diff);
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 7);
  return Math.max(1_000, next.getTime() - now.getTime());
}

/** 下一次「每月 dayOfMonth 号的 time」距现在的毫秒数。该月天数不足时落到当月最后一天。已过则顺延下月。 */
export function getNextMonthlyDelay(now: Date, dayOfMonth: number, time: string): number {
  const { hours, minutes } = parseScheduleTime(time, { hours: 9, minutes: 0 });
  const want = Math.min(31, Math.max(1, Math.trunc(dayOfMonth)));
  const build = (year: number, monthIdx: number): Date => {
    const lastDay = new Date(year, monthIdx + 1, 0).getDate();
    const d = new Date(year, monthIdx, Math.min(want, lastDay));
    d.setHours(hours, minutes, 0, 0);
    return d;
  };
  let next = build(now.getFullYear(), now.getMonth());
  if (next <= now) next = build(now.getFullYear(), now.getMonth() + 1);
  return Math.max(1_000, next.getTime() - now.getTime());
}
