import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AppLanguage } from '../../shared/appSettings';
import { getShellText } from '../i18n';

interface TitleBarProps {
  compactMode: boolean;
  settingsOpen: boolean;
  lockWindowPosition: boolean;
  language: AppLanguage;
  onToggleCompactMode: () => void;
  onToggleSettings: () => void;
  onToggleLockWindowPosition: () => void;
}

export function TitleBar({
  compactMode,
  settingsOpen,
  lockWindowPosition,
  language,
  onToggleCompactMode,
  onToggleSettings,
  onToggleLockWindowPosition,
}: TitleBarProps) {
  const [pinned, setPinned] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const text = getShellText(language).titlebar;

  useEffect(() => {
    // 图钉只反映「置顶」态：onTop 时点亮；normal / desktop 时熄灭。
    // desktop 模式由托盘控制，这里通过 onWindowModeChanged 推送同步图钉状态。
    const refreshPinned = () => {
      window.electronAPI?.getWindowMode().then((mode) => setPinned(mode === 'onTop'));
    };

    refreshPinned();
    window.addEventListener('focus', refreshPinned);
    document.addEventListener('visibilitychange', refreshPinned);
    const unsubscribe = window.electronAPI?.onWindowModeChanged((mode) => setPinned(mode === 'onTop'));

    return () => {
      window.removeEventListener('focus', refreshPinned);
      document.removeEventListener('visibilitychange', refreshPinned);
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!moreOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.titlebar-more-wrap')) return;
      setMoreOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [moreOpen]);

  const handleTogglePin = async () => {
    // 图钉在 normal ↔ onTop 间切；若当前在 desktop 模式，主进程会按图钉语义退出到 onTop。
    const isOnTop = await window.electronAPI?.toggleAlwaysOnTop();
    if (typeof isOnTop === 'boolean') {
      setPinned(isOnTop);
      return;
    }

    const mode = await window.electronAPI?.getWindowMode();
    setPinned(mode === 'onTop');
  };

  const handleResetPosition = () => {
    window.electronAPI?.resetPosition();
    setMoreOpen(false);
  };

  return (
    <div className="titlebar" style={{ WebkitAppRegion: lockWindowPosition ? 'no-drag' : 'drag' }}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onToggleCompactMode}
        className={`titlebar-mode ${compactMode ? 'titlebar-mode-active' : ''}`}
        title={compactMode ? text.normalTitle : text.focusTitle}
        aria-label={compactMode ? text.normalTitle : text.focusTitle}
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {compactMode ? text.focus : text.normal}
      </motion.button>

      <div
        className="titlebar-drag-space"
        aria-hidden="true"
        style={{ WebkitAppRegion: lockWindowPosition ? 'no-drag' : 'drag' }}
      />

      <div className="titlebar-actions" style={{ WebkitAppRegion: 'no-drag' }}>
        <div className="titlebar-actions-primary">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleTogglePin}
            className={`titlebar-icon-button ${pinned ? 'titlebar-icon-active' : ''}`}
            title={pinned ? text.unpin : text.pin}
            aria-label={pinned ? text.unpin : text.pin}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M14 4l6 6-4 1-5 8-2-2 8-5 1-4-6-6z" />
              <path d="M4 20l5-5" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleLockWindowPosition}
            className={`titlebar-icon-button ${lockWindowPosition ? 'titlebar-icon-active' : ''}`}
            title={lockWindowPosition ? text.unlock : text.lock}
            aria-label={lockWindowPosition ? text.unlock : text.lock}
          >
            {lockWindowPosition ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M9 10V7a4 4 0 0 1 7.4-2.1" />
              </svg>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleSettings}
            className={`titlebar-icon-button ${settingsOpen ? 'titlebar-icon-active' : ''}`}
            title={text.settings}
            aria-label={text.settings}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
              <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 .57V20a2 2 0 1 1-4 0v-.08A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-.57-1H4a2 2 0 1 1 0-4h.08A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-.57V4a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 1 .57 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9c.25.36.44.72.57 1H20a2 2 0 1 1 0 4h-.08c-.13.38-.32.74-.52 1Z" />
            </svg>
          </motion.button>
        </div>

        <div className="titlebar-actions-window">
          <div className="titlebar-more-wrap">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMoreOpen((prev) => !prev)}
              className={`titlebar-icon-button ${moreOpen ? 'titlebar-icon-active' : ''}`}
              title={text.more}
              aria-label={text.more}
              aria-expanded={moreOpen}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="19" cy="12" r="1.8" />
              </svg>
            </motion.button>

            {moreOpen && (
              <div className="titlebar-menu">
                <button onClick={handleResetPosition}>{text.resetTopRight}</button>
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.electronAPI?.minimize()}
            className="titlebar-icon-button"
            aria-label={text.hide}
            title={text.hide}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect y="5" width="12" height="2" rx="1" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.electronAPI?.close()}
            className="titlebar-icon-button titlebar-close-button"
            aria-label={text.close}
            title={text.close}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
