import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';

function setAutoStartIfChanged(
  autoStartRef: MutableRefObject<boolean>,
  setAutoStart: Dispatch<SetStateAction<boolean>>,
  nextAutoStart: boolean,
) {
  if (autoStartRef.current === nextAutoStart) return;

  autoStartRef.current = nextAutoStart;
  setAutoStart(nextAutoStart);
}

export function RangeControl({
  label,
  hint,
  value,
  min,
  max,
  unit = '',
  onChange,
  onPreview,
  defaultValue,
  resetTitle,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
  /** Live visual preview while dragging; does not commit React personalization state. */
  onPreview?: (value: number) => void;
  defaultValue?: number;
  resetTitle?: string;
}) {
  const [draft, setDraft] = useState(value);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!draggingRef.current) {
      setDraft(value);
    }
  }, [value]);

  const commit = (next: number) => {
    setDraft(next);
    onChange(next);
  };

  const preview = (next: number) => {
    setDraft(next);
    if (onPreview) {
      onPreview(next);
      return;
    }
    onChange(next);
  };

  const handleReset = () => {
    if (typeof defaultValue !== 'number') return;
    draggingRef.current = false;
    commit(defaultValue);
  };
  const title = typeof defaultValue === 'number' ? resetTitle : undefined;

  return (
    <label className="settings-control" onDoubleClick={handleReset} title={title}>
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <div className="settings-range-row">
        <input
          className="settings-range-input"
          type="range"
          min={min}
          max={max}
          value={draft}
          onDoubleClick={handleReset}
          onPointerDown={() => {
            draggingRef.current = true;
          }}
          onPointerUp={(event) => {
            draggingRef.current = false;
            commit(Number(event.currentTarget.value));
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
          }}
          onInput={(event) => preview(Number(event.currentTarget.value))}
          onChange={(event) => {
            // Keyboard / accessibility path commits immediately.
            if (!draggingRef.current) {
              commit(Number(event.currentTarget.value));
            }
          }}
          title={title}
        />
        <b>{draft}{unit}</b>
      </div>
    </label>
  );
}

export function Field({
  label,
  value,
  onChange,
  multiline = false,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="settings-field">
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      {multiline ? (
        <textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

export function AutoStartToggle() {
  const [autoStart, setAutoStart] = useState(false);
  const autoStartRef = useRef(false);

  useEffect(() => {
    window.electronAPI?.getAutoStart().then((value) => setAutoStartIfChanged(autoStartRef, setAutoStart, value === true));
  }, []);

  const handleChange = (enabled: boolean) => {
    window.electronAPI?.setAutoStart(enabled).then((value) => {
      setAutoStartIfChanged(autoStartRef, setAutoStart, value === true);
    });
  };

  return (
    <button
      type="button"
      className={`settings-switch-row ${autoStart ? 'settings-switch-on' : ''}`}
      onClick={() => handleChange(!autoStart)}
      aria-pressed={autoStart}
    >
      <span>
        <strong>开机自启</strong>
        <small>启动系统时自动运行 Daily Todo</small>
      </span>
      <i aria-hidden="true" />
    </button>
  );
}

export function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`settings-switch-row ${checked ? 'settings-switch-on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <i aria-hidden="true" />
    </button>
  );
}
