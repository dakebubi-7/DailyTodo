# Input Keybindings Design

## Goal

Replace the current two-mode input shortcut behavior with one input-scoped command and keybinding system. The system must make standard form behavior the default while allowing users to override editor commands in Settings.

This work applies only while focus is inside DailyTodo inputs and textareas. It does not change application-level, window-level, or operating-system shortcuts.

## Default Behavior

Native form navigation remains native and is not customizable:

- `Tab` moves to the next focusable input or control.
- `Shift+Tab` moves to the previous focusable input or control.
- In single-line inputs, `Enter` performs the control's normal submit action.
- In multi-line textareas, `Enter` inserts a newline.

The default customizable editor commands are:

| Command | Default binding | Supported inputs |
| --- | --- | --- |
| Submit | `Ctrl+Enter` / `Cmd+Enter` | Multi-line completion records and daily text panels |
| Indent | `Ctrl+]` / `Cmd+]` | Markdown-capable textareas |
| Outdent | `Ctrl+[` / `Cmd+[` | Markdown-capable textareas |
| Bold | `Ctrl+B` / `Cmd+B` | Markdown-capable textareas |
| Italic | `Ctrl+I` / `Cmd+I` | Markdown-capable textareas |
| Undo | `Ctrl+Z` / `Cmd+Z` | Managed Markdown textareas |
| Redo | `Ctrl+Shift+Z`, `Ctrl+Y`, and platform equivalents | Managed Markdown textareas |

The former Obsidian behavior is offered as a restorable preset: `Tab` indent, `Shift+Tab` outdent, and plain `Enter` continues a Markdown list. The standard preset is the default for new users and for existing users who have never selected the old Obsidian mode.

## Model

The data model has three layers:

1. Command definitions: stable command IDs, labels, default bindings, and supported editor scopes.
2. User overrides: only bindings changed by the user are persisted. Missing values inherit from the selected preset.
3. Resolver: a pure function receives an editor scope, a normalized keyboard event, the selected preset, and user overrides. It returns an input command or `null` so native browser behavior continues.

The command IDs are stable storage/API identifiers. Labels remain localized UI text. Bindings are stored as normalized structured data rather than display strings, so matching and conflict detection do not depend on locale or keyboard-label formatting.

## Scopes

The resolver supports these scopes:

- `single-line-task`: task capture and task/subtask title edits. It retains native `Enter` submit behavior and does not consume Markdown commands.
- `completion-note`: completion-record Markdown textareas. It supports submit, indentation, list continuation, formatting, undo, and redo.
- `daily-markdown`: daily work and inspiration textareas. It supports the complete Markdown command set.

The resolver must only prevent the browser default when it resolves a supported command for the active scope. Unsupported or unbound keys, including native form-navigation keys in the standard preset, bubble normally.

## Settings Experience

Settings gets an "Input Shortcuts" section with:

- A preset control: `Standard` and `Obsidian`.
- A compact row for each customizable command, showing its current binding.
- A record state: selecting a row makes the next valid key combination the new binding.
- A clear action for a command override, returning that command to its selected preset value.
- A "Restore defaults" action that selects the standard preset and clears every override.
- A "Restore Obsidian preset" action that selects the Obsidian preset and clears every override.

The recorder rejects shortcut combinations that are unreliable or reserved by the operating system/browser, including modifier-only input and known browser/window commands such as `Alt+Tab`, `Ctrl+W`, and `Ctrl+L`.

When a proposed binding conflicts with another command in an overlapping scope, the UI explains the conflicting command and asks the user to replace its binding or cancel. Commands in non-overlapping scopes may share the same binding.

`Tab`, `Shift+Tab`, and unmodified `Enter` are never recordable in the standard preset because they preserve focus navigation and multi-line text entry. The Obsidian preset owns its legacy behavior rather than exposing those keys as arbitrary custom bindings.

## Migration

The existing `inputKeyboardMode` setting is read once during normalization:

- `obsidian` becomes the `obsidian` preset with no user overrides.
- `standard` becomes the `standard` preset with no user overrides.
- Missing/invalid values become the `standard` preset with no user overrides.

After migration, settings persist the preset and sparse user override map. Keeping the old field out of newly written settings prevents two competing sources of truth.

## Integration

`useMarkdownEditor` delegates all keyboard matching to the resolver and then applies the resolved command through its existing history and selection mechanisms. The daily work panel and completion dialog provide their editor scope and submit callback.

Single-line task inputs retain their current `Enter` submit handling. They do not use the Markdown resolver, avoiding accidental interference with task creation or inline title editing.

## Testing

Pure unit tests cover:

- Standard preset resolution and native-key pass-through.
- Obsidian preset resolution for legacy list editing.
- User overrides taking precedence over preset bindings.
- Scope-specific resolution and shared bindings in disjoint scopes.
- Conflict detection, invalid-binding rejection, clearing overrides, and preset restoration.
- Legacy setting migration and malformed stored data normalization.

Focused component tests cover:

- Keyboard recorder capture/cancel behavior and conflict feedback.
- Settings persistence updates.
- Markdown editor commands consuming only resolved commands; `Tab`, `Shift+Tab`, and plain textarea `Enter` retain native behavior in the standard preset.

Typecheck and the existing app-settings/task-hook verification run after the focused tests.
