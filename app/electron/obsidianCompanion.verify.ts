import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  buildSyncPlan,
  matchesRule,
  renderTemplate,
  writeSyncPlan,
} from './obsidianCompanion';
import { createDefaultCompanionSettings } from '../shared/obsidianCompanionDefaults';
import { CaptureItem } from '../shared/obsidianCompanion';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const item: CaptureItem = {
  id: 'task-1',
  type: 'task',
  content: 'Review inbox',
  tags: ['work', '#focus'],
  priority: 'high',
  source: 'desktop',
  status: 'new',
  createdAt: '2026-05-26T08:30:00.000Z',
};

const rendered = renderTemplate('{{date}} {{content}} {{tags}} {{priority}}', item);
assert(rendered.includes('2026-05-26'), 'template should render date');
assert(rendered.includes('Review inbox'), 'template should render content');
assert(rendered.includes('#work #focus'), 'template should normalize tags');
assert(rendered.includes('high'), 'template should render priority');

assert(
  matchesRule(item, {
    id: 'rule-1',
    name: 'High focus tasks',
    enabled: true,
    priority: 1,
    when: { type: 'task', tagsAll: ['focus'], containsAny: ['inbox'] },
    write: { target: 'Daily.md', templateId: 'daily-task-line', mode: 'append' },
    afterMatch: 'continue',
  }),
  'rule should match type, tags, and content'
);

const vaultPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-companion-'));
const settings = createDefaultCompanionSettings(vaultPath);
const plan = buildSyncPlan(settings, [item]);
assert(plan.ok, plan.errors.join(' '));
assert(plan.changes.length === 1, 'plan should contain one task write');
assert(plan.changes[0].filePath.startsWith(vaultPath), 'target should stay inside vault');

const writeResult = writeSyncPlan(plan);
assert(writeResult.ok, writeResult.errors.join(' '));
assert(fs.existsSync(plan.changes[0].filePath), 'sync should create target file');
const written = fs.readFileSync(plan.changes[0].filePath, 'utf-8');
assert(written.includes('## Daily Tasks'), 'sync should create target section');
assert(written.includes('Review inbox'), 'sync should write rendered content');

const traversalPlan = buildSyncPlan(
  {
    ...settings,
    rules: [
      {
        ...settings.rules[0],
        write: { ...settings.rules[0].write, target: '../outside.md' },
      },
    ],
  },
  [item]
);
assert(!traversalPlan.ok, 'path traversal should be rejected');
assert(traversalPlan.errors.some((error) => error.includes('escapes')), 'path traversal error should be explicit');

console.log('obsidian companion verification passed');
