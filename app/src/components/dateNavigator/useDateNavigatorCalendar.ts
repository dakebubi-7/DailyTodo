import { useCallback, useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';

export interface DateNavigatorCalendarController {
  calendarRef: RefObject<HTMLDivElement>;
  closeCalendar: () => void;
  isCalendarOpen: boolean;
  toggleCalendar: () => void;
  visibleMonth: string;
  setVisibleMonth: Dispatch<SetStateAction<string>>;
}

function getMonthStart(date: string) {
  return date.slice(0, 7) + '-01';
}

export function useDateNavigatorCalendar(selectedDate: string): DateNavigatorCalendarController {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(getMonthStart(selectedDate));
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleMonth(selectedDate.slice(0, 7) + '-01');
  }, [selectedDate]);

  useEffect(() => {
    if (!isCalendarOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && calendarRef.current?.contains(event.target)) return;
      setIsCalendarOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isCalendarOpen]);

  const toggleCalendar = useCallback(() => {
    setIsCalendarOpen((previous) => !previous);
  }, []);

  const closeCalendar = useCallback(() => {
    setIsCalendarOpen(false);
  }, []);

  return { calendarRef, closeCalendar, isCalendarOpen, toggleCalendar, visibleMonth, setVisibleMonth };
}
