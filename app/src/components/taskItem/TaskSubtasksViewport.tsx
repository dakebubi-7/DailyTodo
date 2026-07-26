import { motion } from 'framer-motion';
import type { RefObject } from 'react';
import type { AppLanguage } from '../../../shared/appSettings';
import type { Task } from '../../types/task';
import { SubtaskCard } from './SubtaskCard';
import { stopClusterToggle } from './taskItemInteractions';
import {
  TASK_CLUSTER_REDUCED_TRANSITION,
  TASK_CLUSTER_SPRING,
  TASK_SUBTASK_STAGGER_MS,
} from './taskItemStack';
import { getSubtaskCarryoverNotice, TASK_SUBTASKS_LABEL } from './taskItemPresentation';
import { TASK_SUBTASK_VIEWPORT_HEIGHT, type VirtualSubtaskItem } from './useVirtualSubtasks';

export interface TaskSubtasksViewportProps {
  taskId: string;
  language: AppLanguage;
  carriedFromDate: string | undefined;
  subtaskCarryoverProgress: Task['subtaskCarryoverProgress'];
  viewportRef: RefObject<HTMLSpanElement>;
  isVirtual: boolean;
  totalHeight: number | undefined;
  visibleVirtualItems: VirtualSubtaskItem[];
  shouldReduceMotion: boolean | null;
  onToggleSubtask: (id: string) => void;
  onDeleteSubtask: (id: string) => void;
  onViewSubtaskReview: (task: Task) => void;
  onEditSubtask: (id: string, text: string) => void;
  onChangeSubtaskPriority: (id: string, priority: Task['priority']) => void;
}

export function TaskSubtasksViewport({
  taskId,
  language,
  carriedFromDate,
  subtaskCarryoverProgress,
  viewportRef,
  isVirtual,
  totalHeight,
  visibleVirtualItems,
  shouldReduceMotion,
  onToggleSubtask,
  onDeleteSubtask,
  onViewSubtaskReview,
  onEditSubtask,
  onChangeSubtaskPriority,
}: TaskSubtasksViewportProps) {
  const carryoverNotice = getSubtaskCarryoverNotice(language, carriedFromDate, subtaskCarryoverProgress);

  return (
    <motion.span
      id={`task-subtasks-${taskId}`}
      className="task-subtasks task-subtasks-scroll-viewport"
      aria-label={TASK_SUBTASKS_LABEL}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={shouldReduceMotion ? TASK_CLUSTER_REDUCED_TRANSITION : TASK_CLUSTER_SPRING}
      style={{ maxHeight: TASK_SUBTASK_VIEWPORT_HEIGHT }}
      ref={viewportRef}
      onClick={stopClusterToggle}
      onPointerDown={stopClusterToggle}
    >
      {carryoverNotice && (
        <span className="task-subtask-carryover-notice">{carryoverNotice}</span>
      )}
      <span
        className={`task-subtask-virtual-list ${isVirtual ? 'task-subtask-virtual-list-active' : ''}`}
        style={isVirtual ? { height: totalHeight } : undefined}
      >
        {visibleVirtualItems.map((virtualItem) => (
          <motion.span
            key={virtualItem.task.id}
            className="task-subtask-virtual-spacer"
            style={isVirtual ? { top: virtualItem.top } : undefined}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
            transition={shouldReduceMotion ? TASK_CLUSTER_REDUCED_TRANSITION : {
              ...TASK_CLUSTER_SPRING,
              delay: virtualItem.index * TASK_SUBTASK_STAGGER_MS * 0.001,
            }}
          >
            <SubtaskCard
              subtask={virtualItem.task}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
              onViewSubtaskReview={onViewSubtaskReview}
              onEditSubtask={onEditSubtask}
              onChangeSubtaskPriority={onChangeSubtaskPriority}
            />
          </motion.span>
        ))}
      </span>
    </motion.span>
  );
}
