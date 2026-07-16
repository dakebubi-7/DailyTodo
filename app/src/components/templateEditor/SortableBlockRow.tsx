import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { useSortableMotion } from '../../hooks/useSortableMotion';

interface SortableBlockRowProps {
  sortableId: string;
  isDragActive: boolean;
  children: (dragHandle: ReactNode) => ReactNode;
}

// One reorderable template block row. Mirrors the task list: spring-driven
// make-room displacement during drag, instant jump-to-rest on release.
export function SortableBlockRow({ sortableId, isDragActive, children }: SortableBlockRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useSortable({
    id: sortableId,
    transition: null,
  });
  const { style } = useSortableMotion({ transform, isDragging, isDragActive });

  const dragHandle = (
    <span
      {...attributes}
      {...listeners}
      ref={setActivatorNodeRef}
      className="drag-handle"
      role="button"
      tabIndex={0}
      aria-label="\u62d6\u52a8\u8c03\u6574\u533a\u5757\u987a\u5e8f"
    >
      <span className="drag-handle-dots" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <i key={index} />)}
      </span>
    </span>
  );

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`template-block-row ${isDragging ? 'template-block-row-dragging' : ''}`}
    >
      {children(dragHandle)}
    </motion.div>
  );
}
