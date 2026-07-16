# Dialog Focus Management Design

## Goal

Complete keyboard accessibility for the existing task completion and review dialogs by moving focus into an open dialog, keeping Tab navigation inside it, and restoring the original focus when it closes.

## Scope

This change applies only to `TaskCompletionDialog` and `TaskReviewDialog`. It preserves their visual layout, callbacks, Escape behavior, and existing ARIA attributes. It does not add a browser-test dependency, alter dialog stacking, or change task workflows.

## Approach

Create a small `dialogFocus` helper with explicit DOM-like interfaces so Vitest can exercise the behavior with lightweight fakes. The helper has three responsibilities:

1. Capture the active element before a dialog opens and move focus to the first focusable element inside the dialog. If none exists, focus the dialog container itself.
2. On Tab or Shift+Tab, prevent default navigation only when it would leave the dialog, wrapping to the first or last focusable element. When the dialog container is the only focus target, Tab remains on the container.
3. Restore the previously focused element during cleanup only when it is still connected and exposes `focus()`.

The existing `handleDialogKeyDown` helper remains the owner of Escape-to-close behavior. A new dialog hook composes focus setup, cleanup, and keyboard routing, while the two dialog components provide their `motion.div` container ref and continue to call `onCancel` or `onClose` unchanged.

## Focusable Elements

The helper queries the standard interactive selector set: enabled buttons, links with `href`, enabled inputs, enabled selects, enabled textareas, and explicit non-negative `tabindex` elements. Disabled and negative-tabindex elements are excluded. The dialog container retains `tabIndex={-1}` as the safe fallback focus target.

## Error Handling

All focus operations are defensive. Missing `document`, missing active element, a disconnected prior element, empty dialogs, and elements without a focus method are valid no-op or fallback states. The feature must never throw during render, close, or unmount.

## Testing

Use Vitest with fake focusable elements and a fake dialog container. Tests cover:

- Initial focus moves to the first enabled interactive element.
- An empty dialog focuses its container.
- Tab from the final element wraps to the first; Shift+Tab from the first wraps to the final.
- Tab does not interfere with normal movement between interior elements.
- Cleanup restores a connected trigger and skips a disconnected trigger.
- Existing Escape behavior remains covered by `dialogKeyboard.test.ts`.

## Completion Criteria

- Both dialogs use the shared focus lifecycle hook.
- Dialog focus begins inside the modal, cannot leave through Tab navigation, and returns to the opener on close.
- Focus behavior tests, current dialog keyboard tests, TypeScript checking, task UI verification, production build, and whitespace checking pass.

## Deliberate Limits

This design does not implement modal stacking coordination, inert background content, pointer-trigger capture beyond `document.activeElement`, or a full browser accessibility harness. Those are separate concerns and are not necessary to complete keyboard focus behavior for the current single-dialog flows.
