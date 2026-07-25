# Input Keybindings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make standard input behavior the default while providing scoped, customizable Markdown editor shortcuts and a restorable Obsidian preset.

**Architecture:** A focused renderer-side keybinding module owns command metadata, normalized bindings, preset defaults, validation, conflict detection, and resolution. App settings persist only a selected preset plus sparse command overrides, migrating the old `inputKeyboardMode` value on read. `useMarkdownEditor` delegates matching to the resolver and consumes an event only after a scoped command resolves.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, Electron Store settings persistence.

---

### Task 1: Define and Test the Keybinding Domain

**Files:**
- Create: `src/inputKeybindings/inputKeybindings.ts`
- Create: `tests/inputKeybindings.test.ts`
- Delete: `src/hooks/markdownEditorKeyActions.ts`
- Delete: `tests/markdownEditorKeyActions.test.ts`

- [ ] **Step 1: Write failing resolver and validation tests**

```ts
expect(resolveInputKeybinding({ key: 'Tab' }, 'daily-markdown', standardSettings)).toBeNull();
expect(resolveInputKeybinding(ctrlEnter, 'completion-note', standardSettings)).toBe('submit');
expect(resolveInputKeybinding({ key: 'Tab' }, 'daily-markdown', obsidianSettings)).toBe('indent');
expect(findInputKeybindingConflict('bold', { key: 'Enter', ctrlKey: true }, overrides)).toEqual('submit');
expect(validateInputKeybinding({ key: 'w', ctrlKey: true }).valid).toBe(false);
```

- [ ] **Step 2: Run the focused test and verify it fails because the module is missing**

Run: `npx vitest run tests/inputKeybindings.test.ts --reporter=dot`

Expected: failing import or missing export errors for `inputKeybindings`.

- [ ] **Step 3: Implement the pure command model**

```ts
export type InputKeybindingCommand = 'submit' | 'indent' | 'outdent' | 'continue-list' | 'bold' | 'italic' | 'undo' | 'redo';
export type InputKeybindingScope = 'single-line-task' | 'completion-note' | 'daily-markdown';
export type InputKeybindingPreset = 'standard' | 'obsidian';
export interface InputKeybinding { key: string; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean; }
export interface InputKeybindingSettings { preset: InputKeybindingPreset; overrides: Partial<Record<InputKeybindingCommand, InputKeybinding | null>>; }
```

Use lower-case normalized keys, scope intersections for conflicts, and inherited preset bindings. Exclude native standard `Tab`, `Shift+Tab`, and unmodified `Enter` from recording. Define Obsidian legacy keys only as preset-owned commands.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npx vitest run tests/inputKeybindings.test.ts --reporter=dot`

Expected: all keybinding tests pass.

- [ ] **Step 5: Commit the isolated keybinding domain when the worktree is clean except for this feature**

```bash
git add src/inputKeybindings/inputKeybindings.ts tests/inputKeybindings.test.ts src/hooks/markdownEditorKeyActions.ts tests/markdownEditorKeyActions.test.ts
git commit -m "feat: add scoped input keybinding resolver"
```

### Task 2: Migrate and Persist Keybinding Settings

**Files:**
- Modify: `shared/appSettings.ts`
- Modify: `src/hooks/taskHookState.ts`
- Modify: `tests/appSettings.test.ts`

- [ ] **Step 1: Write failing migration and normalization tests**

```ts
expect(createDefaultAppSettings().inputKeybindings.preset).toBe('standard');
expect(normalizeAppSettings({ inputKeyboardMode: 'obsidian' }).inputKeybindings).toEqual({ preset: 'obsidian', overrides: {} });
expect(normalizeAppSettings({ inputKeyboardMode: 'standard' }).inputKeybindings).toEqual({ preset: 'standard', overrides: {} });
expect(normalizeAppSettings({ inputKeybindings: { preset: 'standard', overrides: { bold: { key: 'k', ctrlKey: true } } } }).inputKeybindings.overrides.bold).toEqual({ key: 'k', ctrlKey: true });
```

- [ ] **Step 2: Run the focused settings test and verify it fails**

Run: `npx vitest run tests/appSettings.test.ts --reporter=dot`

Expected: assertions fail because the app still exposes `inputKeyboardMode`.

- [ ] **Step 3: Replace the persisted mode with normalized settings**

```ts
export interface AppBehaviorSettings {
  inputKeybindings: InputKeybindingSettings;
}
```

Normalize supported commands and valid recordable bindings. When `inputKeybindings` is absent, convert a valid legacy `inputKeyboardMode` once; otherwise use the standard preset. Do not include `inputKeyboardMode` in normalized output. Update `areAppBehaviorSettingsEqual` to compare preset and sparse overrides structurally.

- [ ] **Step 4: Run settings and keybinding tests and verify they pass**

Run: `npx vitest run tests/appSettings.test.ts tests/inputKeybindings.test.ts --reporter=dot`

Expected: all tests pass.

- [ ] **Step 5: Commit the persistence migration**

```bash
git add shared/appSettings.ts src/hooks/taskHookState.ts tests/appSettings.test.ts
git commit -m "feat: persist configurable input keybindings"
```

### Task 3: Provide a Shortcut Recorder in Settings

**Files:**
- Create: `src/components/settings/InputKeybindingsSettingsSection.tsx`
- Modify: `src/components/settings/GeneralSettingsSection.tsx`
- Modify: `src/i18n/shellTextZhSettings.ts`
- Modify: `src/i18n/shellTextEnSettings.ts`
- Modify: `src/styles/globals.css`
- Create: `tests/inputKeybindingsSettings.dom.test.tsx`

- [ ] **Step 1: Write failing DOM tests for recorder behavior**

```tsx
render(<InputKeybindingsSettingsSection settings={standardSettings} onChange={onChange} text={text} />);
await user.click(screen.getByRole('button', { name: /bold/i }));
await user.keyboard('{Control>}k{/Control}');
expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ overrides: { bold: { key: 'k', ctrlKey: true } } }));
```

Cover reserved keys, Escape cancellation, and collision feedback that offers explicit replace/cancel.

- [ ] **Step 2: Run the DOM test and verify it fails because the settings section is missing**

Run: `npx vitest run tests/inputKeybindingsSettings.dom.test.tsx --reporter=dot`

Expected: failing import or missing role assertions.

- [ ] **Step 3: Implement the compact settings section**

```tsx
<fieldset className="input-keybindings-settings">
  <legend>{text.inputShortcuts}</legend>
  <select value={settings.preset} onChange={handlePresetChange}>...</select>
  {editableCommands.map((command) => <ShortcutRow key={command} command={command} />)}
  <button type="button" onClick={restoreStandard}>{text.inputShortcutsRestoreDefaults}</button>
  <button type="button" onClick={restoreObsidian}>{text.inputShortcutsRestoreObsidian}</button>
</fieldset>
```

Use a button-based recorder row with an accessible recording state, individual clear-override action, reserved-key error, and a scope-overlap collision prompt. Keep the current settings styling vocabulary and do not use global key listeners.

- [ ] **Step 4: Connect the section and localized copy**

Pass `appSettings.inputKeybindings` to the new section and publish changes through `onAppSettingsChange({ ...appSettings, inputKeybindings })`. Add Chinese and English labels for presets, commands, recording, invalid input, collisions, replace, cancel, clear, and restoration.

- [ ] **Step 5: Run the focused DOM test and verify it passes**

Run: `npx vitest run tests/inputKeybindingsSettings.dom.test.tsx --reporter=dot`

Expected: all recorder and conflict feedback tests pass.

- [ ] **Step 6: Commit the settings UI**

```bash
git add src/components/settings/InputKeybindingsSettingsSection.tsx src/components/settings/GeneralSettingsSection.tsx src/i18n/shellTextZhSettings.ts src/i18n/shellTextEnSettings.ts src/styles/globals.css tests/inputKeybindingsSettings.dom.test.tsx
git commit -m "feat: add configurable input shortcut settings"
```

### Task 4: Route Markdown Editors Through the Resolver

**Files:**
- Modify: `src/hooks/useMarkdownEditor.ts`
- Modify: `src/components/DailyWorkPanel.tsx`
- Modify: `src/components/taskCompletionDialog/TaskCompletionMarkdownField.tsx`
- Modify: `src/components/TaskCompletionDialog.tsx`
- Modify: `src/components/TaskList.tsx`
- Modify: `src/app/appShellMainContentComposition.tsx`
- Modify: `src/app/appShellOverlayComposition.ts`
- Modify: `tests/taskDialogs.dom.test.tsx`

- [ ] **Step 1: Write failing textarea interaction tests**

```tsx
fireEvent.keyDown(textarea, { key: 'Tab' });
expect(event.defaultPrevented).toBe(false);
fireEvent.keyDown(textarea, { key: 'Enter' });
expect(onSave).not.toHaveBeenCalled();
fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
expect(onSave).toHaveBeenCalledOnce();
```

Include Obsidian `Tab` indentation. Keep single-line task inputs outside this resolver.

- [ ] **Step 2: Run the focused DOM test and verify it fails**

Run: `npx vitest run tests/taskDialogs.dom.test.tsx --reporter=dot`

Expected: standard keybinding assertions fail until structured settings are propagated.

- [ ] **Step 3: Update `useMarkdownEditor` to resolve scoped commands**

```ts
const action = resolveInputKeybinding(eventLike, scope, inputKeybindings);
if (!action) return;
if (action === 'submit') {
  event.preventDefault();
  onSubmit?.();
  return;
}
```

Map resolved editing commands through existing history and selection routines. Only prevent default for `continue-list` when `continueListOnEnter` returns an edit result.

- [ ] **Step 4: Propagate settings only to Markdown-capable textareas**

Use `daily-markdown` for `DailyWorkPanel` and `completion-note` for completion fields. Thread `AppBehaviorSettings['inputKeybindings']` through shell composition and component props. Remove all `InputKeyboardMode` props, default fallbacks, and temporary two-mode copy.

- [ ] **Step 5: Run focused keybinding, settings, and DOM tests**

Run: `npx vitest run tests/inputKeybindings.test.ts tests/appSettings.test.ts tests/inputKeybindingsSettings.dom.test.tsx tests/taskDialogs.dom.test.tsx --reporter=dot`

Expected: all focused tests pass.

- [ ] **Step 6: Commit the editor integration**

```bash
git add src/hooks/useMarkdownEditor.ts src/components/DailyWorkPanel.tsx src/components/taskCompletionDialog/TaskCompletionMarkdownField.tsx src/components/TaskCompletionDialog.tsx src/components/TaskList.tsx src/app/appShellMainContentComposition.tsx src/app/appShellOverlayComposition.ts tests/taskDialogs.dom.test.tsx
git commit -m "feat: apply configurable shortcuts to markdown inputs"
```

### Task 5: Verify the Completed Feature

**Files:**
- Verify: all files changed above

- [ ] **Step 1: Run the focused test suite**

Run: `npm test -- --run tests/inputKeybindings.test.ts tests/appSettings.test.ts tests/inputKeybindingsSettings.dom.test.tsx tests/taskDialogs.dom.test.tsx`

Expected: all selected test files pass with no failures.

- [ ] **Step 2: Run static and app-state verification**

Run: `npm run typecheck`

Expected: both TypeScript projects report no errors.

Run: `npx tsx scripts/verify-task-hook-state.ts`

Expected: task hook state verification completes successfully.

- [ ] **Step 3: Review the final diff against the accepted design**

Run: `git diff --check && git status --short`

Expected: no whitespace errors, no persisted `inputKeyboardMode`, and only intended feature changes remaining.
