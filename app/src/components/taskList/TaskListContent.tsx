import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import { memo } from 'react';
import type { AppLanguage } from '../../../shared/appSettings';
import type { Task, TaskSource } from '../../types/task';
import { SortableSourceSection } from './SortableSourceSection';
import { SortableTaskItem } from './SortableTaskItem';
import { TaskListEmptyState } from './TaskListEmptyState';
import type { TaskSourceGroup } from './taskListDerivations';
import { getSourceSortableId, getTaskSortableId } from './taskListDnd';

export interface TaskListItemContentProps {
  tasks: Task[];
  currentDate: string;
  language: AppLanguage;
  allTags: string[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onPriorityChange: (id: string, priority: Task['priority']) => void;
  onViewReview: (task: Task) => void;
  onToggleSubtask: (id: string) => void;
  onDeleteSubtask: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onViewSubtaskReview: (task: Task) => void;
  onEditSubtask: (id: string, text: string) => void;
  onChangeSubtaskPriority: (id: string, priority: Task['priority']) => void;
  editRequest?: { id: string; nonce: number } | null;
  isCleanupMode?: boolean;
  selectedCleanupTaskIds?: string[];
  onToggleCleanupSelection?: (id: string) => void;
  cleanupSelectionLabel?: string;
}

export interface TaskListContentProps extends TaskListItemContentProps {
  sourceGroups: TaskSourceGroup[];
  shouldGroupBySource: boolean;
  dragDisabled: boolean;
  isDragActive: boolean;
}

export const TaskListContent = memo(function TaskListContent({
  tasks,
  currentDate,
  language,
  sourceGroups,
  shouldGroupBySource,
  dragDisabled,
  isDragActive,
  allTags,
  onToggle,
  onDelete,
  onEdit,
  onPriorityChange,
  onViewReview,
  onToggleSubtask,
  onDeleteSubtask,
  onToggleCollapse,
  onViewSubtaskReview,
  onEditSubtask,
  onChangeSubtaskPriority,
  editRequest,
  isCleanupMode,
  selectedCleanupTaskIds,
  onToggleCleanupSelection,
  cleanupSelectionLabel,
}: TaskListContentProps) {
  const renderTask = (task: Task, index: number) => (
    <SortableTaskItem
      key={task.id}
      task={task}
      currentDate={currentDate}
      language={language}
      index={index}
      dragDisabled={dragDisabled}
      isDragActive={isDragActive}
      onToggle={onToggle}
      onDelete={onDelete}
      onEdit={onEdit}
      onPriorityChange={onPriorityChange}
      onViewReview={onViewReview}
      onToggleSubtask={onToggleSubtask}
      onDeleteSubtask={onDeleteSubtask}
      onToggleCollapse={onToggleCollapse}
      onViewSubtaskReview={onViewSubtaskReview}
      onEditSubtask={onEditSubtask}
      onChangeSubtaskPriority={onChangeSubtaskPriority}
      allTags={allTags}
      editTrigger={editRequest && editRequest.id === task.id ? editRequest.nonce : undefined}
      isCleanupMode={isCleanupMode}
      isCleanupSelected={selectedCleanupTaskIds?.includes(task.id)}
      onToggleCleanupSelection={onToggleCleanupSelection}
      cleanupSelectionLabel={cleanupSelectionLabel}
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
    const openTasks: Task[] = [];
    const doneTasks: Task[] = [];
    for (const task of groupTasks) {
      (task.completed ? doneTasks : openTasks).push(task);
    }

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

  const sourceGroupContent = shouldGroupBySource ? (() => {
    let nextStartIndex = 0;
    return sourceGroups.map((group) => {
      const startIndex = nextStartIndex;
      nextStartIndex += group.tasks.length;
      return renderSourceGroup(group.source, group.tasks, startIndex);
    });
  })() : null;

  return (
    <AnimatePresence>
      {tasks.length === 0 ? (
        <TaskListEmptyState />
      ) : shouldGroupBySource ? (
        <SortableContext items={sourceGroups.map((group) => getSourceSortableId(group.source))} strategy={verticalListSortingStrategy}>
          {sourceGroupContent}
        </SortableContext>
      ) : (
        renderTaskBucket(tasks, 0)
      )}
    </AnimatePresence>
  );
});
