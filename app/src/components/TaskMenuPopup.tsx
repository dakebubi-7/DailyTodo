import { useState, useMemo, useEffect, useRef } from 'react';
import { Task } from '../types/task';
import { getBusinessDateKey, shiftDateKey } from '../../shared/taskRollover';

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

type Pane = 'menu' | 'date' | 'tag' | 'subtask';

function readPayload(): MenuPayload | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('payload');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.task) return null;
    const t = (parsed.theme || {}) as Partial<ThemeInfo>;
    return {
      task: parsed.task as Task,
      allTags: Array.isArray(parsed.allTags) ? parsed.allTags : [],
      isDark: Boolean(parsed.isDark),
      theme: {
        themeId: typeof t.themeId === 'string' ? t.themeId : '',
        accent: t.accent || '#52525b',
        secondary: t.secondary || '#a1a1aa',
        menuOpacity: typeof t.menuOpacity === 'number' ? t.menuOpacity : 0.96,
        blurStrength: typeof t.blurStrength === 'number' ? t.blurStrength : 18,
        cardRadius: typeof t.cardRadius === 'number' ? t.cardRadius : 12,
      },
    };
  } catch {
    return null;
  }
}

function dispatch(taskId: string, updates: Partial<Task>) {
  void window.electronAPI?.dispatchTaskMenuAction({ taskId, updates });
}

function close() {
  void window.electronAPI?.closeTaskContextMenu();
}

export function TaskMenuPopup() {
  const payload = useMemo(readPayload, []);
  const [pane, setPane] = useState<Pane>('menu');
  const cardRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!cardRef.current) return;
    const el = cardRef.current;
    let raf = 0;
    const report = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = el.offsetHeight;
        if (h > 0) void window.electronAPI?.resizeTaskContextMenu(h + 32);
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
  }, [pane]);

  if (!payload) return <div className="tm-popup" />;

  const { task, allTags, theme } = payload;
  const themeClass = theme.themeId ? `theme-${theme.themeId}` : '';

  return (
    <div className={`tm-popup ${themeClass}`}>
      <div className="tm-card-shell" ref={cardRef}>
        <div className="tm-card" role="menu" aria-label="任务操作">
          {pane === 'menu' && <MenuPane task={task} onPick={(p) => (p === 'edit' || p === 'delete' ? handleTopAction(task, p) : setPane(p))} />}
          {pane === 'date' && <DatePane task={task} onBack={() => setPane('menu')} />}
          {pane === 'tag' && <TagPane task={task} allTags={allTags} onBack={() => setPane('menu')} />}
          {pane === 'subtask' && <SubtaskPane task={task} onBack={() => setPane('menu')} />}
        </div>
      </div>
    </div>
  );
}

function handleTopAction(task: Task, action: 'edit' | 'delete') {
  dispatch(task.id, { __action: action } as unknown as Partial<Task>);
}

function Icon({ path }: { path: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}
function CalendarIcon() { return <Icon path="M7 3v3M17 3v3M4 9h16M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5" />; }
function TagIcon() { return <Icon path="M20.5 13.5l-7 7a2 2 0 0 1-2.8 0L3 13V3h10l7.5 7.5a2 2 0 0 1 0 2.8z" />; }
function SubtaskIcon() { return <Icon path="M6 6h12M6 12h8M6 18h5M4 6h.01M4 12h.01M4 18h.01" />; }
function EditIcon() { return <Icon path="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />; }
function TrashIcon() { return <Icon path="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m1 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />; }
function ChevronRight() { return <svg className="tm-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>; }
function BackArrow() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>; }

function MenuPane({ task, onPick }: { task: Task; onPick: (pane: Pane | 'edit' | 'delete') => void }) {
  const activeDateCount = task.scheduledDates?.length || 0;
  const tagCount = task.tags?.length || 0;
  const subtaskCount = task.subtasks?.length || 0;
  return (
    <>
      <div className="tm-header tm-task-header">
        <span className="tm-header-text" title={task.text}>{task.text}</span>
      </div>
      <div className="tm-list">
        <button type="button" className="tm-item tm-item-strong" onClick={() => onPick('date')}>
          <span className="tm-item-icon"><CalendarIcon /></span>
          <span className="tm-item-label">设置日期</span>
          <span className="tm-item-hint">{activeDateCount ? `${activeDateCount} 个` : '设置/清除'}</span>
          <ChevronRight />
        </button>
        <button type="button" className="tm-item" onClick={() => onPick('subtask')}>
          <span className="tm-item-icon"><SubtaskIcon /></span>
          <span className="tm-item-label">添加子任务</span>
          <span className="tm-item-hint">{subtaskCount ? `${subtaskCount} 个` : '新建'}</span>
          <ChevronRight />
        </button>
        <button type="button" className="tm-item" onClick={() => onPick('tag')}>
          <span className="tm-item-icon"><TagIcon /></span>
          <span className="tm-item-label">编辑标签</span>
          <span className="tm-item-hint">{tagCount ? `${tagCount} 个` : '编辑'}</span>
          <ChevronRight />
        </button>
        <div className="tm-divider" />
        <button type="button" className="tm-item" onClick={() => onPick('edit')}>
          <span className="tm-item-icon"><EditIcon /></span>
          <span className="tm-item-label">编辑任务</span>
        </button>
        <button type="button" className="tm-item tm-item-danger" onClick={() => onPick('delete')}>
          <span className="tm-item-icon"><TrashIcon /></span>
          <span className="tm-item-label">删除任务</span>
        </button>
      </div>
    </>
  );
}

function fmtDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} ${week}`;
}

function DatePane({ task, onBack }: { task: Task; onBack: () => void }) {
  const [selectedDate, setSelectedDate] = useState('');
  const today = getBusinessDateKey();
  const tomorrow = shiftDateKey(today, 1);
  const nextWeek = shiftDateKey(today, 7);
  const activeDates = [...(task.scheduledDates || [])].sort();
  const active = new Set(activeDates);
  const setDates = (dates: string[]) => dispatch(task.id, { scheduledDates: dates.length ? Array.from(new Set(dates)).sort() : undefined });
  const toggleDate = (date: string) => {
    const next = active.has(date) ? activeDates.filter((d) => d !== date) : [...activeDates, date];
    setDates(next);
    close();
  };
  const removeDate = (date: string) => setDates(activeDates.filter((d) => d !== date));
  const quick = [
    { label: '今天', date: today },
    { label: '明天', date: tomorrow },
    { label: '下周', date: nextWeek },
  ];

  return (
    <>
      <PaneHeader title="日期" onBack={onBack} />
      <div className="tm-date-body">
        <div className="tm-quick-grid">
          {quick.map((q) => (
            <button key={q.label} type="button" className={`tm-quick-date ${active.has(q.date) ? 'tm-quick-date-active' : ''}`} onClick={() => toggleDate(q.date)}>
              <strong>{q.label}</strong>
              <span>{fmtDate(q.date)}</span>
            </button>
          ))}
        </div>
        {activeDates.length > 0 && (
          <div className="tm-date-section">
            <span className="tm-section-label">移除已选日期</span>
            <div className="tm-date-chips">
              {activeDates.map((date) => (
                <span key={date} className="tm-date-chip">
                  {fmtDate(date)}
                  <button type="button" className="tm-date-chip-remove" aria-label={`移除 ${fmtDate(date)}`} onClick={() => removeDate(date)}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}
        <label className="tm-field tm-date-picker-row">
          <span className="tm-section-label">选择具体日期</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedDate(value);
              if (value) toggleDate(value);
            }}
            className="tm-input"
            aria-label="选择日期"
          />
        </label>
        <button type="button" className="tm-item tm-item-danger tm-clear-date" onClick={() => { setDates([]); close(); }}>
          <span className="tm-item-label">清除日期</span>
        </button>
      </div>
    </>
  );
}

function SubtaskPane({ task, onBack }: { task: Task; onBack: () => void }) {
  const [text, setText] = useState('');
  const save = () => {
    const value = text.trim();
    if (!value) return;
    dispatch(task.id, { __action: 'addSubtask', text: value } as unknown as Partial<Task>);
  };
  return (
    <>
      <PaneHeader title="添加子任务" onBack={onBack} />
      <div className="tm-subtask-form">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save();
          }}
          className="tm-input tm-textarea"
          placeholder="写下下一步，可用 Ctrl+Enter 保存…"
          autoFocus
        />
        <button type="button" className="tm-btn-primary" onClick={save} disabled={!text.trim()}>添加子任务</button>
      </div>
    </>
  );
}

function TagPane({ task, allTags, onBack }: { task: Task; allTags: string[]; onBack: () => void }) {
  const [input, setInput] = useState('');
  const [tags, setTags] = useState(task.tags || []);
  const parseTags = (value: string) => value
    .split(/[,\s]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  const mergeTags = (current: string[], incoming: string[]) => Array.from(new Set([...current, ...incoming]));
  const addTags = (value: string) => {
    const nextTags = parseTags(value);
    if (nextTags.length) setTags((current) => mergeTags(current, nextTags));
  };
  const save = () => {
    const nextTags = mergeTags(tags, parseTags(input));
    dispatch(task.id, { tags: nextTags.length > 0 ? nextTags : undefined });
    close();
  };
  const suggestions = allTags.filter((t) => !tags.includes(t) && t.toLowerCase().includes(input.toLowerCase()));
  return (
    <>
      <PaneHeader title="标签" onBack={onBack} />
      <div className="tm-tag-body">
        {tags.length > 0 && <div className="tm-tag-chips">{tags.map((tag) => <span key={tag} className="tm-chip">{tag}<button type="button" className="tm-chip-x" aria-label={`移除 ${tag}`} onClick={() => setTags(tags.filter((t) => t !== tag))}>×</button></span>)}</div>}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTags(input);
              setInput('');
            } else if (e.key === 'Escape') save();
          }}
          placeholder="输入标签，回车添加…"
          className="tm-input"
          autoFocus
        />
        {suggestions.length > 0 && <div className="tm-suggest">{suggestions.slice(0, 6).map((tag) => <button key={tag} type="button" className="tm-suggest-chip" onClick={() => { addTags(tag); setInput(''); }}>{tag}</button>)}</div>}
      </div>
      <div className="tm-footer"><button type="button" className="tm-btn-primary" onClick={save}>保存</button></div>
    </>
  );
}

function PaneHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return <div className="tm-header tm-header-nav"><button type="button" className="tm-back" onClick={onBack} aria-label="返回"><BackArrow /></button><span className="tm-header-text">{title}</span></div>;
}
