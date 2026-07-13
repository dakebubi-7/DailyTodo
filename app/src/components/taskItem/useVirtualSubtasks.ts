import { useEffect, useMemo, useRef, useState } from 'react';
import type { Task } from '../../types/task';

export const TASK_SUBTASK_VIEWPORT_HEIGHT = 400;
const TASK_SUBTASK_ROW_HEIGHT = 46;
const TASK_SUBTASK_OVERSCAN = 4;
const TASK_SUBTASK_VIRTUAL_THRESHOLD = 30;

export interface VirtualSubtaskItem {
  task: Task;
  index: number;
  top: number;
}

export function useVirtualSubtasks(subtasks: Task[], isExpanded: boolean) {
  const viewportRef = useRef<HTMLSpanElement>(null);
  const scrollFrameRef = useRef<number | undefined>(undefined);
  const [scrollTop, setScrollTop] = useState(0);
  const isVirtual = subtasks.length > TASK_SUBTASK_VIRTUAL_THRESHOLD;
  const totalHeight = isVirtual ? subtasks.length * TASK_SUBTASK_ROW_HEIGHT : undefined;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !isVirtual || !isExpanded) return;

    const handleScroll = () => {
      if (scrollFrameRef.current !== undefined) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = undefined;
        setScrollTop(viewport.scrollTop);
      });
    };
    setScrollTop(viewport.scrollTop);
    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      if (scrollFrameRef.current !== undefined) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = undefined;
      }
    };
  }, [isExpanded, isVirtual]);

  const visibleVirtualItems = useMemo<VirtualSubtaskItem[]>(() => {
    if (!isExpanded) return [];

    if (!isVirtual) {
      return subtasks.map((subtask, index) => ({ task: subtask, index, top: 0 }));
    }

    const viewportHeight = TASK_SUBTASK_VIEWPORT_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / TASK_SUBTASK_ROW_HEIGHT) - TASK_SUBTASK_OVERSCAN);
    const endIndex = Math.min(
      subtasks.length,
      Math.ceil((scrollTop + viewportHeight) / TASK_SUBTASK_ROW_HEIGHT) + TASK_SUBTASK_OVERSCAN,
    );

    return subtasks.slice(startIndex, endIndex).map((subtask, sliceIndex) => {
      const index = startIndex + sliceIndex;
      return { task: subtask, index, top: index * TASK_SUBTASK_ROW_HEIGHT };
    });
  }, [isExpanded, isVirtual, scrollTop, subtasks]);

  return { viewportRef, isVirtual, totalHeight, visibleVirtualItems };
}
