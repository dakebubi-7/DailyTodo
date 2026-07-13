import { motion } from 'framer-motion';
import { ReviewIcon, TrashIcon } from './taskItemIcons';
import {
  TASK_DELETE_ACTION_LABEL,
  getTaskCompleteActionClassName,
} from './taskItemPresentation';

export function ReviewActionButton({
  hasReview,
  label,
  onClick,
}: {
  hasReview: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`task-icon-action task-review-action task-review-action-visible ${!hasReview ? 'task-review-action-empty' : ''}`}
      aria-label={label}
      title={label}
    >
      <ReviewIcon hasReview={hasReview} />
    </motion.button>
  );
}

export function TaskActionLayer({
  canOpenReviewAction,
  hasReview,
  reviewActionLabel,
  onViewReview,
  onDelete,
}: {
  canOpenReviewAction: boolean;
  hasReview: boolean;
  reviewActionLabel: string;
  onViewReview: () => void;
  onDelete: () => void;
}) {
  return (
    <span
      className="task-action-layer"
      aria-hidden={false}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span className="task-action-slot task-action-slot-review task-review-zone">
        {canOpenReviewAction && (
          <ReviewActionButton
            hasReview={hasReview}
            label={reviewActionLabel}
            onClick={onViewReview}
          />
        )}
      </span>

      <span className="task-action-slot task-action-slot-delete task-delete-zone">
        <DeleteActionButton onClick={onDelete} />
      </span>
    </span>
  );
}

export function CompleteActionButton({
  completed,
  label,
  onClick,
}: {
  completed: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className={getTaskCompleteActionClassName(completed)}
      aria-label={label}
      title={label}
    >
      {completed && (
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export function DeleteActionButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="task-icon-action task-delete-action"
      aria-label={TASK_DELETE_ACTION_LABEL}
      title={TASK_DELETE_ACTION_LABEL}
    >
      <TrashIcon />
    </motion.button>
  );
}
