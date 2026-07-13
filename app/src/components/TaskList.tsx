import { lazy, memo, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { useFloatingScrollbar } from '../hooks/useFloatingScrollbar';
import type { Task, TaskSource } from '../types/task';
import { TaskListStaticContent } from './taskList/TaskListStaticContent';
import { TaskListToolbar, type PriorityFilter } from './taskList/TaskListToolbar';
import { getTaskListDerivations } from './taskList/taskListDerivations';

const TaskListDndSurface = lazy(() => import('./taskList/TaskListDndSurface').then((module) => ({
  default: module.TaskListDndSurface,
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
      />

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
