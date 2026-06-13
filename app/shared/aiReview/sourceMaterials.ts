import fs from 'node:fs';
import path from 'node:path';
import type { MonthlySourceMode } from './aiReviewSettings';
import { monthRange } from './monthly';
import { isoWeekKey } from './weekly';

export interface DailySourceRule {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
}

export const NO_SOURCE_MATERIALS_ERROR = {
  zh: '没有找到本周期原始记录，请检查素材来源或手动选择素材文件。',
  en: 'No source notes found for this period. Check source settings or choose files manually.',
} as const;

export interface DailySourceMaterial {
  date: string;
  label: string;
  filePath: string;
  content: string;
}

export interface PeriodSourceMaterial {
  label: string;
  filePath: string;
  content: string;
}

function renderRulePath(templatePath: string, date: string): string {
  return templatePath.replace(/\{\{date\}\}/g, date);
}

export function resolveVaultRelativePath(vaultPath: string, templatePath: string, date: string): string {
  const rendered = renderRulePath(templatePath, date).replace(/[<>:"|?*]/g, '-');
  if (path.isAbsolute(rendered)) throw new Error(`Source path must be relative to the vault: ${rendered}`);
  const vaultRoot = path.resolve(vaultPath);
  const resolved = path.resolve(vaultRoot, rendered);
  const relative = path.relative(vaultRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Source path escapes the selected vault: ${rendered}`);
  }
  return resolved;
}

export function collectDailySourcesForDates(params: {
  vaultPath: string;
  dates: string[];
  rules: DailySourceRule[];
}): DailySourceMaterial[] {
  const seen = new Set<string>();
  const sources: DailySourceMaterial[] = [];
  for (const date of params.dates) {
    for (const rule of params.rules.filter((r) => r.enabled)) {
      const filePath = resolveVaultRelativePath(params.vaultPath, rule.path, date);
      if (!fs.existsSync(filePath) || seen.has(filePath)) continue;
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content.trim()) continue;
      seen.add(filePath);
      sources.push({ date, label: `${date} 日报`, filePath, content });
    }
  }
  return sources;
}

function datesInRange(first: string, last: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${first}T00:00:00`);
  const end = new Date(`${last}T00:00:00`);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function collectWeeklyReports(vaultPath: string, month: string, weeklyDir: string): PeriodSourceMaterial[] {
  const { first, last } = monthRange(month);
  const weeks = Array.from(new Set(datesInRange(first, last).map(isoWeekKey)));
  return weeks
    .map((week) => {
      const filePath = path.join(vaultPath, weeklyDir, `${week}.md`);
      if (!fs.existsSync(filePath)) return null;
      const content = fs.readFileSync(filePath, 'utf-8');
      return content.trim() ? { label: `${week} 周报`, filePath, content } : null;
    })
    .filter((source): source is PeriodSourceMaterial => source !== null);
}

export function collectMonthlySources(params: {
  vaultPath: string;
  month: string;
  weeklyDir: string;
  dailyRules: DailySourceRule[];
  mode: MonthlySourceMode;
}): PeriodSourceMaterial[] {
  if (params.mode === 'weekly-reports' || params.mode === 'weekly-then-daily') {
    const weekly = collectWeeklyReports(params.vaultPath, params.month, params.weeklyDir);
    if (weekly.length || params.mode === 'weekly-reports') return weekly;
  }
  if (params.mode === 'manual-files') return [];
  const { first, last } = monthRange(params.month);
  return collectDailySourcesForDates({
    vaultPath: params.vaultPath,
    dates: datesInRange(first, last),
    rules: params.dailyRules,
  }).map((source) => ({ label: source.label, filePath: source.filePath, content: source.content }));
}

export function hasSourceMaterials(sources: Array<{ content: string }>): boolean {
  return sources.some((source) => source.content.trim());
}
