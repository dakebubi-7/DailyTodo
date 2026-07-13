import { memo } from 'react';
import { isPriorityFilter, type PriorityFilter } from '../../app/appTaskView';

export type { PriorityFilter };

interface TaskListToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
  showOpenOnly: boolean;
  onToggleOpenOnly: () => void;
  priorityFilter: PriorityFilter;
  onPriorityFilterChange: (value: PriorityFilter) => void;
  filtersActive: boolean;
  onClearFilters: () => void;
}

const priorityFilterLabel: Record<PriorityFilter, string> = {
  all: '\u5168\u90e8\u4f18\u5148\u7ea7',
  high: '\u9ad8\u4f18\u5148\u7ea7',
  medium: '\u4e2d\u4f18\u5148\u7ea7',
  low: '\u4f4e\u4f18\u5148\u7ea7',
};

export const TaskListToolbar = memo(function TaskListToolbar({
  searchQuery,
  onSearchChange,
  searchOpen,
  onToggleSearch,
  showOpenOnly,
  onToggleOpenOnly,
  priorityFilter,
  onPriorityFilterChange,
  filtersActive,
  onClearFilters,
}: TaskListToolbarProps) {
  return (
    <div className="task-toolbar">
      <div className="task-toolbar-row">
        <button
          type="button"
          onClick={onToggleSearch}
          className={`task-tool-icon ${searchOpen || filtersActive ? 'task-tool-active' : ''}`}
          title="\u641c\u7d22\u4e0e\u7b5b\u9009"
          aria-label="\u641c\u7d22\u4e0e\u7b5b\u9009"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onToggleOpenOnly}
          className={`task-filter-button ${showOpenOnly ? 'task-filter-active' : ''}`}
        >
          {'\u672a\u5b8c\u6210'}
        </button>

        <select
          value={priorityFilter}
          onChange={(event) => {
            if (!isPriorityFilter(event.target.value)) return;
            onPriorityFilterChange(event.target.value);
          }}
          className="task-filter-select"
          aria-label="\u4f18\u5148\u7ea7\u7b5b\u9009"
        >
          <option value="all">{'\u5168\u90e8\u4f18\u5148\u7ea7'}</option>
          <option value="high">{'\u9ad8\u4f18\u5148\u7ea7'}</option>
          <option value="medium">{'\u4e2d\u4f18\u5148\u7ea7'}</option>
          <option value="low">{'\u4f4e\u4f18\u5148\u7ea7'}</option>
        </select>

        {filtersActive && (
          <button
            type="button"
            onClick={onClearFilters}
            className="task-clear-filter"
            title={`\u6e05\u9664\u7b5b\u9009\uff1a${priorityFilterLabel[priorityFilter]}`}
          >
            {'\u6e05\u9664'}
          </button>
        )}
      </div>

      {(searchOpen || searchQuery.trim()) && (
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="task-search-input"
          placeholder="\u641c\u7d22\u4efb\u52a1..."
          aria-label="\u641c\u7d22\u4efb\u52a1"
        />
      )}
    </div>
  );
});
