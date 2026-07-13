import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AppLanguage } from '../../shared/appSettings';
import { getShellText } from '../i18n';
import { TitleBarPrimaryActions } from './titleBar/TitleBarPrimaryActions';
import { useTitleBarMoreMenu } from './useTitleBarMoreMenu';
import { useTitleBarWindowMode } from './useTitleBarWindowMode';

interface TitleBarProps {
  compactMode: boolean;
  settingsOpen: boolean;
  lockWindowPosition: boolean;
  language: AppLanguage;
  onToggleCompactMode: () => void;
  onToggleSettings: () => void;
  onToggleLockWindowPosition: () => void;
}

export const TitleBar = memo(function TitleBar({
  compactMode,
  settingsOpen,
  lockWindowPosition,
  language,
  onToggleCompactMode,
  onToggleSettings,
  onToggleLockWindowPosition,
}: TitleBarProps) {
  const { pinned, toggleAlwaysOnTop } = useTitleBarWindowMode();
  const { moreOpen, toggleMoreMenu, resetPosition } = useTitleBarMoreMenu();
  const [visualLockActive, setVisualLockActive] = useState(lockWindowPosition);
  const [visualSettingsActive, setVisualSettingsActive] = useState(settingsOpen);
  const text = getShellText(language).titlebar;
  useEffect(() => {
    setVisualLockActive(lockWindowPosition);
  }, [lockWindowPosition]);

  useEffect(() => {
    setVisualSettingsActive(settingsOpen);
  }, [settingsOpen]);

  const togglePrimarySelected = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    button.dataset.selected = button.dataset.selected === 'true' ? 'false' : 'true';
  };

  const handleTogglePin = async (event: React.MouseEvent<HTMLButtonElement>) => {
    togglePrimarySelected(event);
    // 图钉在 normal ↔ onTop 间切；若当前在 desktop 模式，主进程会按图钉语义退出到 onTop。
    await toggleAlwaysOnTop();
  };

  const handleToggleLock = (event: React.MouseEvent<HTMLButtonElement>) => {
    togglePrimarySelected(event);
    setVisualLockActive((prev) => !prev);
    onToggleLockWindowPosition();
  };

  const handleToggleSettings = (event: React.MouseEvent<HTMLButtonElement>) => {
    togglePrimarySelected(event);
    setVisualSettingsActive((prev) => !prev);
    onToggleSettings();
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
        <TitleBarPrimaryActions
          pinned={pinned}
          lockWindowPosition={lockWindowPosition}
          visualLockActive={visualLockActive}
          visualSettingsActive={visualSettingsActive}
          language={language}
          onTogglePin={handleTogglePin}
          onToggleLock={handleToggleLock}
          onToggleSettings={handleToggleSettings}
        />

        <div className="titlebar-actions-window">
          <div className="titlebar-more-wrap">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMoreMenu}
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
                <button onClick={resetPosition}>{text.resetTopRight}</button>
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
});
