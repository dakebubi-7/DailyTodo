import { memo, type ComponentProps } from 'react';
import { getShellText } from '../i18n';
import { DateNavigator } from './DateNavigator';
import { useDateNavigatorCalendar } from './dateNavigator/useDateNavigatorCalendar';
import { Header } from './Header';

export interface AppTopContentProps {
  headerProps: Omit<ComponentProps<typeof Header>, 'calendar' | 'text'>;
  dateNavigatorProps: Omit<ComponentProps<typeof DateNavigator>, 'calendar'>;
  shellText: ReturnType<typeof getShellText>['app'];
}

function haveSameValues(previous: object, next: object) {
  const previousEntries = Object.entries(previous);
  const nextEntries = Object.entries(next);

  return previousEntries.length === nextEntries.length
    && previousEntries.every(([key, value]) => Object.is(value, nextEntries.find(([nextKey]) => nextKey === key)?.[1]));
}

function areAppTopContentPropsEqual(previous: AppTopContentProps, next: AppTopContentProps) {
  return haveSameValues(previous.headerProps, next.headerProps)
    && haveSameValues(previous.dateNavigatorProps, next.dateNavigatorProps)
    && haveSameValues(previous.shellText, next.shellText);
}

export const AppTopContent = memo(function AppTopContent({
  headerProps,
  dateNavigatorProps,
  shellText,
}: AppTopContentProps) {
  const calendar = useDateNavigatorCalendar(headerProps.selectedDate);

  return (
    <div className="app-top border-b border-white/45 bg-white/38 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/35">
      <div className="top-calendar-controller" ref={calendar.calendarRef}>
        <Header {...headerProps} calendar={calendar} text={shellText} />
        <DateNavigator {...dateNavigatorProps} calendar={calendar} />
      </div>
    </div>
  );
}, areAppTopContentPropsEqual);
