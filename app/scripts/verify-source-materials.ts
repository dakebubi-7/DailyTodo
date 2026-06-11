import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  collectDailySourcesForDates,
  collectMonthlySources,
  hasSourceMaterials,
  NO_SOURCE_MATERIALS_ERROR,
} from '../shared/aiReview/sourceMaterials';

const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-sources-'));
fs.mkdirSync(path.join(vault, 'logs/daily/DailyTodo'), { recursive: true });
fs.mkdirSync(path.join(vault, 'logs/weekly-review'), { recursive: true });
fs.writeFileSync(path.join(vault, 'logs/daily/DailyTodo/2026-06-08.md'), 'daily 08');
fs.writeFileSync(path.join(vault, 'logs/weekly-review/2026-W24.md'), 'weekly 24');

const daily = collectDailySourcesForDates({
  vaultPath: vault,
  dates: ['2026-06-08', '2026-06-09'],
  rules: [{ id: 'daily-note-path', label: 'Daily', path: 'logs/daily/DailyTodo/{{date}}.md', enabled: true }],
});
assert.deepEqual(daily.map((source) => source.date), ['2026-06-08']);
assert.ok(daily[0].filePath.endsWith('2026-06-08.md'));
assert.equal(daily[0].content, 'daily 08');
assert.equal(hasSourceMaterials(daily), true);
assert.equal(hasSourceMaterials([]), false);
assert.equal(NO_SOURCE_MATERIALS_ERROR.zh, '没有找到本周期原始记录，请检查素材来源或手动选择素材文件。');

assert.throws(() => collectDailySourcesForDates({
  vaultPath: vault,
  dates: ['2026-06-08'],
  rules: [{ id: 'escape', label: 'Escape', path: '../outside/{{date}}.md', enabled: true }],
}), /escapes|outside/i);

const monthlyFromWeekly = collectMonthlySources({
  vaultPath: vault,
  month: '2026-06',
  weeklyDir: 'logs/weekly-review',
  dailyRules: [{ id: 'daily-note-path', label: 'Daily', path: 'logs/daily/DailyTodo/{{date}}.md', enabled: true }],
  mode: 'weekly-then-daily',
});
assert.ok(monthlyFromWeekly.some((source) => source.label === '2026-W24 周报'));

const monthlyFromDaily = collectMonthlySources({
  vaultPath: vault,
  month: '2026-06',
  weeklyDir: 'missing-weekly',
  dailyRules: [{ id: 'daily-note-path', label: 'Daily', path: 'logs/daily/DailyTodo/{{date}}.md', enabled: true }],
  mode: 'weekly-then-daily',
});
assert.ok(monthlyFromDaily.some((source) => source.label === '2026-06-08 日报'));

// weekly-reports mode never falls back to daily even when empty.
const monthlyWeeklyOnly = collectMonthlySources({
  vaultPath: vault,
  month: '2026-06',
  weeklyDir: 'missing-weekly',
  dailyRules: [{ id: 'daily-note-path', label: 'Daily', path: 'logs/daily/DailyTodo/{{date}}.md', enabled: true }],
  mode: 'weekly-reports',
});
assert.equal(monthlyWeeklyOnly.length, 0);

// manual-files mode returns nothing automatically.
const monthlyManual = collectMonthlySources({
  vaultPath: vault,
  month: '2026-06',
  weeklyDir: 'logs/weekly-review',
  dailyRules: [{ id: 'daily-note-path', label: 'Daily', path: 'logs/daily/DailyTodo/{{date}}.md', enabled: true }],
  mode: 'manual-files',
});
assert.equal(monthlyManual.length, 0);

console.log('verify-source-materials ok');
