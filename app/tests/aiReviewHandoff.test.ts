import { describe, expect, it } from 'vitest';
import {
  buildDailyReviewMessages,
  buildHandoffMessages,
  parseAiDailyReviewSuggestion,
  parseAiHandoff,
} from '../shared/aiReview/handoff';

describe('AI review handoff protocol', () => {
  it('accepts a strict JSON handoff without reading review markdown', () => {
    const handoff = parseAiHandoff(JSON.stringify({
      status: 'partial',
      progressSummary: 'Release implementation is complete',
      blocker: '',
      nextStep: 'Write the release notes',
      shouldCarryForward: true,
    }));

    expect(handoff).toMatchObject({
      status: 'partial',
      nextStep: 'Write the release notes',
      shouldCarryForward: true,
      source: 'ai',
    });
    expect(handoff?.createdAt).toEqual(expect.any(String));
  });

  it('accepts JSON fenced by the model and rejects vague carryover next steps', () => {
    expect(parseAiHandoff('```json\n{"status":"blocked","progressSummary":"Waiting for review","blocker":"Approval is pending","nextStep":"继续推进","shouldCarryForward":true}\n```')).toBeUndefined();
  });

  it('rejects malformed and overlong handoffs instead of throwing', () => {
    expect(parseAiHandoff('{"status":"unknown"}')).toBeUndefined();
    expect(parseAiHandoff(JSON.stringify({
      status: 'partial',
      progressSummary: 'a'.repeat(41),
      blocker: '',
      nextStep: 'Write notes',
      shouldCarryForward: false,
    }))).toBeUndefined();
  });

  it('builds a protocol request from structured task state only', () => {
    const messages = buildHandoffMessages({
      date: '2026-07-20',
      task: {
        id: 'task-1',
        text: 'Ship the release',
        nextStep: 'Finish release notes',
        carryoverContext: { nextStep: 'Review the QA checklist' },
      },
    });

    expect(messages).toHaveLength(2);
    expect(messages[1]?.content).toContain('Ship the release');
    expect(messages[1]?.content).not.toContain('review markdown');
  });

  it('builds an evidence-first daily review prompt and parses one task suggestion', () => {
    const messages = buildDailyReviewMessages({
      sourceDate: '2026-07-25',
      task: {
        id: 'task-1',
        text: 'Ship the release',
        completed: false,
        review: {
          status: 'partial',
          percent: 70,
          summary: 'Login flow is implemented',
          unknowns: 'Test environment startup fails',
          nextStep: 'Diagnose startup error, then add login-flow tests',
          reviewedAt: '2026-07-25T18:00:00.000Z',
        },
        carryoverContext: {
          progressSummary: 'Started test setup',
          blocker: '',
          nextStep: 'Repair the local environment',
        },
        wasFocus: true,
      },
    });

    expect(messages[0]?.content).toContain('Do not invent facts');
    expect(messages[0]?.content).toContain('no suggested action');
    expect(messages[1]?.content).toContain('70%');
    expect(messages[1]?.content).toContain('Test environment startup fails');
    expect(messages[1]?.content).toContain("Yesterday's Focus: yes");
    expect(parseAiDailyReviewSuggestion(JSON.stringify({
      progressSummary: 'Login flow is implemented; test setup is blocked.',
      blocker: 'Test environment startup fails',
      suggestedAction: 'Diagnose the startup error, then add login-flow tests.',
      shouldCarryForward: true,
    }), '2026-07-26T08:00:00.000Z')).toEqual({
      progressSummary: 'Login flow is implemented; test setup is blocked.',
      blocker: 'Test environment startup fails',
      suggestedAction: 'Diagnose the startup error, then add login-flow tests.',
      shouldCarryForward: true,
      createdAt: '2026-07-26T08:00:00.000Z',
    });
  });
});
