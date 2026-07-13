import { useSortable } from '@dnd-kit/sortable';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { type ReactNode, useEffect, useLayoutEffect } from 'react';
import type { TaskSource } from '../../types/task';
import { DragDotsIcon } from '../taskItem/taskItemIcons';
import {
  REDUCED_SORTABLE_MOTION,
  SOURCE_GROUP_SORTABLE_MOTION,
  getSourceSortableId,
} from './taskListDnd';

interface SortableSourceSectionProps {
  source: TaskSource;
  dragDisabled: boolean;
  isDragActive: boolean;
  children: ReactNode;
}

function getSourceLabel(source: TaskSource) {
  return source === 'personal' ? '\u4e2a\u4eba\u4efb\u52a1' : '\u5916\u90e8\u4efb\u52a1';
}

export function SortableSourceSection({
  source,
  dragDisabled,
  isDragActive,
  children,
}: SortableSourceSectionProps) {
  const sortableId = getSourceSortableId(source);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useSortable({
    id: sortableId,
    disabled: dragDisabled,
    transition: null,
  });
  const shouldReduceMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springConfig = shouldReduceMotion ? REDUCED_SORTABLE_MOTION : SOURCE_GROUP_SORTABLE_MOTION;
  const springX = useSpring(rawX, springConfig);
  const springY = useSpring(rawY, springConfig);
  const sourceLabel = getSourceLabel(source);

  useEffect(() => {
    if (isDragging) return;
    rawX.set(transform?.x ?? 0);
    rawY.set(transform?.y ?? 0);
  }, [transform?.x, transform?.y, isDragging, rawX, rawY]);

  // The reordered DOM already matches the make-room preview on drop, so jump
  // the displacement springs to rest before paint to avoid a release bounce.
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
    zIndex: 20,
  };
  const style = isDragging
    ? activeSortableStyle
    : {
        x: springX,
        y: springY,
        zIndex: 1,
      };

  return (
    <motion.section
      ref={setNodeRef}
      style={style}
      className={`task-source-group task-source-group-shell ${isDragging ? 'task-source-group-dragging' : ''}`}
      aria-label={sourceLabel}
    >
      <div
        ref={setActivatorNodeRef}
        className={`task-source-group-title ${source === 'external' ? 'task-source-group-title-external' : ''}`}
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={dragDisabled ? -1 : 0}
        aria-disabled={dragDisabled}
        aria-label={`\u62d6\u52a8\u8c03\u6574${sourceLabel}\u5206\u7ec4\u987a\u5e8f`}
      >
        <span className="source-drag-handle" aria-hidden="true">
          <DragDotsIcon />
        </span>
        <span>{sourceLabel}</span>
      </div>
      {children}
    </motion.section>
  );
}
