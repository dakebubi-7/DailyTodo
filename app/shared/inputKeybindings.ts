export type InputKeybindingCommand =
  | 'submit'
  | 'indent'
  | 'outdent'
  | 'continue-list'
  | 'bold'
  | 'italic'
  | 'undo'
  | 'redo';

export type InputKeybindingScope = 'single-line-task' | 'completion-note' | 'daily-markdown';
export type InputKeybindingPreset = 'standard' | 'obsidian';

export interface InputKeybinding {
  key: string;
  modKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

export type InputKeybindingOverrides = Partial<Record<InputKeybindingCommand, InputKeybinding>>;

export interface InputKeybindingSettings {
  preset: InputKeybindingPreset;
  overrides: InputKeybindingOverrides;
}

export interface InputKeybindingEventLike {
  key: string;
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  isComposing?: boolean;
}

export interface InputKeybindingValidation {
  valid: boolean;
  reason?: 'modifier-only' | 'native-input-key' | 'reserved-shortcut' | 'unreliable-shortcut';
}

interface InputKeybindingCommandDefinition {
  id: InputKeybindingCommand;
  scopes: InputKeybindingScope[];
  customizable: boolean;
}

const INPUT_KEYBINDING_COMMANDS: InputKeybindingCommandDefinition[] = [
  { id: 'submit', scopes: ['completion-note', 'daily-markdown'], customizable: true },
  { id: 'indent', scopes: ['completion-note', 'daily-markdown'], customizable: true },
  { id: 'outdent', scopes: ['completion-note', 'daily-markdown'], customizable: true },
  { id: 'continue-list', scopes: ['completion-note', 'daily-markdown'], customizable: false },
  { id: 'bold', scopes: ['completion-note', 'daily-markdown'], customizable: true },
  { id: 'italic', scopes: ['completion-note', 'daily-markdown'], customizable: true },
  { id: 'undo', scopes: ['completion-note', 'daily-markdown'], customizable: true },
  { id: 'redo', scopes: ['completion-note', 'daily-markdown'], customizable: true },
];

const standardBindings: Record<InputKeybindingCommand, InputKeybinding[]> = {
  submit: [{ key: 'enter', modKey: true }],
  indent: [{ key: ']', modKey: true }],
  outdent: [{ key: '[', modKey: true }],
  'continue-list': [],
  bold: [{ key: 'b', modKey: true }],
  italic: [{ key: 'i', modKey: true }],
  undo: [{ key: 'z', modKey: true }],
  redo: [
    { key: 'z', modKey: true, shiftKey: true },
    { key: 'y', modKey: true },
  ],
};

const obsidianBindings: Record<InputKeybindingCommand, InputKeybinding[]> = {
  ...standardBindings,
  indent: [{ key: 'tab' }],
  outdent: [{ key: 'tab', shiftKey: true }],
  'continue-list': [{ key: 'enter' }],
};

const modifierKeys = new Set(['alt', 'control', 'meta', 'shift', 'altgraph', 'os', 'super', 'win']);
const reservedModKeys = new Set(['l', 'n', 'p', 'q', 'r', 't', 'w']);

export const INPUT_KEYBINDING_COMMAND_IDS = INPUT_KEYBINDING_COMMANDS.map(({ id }) => id);

export function createDefaultInputKeybindingSettings(): InputKeybindingSettings {
  return { preset: 'standard', overrides: {} };
}

export function isInputKeybindingPreset(value: unknown): value is InputKeybindingPreset {
  return value === 'standard' || value === 'obsidian';
}

export function isInputKeybindingCommand(value: unknown): value is InputKeybindingCommand {
  return typeof value === 'string' && INPUT_KEYBINDING_COMMAND_IDS.includes(value as InputKeybindingCommand);
}

export function getInputKeybindingCommandDefinition(command: InputKeybindingCommand): InputKeybindingCommandDefinition {
  const definition = INPUT_KEYBINDING_COMMANDS.find((candidate) => candidate.id === command);
  if (!definition) throw new Error(`Unknown input keybinding command: ${command}`);
  return definition;
}

export function getInputKeybindingCommandScopes(command: InputKeybindingCommand): InputKeybindingScope[] {
  return getInputKeybindingCommandDefinition(command).scopes;
}

export function isInputKeybindingCommandCustomizable(command: InputKeybindingCommand): boolean {
  return getInputKeybindingCommandDefinition(command).customizable;
}

export function normalizeInputKeybinding(binding: InputKeybinding): InputKeybinding {
  return {
    key: binding.key.trim().toLowerCase(),
    ...(binding.modKey ? { modKey: true } : {}),
    ...(binding.shiftKey ? { shiftKey: true } : {}),
    ...(binding.altKey ? { altKey: true } : {}),
  };
}

function isInputKeybindingRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function readInputKeybinding(value: unknown): InputKeybinding | null {
  if (!isInputKeybindingRecord(value) || typeof value.key !== 'string') return null;
  if (
    (value.modKey !== undefined && typeof value.modKey !== 'boolean')
    || (value.shiftKey !== undefined && typeof value.shiftKey !== 'boolean')
    || (value.altKey !== undefined && typeof value.altKey !== 'boolean')
  ) {
    return null;
  }

  const binding = normalizeInputKeybinding({
    key: value.key,
    modKey: value.modKey === true,
    shiftKey: value.shiftKey === true,
    altKey: value.altKey === true,
  });
  return validateInputKeybinding(binding).valid ? binding : null;
}

export function normalizeInputKeybindingOverrides(value: unknown): InputKeybindingOverrides {
  if (!isInputKeybindingRecord(value)) return {};

  return Object.entries(value).reduce<InputKeybindingOverrides>((overrides, [command, binding]) => {
    if (!isInputKeybindingCommand(command) || !isInputKeybindingCommandCustomizable(command)) return overrides;
    const parsedBinding = readInputKeybinding(binding);
    if (!parsedBinding) return overrides;
    overrides[command] = parsedBinding;
    return overrides;
  }, {});
}

export function normalizeInputKeybindingSettings(value: unknown): InputKeybindingSettings {
  if (!isInputKeybindingRecord(value)) return createDefaultInputKeybindingSettings();

  return {
    preset: isInputKeybindingPreset(value.preset) ? value.preset : 'standard',
    overrides: normalizeInputKeybindingOverrides(value.overrides),
  };
}

export function getInputKeybindingForCommand(
  command: InputKeybindingCommand,
  settings: InputKeybindingSettings,
): InputKeybinding[] {
  const override = settings.overrides[command];
  if (override) return [override];
  const bindings = settings.preset === 'obsidian' ? obsidianBindings : standardBindings;
  return bindings[command];
}

export function doInputKeybindingScopesOverlap(
  left: InputKeybindingScope[],
  right: InputKeybindingScope[],
): boolean {
  return left.some((scope) => right.includes(scope));
}

export function inputKeybindingsMatch(left: InputKeybinding, right: InputKeybinding): boolean {
  const normalizedLeft = normalizeInputKeybinding(left);
  const normalizedRight = normalizeInputKeybinding(right);
  return normalizedLeft.key === normalizedRight.key
    && Boolean(normalizedLeft.modKey) === Boolean(normalizedRight.modKey)
    && Boolean(normalizedLeft.shiftKey) === Boolean(normalizedRight.shiftKey)
    && Boolean(normalizedLeft.altKey) === Boolean(normalizedRight.altKey);
}

export function findInputKeybindingConflict(
  command: InputKeybindingCommand,
  binding: InputKeybinding,
  settings: InputKeybindingSettings,
): InputKeybindingCommand | null {
  const commandScopes = getInputKeybindingCommandScopes(command);
  for (const candidate of INPUT_KEYBINDING_COMMANDS) {
    if (candidate.id === command) continue;
    if (!doInputKeybindingScopesOverlap(commandScopes, candidate.scopes)) continue;
    if (getInputKeybindingForCommand(candidate.id, settings).some((candidateBinding) => inputKeybindingsMatch(binding, candidateBinding))) {
      return candidate.id;
    }
  }
  return null;
}

export function validateInputKeybinding(binding: InputKeybinding): InputKeybindingValidation {
  const normalized = normalizeInputKeybinding(binding);
  if (!normalized.key || modifierKeys.has(normalized.key)) {
    return { valid: false, reason: 'modifier-only' };
  }
  if (normalized.key === 'tab' || (normalized.key === 'enter' && !normalized.modKey)) {
    return { valid: false, reason: 'native-input-key' };
  }
  if ((normalized.altKey && normalized.key === 'tab') || (normalized.modKey && reservedModKeys.has(normalized.key))) {
    return { valid: false, reason: 'reserved-shortcut' };
  }
  if (normalized.key === 'dead' || normalized.key === 'process' || normalized.key === 'unidentified') {
    return { valid: false, reason: 'unreliable-shortcut' };
  }
  return { valid: true };
}

function doesEventMatchInputKeybinding(event: InputKeybindingEventLike, binding: InputKeybinding): boolean {
  const normalized = normalizeInputKeybinding(binding);
  return event.key.toLowerCase() === normalized.key
    && (event.ctrlKey || event.metaKey) === Boolean(normalized.modKey)
    && event.shiftKey === Boolean(normalized.shiftKey)
    && event.altKey === Boolean(normalized.altKey);
}

export function resolveInputKeybinding(
  event: InputKeybindingEventLike,
  scope: InputKeybindingScope,
  settings: InputKeybindingSettings,
): InputKeybindingCommand | null {
  if (event.isComposing) return null;

  for (const command of INPUT_KEYBINDING_COMMANDS) {
    if (!command.scopes.includes(scope)) continue;
    if (getInputKeybindingForCommand(command.id, settings).some((binding) => doesEventMatchInputKeybinding(event, binding))) {
      return command.id;
    }
  }

  return null;
}
