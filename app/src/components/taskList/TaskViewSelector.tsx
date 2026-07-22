import { useState } from 'react';
import type { getShellText } from '../../i18n';
import type { TabType } from '../../types/task';

interface TaskViewSelectorProps {
  text: ReturnType<typeof getShellText>['app'];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const taskViewOptions: { value: TabType; textKey: 'todayTasks' | 'allTasks' | 'reviewTasks' }[] = [
  { value: 'today', textKey: 'todayTasks' },
  { value: 'all', textKey: 'allTasks' },
  { value: 'completed', textKey: 'reviewTasks' },
];

export function TaskViewSelector({ text, activeTab, onTabChange }: TaskViewSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeView = taskViewOptions.find((option) => option.value === activeTab) ?? taskViewOptions[0];

  return (
    <div className="task-view-menu">
      <button
        type="button"
        className={`task-view-launcher ${isOpen ? 'task-tool-active' : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        title={`${text.taskView}: ${text[activeView.textKey]}`}
        aria-label={`${text.taskView}: ${text[activeView.textKey]}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span>{text[activeView.textKey]}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      {isOpen && (
        <div className="task-view-menu-popover" role="menu" aria-label={text.taskView}>
          {taskViewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={activeTab === option.value}
              className={activeTab === option.value ? 'task-view-menu-item task-view-menu-item-active' : 'task-view-menu-item'}
              onClick={() => {
                onTabChange(option.value);
                setIsOpen(false);
              }}
            >
              {text[option.textKey]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
