// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getShellText } from '../src/i18n';
import { AiAccountManager } from '../src/components/settings/AiAccountManager';
import { createDefaultAiProfile, type AiProfile } from '../shared/aiReview/aiReviewSettings';

const text = getShellText('en-US').settings.aiReview;

afterEach(cleanup);

describe('AI account manager', () => {
  it('keeps the empty manager usable so adding the first account shows its details', () => {
    let profiles: AiProfile[] = [];
    let activeId = '';
    let editingId = '';
    const rerenderRef: { current?: ReturnType<typeof render>['rerender'] } = {};
    const addAccount = () => {
      const next = { ...createDefaultAiProfile(), id: 'profile-first', name: 'First account' };
      profiles = [next];
      activeId = next.id;
      editingId = next.id;
      rerenderRef.current?.(
        <AiAccountManager
          text={text}
          profiles={profiles}
          activeId={activeId}
          editingId={editingId}
          onSelectEditing={(id) => { editingId = id; }}
          onSetActive={(id) => { activeId = id; }}
          onUpdate={() => {}}
          onUpdateInput={() => {}}
          onAdd={addAccount}
          onDuplicate={() => {}}
          onDelete={() => {}}
          onClose={() => {}}
        />,
      );
    };

    const view = render(
      <AiAccountManager
        text={text}
        profiles={profiles}
        activeId={activeId}
        editingId={editingId}
        onSelectEditing={(id) => { editingId = id; }}
        onSetActive={(id) => { activeId = id; }}
        onUpdate={() => {}}
        onUpdateInput={() => {}}
        onAdd={addAccount}
        onDuplicate={() => {}}
        onDelete={() => {}}
        onClose={() => {}}
      />,
    );
    rerenderRef.current = view.rerender;

    fireEvent.click(screen.getAllByRole('button', { name: text.accountAdd })[0]!);

    expect(screen.getByDisplayValue('https://api.openai.com/v1')).not.toBeNull();
    expect(screen.getByDisplayValue('First account')).not.toBeNull();
  });
});
