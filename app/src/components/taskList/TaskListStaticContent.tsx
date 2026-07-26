import { AnimatePresence } from 'framer-motion';
import { memo } from 'react';
import type { Task, TaskSource } from '../../types/task';
import { TaskItem } from '../TaskItem';
import { TaskListEmptyState } from './TaskListEmptyState';
import type { TaskListItemContentProps } from './TaskListContent';
import type { TaskSourceGroup } from './taskListDerivations';

interface TaskListStaticContentProps extends TaskListItemContentProps {
  sourceGroups: TaskSourceGroup[];
  shouldGroupBySource: boolean;
}

const STATIC_TASK_CONTENT_VISIBILITY = {
  contentVisibility: 'auto',
  containIntrinsicSize: 'auto 4rem',
} as const;

function getSourceLabel(source: TaskSource) {
  return source === 'personal' ? '\u4e2a\u4eba\u4efb\u52a1' : '\u5916\u90e8\u4efb\u52a1';
}

interface StaticTaskItemProps extends Omit<TaskListItemContentProps, 'tasks' | 'editRequest'> {
  task: Task;
  editTrigger?: number;
}

const StaticTaskItem = memo(function StaticTaskItem({
  task,
  language,
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
  editTrigger,
}: StaticTaskItemProps) {
  return (
    <div style={STATIC_TASK_CONTENT_VISIBILITY}>
      <TaskItem
        task={task}
        language={language}
        onToggle={() => onToggle(task.id)}
        onDelete={() => onDelete(task.id)}
        onEdit={(text) => onEdit(task.id, text)}
        onPriorityChange={(priority) => onPriorityChange(task.id, priority)}
        onViewReview={() => onViewReview(task)}
        onToggleSubtask={onToggleSubtask}
        onDeleteSubtask={onDeleteSubtask}
        onToggleCollapse={onToggleCollapse}
        onViewSubtaskReview={onViewSubtaskReview}
        onEditSubtask={onEditSubtask}
        onChangeSubtaskPriority={onChangeSubtaskPriority}
        allTags={allTags}
        editTrigger={editTrigger}
      />
    </div>
  );
});

export const TaskListStaticContent = memo(function TaskListStaticContent({
  tasks,
  language,
  sourceGroups,
  shouldGroupBySource,
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
}: TaskListStaticContentProps) {
  const renderTask = (task: Task) => (
    <StaticTaskItem
      key={task.id}
      task={task}
      language={language}
      allTags={allTags}
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
      editTrigger={editRequest && editRequest.id === task.id ? editRequest.nonce : undefined}
    />
  );

  return (
    <AnimatePresence>
      {tasks.length === 0 ? (
        <TaskListEmptyState />
      ) : shouldGroupBySource ? (
        sourceGroups.map((group) => (
          <section key={group.source} className="task-source-group task-source-group-shell" aria-label={getSourceLabel(group.source)}>
            <div className={`task-source-group-title ${group.source === 'external' ? 'task-source-group-title-external' : ''}`}>
              <span>{getSourceLabel(group.source)}</span>
            </div>
            {group.tasks.map(renderTask)}
          </section>
        ))
      ) : (
        tasks.map(renderTask)
      )}
    </AnimatePresence>
  );
});
