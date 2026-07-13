import { useCallback, useEffect, useState } from 'react';

export function useTitleBarMoreMenu() {
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!moreOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('.titlebar-more-wrap')) return;
      setMoreOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [moreOpen]);

  const toggleMoreMenu = useCallback(() => {
    setMoreOpen((previous) => !previous);
  }, []);

  const resetPosition = useCallback(() => {
    window.electronAPI?.resetPosition();
    setMoreOpen(false);
  }, []);

  return { moreOpen, toggleMoreMenu, resetPosition };
}
