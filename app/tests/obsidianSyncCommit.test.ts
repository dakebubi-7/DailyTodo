import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it } from 'vitest';
import type { ObsidianTemplateSettings } from '../shared/appSettings';
import {
  TASK_END_MARKER,
  TASK_START_MARKER,
  WORK_END_MARKER,
  WORK_START_MARKER,
} from '../shared/obsidianTemplates';
import { createObsidianDailyNoteSyncHelpers } from '../electron/obsidianSyncDailyNote';

const vaults: string[] = [];

afterEach(() => {
  vaults.splice(0).forEach((vault) => fs.rmSync(vault, { recursive: true, force: true }));
});

function createVault() {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-obsidian-sync-'));
  vaults.push(vault);
  return vault;
}

function createHelpers(vault: string, dailyPath = 'logs/daily/{{date}}.md') {
  const templates = {
    dailyPath,
    modules: {
      work: { enabled: true },
      inspiration: { enabled: false },
      tasks: { enabled: true },
    },
  } as ObsidianTemplateSettings;

  return createObsidianDailyNoteSyncHelpers({
    getDateKey: (date) => date ?? '2026-07-14',
    getVaultPath: () => vault,
    getTemplates: () => templates,
    buildDailyTemplate: (date) => `---\ndate: ${date}\n---\n\n用户内容：保留\n`,
    buildWorkBlock: (work) => `${WORK_START_MARKER}\n## Work\n${work || '-'}\n${WORK_END_MARKER}`,
    buildInspirationBlock: (inspiration) => inspiration,
    buildTaskBlock: (date) => `${TASK_START_MARKER}\n## Tasks\n- ${date}\n${TASK_END_MARKER}`,
    migrateLegacyInspirationSection: (existing) => existing,
    upsertMarkedBlock: (existing, start, end, block) => {
      const startIndex = existing.indexOf(start);
      const endIndex = existing.indexOf(end);
      if (startIndex !== -1 && endIndex > startIndex) {
        return `${existing.slice(0, startIndex)}${block}${existing.slice(endIndex + end.length)}`;
      }
      return `${existing.trimEnd()}\n\n${block}\n`;
    },
    readMarkedBlockBody: () => '',
    migrateLegacyWorkSection: (existing) => existing,
  });
}

describe('Obsidian daily-note conditional commits', () => {
  it('preflights every date before committing and leaves the vault untouched when one target is a directory', () => {
    const vault = createVault();
    const helpers = createHelpers(vault);
    const first = helpers.getDailyFilePath('2026-07-13');
    const second = helpers.getDailyFilePath('2026-07-14');
    fs.mkdirSync(path.dirname(first), { recursive: true });
    fs.writeFileSync(first, '用户内容：不应被提前写入\n', 'utf-8');
    fs.mkdirSync(second);

    assert.throws(
      () => helpers.prepareDailyNoteSync([], ['2026-07-13', '2026-07-14'], '2026-07-14', 'today', ''),
      /Daily note target must be a file/,
    );
    assert.equal(fs.readFileSync(first, 'utf-8'), '用户内容：不应被提前写入\n');
  });

  it('uses the read stamp to reject external modifications and deletions without overwriting them', () => {
    const vault = createVault();
    const helpers = createHelpers(vault);
    const file = helpers.getDailyFilePath('2026-07-14');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '原始用户内容\n', 'utf-8');

    const [plan] = helpers.prepareDailyNoteSync([], ['2026-07-14'], '2026-07-14', 'today', '');
    fs.writeFileSync(file, '外部修改内容\n', 'utf-8');
    assert.throws(() => helpers.commitDailyNoteSync([plan], '2026-07-14'), /changed externally|conflict/i);
    assert.equal(fs.readFileSync(file, 'utf-8'), '外部修改内容\n');

    const [deletedPlan] = helpers.prepareDailyNoteSync([], ['2026-07-14'], '2026-07-14', 'today', '');
    fs.rmSync(file);
    assert.throws(() => helpers.commitDailyNoteSync([deletedPlan], '2026-07-14'), /deleted externally|conflict/i);
    assert.equal(fs.existsSync(file), false);
  });

  it('creates changed notes, skips unchanged content, preserves non-ASCII user content, and reports marker warnings in previews', () => {
    const vault = createVault();
    const helpers = createHelpers(vault);
    const file = helpers.getDailyFilePath('2026-07-14');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `---\n标题: 中文\n---\n\n嵌入: ![[图片.png]]\n${TASK_START_MARKER}\n损坏区块\n`, 'utf-8');

    const [firstPlan] = helpers.prepareDailyNoteSync([], ['2026-07-14'], '2026-07-14', 'today', '');
    assert.equal(firstPlan.markerWarnings.length, 1);
    helpers.commitDailyNoteSync([firstPlan], '2026-07-14');
    assert.match(fs.readFileSync(file, 'utf-8'), /标题: 中文[\s\S]*!\[\[图片\.png\]\]/);

    const healthyFile = helpers.getDailyFilePath('2026-07-15');
    fs.writeFileSync(
      healthyFile,
      `保留内容\n\n${WORK_START_MARKER}\n## Work\ntoday\n${WORK_END_MARKER}\n\n${TASK_START_MARKER}\n## Tasks\n- 2026-07-15\n${TASK_END_MARKER}\n`,
      'utf-8',
    );
    const [unchangedPlan] = helpers.prepareDailyNoteSync([], ['2026-07-15'], '2026-07-15', 'today', '');
    assert.equal(unchangedPlan.didWrite, false);
    helpers.commitDailyNoteSync([unchangedPlan], '2026-07-14');
    assert.equal(fs.readdirSync(path.dirname(file)).some((name) => name.includes('.tmp-')), false);
  });
});
