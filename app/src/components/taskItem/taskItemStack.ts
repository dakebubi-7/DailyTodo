import type { CSSProperties } from 'react';

type TaskStackSegmentStyle = CSSProperties & {
  '--task-stack-segment-count': number;
};

export const TASK_STACK_SEGMENT_CLASSES = ['task-stack-segment-1', 'task-stack-segment-2', 'task-stack-segment-3'] as const;

export const TASK_CLUSTER_SPRING = {
  stiffness: 180,
  damping: 25,
  mass: 1,
};

export const TASK_STACK_SEGMENT_TRANSITIONS = TASK_STACK_SEGMENT_CLASSES.map((_, segmentIndex) => ({
  ...TASK_CLUSTER_SPRING,
  delay: segmentIndex * 0.025,
}));

export const TASK_CLUSTER_REDUCED_TRANSITION = {
  duration: 0.01,
};

export const TASK_SUBTASK_STAGGER_MS = 50;

export function getStackSegmentCount(subtaskCount: number) {
  if (subtaskCount <= 0) return 0;
  return Math.min(subtaskCount, TASK_STACK_SEGMENT_CLASSES.length);
}


export function getStackSegmentStyle(segmentCount: number): TaskStackSegmentStyle {
  return {
    '--task-stack-segment-count': segmentCount,
  };
}
