import { useState, type PointerEvent, type RefObject } from 'react';

const MIN_EDITOR_HEIGHT = 56;
const MAX_EDITOR_HEIGHT = 480;

export function useDailyWorkPanelResize(textareaRef: RefObject<HTMLTextAreaElement | null>) {
  const [editorHeight, setEditorHeight] = useState(64);

  const startResize = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = textareaRef.current?.offsetHeight ?? editorHeight;

    const onMove = (moveEvent: globalThis.PointerEvent) => {
      const next = startHeight + (moveEvent.clientY - startY);
      setEditorHeight(Math.min(MAX_EDITOR_HEIGHT, Math.max(MIN_EDITOR_HEIGHT, next)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return { editorHeight, startResize };
}
