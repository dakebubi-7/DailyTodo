import { useCallback, useEffect, useRef, useState } from 'react';

const POPOVER_WIDTH = 142;
const VIEWPORT_GUTTER = 8;
const POPOVER_HEIGHT = 132;

export function usePriorityPickerPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const repositionFrameRef = useRef<number | undefined>(undefined);

  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const left = Math.min(
      Math.max(VIEWPORT_GUTTER, rect.left),
      window.innerWidth - POPOVER_WIDTH - VIEWPORT_GUTTER,
    );
    const top = rect.bottom + VIEWPORT_GUTTER > window.innerHeight - POPOVER_HEIGHT
      ? rect.top - POPOVER_HEIGHT - 6
      : rect.bottom + VIEWPORT_GUTTER;
    const next = { top: Math.max(VIEWPORT_GUTTER, top), left };
    setPosition((previous) => {
      if (previous.top === next.top && previous.left === next.left) return previous;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Node ? event.target : null;
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleReposition = () => {
      if (repositionFrameRef.current !== undefined) return;
      repositionFrameRef.current = window.requestAnimationFrame(() => {
        repositionFrameRef.current = undefined;
        updatePosition();
      });
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      if (repositionFrameRef.current !== undefined) {
        window.cancelAnimationFrame(repositionFrameRef.current);
        repositionFrameRef.current = undefined;
      }
    };
  }, [isOpen, updatePosition]);

  const togglePopover = useCallback(() => {
    setIsOpen((previous) => !previous);
  }, []);

  const closePopover = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { buttonRef, isOpen, popoverRef, position, togglePopover, closePopover };
}
