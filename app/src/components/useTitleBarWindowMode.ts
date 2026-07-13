import { useCallback, useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { readWindowMode } from '../../shared/windowMode';

function setPinnedIfChanged(
  pinnedRef: MutableRefObject<boolean>,
  setPinned: Dispatch<SetStateAction<boolean>>,
  nextPinned: boolean,
) {
  if (pinnedRef.current === nextPinned) return;

  pinnedRef.current = nextPinned;
  setPinned(nextPinned);
}

export function useTitleBarWindowMode() {
  const [pinned, setPinned] = useState(true);
  const pinnedRef = useRef(pinned);

  useEffect(() => {
    const refreshPinned = () => {
      window.electronAPI?.getWindowMode().then((mode) => {
        setPinnedIfChanged(pinnedRef, setPinned, readWindowMode(mode) === 'onTop');
      });
    };

    refreshPinned();
    window.addEventListener('focus', refreshPinned);
    document.addEventListener('visibilitychange', refreshPinned);
    const unsubscribe = window.electronAPI?.onWindowModeChanged((mode) => {
      setPinnedIfChanged(pinnedRef, setPinned, readWindowMode(mode) === 'onTop');
    });

    return () => {
      window.removeEventListener('focus', refreshPinned);
      document.removeEventListener('visibilitychange', refreshPinned);
      unsubscribe?.();
    };
  }, []);

  const toggleAlwaysOnTop = useCallback(async () => {
    const isOnTop = await window.electronAPI?.toggleAlwaysOnTop();
    if (typeof isOnTop === 'boolean') {
      setPinnedIfChanged(pinnedRef, setPinned, isOnTop);
      return isOnTop;
    }

    const mode = readWindowMode(await window.electronAPI?.getWindowMode());
    const nextPinned = mode === 'onTop';
    setPinnedIfChanged(pinnedRef, setPinned, nextPinned);
    return nextPinned;
  }, []);

  return { pinned, toggleAlwaysOnTop };
}
