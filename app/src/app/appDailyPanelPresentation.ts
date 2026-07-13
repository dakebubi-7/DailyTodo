export function hasDailyPanelContent(value: string) {
  return value.trim().length > 0;
}

export function getDailyPanelTabClassName(hasContent: boolean, isOpen: boolean) {
  return `daily-panel-tab ${hasContent ? 'daily-panel-has-content' : ''} ${isOpen ? 'daily-panel-tab-active' : ''}`;
}

export function getDailyPanelTabTitle(editLabel: string, hasContent: boolean) {
  return hasContent ? `${editLabel}: has content` : editLabel;
}
