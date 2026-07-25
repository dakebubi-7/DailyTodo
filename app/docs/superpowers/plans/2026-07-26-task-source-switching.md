# Task Source Switching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users change an existing top-level task between Personal and External in the task context menu.

**Architecture:** Add a source-selection pane to the existing popup and dispatch the already-allowlisted `source` partial update. The renderer's existing task-menu action listener applies the update through `updateTask`, so task grouping, persistence, and synchronization continue to work without new data or IPC contracts.

**Tech Stack:** React 18, TypeScript, Vitest, Electron IPC, existing task context-menu components.

---

## File Structure

- Modify: `src/components/taskMenuPopup/TaskMenuPopupPanes.tsx` to add the `source` popup pane type and the top-level Task type entry.
- Create: `src/components/taskMenuPopup/TaskMenuPopupSourcePane.tsx` to render the two task-source choices and dispatch only a changed source.
- Modify: `src/components/TaskMenuPopup.tsx` to render the source pane and pass the existing dispatch/close functions.
- Modify: `tests/taskMenuActionUpdates.test.ts` to lock the source update value in the shared menu payload contract.
- Modify: `scripts/verify-context-menu.ts` to verify the source pane is wired into the popup and source selection dispatches through the existing menu action channel.
- Modify: `scripts/verify-task-mutations.ts` to lock that a partial source update affects a parent only, and `scripts/verify-task-list-dnd-module.ts` to lock source-group derivation after the change.

### Task 1: Lock the Menu-Action Update Contract

**Files:**
- Modify: `tests/taskMenuActionUpdates.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test proving that a source-only payload is preserved by the shared allowlist:

```ts
it('keeps a supported task source update', () => {
  expect(normalizeTaskMenuActionPayload({
    taskId: '1',
    updates: { source: 'external' },
  })).toEqual({
    taskId: '1',
    updates: { source: 'external' },
  });
});
```

- [ ] **Step 2: Run the focused test to verify the current behavior**

Run: `npm test -- --run tests/taskMenuActionUpdates.test.ts`

Expected: The new test passes because the existing shared allowlist already supports `source`. This confirms the new UI can reuse the established renderer/IPC contract.

### Task 2: Add the Task-Type Popup Pane

**Files:**
- Create: `src/components/taskMenuPopup/TaskMenuPopupSourcePane.tsx`
- Modify: `src/components/taskMenuPopup/TaskMenuPopupPanes.tsx`
- Modify: `src/components/TaskMenuPopup.tsx`
- Modify: `scripts/verify-context-menu.ts`

- [ ] **Step 1: Write the failing source-pane verification**

Extend `scripts/verify-context-menu.ts` with source-level wiring assertions:

```ts
const popupSourcePanePath = join(root, 'src/components/taskMenuPopup/TaskMenuPopupSourcePane.tsx');
assert.ok(existsSync(popupSourcePanePath), 'Task-menu source pane should exist.');
const popupSourcePane = readFileSync(popupSourcePanePath, 'utf8');
assert.match(popupSourcePane, /task\.source \|\| 'personal'/, 'Source pane should treat missing sources as personal.');
assert.match(popupSourcePane, /onDispatch\(task\.id, \{ source \}\)/, 'Source pane should dispatch a source-only task update.');
assert.match(popupSourcePane, /disabled=\{currentSource === 'personal'\}/, 'Source pane should disable the active personal source.');
assert.match(popupSourcePane, /disabled=\{currentSource === 'external'\}/, 'Source pane should disable the active external source.');
```

Add assertions that `TaskMenuPopupPanes.tsx` includes the `'source'` pane type and passes `'source'` from the Task type menu item, and that `TaskMenuPopup.tsx` imports and renders `TaskMenuPopupSourcePane` with the existing `dispatch` and `close` functions.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run verify:context-menu`

Expected: FAIL because `TaskMenuPopupSourcePane` and the `source` pane option do not exist.

- [ ] **Step 3: Implement the minimal source pane**

Create `TaskMenuPopupSourcePane.tsx` using the existing pane header and dispatch shape:

```tsx
export function TaskMenuPopupSourcePane({ task, onBack, onDispatch, onClose }: Props) {
  const currentSource = task.source || 'personal';
  const selectSource = (source: TaskSource) => {
    if (source === currentSource) return;
    onDispatch(task.id, { source });
    onClose();
  };

  return (
    <>
      <TaskMenuPopupPaneHeader title="任务类型" onBack={onBack} />
      <div className="tm-list">
        <button type="button" className="tm-item" disabled={currentSource === 'personal'} onClick={() => selectSource('personal')}>个人任务</button>
        <button type="button" className="tm-item" disabled={currentSource === 'external'} onClick={() => selectSource('external')}>外部任务</button>
      </div>
    </>
  );
}
```

Extend `TaskMenuPopupPane` with `'source'`, add a Task type item in `MenuPane` that calls `onPick('source')`, then import and render the new pane from `TaskMenuPopup` with `task`, `onBack`, `dispatch`, and `close`.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `npm run verify:context-menu && npm test -- --run tests/taskMenuActionUpdates.test.ts`

Expected: PASS with both the source-pane wiring and generic update contract covered.

- [ ] **Step 5: Commit the menu implementation**

```bash
git add src/components/TaskMenuPopup.tsx src/components/taskMenuPopup/TaskMenuPopupPanes.tsx src/components/taskMenuPopup/TaskMenuPopupSourcePane.tsx scripts/verify-context-menu.ts tests/taskMenuActionUpdates.test.ts
git commit -m "feat: switch existing task source"
```

### Task 3: Lock Source-Grouping and Subtask Boundaries

**Files:**
- Modify: `scripts/verify-task-mutations.ts`
- Modify: `scripts/verify-task-list-dnd-module.ts`

- [ ] **Step 1: Write the failing grouping test**

Add the parent-only update assertion in `scripts/verify-task-mutations.ts`:

```ts
const child = { ...task, id: 'child-1', source: 'personal' as const, parentTaskId: 'parent-1' };
const parent = { ...task, id: 'parent-1', source: 'personal' as const, subtasks: [child] };
const sourceChangedParent = updateTaskFields(parent, { source: 'external' });
assert.equal(sourceChangedParent.source, 'external');
assert.equal(sourceChangedParent.subtasks?.[0].source, 'personal');
```

Add a derivation assertion in `scripts/verify-task-list-dnd-module.ts` using `getTaskListDerivations([sourceChangedParent], ['personal', 'external'])` and verify the only group is `external` with the changed parent task.

- [ ] **Step 2: Run the focused test to verify current behavior**

Run: `npm run verify:task-mutations && npm run verify:task-list-dnd-module`

Expected: PASS, documenting that the existing non-recursive field update plus derivation logic meet the boundary requirement.

- [ ] **Step 3: Run the feature-level verification suite**

Run:

```bash
npm test -- --run tests/taskMenuActionUpdates.test.ts
npm run typecheck
npm run lint
npm run verify:context-menu
npm run verify:task-mutations
npm run verify:task-list-dnd-module
```

Expected: Every command exits with code 0.

- [ ] **Step 4: Commit the final focused regression coverage**

```bash
git add scripts/verify-task-mutations.ts scripts/verify-task-list-dnd-module.ts
git commit -m "test: cover task source switch grouping"
```
