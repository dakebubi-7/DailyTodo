import { useEffect, useRef } from 'react';
import {
  type DialogFocusContainer,
  type DialogFocusableElement,
  focusDialog,
  handleDialogTabKeyDown,
  restoreDialogFocus,
} from './dialogFocus';
import { handleDialogKeyDown } from './dialogKeyboard';

export function useDialogFocus(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const dialog = dialogRef.current;
    if (dialog) focusDialog(dialog as unknown as DialogFocusContainer);

    return () => {
      restoreDialogFocus(previousFocusRef.current);
      previousFocusRef.current = null;
    };
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    handleDialogTabKeyDown(
      event,
      dialogRef.current as unknown as DialogFocusContainer | null,
      document.activeElement as DialogFocusableElement | null,
    );
    handleDialogKeyDown(event, onClose);
  };

  return { dialogRef, handleKeyDown };
}
