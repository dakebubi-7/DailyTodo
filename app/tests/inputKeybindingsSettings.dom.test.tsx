// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { enSettingsText } from '../src/i18n/shellTextEnSettings';
import { InputKeybindingsSettingsSection } from '../src/components/settings/InputKeybindingsSettingsSection';
import type { InputKeybindingSettings } from '../shared/inputKeybindings';

const standardSettings: InputKeybindingSettings = {
  preset: 'standard',
  overrides: {},
};

afterEach(cleanup);

describe('input keybinding settings', () => {
  it('records a valid command override from the focused recorder', () => {
    const onChange = vi.fn();
    render(
      <InputKeybindingsSettingsSection
        text={enSettingsText}
        settings={standardSettings}
        onChange={onChange}
      />,
    );

    const recorder = screen.getByRole('button', { name: 'Record Bold shortcut' });
    fireEvent.click(recorder);
    fireEvent.keyDown(recorder, { key: 'k', ctrlKey: true });

    expect(onChange).toHaveBeenCalledWith({
      preset: 'standard',
      overrides: {
        bold: { key: 'k', modKey: true },
      },
    });
  });

  it('shows collision feedback and can replace the conflicting command binding', () => {
    const onChange = vi.fn();
    render(
      <InputKeybindingsSettingsSection
        text={enSettingsText}
        settings={standardSettings}
        onChange={onChange}
      />,
    );

    const recorder = screen.getByRole('button', { name: 'Record Bold shortcut' });
    fireEvent.click(recorder);
    fireEvent.keyDown(recorder, { key: 'Enter', ctrlKey: true });

    expect(screen.getByRole('alert').textContent).toContain('Conflicts with Submit');
    fireEvent.click(screen.getByRole('button', { name: 'Replace shortcut' }));

    expect(onChange).toHaveBeenLastCalledWith({
      preset: 'standard',
      overrides: {
        bold: { key: 'enter', modKey: true },
        submit: { key: 'b', modKey: true },
      },
    });
  });

  it('rejects native keys and clears a command override back to its preset', () => {
    const onChange = vi.fn();
    const settings: InputKeybindingSettings = {
      preset: 'standard',
      overrides: { bold: { key: 'k', modKey: true } },
    };
    render(
      <InputKeybindingsSettingsSection
        text={enSettingsText}
        settings={settings}
        onChange={onChange}
      />,
    );

    const recorder = screen.getByRole('button', { name: 'Record Bold shortcut' });
    fireEvent.click(recorder);
    fireEvent.keyDown(recorder, { key: 'Tab' });
    expect(screen.getByRole('alert').textContent).toContain('Tab keeps its native input behavior.');

    fireEvent.click(screen.getByRole('button', { name: 'Clear Bold shortcut override' }));
    expect(onChange).toHaveBeenLastCalledWith({ preset: 'standard', overrides: {} });
  });
});
