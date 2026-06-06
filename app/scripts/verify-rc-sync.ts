import assert from 'node:assert/strict';
import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';
import {
  TASK_END_MARKER,
  TASK_START_MARKER,
  buildDailyNoteContent,
  buildSyncPreview,
} from '../shared/obsidianTemplates';
import type { Task } from '../src/types/task';

const templates = createDefaultObsidianTemplateSettings();

const task: Task = {
  id: 'task-rc-1',
  text: 'Prepare DailyTodo release candidate',
  completed: false,
  priority: 'high',
  createdAt: '2026-05-28T08:00:00.000Z',
  taskDate: '2026-05-28',
  isToday: true,
};

const dailyNote = buildDailyNoteContent({
  date: '2026-05-28',
  tasks: [task],
  dailyWork: 'Test the release candidate sync.',
  dailyInspiration: 'Keep one Obsidian daily file.',
  templates,
});

assert.match(dailyNote, new RegExp(TASK_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.match(dailyNote, new RegExp(TASK_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.match(dailyNote, /Prepare DailyTodo release candidate/);

const preview = buildSyncPreview({
  date: '2026-05-28',
  tasksAfterDelete: [task],
  dailyWork: '',
  dailyInspiration: '',
  templates,
  vaultPath: 'G:/Personal-AI/Personal-KB',
  existingDailyNote: '',
});

assert.equal(preview.files.length, 1, 'RC sync preview should include only the daily note file');
assert.equal(preview.files[0].filePath.endsWith('logs\\daily\\DailyTodo\\2026-05-28.md') || preview.files[0].filePath.endsWith('logs/daily/DailyTodo/2026-05-28.md'), true);
assert.equal(
  preview.files.some((file) => /[\\/]tasks[\\/]/.test(file.filePath)),
  false,
  'RC sync must not preview the legacy tasks export file',
);
assert.equal(preview.managedBlocks.some((block) => block.marker === 'DAILYTODO:TASKS'), true);

console.log('RC sync verification passed');
