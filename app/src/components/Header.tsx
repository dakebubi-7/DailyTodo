import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface HeaderProps {
  selectedDate: string;
  completedCount: number;
  totalCount: number;
  isDark: boolean;
  onToggleDark: () => void;
  obsidianPath: string;
  syncStatus: 'idle' | 'synced' | 'needs-path' | 'error';
  onChooseObsidian: () => void;
  onOpenTodayNote: () => void;
}

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(`${date}T00:00:00`));
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function Header({
  selectedDate,
  completedCount,
  totalCount,
  isDark,
  onToggleDark,
  obsidianPath,
  syncStatus,
  onChooseObsidian,
  onOpenTodayNote,
}: HeaderProps) {
  const prevCompletedRef = useRef(completedCount);
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const openCount = Math.max(0, totalCount - completedCount);
  const today = getLocalDateKey();
  const dateContextLabel = selectedDate === today ? '今天' : selectedDate > today ? '计划' : '历史';

  useEffect(() => {
    if (completedCount > 0 && completedCount === totalCount && prevCompletedRef.current < totalCount) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.62 },
        colors: ['#2D4A3E', '#C9A84C', '#5B9A8B'],
      });
    }
    prevCompletedRef.current = completedCount;
  }, [completedCount, totalCount]);

  const syncLabel = {
    idle: obsidianPath ? '更改库' : '选择库',
    synced: '更改库',
    'needs-path': '选择库',
    error: '重选库',
  }[syncStatus];

  return (
    <div className="app-header">
      <div className="header-main">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className="app-brand"
        >
          <div className="app-brand-eyebrow">Daily Todo</div>
          <h1>{dateContextLabel} · {formatDateLabel(selectedDate)}</h1>
          <p>{openCount} 项待推进 · {completedCount}/{totalCount} 完成</p>
        </motion.div>

        <div className="header-actions">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={onChooseObsidian}
            className={`header-folder-button ${
              syncStatus === 'error'
                ? 'header-sync-error'
                : syncStatus === 'needs-path'
                  ? 'header-sync-needed'
                  : 'header-sync-ready'
            }`}
            title={obsidianPath ? `当前库：${obsidianPath}` : '选择 Obsidian 仓库文件夹'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h7l2 3h7v13H4z" />
              <path d="M8 13h8M8 17h5" />
            </svg>
            <span>{syncLabel}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenTodayNote}
            className="header-icon-button"
            title="打开所选日期的 Obsidian 笔记"
            aria-label="打开所选日期的 Obsidian 笔记"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 3h7v7" />
              <path d="M10 14L21 3" />
              <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleDark}
            className="header-icon-button"
            aria-label="切换主题"
            title="切换主题"
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </motion.button>
        </div>
      </div>

      <div className="header-progress-row">
        <div className="header-progress-track">
          <motion.div
            className="progress-fill h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}
