const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export type DialogFocusableElement = {
  disabled?: boolean;
  focus?: () => void;
  isConnected?: boolean;
};

export type DialogFocusContainer = DialogFocusableElement & {
  querySelectorAll: (selector: string) => ArrayLike<DialogFocusableElement>;
};

export type DialogTabEvent = {
  key: string;
  shiftKey: boolean;
  preventDefault: () => void;
};

export function getDialogFocusableElements(dialog: DialogFocusContainer): DialogFocusableElement[] {
  return Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => !element.disabled);
}

export function focusDialog(dialog: DialogFocusContainer): void {
  const [firstFocusable] = getDialogFocusableElements(dialog);
  (firstFocusable ?? dialog).focus?.();
}

export function handleDialogTabKeyDown(
  event: DialogTabEvent,
  dialog: DialogFocusContainer | null,
  activeElement: DialogFocusableElement | null,
): void {
  if (event.key !== 'Tab' || !dialog) return;

  const focusableElements = getDialogFocusableElements(dialog);
  if (focusableElements.length === 0) {
    event.preventDefault();
    dialog.focus?.();
    return;
  }

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && activeElement === firstFocusable) {
    event.preventDefault();
    lastFocusable.focus?.();
    return;
  }

  if (!event.shiftKey && activeElement === lastFocusable) {
    event.preventDefault();
    firstFocusable.focus?.();
  }
}

export function restoreDialogFocus(element: DialogFocusableElement | null): void {
  if (!element || element.isConnected === false) return;
  element.focus?.();
}
