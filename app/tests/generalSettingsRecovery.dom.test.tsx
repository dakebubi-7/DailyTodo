// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultAppSettings } from '../shared/appSettings';
import { getShellText } from '../src/i18n';
import { GeneralSettingsSection } from '../src/components/settings/GeneralSettingsSection';

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'electronAPI');
});

describe('GeneralSettingsSection recovery actions', () => {
  it('exposes close-to-exit as an advanced opt-in while keeping the default close-to-tray behavior', () => {
    const onAppSettingsChange = vi.fn();
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        getAutoStart: vi.fn().mockResolvedValue(false),
        setAutoStart: vi.fn().mockResolvedValue(false),
      },
    });

    render(
      <GeneralSettingsSection
        text={getShellText('en-US').settings}
        settings={{}}
        appSettings={{ ...createDefaultAppSettings(), language: 'en-US' }}
        onChange={vi.fn()}
        onAppSettingsChange={onAppSettingsChange}
      />,
    );

    const closeToExit = screen.getByRole('button', { name: /close exits dailytodo/i });
    expect(closeToExit.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(closeToExit);
    expect(onAppSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ closeToExit: true }));
  });

  it('previews a selected backup and requires an explicit confirmation before restore', async () => {
    const chooseRestoreBackup = vi.fn().mockResolvedValue({
      ok: true,
      token: 'restore-token',
      preview: {
        version: 2,
        createdAt: '2026-07-26T09:00:00.000Z',
        kind: 'export',
        taskCount: 4,
        hasUiPreferences: true,
        hasDailyReviewBatches: false,
      },
    });
    const restoreBackup = vi.fn().mockResolvedValue({ ok: true });
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        getAutoStart: vi.fn().mockResolvedValue(false),
        setAutoStart: vi.fn().mockResolvedValue(false),
        chooseRestoreBackup,
        restoreBackup,
        exportBackup: vi.fn().mockResolvedValue({ ok: true }),
        openBackupFolder: vi.fn().mockResolvedValue({ ok: true }),
        openDiagnosticsFolder: vi.fn().mockResolvedValue({ ok: true }),
        exportSupportBundle: vi.fn().mockResolvedValue({ ok: true }),
      },
    });

    render(
      <GeneralSettingsSection
        text={getShellText('en-US').settings}
        settings={{}}
        appSettings={{ ...createDefaultAppSettings(), language: 'en-US' }}
        onChange={vi.fn()}
        onAppSettingsChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /restore backup/i }));
    await waitFor(() => expect(chooseRestoreBackup).toHaveBeenCalledOnce());

    expect(screen.getByText(/4 tasks/i)).toBeTruthy();
    expect(restoreBackup).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /restore and restart/i }));
    await waitFor(() => expect(restoreBackup).toHaveBeenCalledWith({
      token: 'restore-token',
      confirmed: true,
    }));
  });
});
