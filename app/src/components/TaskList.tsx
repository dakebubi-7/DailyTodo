import { lazy, memo, Suspense, type ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { getShellText } from '../i18n';
import { useFloatingScrollbar } from '../hooks/useFloatingScrollbar';
import type { Task, TaskSource } from '../types/task';
import type { TabType } from '../types/task';
import type { InputKeybindingSettings } from '../../shared/inputKeybindings';
import type { DailyWorkPanel as DailyWorkPanelComponent } from './DailyWorkPanel';
import { HistoryCleanupToolbar } from './historyCleanup/HistoryCleanupToolbar';
import {
  isEveryVisibleHistoryItemSelected,
  keepVisibleSelection,
  selectVisibleHistoryItems,
  toggleHistorySelection,
} from './historyCleanup/historyCleanupSelection';
import { TaskListStaticContent } from './taskList/TaskListStaticContent';
import { TaskListToolbar, type PriorityFilter } from './taskList/TaskListToolbar';
import { getTaskListDerivations } from './taskList/taskListDerivations';
import { DailyReviewPanel } from './taskList/DailyReviewPanel';
import { TodayFocusPanel } from './taskList/TodayFocusPanel';
import { TodayFocusExecutionZone } from './taskList/TodayFocusExecutionZone';
import {
  getTodayFocusCandidates,
  getTodayFocusExecution,
  getTodayFocusRequestDraft,
  getTodayFocusTasks,
  type TodayFocusState,
} from '../../shared/todayFocus';
import type { DailyReviewSuggestionAdoption } from '../hooks/taskTreeActions';

const TaskListDndSurface = lazy(() => import('./taskList/TaskListDndSurface').then((module) => ({
  default: module.TaskListDndSurface,
})));
const DailyWorkPanel = lazy(() => import('./DailyWorkPanel').then((module) => ({
  default: module.DailyWorkPanel,
})));

interface TaskListProps {
  tasks: Task[];
  allTasks: Task[];
  selectedDate: string;
  currentDate: string;
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
  setTodayFocus: (selectedTaskIds: string[]) => void;
  setTodayFocusState: (taskId: string, state: TodayFocusState, reason?: string) => void;
  onAdoptDailyReviewSuggestion: (adoption: DailyReviewSuggestionAdoption) => void;
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
  onDeleteTasks: (ids: string[]) => void;
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
  todayFocusRequest?: { id: string; nonce: number } | null;
  inputKeybindings: InputKeybindingSettings;
}

export const TaskList = memo(function TaskList({
  tasks,
  allTasks,
  selectedDate,
  currentDate,
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
  setTodayFocus,
  setTodayFocusState,
  onAdoptDailyReviewSuggestion,
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
  onDeleteTasks,
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
  todayFocusRequest,
  inputKeybindings,
}: TaskListProps) {
  const filtersActive = Boolean(searchQuery.trim() || showOpenOnly || priorityFilter !== 'all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dndRequested, setDndRequested] = useState(false);
  const [isTodayFocusAdjusting, setIsTodayFocusAdjusting] = useState(false);
  const [todayFocusDraftIds, setTodayFocusDraftIds] = useState<string[]>([]);
  const [isCleanupMode, setIsCleanupMode] = useState(false);
  const [selectedCleanupTaskIds, setSelectedCleanupTaskIds] = useState<string[]>([]);
  useFloatingScrollbar(scrollRef);

  const canCleanHistory = activeTab === 'all';
  const visibleTaskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
  const allVisibleTasksSelected = isEveryVisibleHistoryItemSelected(selectedCleanupTaskIds, visibleTaskIds);

  useEffect(() => {
    setSelectedCleanupTaskIds((previous) => keepVisibleSelection(previous, visibleTaskIds));
  }, [visibleTaskIds]);

  useEffect(() => {
    if (!canCleanHistory) {
      setIsCleanupMode(false);
      setSelectedCleanupTaskIds([]);
    }
  }, [canCleanHistory]);

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
  const todayFocusCandidates = useMemo(
    () => getTodayFocusCandidates(allTasks, currentDate),
    [allTasks, currentDate],
  );
  const todayFocusExecution = useMemo(
    () => getTodayFocusExecution(allTasks, currentDate),
    [allTasks, currentDate],
  );
  const openTodayFocusAdjustment = useCallback(() => {
    if (selectedDate !== currentDate) return;
    setTodayFocusDraftIds(getTodayFocusTasks(allTasks, currentDate).map((task) => task.id));
    setIsTodayFocusAdjusting(true);
  }, [allTasks, currentDate, selectedDate]);
  useEffect(() => {
    if (!todayFocusRequest || selectedDate !== currentDate) return;
    setTodayFocusDraftIds(getTodayFocusRequestDraft(allTasks, currentDate, todayFocusRequest.id));
    setIsTodayFocusAdjusting(true);
  }, [allTasks, currentDate, selectedDate, todayFocusRequest]);
  const cancelTodayFocus = useCallback(() => {
    setIsTodayFocusAdjusting(false);
    setTodayFocusDraftIds([]);
  }, []);
  const confirmTodayFocus = useCallback(() => {
    setTodayFocus(todayFocusDraftIds);
    setIsTodayFocusAdjusting(false);
    setTodayFocusDraftIds([]);
  }, [setTodayFocus, todayFocusDraftIds]);
  const toggleTaskCleanupSelection = useCallback((id: string) => {
    setSelectedCleanupTaskIds((previous) => toggleHistorySelection(previous, id));
  }, []);
  const cancelCleanup = useCallback(() => {
    setIsCleanupMode(false);
    setSelectedCleanupTaskIds([]);
  }, []);
  const toggleVisibleCleanupSelection = useCallback(() => {
    setSelectedCleanupTaskIds((previous) => (
      isEveryVisibleHistoryItemSelected(previous, visibleTaskIds) ? [] : selectVisibleHistoryItems(visibleTaskIds)
    ));
  }, [visibleTaskIds]);
  const deleteSelectedTasks = useCallback(() => {
    if (!selectedCleanupTaskIds.length) return;
    const message = text.cleanupTasksConfirmation.replace('{count}', String(selectedCleanupTaskIds.length));
    if (!window.confirm(message)) return;
    onDeleteTasks(selectedCleanupTaskIds);
    cancelCleanup();
  }, [cancelCleanup, onDeleteTasks, selectedCleanupTaskIds, text.cleanupTasksConfirmation]);

  const contentProps = {
    tasks,
    currentDate,
    language,
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
    isCleanupMode,
    selectedCleanupTaskIds,
    onToggleCleanupSelection: toggleTaskCleanupSelection,
    cleanupSelectionLabel: text.selectHistoryItem,
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

      {canCleanHistory && (
        <HistoryCleanupToolbar
          isActive={isCleanupMode}
          visibleItemCount={visibleTaskIds.length}
          selectedItemCount={selectedCleanupTaskIds.length}
          isEveryVisibleItemSelected={allVisibleTasksSelected}
          text={text}
          onStart={() => setIsCleanupMode(true)}
          onCancel={cancelCleanup}
          onToggleVisibleItems={toggleVisibleCleanupSelection}
          onDeleteSelected={deleteSelectedTasks}
        />
      )}

      <div className="task-daily-panels">
        {selectedDate === currentDate && (
          <>
            <TodayFocusExecutionZone
              focusTasks={todayFocusExecution.tasks}
              activeTaskId={todayFocusExecution.activeTaskId}
              nextTaskId={todayFocusExecution.nextTaskId}
              completedCount={todayFocusExecution.completedCount}
              text={text}
              onAdjust={openTodayFocusAdjustment}
              onStateChange={setTodayFocusState}
            />
            <DailyReviewPanel
              currentDate={currentDate}
              text={text}
              onAdoptDailyReviewSuggestion={onAdoptDailyReviewSuggestion}
            />
          </>
        )}
        {isTodayFocusAdjusting && (
          <TodayFocusPanel
            candidates={todayFocusCandidates}
            selectedTaskIds={todayFocusDraftIds}
            onSelectionChange={setTodayFocusDraftIds}
            onConfirm={confirmTodayFocus}
            onCancel={cancelTodayFocus}
            text={text}
          />
        )}
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
              inputKeybindings={inputKeybindings}
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
              inputKeybindings={inputKeybindings}
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
              dragDisabled={dragDisabled || isCleanupMode}
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
