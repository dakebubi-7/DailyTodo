import { memo } from 'react';
import { motion } from 'framer-motion';
import type { CompactDayStripText } from './compactDayStrip/compactDayStripUtils';
import type { DateNavigatorCalendarController } from './dateNavigator/useDateNavigatorCalendar';
import { useCompletionCelebration } from './header/useCompletionCelebration';

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
  calendar: DateNavigatorCalendarController;
  text: CompactDayStripText;
}

export const Header = memo(function Header({
  completedCount,
  totalCount,
  isDark,
  onToggleDark,
  obsidianPath,
  syncStatus,
  onChooseObsidian,
  onOpenTodayNote,
  calendar,
  text,
}: HeaderProps) {
  useCompletionCelebration({ completedCount, totalCount });

  const syncLabel = {
    idle: obsidianPath ? '更新库' : '选择库',
    synced: '更新库',
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
          <h1>Daily Todo</h1>
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
            type="button"
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
            type="button"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={calendar.toggleCalendar}
            className="header-icon-button"
            aria-label={calendar.isCalendarOpen ? text.closeCalendar : text.openCalendar}
            title={calendar.isCalendarOpen ? text.closeCalendar : text.openCalendar}
            aria-expanded={calendar.isCalendarOpen}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 2v4M17 2v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
            </svg>
          </motion.button>

          <motion.button
            type="button"
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
    </div>
  );
});
