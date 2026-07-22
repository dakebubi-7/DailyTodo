import { memo, useState } from 'react';
import type { getShellText } from '../../i18n';
import { getDailyPanelTabClassName, getDailyPanelTabTitle } from '../../app/appDailyPanelPresentation';
import { isPriorityFilter, type PriorityFilter } from '../../app/appTaskView';
import type { TabType } from '../../types/task';
import { TaskViewSelector } from './TaskViewSelector';

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
  text: ReturnType<typeof getShellText>['app'];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasDailyWorkContent: boolean;
  hasDailyInspirationContent: boolean;
  isDailyWorkOpen: boolean;
  isInspirationOpen: boolean;
  onToggleDailyWorkPanel: () => void;
  onToggleInspirationPanel: () => void;
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
  text,
  activeTab,
  onTabChange,
  hasDailyWorkContent,
  hasDailyInspirationContent,
  isDailyWorkOpen,
  isInspirationOpen,
  onToggleDailyWorkPanel,
  onToggleInspirationPanel,
}: TaskListToolbarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="task-toolbar">
      <div className="task-toolbar-row">
        <div className="task-toolbar-tools">
          <button
            type="button"
            onClick={onToggleSearch}
            className={`task-tool-icon ${searchOpen ? 'task-tool-active' : ''}`}
            title={text.searchTasks}
            aria-label={text.searchTasks}
            aria-pressed={searchOpen}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </button>
          <button
            type="button"
            className={`task-tool-icon task-filter-launcher ${isFilterOpen || filtersActive ? 'task-tool-active' : ''}`}
            onClick={() => setIsFilterOpen((open) => !open)}
            title={text.filterTasks}
            aria-label={text.filterTasks}
            aria-pressed={isFilterOpen}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
              <path d="M4 6h16" />
              <path d="M7 12h10" />
              <path d="M10 18h4" />
            </svg>
          </button>
          <TaskViewSelector text={text} activeTab={activeTab} onTabChange={onTabChange} />
        </div>

        <div className="task-daily-actions">
          <button
            type="button"
            className={`task-daily-action ${getDailyPanelTabClassName(hasDailyWorkContent, isDailyWorkOpen)}`}
            onClick={onToggleDailyWorkPanel}
            aria-pressed={isDailyWorkOpen}
            aria-label={text.dailyWork}
            title={getDailyPanelTabTitle(text.editDailyWork, hasDailyWorkContent)}
          >
            {text.dailyWork}{hasDailyWorkContent && <span className="daily-panel-dot" aria-hidden="true" />}
          </button>
          <button
            type="button"
            className={`task-daily-action ${getDailyPanelTabClassName(hasDailyInspirationContent, isInspirationOpen)}`}
            onClick={onToggleInspirationPanel}
            aria-pressed={isInspirationOpen}
            aria-label={text.inspiration}
            title={getDailyPanelTabTitle(text.editInspiration, hasDailyInspirationContent)}
          >
            {text.inspiration}{hasDailyInspirationContent && <span className="daily-panel-dot" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="task-filter-controls">
          <button
            type="button"
            onClick={onToggleOpenOnly}
            className={`task-filter-button ${showOpenOnly ? 'task-filter-active' : ''}`}
            aria-pressed={showOpenOnly}
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
              title={`${text.clearFilters}: ${priorityFilterLabel[priorityFilter]}`}
            >
              {text.clearFilters}
            </button>
          )}
        </div>
      )}

      {(searchOpen || searchQuery.trim()) && (
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="task-search-input"
          placeholder={`${text.searchTasks}...`}
          aria-label={text.searchTasks}
        />
      )}
    </div>
  );
});
