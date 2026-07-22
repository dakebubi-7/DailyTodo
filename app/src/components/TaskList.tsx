import { lazy, memo, Suspense, type ComponentProps, useCallback, useMemo, useRef, useState } from 'react';
import type { getShellText } from '../i18n';
import { useFloatingScrollbar } from '../hooks/useFloatingScrollbar';
import type { Task, TaskSource } from '../types/task';
import type { TabType } from '../types/task';
import type { DailyWorkPanel as DailyWorkPanelComponent } from './DailyWorkPanel';
import { TaskListStaticContent } from './taskList/TaskListStaticContent';
import { TaskListToolbar, type PriorityFilter } from './taskList/TaskListToolbar';
import { getTaskListDerivations } from './taskList/taskListDerivations';

const TaskListDndSurface = lazy(() => import('./taskList/TaskListDndSurface').then((module) => ({
  default: module.TaskListDndSurface,
})));
const DailyWorkPanel = lazy(() => import('./DailyWorkPanel').then((module) => ({
  default: module.DailyWorkPanel,
})));

interface TaskListProps {
  tasks: Task[];
  selectedDate: string;
  sourceOrder: TaskSource[];
  dragDisabled: boolean;
  onReorderSources: (date: string, activeSource: TaskSource, overSource: TaskSource) => void;
  onReorderTasks: (date: string, source: TaskSource, completed: boolean, activeId: string, overId: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
  showOpenOnly: boolean;
  onToggleOpenOnly: () => void;
  priorityFilter: PriorityFilter;
  onPriorityFilterChange: (value: PriorityFilter) => void;
  text: ReturnType<typeof getShellText>['app'];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasDailyWorkContent: boolean;
  hasDailyInspirationContent: boolean;
  isDailyWorkOpen: boolean;
  isInspirationOpen: boolean;
  onToggleDailyWorkPanel: () => void;
  onToggleInspirationPanel: () => void;
  selectedDateTasksForCommands: Task[];
  language: ComponentProps<typeof DailyWorkPanelComponent>['language'];
  dailyWork: string;
  dailyInspiration: string;
  onChangeDailyWork: ComponentProps<typeof DailyWorkPanelComponent>['onChange'];
  onChangeDailyInspiration: ComponentProps<typeof DailyWorkPanelComponent>['onChange'];
  onCloseDailyWorkPanel: () => void;
  onCloseInspirationPanel: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onPriorityChange: (id: string, priority: Task['priority']) => void;
  onViewReview: (task: Task) => void;
  onToggleSubtask: (id: string) => void;
  onDeleteSubtask: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onViewSubtaskReview: (task: Task) => void;
  onEditSubtask: (id: string, text: string) => void;
  onChangeSubtaskPriority: (id: string, priority: Task['priority']) => void;
  editRequest?: { id: string; nonce: number } | null;
}

export const TaskList = memo(function TaskList({
  tasks,
  selectedDate,
  sourceOrder,
  dragDisabled,
  onReorderSources,
  onReorderTasks,
  searchQuery,
  onSearchChange,
  searchOpen,
  onToggleSearch,
  showOpenOnly,
  onToggleOpenOnly,
  priorityFilter,
  onPriorityFilterChange,
  text,
  activeTab,
  onTabChange,
  hasDailyWorkContent,
  hasDailyInspirationContent,
  isDailyWorkOpen,
  isInspirationOpen,
  onToggleDailyWorkPanel,
  onToggleInspirationPanel,
  selectedDateTasksForCommands,
  language,
  dailyWork,
  dailyInspiration,
  onChangeDailyWork,
  onChangeDailyInspiration,
  onCloseDailyWorkPanel,
  onCloseInspirationPanel,
  onToggle,
  onDelete,
  onEdit,
  onPriorityChange,
  onViewReview,
  onToggleSubtask,
  onDeleteSubtask,
  onToggleCollapse,
  onViewSubtaskReview,
  onEditSubtask,
  onChangeSubtaskPriority,
  editRequest,
}: TaskListProps) {
  const filtersActive = Boolean(searchQuery.trim() || showOpenOnly || priorityFilter !== 'all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dndRequested, setDndRequested] = useState(false);
  useFloatingScrollbar(scrollRef);

  const { allTags, sourceGroups, shouldGroupBySource } = useMemo(
    () => getTaskListDerivations(tasks, sourceOrder),
    [sourceOrder, tasks],
  );
  const clearFilters = useCallback(() => {
    onSearchChange('');
    if (showOpenOnly) onToggleOpenOnly();
    onPriorityFilterChange('all');
  }, [onPriorityFilterChange, onSearchChange, onToggleOpenOnly, showOpenOnly]);
  const requestDndSurface = useCallback(() => setDndRequested(true), []);

  const contentProps = {
    tasks,
    sourceGroups,
    shouldGroupBySource,
    allTags,
    onToggle,
    onDelete,
    onEdit,
    onPriorityChange,
    onViewReview,
    onToggleSubtask,
    onDeleteSubtask,
    onToggleCollapse,
    onViewSubtaskReview,
    onEditSubtask,
    onChangeSubtaskPriority,
    editRequest,
  };

  return (
    <div className="task-list flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-2">
      <TaskListToolbar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchOpen={searchOpen}
        onToggleSearch={onToggleSearch}
        showOpenOnly={showOpenOnly}
        onToggleOpenOnly={onToggleOpenOnly}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={onPriorityFilterChange}
        filtersActive={filtersActive}
        onClearFilters={clearFilters}
        text={text}
        activeTab={activeTab}
        onTabChange={onTabChange}
        hasDailyWorkContent={hasDailyWorkContent}
        hasDailyInspirationContent={hasDailyInspirationContent}
        isDailyWorkOpen={isDailyWorkOpen}
        isInspirationOpen={isInspirationOpen}
        onToggleDailyWorkPanel={onToggleDailyWorkPanel}
        onToggleInspirationPanel={onToggleInspirationPanel}
      />

      <div className="task-daily-panels">
        {isDailyWorkOpen && (
          <Suspense fallback={null}>
            <DailyWorkPanel
              title={text.dailyWork}
              description={text.dailyWorkDescription}
              placeholder={text.dailyWorkPlaceholder}
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
              title={text.inspiration}
              description={text.inspirationDescription}
              placeholder={text.inspirationPlaceholder}
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

      <div
        ref={scrollRef}
        className="task-scroll min-h-0 flex-1 overflow-y-auto pr-1"
        onPointerEnter={requestDndSurface}
        onFocusCapture={requestDndSurface}
      >
        {dndRequested ? (
          <Suspense fallback={<TaskListStaticContent {...contentProps} />}>
            <TaskListDndSurface
              {...contentProps}
              selectedDate={selectedDate}
              dragDisabled={dragDisabled}
              onReorderSources={onReorderSources}
              onReorderTasks={onReorderTasks}
            />
          </Suspense>
        ) : (
          <TaskListStaticContent {...contentProps} />
        )}
      </div>
    </div>
  );
});
