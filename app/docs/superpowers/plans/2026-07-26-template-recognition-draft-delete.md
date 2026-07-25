# Template Recognition Draft Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user remove individual recognized template blocks before applying the recognition result.

**Architecture:** Keep recognition results as local modal state. Add a focused removal helper to update that state, render a per-row delete control, and prevent append/replace operations from running when every recognized result has been removed.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, existing Electron Vite application.

---

### Task 1: Cover Removal Before Applying

**Files:**
- Create: `tests/templateRecognitionModal.dom.test.tsx`
- Modify: `src/components/TemplateRecognitionModal.tsx`
- Modify: `src/styles/globals.css`

- [x] **Step 1: Write the failing test**

```tsx
it('applies only the recognized blocks left after removing a draft block', () => {
  const onApply = vi.fn();
  render(<TemplateRecognitionModal existingBlocks={[]} onApply={onApply} onCancel={vi.fn()} />);

  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: '## First\nContent\n## Second\nContent' },
  });
  fireEvent.click(screen.getByRole('button', { name: '开始识别' }));
  fireEvent.click(screen.getByRole('button', { name: '删除 First' }));
  fireEvent.click(screen.getByRole('button', { name: '替换自定义区块' }));

  expect(onApply).toHaveBeenCalledWith([
    expect.objectContaining({ name: 'Second' }),
  ], 'replace');
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/templateRecognitionModal.dom.test.tsx`

Expected: FAIL because the preview does not expose a removal control.

- [x] **Step 3: Write the minimal implementation**

```tsx
const removeRecognized = (id: string) => {
  setRecognized((previous) => previous.filter((block) => block.id !== id));
};

<button
  type="button"
  className="recognition-remove-button"
  aria-label={`删除 ${block.name}`}
  title={`删除 ${block.name}`}
  onClick={() => removeRecognized(block.id)}
>
  &times;
</button>
```

Render an empty-state message and disable both apply buttons when `recognized.length === 0`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/templateRecognitionModal.dom.test.tsx`

Expected: PASS with no failures.

- [x] **Step 5: Run focused static verification**

Run: `npm run typecheck && npm run verify:section-config && npx tsx scripts/verify-recognize-template-blocks.ts`

Expected: all commands exit successfully.

- [x] **Step 6: Commit**

```bash
git add app/src/components/TemplateRecognitionModal.tsx app/src/styles/globals.css app/tests/templateRecognitionModal.dom.test.tsx app/docs/superpowers/plans/2026-07-26-template-recognition-draft-delete.md
git commit -m "feat: remove template recognition drafts before applying"
```
