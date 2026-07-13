import { useEffect, useRef, useState } from 'react';
import type { TaskMenuPopupPane } from './TaskMenuPopupPanes';

type UseTaskMenuPopupLifecycleOptions = {
  payload: unknown;
  close: () => void;
};

export function useTaskMenuPopupLifecycle({ payload, close }: UseTaskMenuPopupLifecycleOptions) {
  const [pane, setPane] = useState<TaskMenuPopupPane>('menu');
  const cardRef = useRef<HTMLDivElement>(null);
  const lastReportedHeightRef = useRef<number | null>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const el = cardRef.current;
    let raf = 0;
    const report = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = el.offsetHeight;
        if (h <= 0 || h === lastReportedHeightRef.current) return;
        lastReportedHeightRef.current = h;
        void window.electronAPI?.resizeTaskContextMenu(h + 32);
      });
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [pane, payload]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pane === 'menu') close();
        else setPane('menu');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, pane]);

  return { cardRef, pane, setPane };
}
