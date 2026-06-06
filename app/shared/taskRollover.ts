export interface RolloverTaskReview {
  percent: number;
  reviewedAt: string;
}

export interface RolloverTask {
  completed: boolean;
  completionReview?: RolloverTaskReview;
  completionReviews?: RolloverTaskReview[];
}

function parseTime(value: string) {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return { hours: 5, minutes: 0 };
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

export function formatLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftDateKey(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return formatLocalDateKey(next);
}

export function getBusinessDateKey(date = new Date(), rolloverTime = '05:00') {
  const { hours, minutes } = parseTime(rolloverTime);
  const businessDate = new Date(date);
  businessDate.setHours(businessDate.getHours() - hours, businessDate.getMinutes() - minutes, 0, 0);
  return formatLocalDateKey(businessDate);
}

export function getNextRolloverDelay(now = new Date(), rolloverTime = '05:00') {
  const { hours, minutes } = parseTime(rolloverTime);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return Math.max(1_000, next.getTime() - now.getTime());
}

export function getLatestCompletionPercent(task: RolloverTask) {
  const reviews = task.completionReviews?.length
    ? task.completionReviews
    : task.completionReview
      ? [task.completionReview]
      : [];
  return reviews[reviews.length - 1]?.percent;
}

export function shouldCarryTaskForward(task: RolloverTask) {
  if (!task.completed) return true;
  const latestPercent = getLatestCompletionPercent(task);
  return typeof latestPercent === 'number' && latestPercent < 100;
}
