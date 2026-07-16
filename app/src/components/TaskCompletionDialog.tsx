import { motion } from 'framer-motion';
import { Task, TaskCompletionReview } from '../types/task';
import { isTaskCompletionReviewStatus } from '../../shared/completionReviews';
import { TaskCompletionMarkdownField } from './taskCompletionDialog/TaskCompletionMarkdownField';
import { useTaskCompletionDialogForm } from './taskCompletionDialog/useTaskCompletionDialogForm';
import { useDialogFocus } from './useDialogFocus';

interface TaskCompletionDialogProps {
  task: Task | null;
  onCancel: () => void;
  onSave: (taskId: string, review: Omit<TaskCompletionReview, 'reviewedAt' | 'id'>) => void;
  onCompleteWithoutReview: (taskId: string) => void;
}

const statusOptions: { value: TaskCompletionReview['status']; label: string }[] = [
  { value: 'done', label: '全部完成' },
  { value: 'partial', label: '部分完成' },
  { value: 'blocked', label: '先标记完成，但还有卡点' },
];

export function TaskCompletionDialog({
  task,
  onCancel,
  onSave,
  onCompleteWithoutReview,
}: TaskCompletionDialogProps) {
  const {
    nextStep,
    percent,
    save,
    selectStatus,
    setNextStep,
    setPercent,
    setSummary,
    setUnknowns,
    status,
    summary,
    unknowns,
  } = useTaskCompletionDialogForm({ task, onSave });
  const { dialogRef, handleKeyDown } = useDialogFocus(Boolean(task), onCancel);

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/25 p-4 backdrop-blur-sm">
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        className="completion-dialog w-full max-w-[25rem] rounded-[14px] border border-white/60 bg-white/86 p-4 shadow-[0_24px_80px_rgba(31,41,55,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/86"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-completion-dialog-title"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="mb-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
            任务完成记录
          </p>
          <h2 id="task-completion-dialog-title" className="mt-1 break-words text-[1rem] font-bold text-forest dark:text-white">
            {task.text}
          </h2>
          <p className="mt-1 text-[0.76rem] text-zinc-500 dark:text-zinc-400">
            这段内容会追加到这个任务的阶段记录，并同步到 Obsidian。
          </p>
        </div>

        <div className="completion-progress-grid grid grid-cols-2 gap-2">
          <label className="completion-field">
            完成情况
            <div className="completion-input-shell">
              <select
                value={status}
                onChange={(event) => {
                  if (!isTaskCompletionReviewStatus(event.target.value)) return;
                  selectStatus(event.target.value);
                }}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="completion-field completion-percent-field">
            <span className="completion-percent-field-head">
              <span>完成度</span>
              <span>{percent}%</span>
            </span>
            <div className="completion-input-shell">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={percent}
                onChange={(event) => setPercent(Number(event.target.value))}
              />
            </div>
          </label>
        </div>

        <TaskCompletionMarkdownField
          label="今天这个任务的情况"
          value={summary}
          placeholder="比如：核心步骤已经跑通了，但还需要明天再整理一下文档。"
          onChange={setSummary}
          resetKey={task.id}
        />
        <TaskCompletionMarkdownField
          label="还有什么不懂 / 卡住"
          value={unknowns}
          placeholder="比如：API 权限、Electron 打包、某个概念还不清楚。"
          onChange={setUnknowns}
          resetKey={task.id}
        />
        <TaskCompletionMarkdownField
          label="下一步"
          value={nextStep}
          placeholder="比如：明天先复盘这个问题，再继续做下一步。"
          onChange={setNextStep}
          resetKey={task.id}
        />

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl px-3 py-2 text-[0.78rem] font-semibold text-zinc-500 transition-colors hover:bg-white/60 hover:text-zinc-700 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            取消
          </button>
          <button
            onClick={() => onCompleteWithoutReview(task.id)}
            className="rounded-xl border border-white/60 bg-white/55 px-3 py-2 text-[0.78rem] font-semibold text-zinc-500 transition-colors hover:text-forest dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            只标记完成
          </button>
          <button
            onClick={save}
            className="rounded-xl bg-forest px-3 py-2 text-[0.78rem] font-semibold text-white shadow-card transition-colors hover:bg-forest/90 dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-none dark:hover:bg-white"
          >
            保存并完成
          </button>
        </div>
      </motion.div>
    </div>
  );
}
