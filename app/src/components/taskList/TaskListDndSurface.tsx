import { DndContext, PointerSensor, useSensor, useSensors, type DragCancelEvent, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';
import type { TaskSource } from '../../types/task';
import { TaskListContent, type TaskListContentProps } from './TaskListContent';
import { getSourceDragTarget, parseSortableId, scopedCollisionDetection } from './taskListDnd';

interface TaskListDndSurfaceProps extends Omit<TaskListContentProps, 'dragDisabled' | 'isDragActive'> {
  selectedDate: string;
  dragDisabled: boolean;
  onReorderSources: (date: string, activeSource: TaskSource, overSource: TaskSource) => void;
  onReorderTasks: (date: string, source: TaskSource, completed: boolean, activeId: string, overId: string) => void;
}

export function TaskListDndSurface({
  selectedDate,
  dragDisabled,
  onReorderSources,
  onReorderTasks,
  ...contentProps
}: TaskListDndSurfaceProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeSourceDrag, setActiveSourceDrag] = useState<TaskSource | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragActive(true);
    const active = parseSortableId(String(event.active.id));
    if (active?.type === 'source') setActiveSourceDrag(active.source);
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setIsDragActive(false);
    setActiveSourceDrag(null);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Keep React order stable while dnd-kit previews the prospective placement.
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragActive(false);
    setActiveSourceDrag(null);
    if (dragDisabled || !event.over) return;

    const active = parseSortableId(String(event.active.id));
    const over = parseSortableId(String(event.over.id));
    if (!active || !over || active.type !== over.type) return;

    if (active.type === 'source') {
      const target = getSourceDragTarget(String(event.active.id), String(event.over.id));
      if (target) onReorderSources(selectedDate, target.activeSource, target.targetSource);
      return;
    }

    if (
      active.type === 'task' &&
      over.type === 'task' &&
      active.source === over.source &&
      active.completed === over.completed &&
      active.taskId !== over.taskId
    ) {
      onReorderTasks(selectedDate, active.source, active.completed, active.taskId, over.taskId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={scopedCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className={`space-y-2 ${dragDisabled ? 'task-drag-disabled' : 'task-drag-enabled'} ${activeSourceDrag ? 'source-drag-active' : ''}`}>
        <TaskListContent {...contentProps} dragDisabled={dragDisabled} isDragActive={isDragActive} />
      </div>
    </DndContext>
  );
}
