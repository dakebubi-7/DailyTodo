import { useSortable } from '@dnd-kit/sortable';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { memo, useEffect, useLayoutEffect } from 'react';
import type { AppLanguage } from '../../../shared/appSettings';
import type { Task } from '../../types/task';
import { TaskItem, type TaskDragHandleProps } from '../TaskItem';
import { REDUCED_SORTABLE_MOTION, TASK_SORTABLE_MOTION, getTaskSortableId } from './taskListDnd';

interface SortableTaskItemProps {
  task: Task;
  currentDate: string;
  language: AppLanguage;
  index: number;
  dragDisabled: boolean;
  isDragActive: boolean;
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
  allTags: string[];
  editTrigger?: number;
  isCleanupMode?: boolean;
  isCleanupSelected?: boolean;
  onToggleCleanupSelection?: (id: string) => void;
  cleanupSelectionLabel?: string;
}

function haveSameTags(previous: string[], next: string[]) {
  return previous === next || (
    previous.length === next.length && previous.every((tag, index) => tag === next[index])
  );
}

function areTaskItemPropsEqual(previous: SortableTaskItemProps, next: SortableTaskItemProps) {
  return (
    previous.task === next.task &&
    previous.currentDate === next.currentDate &&
    previous.language === next.language &&
    previous.index === next.index &&
    previous.dragDisabled === next.dragDisabled &&
    previous.isDragActive === next.isDragActive &&
    previous.onToggle === next.onToggle &&
    previous.onDelete === next.onDelete &&
    previous.onEdit === next.onEdit &&
    previous.onPriorityChange === next.onPriorityChange &&
    previous.onViewReview === next.onViewReview &&
    previous.onToggleSubtask === next.onToggleSubtask &&
    previous.onDeleteSubtask === next.onDeleteSubtask &&
    previous.onToggleCollapse === next.onToggleCollapse &&
    previous.onViewSubtaskReview === next.onViewSubtaskReview &&
    previous.onEditSubtask === next.onEditSubtask &&
    previous.onChangeSubtaskPriority === next.onChangeSubtaskPriority &&
    previous.editTrigger === next.editTrigger &&
    previous.isCleanupMode === next.isCleanupMode &&
    previous.isCleanupSelected === next.isCleanupSelected &&
    previous.onToggleCleanupSelection === next.onToggleCleanupSelection &&
    previous.cleanupSelectionLabel === next.cleanupSelectionLabel &&
    haveSameTags(previous.allTags, next.allTags)
  );
}

export const SortableTaskItem = memo(function SortableTaskItem({
  task,
  currentDate,
  language,
  index,
  dragDisabled,
  isDragActive,
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
  allTags,
  editTrigger,
  isCleanupMode,
  isCleanupSelected,
  onToggleCleanupSelection,
  cleanupSelectionLabel,
}: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useSortable({
    id: getTaskSortableId(task),
    disabled: dragDisabled,
    transition: null,
  });
  const shouldReduceMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springConfig = shouldReduceMotion ? REDUCED_SORTABLE_MOTION : TASK_SORTABLE_MOTION;
  const springX = useSpring(rawX, springConfig);
  const springY = useSpring(rawY, springConfig);

  useEffect(() => {
    if (isDragging) return;
    rawX.set(transform?.x ?? 0);
    rawY.set(transform?.y ?? 0);
  }, [transform?.x, transform?.y, isDragging, rawX, rawY]);

  // On drag end the reordered DOM already matches the make-room preview, so jump
  // the springs to 0 before paint instead of animating to prevent release bounce.
  useLayoutEffect(() => {
    if (isDragActive) return;
    springX.jump(0);
    springY.jump(0);
    rawX.set(0);
    rawY.set(0);
  }, [isDragActive, springX, springY, rawX, rawY]);

  const activeSortableStyle = {
    x: transform?.x ?? 0,
    y: transform?.y ?? 0,
    zIndex: 30,
  };
  const style = isDragging
    ? activeSortableStyle
    : {
        x: springX,
        y: springY,
        zIndex: 1,
  };
  const dragHandleProps: TaskDragHandleProps = {
    attributes,
    listeners,
    setActivatorNodeRef,
    disabled: dragDisabled,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      key={task.id}
      className={`task-sortable-shell ${isDragging ? 'task-sortable-dragging' : ''}`}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isDragging ? 0.78 : 1 }}
        exit={{ opacity: 0, x: 56 }}
        transition={{ duration: 0.18, delay: index * 0.012, ease: 'easeOut' }}
      >
        <TaskItem
          task={task}
          currentDate={currentDate}
          language={language}
          dragHandleProps={dragHandleProps}
          onToggle={() => onToggle(task.id)}
          onDelete={() => onDelete(task.id)}
          onEdit={(text) => onEdit(task.id, text)}
          onPriorityChange={(priority) => onPriorityChange(task.id, priority)}
          onViewReview={() => onViewReview(task)}
          onToggleSubtask={onToggleSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onToggleCollapse={onToggleCollapse}
          onViewSubtaskReview={onViewSubtaskReview}
          onEditSubtask={onEditSubtask}
          onChangeSubtaskPriority={onChangeSubtaskPriority}
          allTags={allTags}
          editTrigger={editTrigger}
          isCleanupMode={isCleanupMode}
          isCleanupSelected={isCleanupSelected}
          onToggleCleanupSelection={onToggleCleanupSelection ? () => onToggleCleanupSelection(task.id) : undefined}
          cleanupSelectionLabel={cleanupSelectionLabel}
        />
      </motion.div>
    </motion.div>
  );
}, areTaskItemPropsEqual);
