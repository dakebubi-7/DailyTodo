import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { SettingsNavSection, SettingsSection } from './settingsPanelNavigation';

interface SettingsPanelShellProps {
  sidebarTitle: string;
  sidebarHint: string;
  navigationLabel: string;
  closeLabel: string;
  navSections: SettingsNavSection[];
  section: SettingsSection;
  pageTitle: string;
  pageDescription: string;
  onSectionChange: (section: SettingsSection) => void;
  onClose: () => void;
  children: ReactNode;
}

export function SettingsPanelShell({
  sidebarTitle,
  sidebarHint,
  navigationLabel,
  closeLabel,
  navSections,
  section,
  pageTitle,
  pageDescription,
  onSectionChange,
  onClose,
  children,
}: SettingsPanelShellProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="settings-panel"
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <div className="settings-v2-layout">
        <nav className="settings-v2-sidebar" aria-label={navigationLabel}>
          <div className="settings-v2-sidebar-title">
            <h2>{sidebarTitle}</h2>
            <p>{sidebarHint}</p>
          </div>
          <div className="settings-nav-list">
            {navSections.map((group) => (
              <div key={group.title}>
                <p className="settings-nav-section-title">{group.title}</p>
                <div className="settings-nav-list">
                  {group.entries.map((entry) => (
                    <button
                      key={entry.key}
                      type="button"
                      className={`settings-nav-item ${entry.primary ? 'settings-nav-primary' : ''} ${section === entry.key ? 'settings-nav-active' : ''}`}
                      onClick={() => onSectionChange(entry.key)}
                      aria-current={section === entry.key ? 'page' : undefined}
                    >
                      <span>
                        <strong>{entry.title}</strong>
                        <small>{entry.description}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="settings-v2-content">
          <button onClick={onClose} className="settings-floating-close settings-icon-button" aria-label={closeLabel} title={closeLabel}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="settings-v2-page">
            <div className="settings-page-title">
              <h2>{pageTitle}</h2>
              <p>{pageDescription}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
