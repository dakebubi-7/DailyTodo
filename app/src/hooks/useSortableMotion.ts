import { useEffect, useLayoutEffect } from 'react';
import { useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

// Shared sortable spring presets. Kept here so both the task list and the
// template editor reorder with the SAME feel (make-room spring during drag,
// instant jump-to-rest on release — no bounce).
export const SORTABLE_ITEM_MOTION = {
  stiffness: 95,
  damping: 14,
  mass: 1.35,
  restDelta: 0.5,
  restSpeed: 10,
};

export const SORTABLE_GROUP_MOTION = {
  stiffness: 55,
  damping: 13,
  mass: 1.8,
  restDelta: 0.5,
  restSpeed: 10,
};

export const SORTABLE_REDUCED_MOTION = {
  stiffness: 1000,
  damping: 100,
  mass: 0.1,
  restDelta: 0.5,
  restSpeed: 10,
};

type Transform = { x: number; y: number } | null | undefined;

interface UseSortableMotionOptions {
  /** dnd-kit transform for this item (drag displacement). */
  transform: Transform;
  /** True while THIS item is the one being dragged. */
  isDragging: boolean;
  /** True between drag start and drag end/cancel for the whole context. */
  isDragActive: boolean;
  /** Spring preset; defaults to the per-item preset. */
  motion?: typeof SORTABLE_ITEM_MOTION;
}

/**
 * Drives a sortable item's displacement with a Framer Motion spring while other
 * items make room, then JUMPS the springs to 0 before paint the instant the
 * drag ends — because the reordered DOM already sits where the make-room
 * preview put it, the jump is invisible and there is no release bounce.
 *
 * Returns the motion `style` to spread onto the item's motion element while it
 * is not the actively-dragged item, plus the raw spring values for callers that
 * need them.
 */
export function useSortableMotion({ transform, isDragging, isDragActive, motion }: UseSortableMotionOptions) {
  const shouldReduceMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springConfig = shouldReduceMotion ? SORTABLE_REDUCED_MOTION : (motion ?? SORTABLE_ITEM_MOTION);
  const springX = useSpring(rawX, springConfig);
  const springY = useSpring(rawY, springConfig);

  useEffect(() => {
    if (isDragging) return;
    rawX.set(transform?.x ?? 0);
    rawY.set(transform?.y ?? 0);
  }, [transform?.x, transform?.y, isDragging, rawX, rawY]);

  // On drag end the reordered DOM already matches the make-room preview, so jump
  // the springs to 0 before paint instead of animating — kills the release bounce.
  useLayoutEffect(() => {
    if (isDragActive) return;
    springX.jump(0);
    springY.jump(0);
    rawX.set(0);
    rawY.set(0);
  }, [isDragActive, springX, springY, rawX, rawY]);

  const restingStyle = {
    x: springX,
    y: springY,
    zIndex: 1,
  };

  const draggingStyle = {
    x: transform?.x ?? 0,
    y: transform?.y ?? 0,
    zIndex: 30,
  };

  return {
    style: isDragging ? draggingStyle : restingStyle,
    springX,
    springY,
    rawX,
    rawY,
  };
}
