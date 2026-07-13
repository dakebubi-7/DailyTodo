import type { Dispatch, SetStateAction } from 'react';
import { shiftDateKey } from '../../shared/taskRollover';

export type AppKeyboardShortcutAction =
  | { kind: 'toggleCompactMode' }
  | { kind: 'openSelectedDailyNote' }
  | { kind: 'shiftSelectedDate'; days: -1 | 1 };

export function getAppKeyboardShortcutAction(event: KeyboardEvent): AppKeyboardShortcutAction | null {
  const target = event.target instanceof HTMLElement ? event.target : null;
  const tagName = target?.tagName;
  const isTyping = tagName === 'INPUT' || tagName === 'TEXTAREA';

  if (event.ctrlKey && event.key.toLowerCase() === 'k') {
    return { kind: 'toggleCompactMode' };
  }

  if (event.ctrlKey && event.key.toLowerCase() === 'o') {
    return { kind: 'openSelectedDailyNote' };
  }

  if (!isTyping && event.key === '[') {
    return { kind: 'shiftSelectedDate', days: -1 };
  }

  if (!isTyping && event.key === ']') {
    return { kind: 'shiftSelectedDate', days: 1 };
  }

  return null;
}


interface AppKeyboardShortcutActionDeps {
  setCompactMode: Dispatch<SetStateAction<boolean>>;
  openSelectedDailyNote: () => void;
  setSelectedDate: Dispatch<SetStateAction<string>>;
}

export function applyAppKeyboardShortcutAction(
  event: KeyboardEvent,
  action: AppKeyboardShortcutAction,
  { setCompactMode, openSelectedDailyNote, setSelectedDate }: AppKeyboardShortcutActionDeps,
) {
  if (action.kind === 'toggleCompactMode') {
    event.preventDefault();
    setCompactMode((prev) => !prev);
    return;
  }

  if (action.kind === 'openSelectedDailyNote') {
    event.preventDefault();
    openSelectedDailyNote();
    return;
  }

  setSelectedDate((prev) => shiftDateKey(prev, action.days));
}

export function registerAppKeyboardShortcutListener(
  targetWindow: Pick<Window, 'addEventListener' | 'removeEventListener'>,
  deps: AppKeyboardShortcutActionDeps,
) {
  const handleKeyDown = (event: KeyboardEvent) => {
    const action = getAppKeyboardShortcutAction(event);
    if (!action) return;

    applyAppKeyboardShortcutAction(event, action, deps);
  };

  targetWindow.addEventListener('keydown', handleKeyDown);
  return () => targetWindow.removeEventListener('keydown', handleKeyDown);
}

