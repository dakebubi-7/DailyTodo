import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type CollisionDetection, type DragCancelEvent, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { type ButtonHTMLAttributes, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Task, TaskSource } from '../types/task';
import { TaskItem, type TaskDragHandleProps } from './TaskItem';
import { useFloatingScrollbar } from '../hooks/useFloatingScrollbar';

interface TaskListProps {
  tasks: Task[];
  selectedDate: string;
  sourceOrder: TaskSource[];
  dragDisabled: boolean;
  onReorderSources: (date: string, activeSource: TaskSource, overSource: TaskSource) => void;
  onReorderTasks: (date: string, source: TaskSource, completed: boolean, activeId: string, overId: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
  showOpenOnly: boolean;
  onToggleOpenOnly: () => void;
  priorityFilter: 'all' | 'high' | 'medium' | 'low';
  onPriorityFilterChange: (value: 'all' | 'high' | 'medium' | 'low') => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onPriorityChange: (id: string, priority: Task['priority']) => void;
  onViewReview: (task: Task) => void;
  onToggleSubtask: (id: string) => void;
  onDeleteSubtask: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onViewSubtaskReview: (task: Task) => void;
  editRequest?: { id: string; nonce: number } | null;
}

const priorityFilterLabel = {
  all: '全部优先级',
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

const TASK_SORTABLE_MOTION = {
  stiffness: 95,
  damping: 14,
  mass: 1.35,
  restDelta: 0.5,
  restSpeed: 10,
};
const SOURCE_GROUP_SORTABLE_MOTION = {
  stiffness: 55,
  damping: 13,
  mass: 1.8,
  restDelta: 0.5,
  restSpeed: 10,
};
const REDUCED_SORTABLE_MOTION = {
  stiffness: 1000,
  damping: 100,
  mass: 0.1,
  restDelta: 0.5,
  restSpeed: 10,
};

function getTaskSource(task: Task): TaskSource {
  return task.source || 'personal';
}

function getSourceSortableId(source: TaskSource) {
  return `source:${source}`;
}

function getTaskSortableId(task: Task) {
  return `task:${getTaskSource(task)}:${task.completed ? 'done' : 'open'}:${task.id}`;
}

function parseSortableId(id: string) {
  const parts = id.split(':');
  if (parts[0] === 'source' && (parts[1] === 'personal' || parts[1] === 'external')) {
    return { type: 'source' as const, source: parts[1] as TaskSource };
  }
  if (parts[0] === 'task' && (parts[1] === 'personal' || parts[1] === 'external') && (parts[2] === 'open' || parts[2] === 'done')) {
    return {
      type: 'task' as const,
      source: parts[1] as TaskSource,
      completed: parts[2] === 'done',
      taskId: parts.slice(3).join(':'),
    };
  }
  return null;
}

function scopedCollisionDetection(args: Parameters<CollisionDetection>[0]) {
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
}

export function TaskList({
  tasks,
  selectedDate,
  sourceOrder,
  dragDisabled,
  onReorderSources,
  onReorderTasks,
  searchQuery,
  onSearchChange,
  searchOpen,
  onToggleSearch,
  showOpenOnly,
  onToggleOpenOnly,
  priorityFilter,
  onPriorityFilterChange,
  onToggle,
  onDelete,
  onEdit,
  onPriorityChange,
  onViewReview,
  onToggleSubtask,
  onDeleteSubtask,
  onToggleCollapse,
  onViewSubtaskReview,
  editRequest,
}: TaskListProps) {
  const filtersActive = Boolean(searchQuery.trim() || showOpenOnly || priorityFilter !== 'all');
  const scrollRef = useRef<HTMLDivElement>(null);
  useFloatingScrollbar(scrollRef);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeSourceDrag, setActiveSourceDrag] = useState<TaskSource | null>(null);
  // True between drag start and drag end/cancel. Sortable items animate their
  // make-room displacement while this is true, then JUMP to their final spot the
  // instant it turns false — the reordered DOM already matches the make-room
  // preview, so the jump is invisible and there is no release bounce.
  const [isDragActive, setIsDragActive] = useState(false);

  const allTags = Array.from(
    new Set(tasks.flatMap(task => task.tags || []))
  ).sort((a, b) => {
    const countA = tasks.filter(t => t.tags?.includes(a)).length;
    const countB = tasks.filter(t => t.tags?.includes(b)).length;
    return countB - countA;
  });

  const sourceGroups = useMemo(() => {
    const grouped = new Map<TaskSource, Task[]>();
    tasks.forEach((task) => {
      const source = getTaskSource(task);
      grouped.set(source, [...(grouped.get(source) || []), task]);
    });
    const sourcesInTasks = Array.from(grouped.keys());
    const orderedSources = [
      ...sourceOrder.filter((source) => grouped.has(source)),
      ...sourcesInTasks.filter((source) => !sourceOrder.includes(source)),
    ];
    return orderedSources.map((source) => ({ source, tasks: grouped.get(source) || [] }));
  }, [sourceOrder, tasks]);

  const externalTasks = tasks.filter((task) => getTaskSource(task) === 'external');
  const shouldGroupBySource = externalTasks.length > 0;

  const clearFilters = () => {
    onSearchChange('');
    if (showOpenOnly) onToggleOpenOnly();
    onPriorityFilterChange('all');
  };

  const getSourceDragTarget = (activeId: string, overId: string) => {
    const active = parseSortableId(activeId);
    const over = parseSortableId(overId);
    if (!active || active.type !== 'source' || !over) return null;
    const targetSource = over.type === 'source' ? over.source : over.type === 'task' ? over.source : null;
    if (!targetSource || active.source === targetSource) return null;
    return { activeSource: active.source, targetSource };
  };

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragActive(true);
    const active = parseSortableId(String(event.active.id));
    if (active?.type !== 'source') return;
    setActiveSourceDrag(active.source);
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setIsDragActive(false);
    setActiveSourceDrag(null);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Keep React order stable during drag. dnd-kit transform previews movement;
    // persistence happens once in handleDragEnd to avoid flash and sync storms.
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragActive(false);
    if (activeSourceDrag) setActiveSourceDrag(null);
    if (dragDisabled || !event.over) return;
    const active = parseSortableId(String(event.active.id));
    const over = parseSortableId(String(event.over.id));
    if (!active || !over || active.type !== over.type) return;

    if (active.type === 'source') {
      const target = getSourceDragTarget(String(event.active.id), String(event.over.id));
      if (target) onReorderSources(selectedDate, target.activeSource, target.targetSource);
      setActiveSourceDrag(null);
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

  const renderTask = (task: Task, index: number) => (
    <SortableTaskItem
      key={task.id}
      task={task}
      index={index}
      dragDisabled={dragDisabled}
      isDragActive={isDragActive}
      onToggle={() => onToggle(task.id)}
      onDelete={() => onDelete(task.id)}
      onEdit={(text) => onEdit(task.id, text)}
      onPriorityChange={(priority) => onPriorityChange(task.id, priority)}
      onViewReview={() => onViewReview(task)}
      onToggleSubtask={onToggleSubtask}
      onDeleteSubtask={onDeleteSubtask}
      onToggleCollapse={onToggleCollapse}
      onViewSubtaskReview={onViewSubtaskReview}
      allTags={allTags}
      editTrigger={editRequest && editRequest.id === task.id ? editRequest.nonce : undefined}
    />
  );

  const renderTaskBucket = (bucketTasks: Task[], startIndex: number) => {
    if (!bucketTasks.length) return null;
    return (
      <SortableContext items={bucketTasks.map(getTaskSortableId)} strategy={verticalListSortingStrategy}>
        {bucketTasks.map((task, index) => renderTask(task, startIndex + index))}
      </SortableContext>
    );
  };

  const renderSourceGroup = (source: TaskSource, groupTasks: Task[], startIndex: number) => {
    const openTasks = groupTasks.filter((task) => !task.completed);
    const doneTasks = groupTasks.filter((task) => task.completed);
    return (
      <SortableSourceSection
        key={source}
        source={source}
        dragDisabled={dragDisabled || sourceGroups.length < 2}
        isDragActive={isDragActive}
      >
        {renderTaskBucket(openTasks, startIndex)}
        {renderTaskBucket(doneTasks, startIndex + openTasks.length)}
      </SortableSourceSection>
    );
  };

  return (
    <div className="task-list flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-2">
      <div className="task-toolbar">
        <div className="task-toolbar-row">
          <button
            type="button"
            onClick={onToggleSearch}
            className={`task-tool-icon ${searchOpen || filtersActive ? 'task-tool-active' : ''}`}
            title="搜索与筛选"
            aria-label="搜索与筛选"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onToggleOpenOnly}
            className={`task-filter-button ${showOpenOnly ? 'task-filter-active' : ''}`}
          >
            未完成
          </button>

          <select
            value={priorityFilter}
            onChange={(event) => onPriorityFilterChange(event.target.value as 'all' | 'high' | 'medium' | 'low')}
            className="task-filter-select"
            aria-label="优先级筛选"
          >
            <option value="all">全部优先级</option>
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>

          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="task-clear-filter"
              title={`清除筛选：${priorityFilterLabel[priorityFilter]}`}
            >
              清除
            </button>
          )}
        </div>

        {(searchOpen || searchQuery.trim()) && (
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="task-search-input"
            placeholder="搜索任务..."
            aria-label="搜索任务"
          />
        )}
      </div>

      <div ref={scrollRef} className="task-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        <DndContext sensors={sensors} collisionDetection={scopedCollisionDetection} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragCancel={handleDragCancel} onDragEnd={handleDragEnd}>
          <div className={`space-y-2 ${dragDisabled ? 'task-drag-disabled' : 'task-drag-enabled'} ${activeSourceDrag ? 'source-drag-active' : ''}`}>
            <AnimatePresence>
              {tasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="empty-state"
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" className="mb-3 opacity-45">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="font-sans text-sm">这一天还没有任务</p>
                  <p className="mt-1 font-sans text-xs">写下第一件要推进的小事</p>
                </motion.div>
              ) : shouldGroupBySource ? (
                <SortableContext items={sourceGroups.map((group) => getSourceSortableId(group.source))} strategy={verticalListSortingStrategy}>
                  {sourceGroups.map((group, groupIndex) => {
                    const startIndex = sourceGroups.slice(0, groupIndex).reduce((sum, item) => sum + item.tasks.length, 0);
                    return renderSourceGroup(group.source, group.tasks, startIndex);
                  })}
                </SortableContext>
              ) : (
                renderTaskBucket(tasks, 0)
              )}
            </AnimatePresence>
          </div>
        </DndContext>
      </div>
    </div>
  );
}

function SortableSourceSection({
  source,
  dragDisabled,
  isDragActive,
  children,
}: {
  source: TaskSource;
  dragDisabled: boolean;
  isDragActive: boolean;
  children: ReactNode;
}) {
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

  useEffect(() => {
    if (isDragging) return;
    rawX.set(transform?.x ?? 0);
    rawY.set(transform?.y ?? 0);
  }, [transform?.x, transform?.y, isDragging, rawX, rawY]);

  // When the drag ends, the reordered DOM already sits where the make-room
  // preview put this group. Jump the springs to 0 before paint so the element
  // does not first leap to (slot + 2*displacement) and bounce back.
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
      aria-label={source === 'personal' ? '个人任务' : '外部任务'}
    >
      <div
        ref={setActivatorNodeRef}
        className={`task-source-group-title ${source === 'external' ? 'task-source-group-title-external' : ''}`}
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={dragDisabled ? -1 : 0}
        aria-disabled={dragDisabled}
        aria-label={`拖动调整${source === 'personal' ? '个人任务' : '外部任务'}分组顺序`}
      >
        <span className="source-drag-handle" aria-hidden="true">
          <DragDotsIcon />
        </span>
        <span>{source === 'personal' ? '个人任务' : '外部任务'}</span>
      </div>
      {children}
    </motion.section>
  );
}

function SortableTaskItem({
  task,
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
  allTags,
  editTrigger,
}: {
  task: Task;
  index: number;
  dragDisabled: boolean;
  isDragActive: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
  onPriorityChange: (priority: Task['priority']) => void;
  onViewReview: () => void;
  onToggleSubtask: (id: string) => void;
  onDeleteSubtask: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onViewSubtaskReview: (task: Task) => void;
  allTags: string[];
  editTrigger?: number;
}) {
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
  // the springs to 0 before paint instead of animating — kills the release bounce.
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
    attributes: attributes as ButtonHTMLAttributes<HTMLButtonElement>,
    listeners: listeners as ButtonHTMLAttributes<HTMLButtonElement> | undefined,
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
          dragHandleProps={dragHandleProps}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onPriorityChange={onPriorityChange}
          onViewReview={onViewReview}
          onToggleSubtask={onToggleSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onToggleCollapse={onToggleCollapse}
          onViewSubtaskReview={onViewSubtaskReview}
          allTags={allTags}
          editTrigger={editTrigger}
        />
      </motion.div>
    </motion.div>
  );
}

function DragDotsIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="3" r="1.15" />
      <circle cx="9" cy="3" r="1.15" />
      <circle cx="3" cy="7" r="1.15" />
      <circle cx="9" cy="7" r="1.15" />
      <circle cx="3" cy="11" r="1.15" />
      <circle cx="9" cy="11" r="1.15" />
    </svg>
  );
}
