export interface ScheduleTime {
  hours: number;
  minutes: number;
}

const SCHEDULE_TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isScheduleTime(value: unknown): value is string {
  return typeof value === 'string' && SCHEDULE_TIME.test(value);
}

export function parseScheduleTime(time: string, fallback: ScheduleTime): ScheduleTime {
  if (!isScheduleTime(time)) return fallback;
  const [hours, minutes] = time.split(':');
  return { hours: Number(hours), minutes: Number(minutes) };
}
