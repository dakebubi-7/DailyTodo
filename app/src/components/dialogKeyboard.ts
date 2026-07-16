type DialogKeyboardEvent = {
  key: string;
  preventDefault(): void;
};

export function handleDialogKeyDown(event: DialogKeyboardEvent, onClose: () => void) {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  onClose();
}
