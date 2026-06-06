import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Task } from '../types/task';

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
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const popoverWidth = 142;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - popoverWidth - 8);
    const top = rect.bottom + 8 > window.innerHeight - 132 ? rect.top - 138 : rect.bottom + 8;
    setPosition({ top: Math.max(8, top), left });
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleReposition = () => updatePosition();

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen]);

  return (
    <>
      <motion.button
        ref={buttonRef}
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen((prev) => !prev)}
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
                onChange(priority);
                setIsOpen(false);
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
