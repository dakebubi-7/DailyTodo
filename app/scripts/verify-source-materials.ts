import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  collectDailySourcesForDates,
  collectMonthlySources,
  hasSourceMaterials,
  NO_SOURCE_MATERIALS_ERROR,
  readAiReviewSourceMaterialsResult,
} from '../shared/aiReview/sourceMaterials';
import { dateKeyToLocalDate } from '../shared/pathTemplate';

const localDate = dateKeyToLocalDate('2026-06-08');
assert.equal(localDate.getFullYear(), 2026, 'date-key conversion should preserve the local calendar year.');
assert.equal(localDate.getMonth(), 5, 'date-key conversion should preserve the local calendar month.');
assert.equal(localDate.getDate(), 8, 'date-key conversion should preserve the local calendar day.');

const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-sources-'));
fs.mkdirSync(path.join(vault, 'logs/daily/DailyTodo'), { recursive: true });
fs.mkdirSync(path.join(vault, 'logs/daily/2026/06'), { recursive: true });
fs.mkdirSync(path.join(vault, 'logs/weekly-review'), { recursive: true });
fs.writeFileSync(path.join(vault, 'logs/daily/DailyTodo/2026-06-08.md'), 'daily 08');
fs.writeFileSync(path.join(vault, 'logs/daily/2026/06/2026-06-08.md'), 'daily nested 08');
fs.writeFileSync(path.join(vault, 'logs/weekly-review/2026-W24.md'), 'weekly 24');
const outsideWeeklyDir = path.resolve(vault, '..', 'outside-weekly');
fs.mkdirSync(outsideWeeklyDir, { recursive: true });
fs.writeFileSync(path.join(outsideWeeklyDir, '2026-W24.md'), 'outside weekly 24');

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

const nestedDaily = collectDailySourcesForDates({
  vaultPath: vault,
  dates: ['2026-06-08'],
  rules: [{ id: 'nested-daily-path', label: 'Daily', path: 'logs/daily/{{YEAR}}/{{Month}}/{{ DATE }}.md', enabled: true }],
});
assert.deepEqual(
  nestedDaily.map((source) => source.content),
  ['daily nested 08'],
  'AI Review daily source paths should expand the same whitespace/case-tolerant date variables as Obsidian daily paths.',
);

fs.mkdirSync(path.join(vault, 'logs/daily/DailyTodo/2026-06-09.md'), { recursive: true });
assert.doesNotThrow(() => {
  const dailyWithDirectoryCandidate = collectDailySourcesForDates({
    vaultPath: vault,
    dates: ['2026-06-08', '2026-06-09'],
    rules: [{ id: 'daily-note-path', label: 'Daily', path: 'logs/daily/DailyTodo/{{date}}.md', enabled: true }],
  });
  assert.deepEqual(
    dailyWithDirectoryCandidate.map((source) => source.date),
    ['2026-06-08'],
    'AI Review daily source collection should skip directory candidates and keep valid files.',
  );
}, 'AI Review daily source collection should not throw when a rendered source path is a directory');

assert.equal(NO_SOURCE_MATERIALS_ERROR.zh, '没有找到本周期原始记录，请检查素材来源或手动选择素材文件。');

assert.throws(() => collectDailySourcesForDates({
  vaultPath: vault,
  dates: ['2026-06-08'],
  rules: [{ id: 'escape', label: 'Escape', path: '../outside/{{date}}.md', enabled: true }],
}), /escapes|outside/i);


assert.throws(() => collectDailySourcesForDates({
  vaultPath: vault,
  dates: ['2026-06-08'],
  rules: [{ id: 'absolute-windows', label: 'Absolute', path: 'C:/secret/{{date}}.md', enabled: true }],
}), /relative to the vault/i);

const monthlyFromWeekly = collectMonthlySources({
  vaultPath: vault,
  month: '2026-06',
  weeklyDir: 'logs/weekly-review',
  dailyRules: [{ id: 'daily-note-path', label: 'Daily', path: 'logs/daily/DailyTodo/{{date}}.md', enabled: true }],
  mode: 'weekly-then-daily',
});
assert.ok(monthlyFromWeekly.some((source) => source.label === '2026-W24 周报'));

fs.mkdirSync(path.join(vault, 'reports', 'weekly', '2026'), { recursive: true });
fs.writeFileSync(path.join(vault, 'reports', 'weekly', '2026', '2026-W24.md'), 'templated weekly 24');
const monthlyFromWeeklyTemplate = collectMonthlySources({
  vaultPath: vault,
  month: '2026-06',
  weeklyPathTemplate: 'reports/weekly/{{year}}/{{year}}-W{{week}}.md',
  dailyRules: [],
  mode: 'weekly-reports',
});
assert.ok(
  monthlyFromWeeklyTemplate.some((source) => source.content === 'templated weekly 24'),
  'monthly source lookup should expand the weekly report path template for each ISO week',
);


assert.throws(() => collectMonthlySources({
  vaultPath: vault,
  month: '2026-06',
  weeklyDir: '../outside-weekly',
  dailyRules: [],
  mode: 'weekly-reports',
}), /escapes|relative to the vault/i);

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


assert.deepEqual(
  readAiReviewSourceMaterialsResult({
    ok: true,
    sources: [{ label: 'Daily', filePath: 'C:/vault/a.md' }],
  }),
  {
    ok: true,
    sources: [{ label: 'Daily', filePath: 'C:/vault/a.md' }],
  },
);
assert.equal(
  readAiReviewSourceMaterialsResult({ ok: true, sources: [{ label: 'Daily' }] }),
  undefined,
);
assert.equal(readAiReviewSourceMaterialsResult(null), undefined);

const sourceMaterialsSource = fs.readFileSync(
  path.join(process.cwd(), 'shared/aiReview/sourceMaterials.ts'),
  'utf8',
);
assert.match(
  sourceMaterialsSource,
  /const enabledRules = params\.rules\.filter\(\(rule\) => rule\.enabled\);/,
  'daily source collection should filter enabled rules once before processing dates.',
);
assert.match(
  sourceMaterialsSource,
  /for \(const date of params\.dates\) \{\s*for \(const rule of enabledRules\) \{/,
  'daily source collection should reuse enabled rules for every date.',
);
assert.doesNotMatch(
  sourceMaterialsSource,
  /for \(const date of params\.dates\) \{\s*for \(const rule of params\.rules\.filter/,
  'daily source collection should not filter rules repeatedly for each date.',
);
assert.match(sourceMaterialsSource, /import \{ isObjectRecord \} from '\.\.\/unknownValueGuards';/, 'source-material result parsing should reuse the shared object-record guard.');
assert.doesNotMatch(sourceMaterialsSource, /function isObject\(value: unknown\)/, 'source-material result parsing should not redeclare the shared object-record guard.');

console.log('verify-source-materials ok');
