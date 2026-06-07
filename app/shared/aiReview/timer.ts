export function getNextTimerDelay(now: Date, time: string): number {
  const m = time.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  const hours = m ? Number(m[1]) : 23;
  const minutes = m ? Number(m[2]) : 0;
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return Math.max(1_000, next.getTime() - now.getTime());
}
