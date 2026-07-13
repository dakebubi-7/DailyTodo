import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';
import { buildTaskLines } from '../shared/obsidianTemplates';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Task } from '../src/types/task';

const date = '2026-06-12';
const tasks: Task[] = [
  {
    id: 'parent',
    text: 'Parent task',
    completed: false,
    priority: 'medium',
    tags: ['work', '#focus'],
    createdAt: `${date}T08:00:00.000Z`,
    taskDate: date,
    isToday: true,
    subtasks: [
      {
        id: 'child',
        text: 'Child task',
        completed: true,
        priority: 'medium',
        tags: ['client'],
        createdAt: `${date}T09:00:00.000Z`,
        taskDate: date,
        isToday: true,
        parentTaskId: 'parent',
        completionReviews: [
          {
            id: 'child-review',
            status: 'partial',
            percent: 80,
            summary: 'Child review summary',
            unknowns: 'Child review blocker',
            nextStep: 'Child review next step',
            reviewedAt: `${date}T11:00:00.000Z`,
          },
        ],
        subtasks: [
          {
            id: 'grandchild',
            text: 'Grandchild task',
            completed: false,
            priority: 'medium',
            createdAt: `${date}T10:00:00.000Z`,
            taskDate: date,
            isToday: true,
            parentTaskId: 'child',
          },
        ],
      },
    ],
  },
];

const lines = buildTaskLines(tasks, date, createDefaultObsidianTemplateSettings());
const markdown = lines.join('\n');

const expected = [
  '- [ ] Parent task',
  '#work #focus',
  '  - [x] Child task',
  '#client',
  '完成记录 1: 部分完成 80%',
  '完成情况: Child review summary',
  '卡点/未知: Child review blocker',
  '下一步: Child review next step',
  'Child review summary',
  'Child review blocker',
  'Child review next step',
  '    - [ ] Grandchild task',
];

for (const line of expected) {
  if (!markdown.includes(line)) {
    throw new Error(`Missing expected Obsidian task line: ${line}\n\nActual:\n${markdown}`);
  }
}

const tagMarkdown = buildTaskLines([
  {
    id: 'tag-normalization',
    text: 'Tag normalization',
    completed: false,
    priority: 'medium',
    tags: [' work item ', '', '   ', '#focus'],
    createdAt: `${date}T12:00:00.000Z`,
    taskDate: date,
  },
], date, createDefaultObsidianTemplateSettings()).join('\n');
if (!tagMarkdown.includes('#work-item #focus')) {
  throw new Error(`Tags should trim whitespace, skip empty entries, and preserve existing # prefixes. Actual:\n${tagMarkdown}`);
}

const obsidianTemplatesSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'shared/obsidianTemplates.ts'), 'utf8');
if (/function formatTaskTags[\s\S]*?return tags[\s\S]*?\.map\(/.test(obsidianTemplatesSource)) {
  throw new Error('Task tag formatting should normalize tags in one loop rather than chained map/filter/map passes.');
}
if (obsidianTemplatesSource.includes('.filter(({ referencedDetails }) =>')) {
  throw new Error('Completion-review rendering should filter and render template lines in one traversal.');
}
if (/sortTasks\(task\.subtasks \|\| \[\]\)\s*\.filter\(\(subtask\) => visibleTasks\.has\(subtask\)\)/.test(obsidianTemplatesSource)) {
  throw new Error('Subtask rendering should discard invisible tasks before sorting the visible subtree.');
}
if (obsidianTemplatesSource.includes('const lines = body.split(/\\r?\\n/);')) {
  throw new Error('Marked block reading should avoid splitting and rebuilding the whole block just to remove an optional heading.');
}

const forbidden = ['summary:', 'blocker:', 'next:', 'completed at:', 'task date:'];
for (const text of forbidden) {
  if (markdown.includes(text)) {
    throw new Error(`Unexpected English label in Obsidian task output: ${text}\n\nActual:\n${markdown}`);
  }
}

console.log('verify-subtask-obsidian-sync ok');
