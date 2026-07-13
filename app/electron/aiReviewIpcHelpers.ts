import { monthRange } from '../shared/aiReview/monthly';
import { shiftDateKey } from '../shared/taskRollover';

export function buildSourceCharsMessage(sourceChars: number): string {
  return `素材 ${sourceChars} 字符`;
}

export function getWeekDates(selected: string): { monday: string; dates: string[] } {
  const date = new Date(`${selected}T00:00:00`);
  const dayNr = (date.getDay() + 6) % 7;
  const monday = shiftDateKey(selected, -dayNr);
  return {
    monday,
    dates: Array.from({ length: 7 }, (_, index) => shiftDateKey(monday, index)),
  };
}

export function getMonthDates(month: string): { first: string; last: string; dates: string[] } {
  const { first, last } = monthRange(month);
  return {
    first,
    last,
    dates: Array.from({ length: Number(last.slice(-2)) }, (_, index) => shiftDateKey(first, index)),
  };
}
