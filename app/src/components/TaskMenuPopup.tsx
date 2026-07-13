import { useMemo, useEffect } from 'react';
import { Task } from '../types/task';
import { isTaskLike } from '../hooks/taskTransforms';
import { MenuPane, SubtaskPane } from './taskMenuPopup/TaskMenuPopupPanes';
import { DatePane } from './taskMenuPopup/TaskMenuPopupDatePane';
import { TagPane } from './taskMenuPopup/TaskMenuPopupTagPane';
import { useTaskMenuPopupLifecycle } from './taskMenuPopup/useTaskMenuPopupLifecycle';
import { isObjectRecord } from '../../shared/unknownValueGuards';

export { getTagSuggestions } from './taskMenuPopup/TaskMenuPopupTagPane';

type ThemeInfo = {
  themeId: string;
  accent: string;
  secondary: string;
  menuOpacity: number;
  blurStrength: number;
  cardRadius: number;
};

type MenuPayload = {
  task: Task;
  allTags: string[];
  isDark: boolean;
  theme: ThemeInfo;
};

type TaskMenuPopupActionUpdate = {
  __action: 'edit' | 'delete' | 'addSubtask';
  text?: string;
};

export function parseTaskMenuPopupPayload(value: unknown): MenuPayload | null {
  if (!isObjectRecord(value) || !isTaskLike(value.task)) return null;

  const themeRecord = isObjectRecord(value.theme) ? value.theme : {};
  const allTags = Array.isArray(value.allTags)
    ? value.allTags.filter((tag): tag is string => typeof tag === 'string')
    : [];

  return {
    task: value.task,
    allTags,
    isDark: typeof value.isDark === 'boolean' ? value.isDark : false,
    theme: {
      themeId: typeof themeRecord.themeId === 'string' ? themeRecord.themeId : '',
      accent: typeof themeRecord.accent === 'string' ? themeRecord.accent : '#52525b',
      secondary: typeof themeRecord.secondary === 'string' ? themeRecord.secondary : '#a1a1aa',
      menuOpacity: typeof themeRecord.menuOpacity === 'number' && Number.isFinite(themeRecord.menuOpacity)
        ? themeRecord.menuOpacity
        : 0.96,
      blurStrength: typeof themeRecord.blurStrength === 'number' && Number.isFinite(themeRecord.blurStrength)
        ? themeRecord.blurStrength
        : 18,
      cardRadius: typeof themeRecord.cardRadius === 'number' && Number.isFinite(themeRecord.cardRadius)
        ? themeRecord.cardRadius
        : 12,
    },
  };
}

function readPayload(): MenuPayload | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('payload');
    if (!raw) return null;
    return parseTaskMenuPopupPayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

function dispatch(taskId: string, updates: Partial<Task> | TaskMenuPopupActionUpdate) {
  void window.electronAPI?.dispatchTaskMenuAction({ taskId, updates });
}

function close() {
  void window.electronAPI?.closeTaskContextMenu();
}

export function TaskMenuPopup() {
  const payload = useMemo(readPayload, []);
  const { cardRef, pane, setPane } = useTaskMenuPopupLifecycle({ payload, close });

  useEffect(() => {
    const theme = payload?.theme;
    const root = document.documentElement;
    root.classList.toggle('dark', Boolean(payload?.isDark));
    if (theme) {
      const surface = root.style;
      surface.setProperty('--menu-accent', theme.accent);
      surface.setProperty('--menu-secondary', theme.secondary);
      surface.setProperty('--menu-surface-opacity', String(Math.min(1, Math.max(0.94, theme.menuOpacity))));
      surface.setProperty('--menu-blur', `${Math.min(36, Math.max(8, theme.blurStrength + 4))}px`);
      surface.setProperty('--menu-radius', `${Math.min(22, Math.max(12, theme.cardRadius + 4))}px`);
    }
  }, [payload]);

  if (!payload) return <div className="tm-popup" />;

  const { task, allTags, theme } = payload;
  const themeClass = theme.themeId ? `theme-${theme.themeId}` : '';

  return (
    <div className={`tm-popup ${themeClass}`}>
      <div className="tm-card-shell" ref={cardRef}>
        <div className="tm-card" role="menu" aria-label="任务操作">
          {pane === 'menu' && <MenuPane task={task} onPick={(p) => (p === 'edit' || p === 'delete' ? handleTopAction(task, p) : setPane(p))} />}
          {pane === 'date' && <DatePane task={task} onBack={() => setPane('menu')} onDispatch={dispatch} onClose={close} />}
          {pane === 'tag' && <TagPane task={task} allTags={allTags} onBack={() => setPane('menu')} onDispatch={dispatch} onClose={close} />}
          {pane === 'subtask' && <SubtaskPane task={task} onBack={() => setPane('menu')} onDispatch={dispatch} />}
        </div>
      </div>
    </div>
  );
}

function handleTopAction(task: Task, action: 'edit' | 'delete') {
  dispatch(task.id, { __action: action });
}
