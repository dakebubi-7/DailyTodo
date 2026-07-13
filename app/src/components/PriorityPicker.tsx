import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Task } from '../types/task';
import { usePriorityPickerPopover } from './priorityPicker/usePriorityPickerPopover';

interface PriorityPickerProps {
  value: Task['priority'];
  onChange: (priority: Task['priority']) => void;
  title?: string;
}

const priorities: Task['priority'][] = ['high', 'medium', 'low'];

const priorityMeta = {
  high: { label: '高', fullLabel: '高优先级', color: '#D35F5F', hint: '先做，别拖' },
  medium: { label: '中', fullLabel: '中优先级', color: '#E5A84B', hint: '正常推进' },
  low: { label: '低', fullLabel: '低优先级', color: '#5B9A8B', hint: '有空再做' },
};

export function PriorityPicker({ value, onChange, title = '调整优先级' }: PriorityPickerProps) {
  const { buttonRef, isOpen, popoverRef, position, togglePopover, closePopover } = usePriorityPickerPopover();

  return (
    <>
      <motion.button
        ref={buttonRef}
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        onClick={togglePopover}
        className="priority-dot-button"
        title={`${title}: ${priorityMeta[value].fullLabel}`}
        aria-label={`${title}: ${priorityMeta[value].fullLabel}`}
        aria-expanded={isOpen}
      >
        <span style={{ backgroundColor: priorityMeta[value].color }} />
      </motion.button>

      {isOpen && createPortal(
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: -4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.96 }}
          className="priority-popover"
          style={{ top: position.top, left: position.left }}
        >
          {priorities.map((priority) => (
            <button
              key={priority}
              type="button"
              onClick={() => {
                if (priority !== value) onChange(priority);
                closePopover();
              }}
              className={`priority-option ${value === priority ? 'priority-option-active' : ''}`}
            >
              <span className="priority-option-dot" style={{ backgroundColor: priorityMeta[priority].color }} />
              <span className="priority-option-copy">
                <strong>{priorityMeta[priority].fullLabel}</strong>
                <small>{priorityMeta[priority].hint}</small>
              </span>
              <span className="priority-option-mark">{value === priority ? '✓' : ''}</span>
            </button>
          ))}
        </motion.div>,
        document.body
      )}
    </>
  );
}
