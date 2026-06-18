import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { parseQuickCapture } from '../../shared/quickCapture';
import { Task, TaskSource } from '../types/task';
import { PriorityPicker } from './PriorityPicker';

interface AddTaskInputProps {
  onAdd: (text: string, priority: Task['priority'], source: TaskSource) => void;
}

// 高 → 中 → 低，↑ 提高一级、↓ 降低一级。
const PRIORITY_ORDER: Task['priority'][] = ['high', 'medium', 'low'];

const sourceLabels: Record<TaskSource, string> = {
  personal: '个人',
  external: '外部',
};

const sourceTitles: Record<TaskSource, string> = {
  personal: '个人任务',
  external: '外部任务',
};

export function AddTaskInput({ onAdd }: AddTaskInputProps) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [source, setSource] = useState<TaskSource>('personal');

  const parsed = useMemo(() => parseQuickCapture(text), [text]);
  const effectivePriority = parsed.priority || priority;
  const effectiveSource: TaskSource = parsed.sourceLabel === '外部' ? 'external' : source;
  const showQuickCapturePreview = Boolean(text.trim());
  const showQuickCaptureError = showQuickCapturePreview && !parsed.title;

  const toggleSource = () => {
    setSource((prev) => (prev === 'personal' ? 'external' : 'personal'));
  };

  const handleSubmit = () => {
    const nextText = parsed.title || text.trim();
    if (!nextText || showQuickCaptureError) return;

    onAdd(nextText, effectivePriority, effectiveSource);
    setText('');
    setPriority('medium');
    setSource('personal');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
      return;
    }

    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      toggleSource();
      return;
    }

    // Alt+1/2/3 直接设为 高/中/低。加 Alt 修饰键，避免和直接输入数字冲突。
    if (event.altKey && (event.key === '1' || event.key === '2' || event.key === '3')) {
      event.preventDefault();
      setPriority(PRIORITY_ORDER[Number(event.key) - 1]);
      return;
    }

    // ↑↓ 调整待添加任务的优先级。单行输入里上下键本无默认行为，不会和打字冲突。
    // （裸 1/2/3、←→ 会和输入数字 / 移动光标冲突，故用 Alt+数字 代替。）
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      setPriority((prev) => {
        const i = PRIORITY_ORDER.indexOf(prev);
        const nextIndex = event.key === 'ArrowUp'
          ? Math.max(0, i - 1)
          : Math.min(PRIORITY_ORDER.length - 1, i + 1);
        return PRIORITY_ORDER[nextIndex];
      });
    }
  };

  return (
    <div className="add-task">
      <div className="add-task-inner">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="添加一个要推进的小任务..."
          className="add-task-input"
          aria-label="添加新任务（Alt+S 切换个人/外部，↑↓ 或 Alt+1/2/3 调整优先级）"
          title="回车添加；Alt+S 切换个人/外部；↑↓ 或 Alt+1/2/3 调整优先级"
        />

        <button
          type="button"
          onClick={toggleSource}
          className="source-toggle-button"
          data-source={source}
          aria-label={`当前来源：${sourceTitles[source]}，点击切换`}
          title="Alt+S 切换个人 / 外部"
        >
          {sourceLabels[source]}
        </button>

        <PriorityPicker value={effectivePriority} onChange={setPriority} title="选择新任务优先级" />

        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleSubmit}
          className="add-task-button"
          aria-label="添加任务"
          title="添加任务"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </motion.button>
      </div>

      {showQuickCapturePreview && (
        <div className="quick-capture-preview" aria-live="polite">
          {showQuickCaptureError ? (
            <span className="quick-capture-error">请输入任务内容</span>
          ) : (
            <>
              <span>任务：{parsed.title}</span>
              {parsed.dateIntent && <span>日期：{parsed.dateIntent.label}</span>}
              <span>优先级：{effectivePriority === 'high' ? '高' : effectivePriority === 'medium' ? '中' : '低'}</span>
              {parsed.sourceLabel && <span>来源：{parsed.sourceLabel}</span>}
              {parsed.tags.length > 0 && <span>标签：{parsed.tags.join('、')}</span>}
              {parsed.timeIntent && <span>时间：{parsed.timeIntent}</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
