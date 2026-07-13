import { motion } from 'framer-motion';
import type { CSSProperties, MouseEvent } from 'react';
import { AppLanguage } from '../../../shared/appSettings';
import { getShellText } from '../../i18n';

interface TitleBarPrimaryActionsProps {
  pinned: boolean;
  lockWindowPosition: boolean;
  visualLockActive: boolean;
  visualSettingsActive: boolean;
  language: AppLanguage;
  onTogglePin: (event: MouseEvent<HTMLButtonElement>) => void;
  onToggleLock: (event: MouseEvent<HTMLButtonElement>) => void;
  onToggleSettings: (event: MouseEvent<HTMLButtonElement>) => void;
}

const titlebarPrimaryActiveStyle = {
  borderColor: '#ffffff',
  backgroundColor: '#ffffff',
  color: '#000000',
  boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.35), 0 6px 14px rgba(0, 0, 0, 0.22)',
} satisfies CSSProperties;

export function TitleBarPrimaryActions({
  pinned,
  lockWindowPosition,
  visualLockActive,
  visualSettingsActive,
  language,
  onTogglePin,
  onToggleLock,
  onToggleSettings,
}: TitleBarPrimaryActionsProps) {
  const text = getShellText(language).titlebar;

  return (
    <div className="titlebar-actions-primary">
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={onTogglePin}
        className={`titlebar-icon-button ${pinned ? 'titlebar-icon-active' : ''}`}
        data-titlebar-primary="true"
        data-selected={pinned ? 'true' : 'false'}
        title={pinned ? text.unpin : text.pin}
        aria-label={pinned ? text.unpin : text.pin}
        style={pinned ? titlebarPrimaryActiveStyle : undefined}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M14 4l6 6-4 1-5 8-2-2 8-5 1-4-6-6z" />
          <path d="M4 20l5-5" />
        </svg>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleLock}
        className={`titlebar-icon-button ${visualLockActive ? 'titlebar-icon-active' : ''}`}
        data-titlebar-primary="true"
        data-selected={visualLockActive ? 'true' : 'false'}
        title={lockWindowPosition ? text.unlock : text.lock}
        aria-label={lockWindowPosition ? text.unlock : text.lock}
        style={visualLockActive ? titlebarPrimaryActiveStyle : undefined}
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
        className={`titlebar-icon-button ${visualSettingsActive ? 'titlebar-icon-active' : ''}`}
        data-titlebar-primary="true"
        data-selected={visualSettingsActive ? 'true' : 'false'}
        title={text.settings}
        aria-label={text.settings}
        style={visualSettingsActive ? titlebarPrimaryActiveStyle : undefined}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
          <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 .57V20a2 2 0 1 1-4 0v-.08A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-.57-1H4a2 2 0 1 1 0-4h.08A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-.57V4a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 1 .57 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9c.25.36.44.72.57 1H20a2 2 0 1 1 0 4h-.08c-.13.38-.32.74-.52 1Z" />
        </svg>
      </motion.button>
    </div>
  );
}
