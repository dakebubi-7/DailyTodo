import type { Task, TaskSource } from '../../types/task';
import { TaskMenuPopupPaneHeader } from './TaskMenuPopupPaneHeader';
import type { CloseTaskMenu, DispatchTaskMenuUpdate } from './TaskMenuPopupPanes';

type Props = {
  task: Task;
  onBack: () => void;
  onDispatch: DispatchTaskMenuUpdate;
  onClose: CloseTaskMenu;
};

function CheckIcon() {
  return (
    <svg className="tm-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function TaskMenuPopupSourcePane({ task, onBack, onDispatch, onClose }: Props) {
  const currentSource = task.source || 'personal';
  const selectSource = (source: TaskSource) => {
    if (source === currentSource) return;
    onDispatch(task.id, { source });
    onClose();
  };

  return (
    <>
      <TaskMenuPopupPaneHeader title="任务类型" onBack={onBack} />
      <div className="tm-list">
        <button
          type="button"
          className={`tm-item ${currentSource === 'personal' ? 'tm-item-active' : ''}`}
          disabled={currentSource === 'personal'}
          onClick={() => selectSource('personal')}
        >
          <span className="tm-item-label">个人任务</span>
          {currentSource === 'personal' && <CheckIcon />}
        </button>
        <button
          type="button"
          className={`tm-item ${currentSource === 'external' ? 'tm-item-active' : ''}`}
          disabled={currentSource === 'external'}
          onClick={() => selectSource('external')}
        >
          <span className="tm-item-label">外部任务</span>
          {currentSource === 'external' && <CheckIcon />}
        </button>
      </div>
    </>
  );
}
