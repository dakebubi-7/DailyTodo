import { motion } from 'framer-motion';
import { Task } from '../types/task';

interface TaskReviewDialogProps {
  task: Task | null;
  onClose: () => void;
  onAddRecord: (task: Task) => void;
  onDeleteRecord: (taskId: string, reviewId: string) => void;
}

const statusLabel = {
  done: '全部完成',
  partial: '部分完成',
  blocked: '有卡点',
};

export function TaskReviewDialog({ task, onClose, onAddRecord, onDeleteRecord }: TaskReviewDialogProps) {
  const reviews = task?.completionReviews?.length
    ? task.completionReviews
    : task?.completionReview
      ? [task.completionReview]
      : [];

  if (!task || reviews.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/25 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        className="completion-dialog w-full max-w-[25rem] rounded-[24px] border border-white/60 bg-white/86 p-4 shadow-[0_24px_80px_rgba(31,41,55,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/86"
      >
        <div className="mb-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
            完成记录查看
          </p>
          <h2 className="mt-1 break-words text-[1rem] font-bold text-forest dark:text-white">
            {task.text}
          </h2>
          <p className="mt-1 text-[0.76rem] text-zinc-500 dark:text-zinc-400">
            这里按时间保留这个任务的所有阶段记录。删除记录会同步更新本地数据和下一次 Obsidian 同步结果。
          </p>
        </div>

        <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1 text-[0.82rem] text-zinc-700 dark:text-zinc-200">
          {reviews.map((review, index) => (
            <div key={review.id || review.reviewedAt || index} className="grid gap-2 rounded-xl border border-white/50 bg-white/45 p-2 dark:border-white/10 dark:bg-white/10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.72rem] font-semibold text-zinc-400 dark:text-zinc-500">
                  阶段记录 {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteRecord(task.id, review.id || review.reviewedAt)}
                  className="rounded-lg border border-red-200/70 bg-red-50/80 px-2 py-1 text-[0.7rem] font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"
                >
                  删除记录
                </button>
              </div>
              <InfoRow label="记录时间" value={new Date(review.reviewedAt).toLocaleString('zh-CN')} />
              <InfoRow label="完成情况" value={statusLabel[review.status]} />
              <InfoRow label="完成度" value={`${review.percent}%`} />
              <InfoRow label="今天情况" value={review.summary || '-'} multiline />
              <InfoRow label="还没懂 / 卡点" value={review.unknowns || '-'} multiline />
              <InfoRow label="下一步" value={review.nextStep || '-'} multiline />
            </div>
          ))}
          {task.completedAt && (
            <InfoRow label="任务完成时间" value={new Date(task.completedAt).toLocaleString('zh-CN')} />
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => {
              onClose();
              onAddRecord(task);
            }}
            className="rounded-xl border border-white/60 bg-white/55 px-3 py-2 text-[0.78rem] font-semibold text-zinc-500 transition-colors hover:text-forest dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            追加记录
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-forest px-3 py-2 text-[0.78rem] font-semibold text-white shadow-card transition-colors hover:bg-forest/90 dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-none dark:hover:bg-white"
          >
            关闭
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="grid gap-1 rounded-xl border border-white/50 bg-white/55 px-3 py-2 dark:border-white/10 dark:bg-white/10">
      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
        {label}
      </div>
      <div className={`whitespace-pre-wrap ${multiline ? 'leading-6' : ''}`}>{value}</div>
    </div>
  );
}
