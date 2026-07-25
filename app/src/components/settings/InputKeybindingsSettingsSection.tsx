import { useState } from 'react';
import {
  INPUT_KEYBINDING_COMMAND_IDS,
  findInputKeybindingConflict,
  getInputKeybindingForCommand,
  isInputKeybindingCommandCustomizable,
  normalizeInputKeybinding,
  validateInputKeybinding,
  type InputKeybinding,
  type InputKeybindingCommand,
  type InputKeybindingSettings,
} from '../../../shared/inputKeybindings';
import type { getShellText } from '../../i18n';

type SettingsText = ReturnType<typeof getShellText>['settings'];

const editableCommands = INPUT_KEYBINDING_COMMAND_IDS.filter(isInputKeybindingCommandCustomizable);

interface PendingConflict {
  command: InputKeybindingCommand;
  binding: InputKeybinding;
  conflictingCommand: InputKeybindingCommand;
}

function getModifierLabel(): string {
  return navigator.platform.toLowerCase().includes('mac') ? 'Cmd' : 'Ctrl';
}

function formatInputKeybinding(binding: InputKeybinding): string {
  const keys = [
    ...(binding.modKey ? [getModifierLabel()] : []),
    ...(binding.altKey ? ['Alt'] : []),
    ...(binding.shiftKey ? ['Shift'] : []),
    binding.key === 'enter' ? 'Enter' : binding.key === 'tab' ? 'Tab' : binding.key.toUpperCase(),
  ];
  return keys.join('+');
}

function formatCommandBinding(command: InputKeybindingCommand, settings: InputKeybindingSettings): string {
  const bindings = getInputKeybindingForCommand(command, settings);
  return bindings.length ? bindings.map(formatInputKeybinding).join(' / ') : '-';
}

function eventToInputKeybinding(event: React.KeyboardEvent<HTMLButtonElement>): InputKeybinding {
  return {
    key: event.key,
    ...(event.ctrlKey || event.metaKey ? { modKey: true } : {}),
    ...(event.shiftKey ? { shiftKey: true } : {}),
    ...(event.altKey ? { altKey: true } : {}),
  };
}

export function InputKeybindingsSettingsSection({
  text,
  settings,
  onChange,
}: {
  text: SettingsText;
  settings: InputKeybindingSettings;
  onChange: (settings: InputKeybindingSettings) => void;
}) {
  const [recordingCommand, setRecordingCommand] = useState<InputKeybindingCommand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingConflict, setPendingConflict] = useState<PendingConflict | null>(null);

  const updateSettings = (overrides: InputKeybindingSettings['overrides']) => {
    onChange({ ...settings, overrides });
  };

  const startRecording = (command: InputKeybindingCommand) => {
    setRecordingCommand(command);
    setError(null);
    setPendingConflict(null);
  };

  const handleRecorderKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, command: InputKeybindingCommand) => {
    if (recordingCommand !== command) return;
    event.preventDefault();

    if (event.key === 'Escape') {
      setRecordingCommand(null);
      setError(null);
      return;
    }

    const binding = normalizeInputKeybinding(eventToInputKeybinding(event));
    const validation = validateInputKeybinding(binding);
    if (!validation.valid) {
      setError(text.inputShortcutsInvalid[validation.reason || 'unreliable-shortcut']);
      return;
    }

    const conflict = findInputKeybindingConflict(command, binding, settings);
    if (conflict) {
      setPendingConflict({ command, binding, conflictingCommand: conflict });
      setRecordingCommand(null);
      return;
    }

    updateSettings({ ...settings.overrides, [command]: binding });
    setRecordingCommand(null);
  };

  const clearOverride = (command: InputKeybindingCommand) => {
    const { [command]: _removed, ...overrides } = settings.overrides;
    updateSettings(overrides);
    setError(null);
  };

  const replaceConflict = () => {
    if (!pendingConflict) return;
    const previousBinding = getInputKeybindingForCommand(pendingConflict.command, settings)[0];
    const overrides = {
      ...settings.overrides,
      [pendingConflict.command]: pendingConflict.binding,
    };
    if (previousBinding) {
      overrides[pendingConflict.conflictingCommand] = previousBinding;
    } else {
      delete overrides[pendingConflict.conflictingCommand];
    }
    updateSettings(overrides);
    setPendingConflict(null);
  };

  const updatePreset = (preset: InputKeybindingSettings['preset']) => {
    onChange({ preset, overrides: {} });
    setRecordingCommand(null);
    setError(null);
    setPendingConflict(null);
  };

  return (
    <section className="settings-section input-keybindings-settings">
      <h3>{text.inputShortcuts}</h3>
      <label className="settings-field">
        <span>
          <strong>{text.inputShortcutsPreset}</strong>
          <small>{text.inputShortcutsHint}</small>
        </span>
        <select
          value={settings.preset}
          onChange={(event) => updatePreset(event.target.value === 'obsidian' ? 'obsidian' : 'standard')}
        >
          <option value="standard">{text.inputShortcutsPresetStandard}</option>
          <option value="obsidian">{text.inputShortcutsPresetObsidian}</option>
        </select>
      </label>

      <div className="input-keybinding-list">
        {editableCommands.map((command) => {
          const label = text.inputShortcutCommands[command];
          const isRecording = recordingCommand === command;
          const hasOverride = Boolean(settings.overrides[command]);
          return (
            <div className="input-keybinding-row" key={command}>
              <span className="input-keybinding-command">{label}</span>
              <div className="input-keybinding-actions">
                <button
                  type="button"
                  className={isRecording ? 'input-keybinding-recorder is-recording' : 'input-keybinding-recorder'}
                  aria-label={`Record ${label} shortcut`}
                  aria-pressed={isRecording}
                  onClick={() => startRecording(command)}
                  onKeyDown={(event) => handleRecorderKeyDown(event, command)}
                >
                  {isRecording ? text.inputShortcutsRecording : formatCommandBinding(command, settings)}
                </button>
                {hasOverride && (
                  <button
                    type="button"
                    className="input-keybinding-clear"
                    aria-label={`Clear ${label} shortcut override`}
                    onClick={() => clearOverride(command)}
                  >
                    {text.inputShortcutsClear}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="input-keybinding-message" role="alert">{error}</p>}
      {pendingConflict && (
        <div className="input-keybinding-message" role="alert">
          <span>{text.inputShortcutsConflict.replace('{command}', text.inputShortcutCommands[pendingConflict.conflictingCommand])}</span>
          <div className="input-keybinding-conflict-actions">
            <button type="button" onClick={replaceConflict}>{text.inputShortcutsReplace}</button>
            <button type="button" onClick={() => setPendingConflict(null)}>{text.inputShortcutsCancel}</button>
          </div>
        </div>
      )}

      <div className="settings-action-row input-keybinding-restore-actions">
        <button type="button" className="settings-reset-button" onClick={() => updatePreset('standard')}>
          {text.inputShortcutsRestoreDefaults}
        </button>
        <button type="button" className="settings-reset-button" onClick={() => updatePreset('obsidian')}>
          {text.inputShortcutsRestoreObsidian}
        </button>
      </div>
    </section>
  );
}
