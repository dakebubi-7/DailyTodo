// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReviewView } from '../src/components/ReviewView';
import { getShellText } from '../src/i18n';

afterEach(cleanup);

describe('ReviewView', () => {
  it('keeps the task view menu available so a review can switch back to today', () => {
    const onTabChange = vi.fn();
    render(
      <ReviewView
        allTasks={[]}
        text={getShellText('en-US').app}
        activeTab="completed"
        onTabChange={onTabChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /task view: review/i }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: /today/i }));

    expect(onTabChange).toHaveBeenCalledWith('today');
  });
});
