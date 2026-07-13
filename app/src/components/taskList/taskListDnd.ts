import { closestCenter, type CollisionDetection } from '@dnd-kit/core';
import type { Task, TaskSource } from '../../types/task';
import {
  getSourceSortableId as getModelSourceSortableId,
  getTaskSortableId as getModelTaskSortableId,
  getTaskSource as getModelTaskSource,
} from './taskListModel';

export const TASK_SORTABLE_MOTION = {
  stiffness: 95,
  damping: 14,
  mass: 1.35,
  restDelta: 0.5,
  restSpeed: 10,
};

export const SOURCE_GROUP_SORTABLE_MOTION = {
  stiffness: 55,
  damping: 13,
  mass: 1.8,
  restDelta: 0.5,
  restSpeed: 10,
};

export const REDUCED_SORTABLE_MOTION = {
  stiffness: 1000,
  damping: 100,
  mass: 0.1,
  restDelta: 0.5,
  restSpeed: 10,
};

export type ParsedSortableId =
  | { type: 'source'; source: TaskSource }
  | { type: 'task'; source: TaskSource; completed: boolean; taskId: string };

export function getTaskSource(task: Task): TaskSource {
  return getModelTaskSource(task);
}

export function getSourceSortableId(source: TaskSource) {
  return getModelSourceSortableId(source);
}

export function getTaskSortableId(task: Task) {
  return getModelTaskSortableId(task);
}

export function parseSortableId(id: string): ParsedSortableId | null {
  const parts = id.split(':');
  if (parts[0] === 'source' && (parts[1] === 'personal' || parts[1] === 'external')) {
    return { type: 'source', source: parts[1] };
  }
  if (parts[0] === 'task' && (parts[1] === 'personal' || parts[1] === 'external') && (parts[2] === 'open' || parts[2] === 'done')) {
    return {
      type: 'task',
      source: parts[1],
      completed: parts[2] === 'done',
      taskId: parts.slice(3).join(':'),
    };
  }
  return null;
}

export const scopedCollisionDetection: CollisionDetection = (args) => {
  const active = parseSortableId(String(args.active.id));
  if (!active) return closestCenter(args);

  const droppableContainers = args.droppableContainers.filter((container) => {
    const candidate = parseSortableId(String(container.id));
    if (!candidate) return false;

    if (active.type === 'task') {
      return (
        candidate.type === 'task' &&
        candidate.source === active.source &&
        candidate.completed === active.completed
      );
    }

    if (active.type === 'source') {
      return candidate.type === 'source';
    }

    return false;
  });

  return closestCenter({ ...args, droppableContainers });
};

export function getSourceDragTarget(activeId: string, overId: string) {
  const active = parseSortableId(activeId);
  const over = parseSortableId(overId);
  if (!active || active.type !== 'source' || !over) return null;
  const targetSource = over.type === 'source' ? over.source : over.type === 'task' ? over.source : null;
  if (!targetSource || active.source === targetSource) return null;
  return { activeSource: active.source, targetSource };
}
