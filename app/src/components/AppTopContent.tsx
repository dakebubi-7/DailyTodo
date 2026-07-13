import { lazy, memo, Suspense, type ComponentProps } from 'react';
import { getDailyPanelTabClassName, getDailyPanelTabTitle } from '../app/appDailyPanelPresentation';
import { getShellText } from '../i18n';
import type { Task } from '../types/task';
import type { DailyWorkPanel as DailyWorkPanelComponent } from './DailyWorkPanel';
import { DateNavigator } from './DateNavigator';
import { Header } from './Header';
import { TabBar } from './TabBar';

const DailyWorkPanel = lazy(() => import('./DailyWorkPanel').then((module) => ({ default: module.DailyWorkPanel })));

export interface AppTopContentProps {
  headerProps: ComponentProps<typeof Header>;
  dateNavigatorProps: ComponentProps<typeof DateNavigator>;
  tabBarProps: ComponentProps<typeof TabBar>;
  shellText: ReturnType<typeof getShellText>['app'];
  selectedDateTasksForCommands: Task[];
  language: ComponentProps<typeof DailyWorkPanelComponent>['language'];
  dailyWork: string;
  dailyInspiration: string;
  hasDailyWorkContent: boolean;
  hasDailyInspirationContent: boolean;
  isDailyWorkOpen: boolean;
  isInspirationOpen: boolean;
  onChangeDailyWork: ComponentProps<typeof DailyWorkPanelComponent>['onChange'];
  onChangeDailyInspiration: ComponentProps<typeof DailyWorkPanelComponent>['onChange'];
  onToggleDailyWorkPanel: () => void;
  onToggleInspirationPanel: () => void;
  onCloseDailyWorkPanel: () => void;
  onCloseInspirationPanel: () => void;
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
    && haveSameValues(previous.tabBarProps, next.tabBarProps)
    && haveSameValues(previous.shellText, next.shellText)
    && previous.selectedDateTasksForCommands === next.selectedDateTasksForCommands
    && previous.language === next.language
    && previous.dailyWork === next.dailyWork
    && previous.dailyInspiration === next.dailyInspiration
    && previous.hasDailyWorkContent === next.hasDailyWorkContent
    && previous.hasDailyInspirationContent === next.hasDailyInspirationContent
    && previous.isDailyWorkOpen === next.isDailyWorkOpen
    && previous.isInspirationOpen === next.isInspirationOpen
    && previous.onChangeDailyWork === next.onChangeDailyWork
    && previous.onChangeDailyInspiration === next.onChangeDailyInspiration
    && previous.onToggleDailyWorkPanel === next.onToggleDailyWorkPanel
    && previous.onToggleInspirationPanel === next.onToggleInspirationPanel
    && previous.onCloseDailyWorkPanel === next.onCloseDailyWorkPanel
    && previous.onCloseInspirationPanel === next.onCloseInspirationPanel;
}

export const AppTopContent = memo(function AppTopContent({
  headerProps,
  dateNavigatorProps,
  tabBarProps,
  shellText,
  selectedDateTasksForCommands,
  language,
  dailyWork,
  dailyInspiration,
  hasDailyWorkContent,
  hasDailyInspirationContent,
  isDailyWorkOpen,
  isInspirationOpen,
  onChangeDailyWork,
  onChangeDailyInspiration,
  onToggleDailyWorkPanel,
  onToggleInspirationPanel,
  onCloseDailyWorkPanel,
  onCloseInspirationPanel,
}: AppTopContentProps) {
  return (
    <div className="app-top border-b border-white/45 bg-white/38 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/35">
      <Header {...headerProps} />
      <DateNavigator {...dateNavigatorProps} />
      <div className="daily-panels px-3 pt-1.5">
        <div className="daily-panel-switch grid grid-cols-2 gap-2">
          <button
            className={getDailyPanelTabClassName(hasDailyWorkContent, isDailyWorkOpen)}
            onClick={onToggleDailyWorkPanel}
            aria-label={shellText.editDailyWork}
            aria-pressed={isDailyWorkOpen}
            title={getDailyPanelTabTitle(shellText.editDailyWork, hasDailyWorkContent)}
          >
            {shellText.dailyWork}
            {hasDailyWorkContent && <span className="daily-panel-dot" aria-hidden="true" />}
          </button>
          <button
            className={getDailyPanelTabClassName(hasDailyInspirationContent, isInspirationOpen)}
            onClick={onToggleInspirationPanel}
            aria-label={shellText.editInspiration}
            aria-pressed={isInspirationOpen}
            title={getDailyPanelTabTitle(shellText.editInspiration, hasDailyInspirationContent)}
          >
            {shellText.inspiration}
            {hasDailyInspirationContent && <span className="daily-panel-dot" aria-hidden="true" />}
          </button>
        </div>
        {isDailyWorkOpen && (
          <Suspense fallback={null}>
            <DailyWorkPanel
              title={shellText.dailyWork}
              description={shellText.dailyWorkDescription}
              placeholder={shellText.dailyWorkPlaceholder}
              value={dailyWork}
              taskCommands={selectedDateTasksForCommands}
              language={language}
              onChange={onChangeDailyWork}
              isOpen={isDailyWorkOpen}
              onClose={onCloseDailyWorkPanel}
            />
          </Suspense>
        )}
        {isInspirationOpen && (
          <Suspense fallback={null}>
            <DailyWorkPanel
              title={shellText.inspiration}
              description={shellText.inspirationDescription}
              placeholder={shellText.inspirationPlaceholder}
              value={dailyInspiration}
              taskCommands={selectedDateTasksForCommands}
              language={language}
              onChange={onChangeDailyInspiration}
              isOpen={isInspirationOpen}
              onClose={onCloseInspirationPanel}
            />
          </Suspense>
        )}
      </div>
      <TabBar {...tabBarProps} />
    </div>
  );
}, areAppTopContentPropsEqual);
