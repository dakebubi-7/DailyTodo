import { describe, expect, it } from 'vitest';
import {
  doInputKeybindingScopesOverlap,
  findInputKeybindingConflict,
  getInputKeybindingForCommand,
  resolveInputKeybinding,
  validateInputKeybinding,
  type InputKeybindingEventLike,
  type InputKeybindingSettings,
} from '../src/inputKeybindings/inputKeybindings';

const standardSettings: InputKeybindingSettings = {
  preset: 'standard',
  overrides: {},
};

const obsidianSettings: InputKeybindingSettings = {
  preset: 'obsidian',
  overrides: {},
};

const baseEvent: InputKeybindingEventLike = {
  key: '',
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  isComposing: false,
};

describe('input keybindings', () => {
  it('keeps native form navigation and multiline Enter behavior in the standard preset', () => {
    expect(resolveInputKeybinding({ ...baseEvent, key: 'Tab' }, 'daily-markdown', standardSettings)).toBeNull();
    expect(resolveInputKeybinding({ ...baseEvent, key: 'Tab', shiftKey: true }, 'daily-markdown', standardSettings)).toBeNull();
    expect(resolveInputKeybinding({ ...baseEvent, key: 'Enter' }, 'daily-markdown', standardSettings)).toBeNull();
    expect(resolveInputKeybinding({ ...baseEvent, key: 'Enter', ctrlKey: true }, 'completion-note', standardSettings)).toBe('submit');
    expect(resolveInputKeybinding({ ...baseEvent, key: ']', ctrlKey: true }, 'daily-markdown', standardSettings)).toBe('indent');
    expect(resolveInputKeybinding({ ...baseEvent, key: '[', ctrlKey: true }, 'daily-markdown', standardSettings)).toBe('outdent');
  });

  it('keeps the legacy Obsidian editing behavior in the Obsidian preset', () => {
    expect(resolveInputKeybinding({ ...baseEvent, key: 'Tab' }, 'daily-markdown', obsidianSettings)).toBe('indent');
    expect(resolveInputKeybinding({ ...baseEvent, key: 'Tab', shiftKey: true }, 'daily-markdown', obsidianSettings)).toBe('outdent');
    expect(resolveInputKeybinding({ ...baseEvent, key: 'Enter' }, 'daily-markdown', obsidianSettings)).toBe('continue-list');
  });

  it('gives user overrides precedence over their selected preset', () => {
    const settings: InputKeybindingSettings = {
      preset: 'standard',
      overrides: {
        bold: { key: 'k', modKey: true },
      },
    };

    expect(resolveInputKeybinding({ ...baseEvent, key: 'b', ctrlKey: true }, 'daily-markdown', settings)).toBeNull();
    expect(resolveInputKeybinding({ ...baseEvent, key: 'k', metaKey: true }, 'daily-markdown', settings)).toBe('bold');
    expect(getInputKeybindingForCommand('bold', settings)).toEqual([{ key: 'k', modKey: true }]);
  });

  it('limits commands to their supported input scopes', () => {
    expect(resolveInputKeybinding({ ...baseEvent, key: 'Enter', ctrlKey: true }, 'single-line-task', standardSettings)).toBeNull();
    expect(doInputKeybindingScopesOverlap(['daily-markdown'], ['completion-note'])).toBe(false);
    expect(doInputKeybindingScopesOverlap(['daily-markdown'], ['daily-markdown', 'completion-note'])).toBe(true);
  });

  it('only reports collisions for commands with overlapping scopes', () => {
    expect(findInputKeybindingConflict('bold', { key: 'Enter', modKey: true }, standardSettings)).toBe('submit');
    expect(findInputKeybindingConflict('submit', { key: 'b', modKey: true }, standardSettings)).toBe('bold');
  });

  it('rejects reserved and unreliable recorded shortcuts', () => {
    expect(validateInputKeybinding({ key: 'Control' }).valid).toBe(false);
    expect(validateInputKeybinding({ key: 'Tab' }).valid).toBe(false);
    expect(validateInputKeybinding({ key: 'Enter' }).valid).toBe(false);
    expect(validateInputKeybinding({ key: 'Tab', altKey: true }).valid).toBe(false);
    expect(validateInputKeybinding({ key: 'w', modKey: true }).valid).toBe(false);
    expect(validateInputKeybinding({ key: 'l', modKey: true }).valid).toBe(false);
    expect(validateInputKeybinding({ key: 'k', modKey: true }).valid).toBe(true);
  });
});
