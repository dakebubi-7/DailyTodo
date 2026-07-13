import { motion } from 'framer-motion';
import {
  TASK_CLUSTER_REDUCED_TRANSITION,
  TASK_STACK_SEGMENT_CLASSES,
  TASK_STACK_SEGMENT_TRANSITIONS,
} from './taskItemStack';

export interface TaskStackSegmentsProps {
  segmentCount: number;
  shouldReduceMotion: boolean | null;
}

export function TaskStackSegments({
  segmentCount,
  shouldReduceMotion,
}: TaskStackSegmentsProps) {
  return (
    <span className="task-stack-segments" aria-hidden="true">
      {TASK_STACK_SEGMENT_CLASSES.slice(0, segmentCount).map((segmentClass, segmentIndex) => (
        <motion.span
          key={segmentClass}
          className={`task-stack-segment ${segmentClass}`}
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={shouldReduceMotion ? TASK_CLUSTER_REDUCED_TRANSITION : TASK_STACK_SEGMENT_TRANSITIONS[segmentIndex]}
        />
      ))}
    </span>
  );
}
