import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { lazy, Suspense, type KeyboardEvent } from 'react';
import type { AppLanguage } from '../../shared/appSettings';
import { Task } from '../types/task';
import { PriorityPicker } from './PriorityPicker';
import { TaskStackSegments } from './taskItem/TaskStackSegments';
import { DragHandleButton, TaskMainContent } from './taskItem/taskItemControls';
import type { TaskDragHandleProps } from './taskItem/taskItemControls';
import { CompleteActionButton, TaskActionLayer } from './taskItem/taskItemActionControls';
import { getTaskCardClassName, getTaskClusterClassName, getTaskCompleteActionLabel, getTaskReviewActionLabel, getVisibleScheduledDates, getVisibleTaskTags, hasTaskReview } from './taskItem/taskItemPresentation';
import { createTaskContextMenuOpenPayload } from './taskItem/taskItemContextMenu';
import { stopClusterToggle, shouldToggleTaskClusterForKey } from './taskItem/taskItemInteractions';
import { getStackSegmentCount, getStackSegmentStyle } from './taskItem/taskItemStack';
import { useTaskItemEditing } from './taskItem/useTaskItemEditing';
import { useVirtualSubtasks } from './taskItem/useVirtualSubtasks';

const TaskSubtasksViewport = lazy(() => import('./taskItem/TaskSubtasksViewport').then((module) => ({
  default: module.TaskSubtasksViewport,
})));

export type { TaskDragHandleProps } from './taskItem/taskItemControls';

interface TaskItemProps {
  task: Task;
  language: AppLanguage;
  dragHandleProps?: TaskDragHandleProps;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
  onPriorityChange: (priority: Task['priority']) => void;
  onViewReview: () => void;
  onToggleSubtask: (id: string) => void;
  onDeleteSubtask: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onViewSubtaskReview: (task: Task) => void;
  onEditSubtask: (id: string, text: string) => void;
  onChangeSubtaskPriority: (id: string, priority: Task['priority']) => void;
  allTags?: string[];
  editTrigger?: number;
  isCleanupMode?: boolean;
  isCleanupSelected?: boolean;
  onToggleCleanupSelection?: () => void;
  cleanupSelectionLabel?: string;
}

export function TaskItem({
  task,
  language,
  dragHandleProps,
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
  allTags = [],
  editTrigger,
  isCleanupMode = false,
  isCleanupSelected = false,
  onToggleCleanupSelection,
  cleanupSelectionLabel,
}: TaskItemProps) {
  const {
    editText,
    handleEditKeyDown,
    isEditing,
    setEditText,
    startEditing,
    submitEdit,
  } = useTaskItemEditing({ task, editTrigger, onEdit });
  const shouldReduceMotion = useReducedMotion();
  const directSubtasks = task.subtasks || [];
  const subtaskCount = directSubtasks.length;
  const hasChildren = subtaskCount > 0;
  const hasTags = Boolean(task.tags?.length);
  const hasReview = hasTaskReview(task);
  const canOpenReviewAction = task.completed || hasReview;
  const completeActionLabel = getTaskCompleteActionLabel(task.completed);
  const reviewActionLabel = getTaskReviewActionLabel(hasReview);
  const { visibleTags, remainingTagCount } = getVisibleTaskTags(task.tags);
  const { visibleScheduledDates, remainingScheduledDateCount } = getVisibleScheduledDates(task.scheduledDates);
  const isExpanded = hasChildren && !task.collapsed;
  const virtualSubtasks = useVirtualSubtasks(directSubtasks, isExpanded);
  const stackSegmentCount = getStackSegmentCount(subtaskCount);
  const stackSegmentStyle = !isExpanded && stackSegmentCount > 0
    ? getStackSegmentStyle(stackSegmentCount)
    : undefined;

  const toggleCluster = () => {
    if (!hasChildren) return;
    onToggleCollapse(task.id);
  };

  const handleClusterKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasChildren) return;
    if (!shouldToggleTaskClusterForKey(event.key)) return;
    event.preventDefault();
    onToggleCollapse(task.id);
  };

  return (
    <span className={getTaskClusterClassName({
      hasChildren,
      isExpanded,
    })}>
      <span className="task-cluster-stack-shell" style={stackSegmentStyle}>
        <AnimatePresence initial={false}>
          {!isExpanded && stackSegmentCount > 0 && (
            <TaskStackSegments
              segmentCount={stackSegmentCount}
              shouldReduceMotion={shouldReduceMotion}
            />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: 48 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={isCleanupMode ? undefined : toggleCluster}
          onKeyDown={isCleanupMode ? undefined : handleClusterKeyDown}
          onContextMenu={(e) => {
            e.preventDefault();
            const viewport = document.querySelector('.app-viewport');
            const shell = document.querySelector('.app-shell');
            const themeStyle = shell ? getComputedStyle(shell) : null;
            const viewportStyle = viewport ? getComputedStyle(viewport) : null;

            void window.electronAPI?.openTaskContextMenu(createTaskContextMenuOpenPayload({
              task,
              allTags,
              screenX: e.screenX,
              screenY: e.screenY,
              isDark: document.documentElement.classList.contains('dark'),
              shellClassList: shell?.classList,
              themeStyle,
              viewportStyle,
            }));
          }}
          className={`${getTaskCardClassName({
            hasChildren,
            hasTags,
            canOpenReviewAction,
            completed: task.completed,
          })}${isCleanupMode ? ' history-cleanup-task-card' : ''}${isCleanupSelected ? ' history-cleanup-task-card-selected' : ''}`}
          data-priority={task.priority}
          role={hasChildren ? 'button' : undefined}
          tabIndex={hasChildren ? 0 : undefined}
          aria-expanded={hasChildren ? !task.collapsed : undefined}
          aria-controls={hasChildren ? `task-subtasks-${task.id}` : undefined}
        >
          {isCleanupMode ? (
            <span className="history-cleanup-task-selection" onClick={stopClusterToggle} onPointerDown={stopClusterToggle}>
              <input
                type="checkbox"
                checked={isCleanupSelected}
                onChange={onToggleCleanupSelection}
                aria-label={cleanupSelectionLabel}
              />
            </span>
          ) : (
            <>
              <DragHandleButton dragHandleProps={dragHandleProps} />
              <CompleteActionButton
                completed={task.completed}
                label={completeActionLabel}
                onClick={onToggle}
              />
              <span className="task-priority-stop" onClick={stopClusterToggle} onPointerDown={stopClusterToggle}>
                <PriorityPicker value={task.priority} onChange={onPriorityChange} />
              </span>
            </>
          )}

          <TaskMainContent
            task={task}
            isEditing={isEditing}
            editText={editText}
            visibleTags={visibleTags}
            remainingTagCount={remainingTagCount}
            visibleScheduledDates={visibleScheduledDates}
            remainingScheduledDateCount={remainingScheduledDateCount}
            onEditTextChange={setEditText}
            onSubmitEdit={submitEdit}
            onEditKeyDown={handleEditKeyDown}
            onStartEdit={isCleanupMode ? undefined : (event) => {
              stopClusterToggle(event);
              startEditing();
            }}
          />

          {!isCleanupMode && (
            <TaskActionLayer
              canOpenReviewAction={canOpenReviewAction}
              hasReview={hasReview}
              reviewActionLabel={reviewActionLabel}
              onViewReview={onViewReview}
              onDelete={onDelete}
            />
          )}
        </motion.div>
      </span>

      <AnimatePresence initial={false}>
        {!isCleanupMode && isExpanded && (
          <Suspense fallback={null}>
            <TaskSubtasksViewport
              taskId={task.id}
              language={language}
              carriedFromDate={task.carriedFromDate}
              subtaskCarryoverProgress={task.subtaskCarryoverProgress}
              viewportRef={virtualSubtasks.viewportRef}
              isVirtual={virtualSubtasks.isVirtual}
              totalHeight={virtualSubtasks.totalHeight}
              visibleVirtualItems={virtualSubtasks.visibleVirtualItems}
              shouldReduceMotion={shouldReduceMotion}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
              onViewSubtaskReview={onViewSubtaskReview}
              onEditSubtask={onEditSubtask}
              onChangeSubtaskPriority={onChangeSubtaskPriority}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </span>
  );
}
