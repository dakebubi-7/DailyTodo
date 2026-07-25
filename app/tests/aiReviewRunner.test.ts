import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runReviewForFile } from '../electron/aiReview/runner';
import { customBlockMarker, REVIEW_MARKERS, readBlockBody } from '../shared/aiReview/markers';
import { createDefaultSections, type CustomBlock } from '../shared/aiReview/sectionConfig';

const temporaryDirectories: string[] = [];

function createReviewFile(lines: string[]) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-ai-review-'));
  temporaryDirectories.push(directory);
  const filePath = path.join(directory, '2026-07-20.md');
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return filePath;
}

function reviewBlockLines(body = '') {
  return [
    '# 2026-07-20',
    '## Review',
    REVIEW_MARKERS.REVIEW.start,
    body,
    REVIEW_MARKERS.REVIEW.end,
  ];
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('AI review file runner', () => {
  it('reports a provider failure when every requested AI block fails', async () => {
    const filePath = createReviewFile(reviewBlockLines());

    const result = await runReviewForFile({
      filePath,
      date: '2026-07-20',
      tasks: [],
      sections: createDefaultSections().filter((section) => section.markerKey === 'REVIEW'),
      callLlm: async () => ({ ok: false as const, error: 'provider unavailable' }),
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('provider unavailable');
    expect(result).toMatchObject({
      failedMarkers: [{ key: 'REVIEW', error: 'provider unavailable' }],
    });
  });

  it('writes successful blocks and exposes a warning when another requested block fails', async () => {
    const filePath = createReviewFile([
      '# 2026-07-20',
      '## Review',
      REVIEW_MARKERS.REVIEW.start,
      REVIEW_MARKERS.REVIEW.end,
      '## Knowledge',
      REVIEW_MARKERS.KNOWLEDGE.start,
      REVIEW_MARKERS.KNOWLEDGE.end,
    ]);

    let callCount = 0;
    const result = await runReviewForFile({
      filePath,
      date: '2026-07-20',
      tasks: [],
      sections: createDefaultSections().filter((section) => section.markerKey !== 'TOMORROW'),
      callLlm: async () => {
        callCount += 1;
        return callCount === 2
          ? { ok: false as const, error: 'knowledge provider unavailable' }
          : { ok: true as const, content: 'Regenerated review' };
      },
    });

    expect(result).toMatchObject({
      ok: true,
      failedMarkers: [{ key: 'KNOWLEDGE', error: 'knowledge provider unavailable' }],
    });
    expect(result.warning).toContain('knowledge provider unavailable');
    expect(readBlockBody(fs.readFileSync(filePath, 'utf8'), REVIEW_MARKERS.REVIEW)).toContain('Regenerated review');
  });

  it('overwrites a user-edited managed block after the user confirms regeneration', async () => {
    const filePath = createReviewFile(reviewBlockLines('User changed this review'));

    const result = await runReviewForFile({
      filePath,
      date: '2026-07-20',
      tasks: [],
      force: true,
      sections: createDefaultSections().filter((section) => section.markerKey === 'REVIEW'),
      callLlm: async () => ({ ok: true as const, content: 'Regenerated review' }),
    });

    expect(result.ok).toBe(true);
    expect(readBlockBody(fs.readFileSync(filePath, 'utf8'), REVIEW_MARKERS.REVIEW)).toContain('Regenerated review');
  });

  it('keeps an explicitly frozen block even after regeneration is confirmed', async () => {
    const filePath = createReviewFile(reviewBlockLines('<!-- DAILYTODO:FREEZE -->\nKeep this'));
    const callLlm = vi.fn(async () => ({ ok: true as const, content: 'Should not be written' }));

    const result = await runReviewForFile({
      filePath,
      date: '2026-07-20',
      tasks: [],
      force: true,
      sections: createDefaultSections().filter((section) => section.markerKey === 'REVIEW'),
      callLlm,
    });

    expect(result.ok).toBe(true);
    expect(result.skippedMarkers).toEqual(['REVIEW']);
    expect(callLlm).not.toHaveBeenCalled();
    expect(readBlockBody(fs.readFileSync(filePath, 'utf8'), REVIEW_MARKERS.REVIEW)).toContain('Keep this');
  });

  it('projects tomorrow work from the reviewed date instead of every open task', async () => {
    const tomorrowBlock = {
      id: 'tomorrow',
      name: 'Tomorrow',
      aiGenerate: true,
      renderType: 'list',
      prompt: '',
      contentSource: 'tomorrowProjection',
    } as CustomBlock;
    const marker = customBlockMarker(tomorrowBlock.id);
    const filePath = createReviewFile([
      '# 2026-07-20',
      '## Tomorrow',
      marker.start,
      marker.end,
    ]);
    const callLlm = vi.fn(async () => ({ ok: true as const, content: 'This should not be used' }));

    const result = await runReviewForFile({
      filePath,
      date: '2026-07-20',
      tasks: [
        { id: 'today', completed: false, taskDate: '2026-07-20', text: 'Finish the reviewed task' },
        { id: 'other-day', completed: false, taskDate: '2026-07-21', text: 'Unrelated future task' },
        { id: 'cleared', completed: false, cleared: true, taskDate: '2026-07-20', text: 'Hidden task' },
        {
          id: 'carryover',
          completed: false,
          taskDate: '2026-07-21',
          carriedFromDate: '2026-07-20',
          carriedFromTaskId: 'today',
          text: 'Finish the reviewed task',
          nextStep: 'Write the release notes',
        },
      ],
      sections: [],
      customBlocks: [tomorrowBlock],
      callLlm,
    });

    expect(result.ok).toBe(true);
    expect(callLlm).not.toHaveBeenCalled();
    const body = readBlockBody(fs.readFileSync(filePath, 'utf8'), marker);
    expect(body).toContain('Write the release notes');
    expect(body).not.toContain('Unrelated future task');
    expect(body).not.toContain('Hidden task');
  });
});
