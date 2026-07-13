import type { ObsidianTemplateSettings } from './appSettings';
import { readObsidianTemplateCompat } from './obsidianTemplateCompat';
import {
  compileCompletionReviewTemplate,
  escapeReviewText,
  escapeTaskText,
  formatTaskDateTime as formatDateTime,
  formatTaskTags,
  renderTaskLineTemplate as renderTemplate,
} from './obsidianTemplateTaskLineFormatting';
import { collectVisibleTaskData } from './obsidianTemplateTaskVisibility';
export type { ObsidianTemplateCompletionReview } from './obsidianTemplateCompletionReviewVisibility';
import type { ObsidianTemplateCompletionReview } from './obsidianTemplateCompletionReviewVisibility';

export type ObsidianTemplateTask = {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  taskDate?: string;
  completedAt?: string;
  tags?: string[];
  completionReview?: ObsidianTemplateCompletionReview;
  completionReviews?: ObsidianTemplateCompletionReview[];
  subtasks?: ObsidianTemplateTask[];
};

const compat = readObsidianTemplateCompat;

/** 复盘字段允许多行：保留换行，后续行加缩进以保持在 Obsidian 嵌套列表项内。 */
export function buildTaskLines(tasks: ObsidianTemplateTask[], date: string, templates: ObsidianTemplateSettings) {
  const c = compat(templates);
  const { visibleTasks, visibleReviewsByTask, taskDates } = collectVisibleTaskData(tasks, date);
  const completionReviewLines = compileCompletionReviewTemplate(String(c.completionReviewTemplate));
  const priorityLabel = { high: 'high', medium: 'medium', low: 'low' };
  const statusLabel = { done: '全部完成', partial: '部分完成', blocked: '有卡点' };
  const sortTasks = (items: ObsidianTemplateTask[]) =>
    [...items].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
  const indentLines = (value: string, depth: number) =>
    value
      .split('\n')
      .map((line) => `${'  '.repeat(depth)}${line}`)
      .join('\n');

  const renderTask = (task: ObsidianTemplateTask, depth: number): string[] => {
    const taskDate = taskDates.get(task) ?? '';
    const tags = formatTaskTags(task.tags);
    const taskText = [escapeTaskText(task.text), c.taskLineTemplate.includes('tags') ? '' : tags]
      .filter(Boolean)
      .join(' ');
    const lines = [
      indentLines(renderTemplate(c.taskLineTemplate, {
        checked: task.completed ? 'x' : ' ',
        text: taskText,
        priority: priorityLabel[task.priority],
        tags,
        dateNote: taskDate && taskDate !== date ? ` (任务日期: ${taskDate})` : '',
      }), depth),
    ];

    if (task.completedAt) {
      lines.push(indentLines(`  - 任务完成时间: ${formatDateTime(task.completedAt)}`, depth));
    }

    const visibleReviews = visibleReviewsByTask.get(task) ?? [];

    visibleReviews.forEach((review, index) => {
      const rawDetails: Record<string, string> = {
        summary: review.summary,
        unknowns: review.unknowns,
        nextStep: review.nextStep,
      };
      const replacements = {
        index: index + 1,
        status: statusLabel[review.status],
        percent: review.percent,
        reviewedAt: formatDateTime(review.reviewedAt),
        summary: escapeReviewText(review.summary),
        unknowns: escapeReviewText(review.unknowns),
        nextStep: escapeReviewText(review.nextStep),
      };
      const renderedLines: string[] = [];
      for (const { template, referencedDetails } of completionReviewLines) {
        if (referencedDetails.length && !referencedDetails.some((token) => escapeTaskText(rawDetails[token]) !== '')) {
          continue;
        }
        renderedLines.push(renderTemplate(template, replacements));
      }

      if (renderedLines.length) {
        lines.push(indentLines(renderedLines.join('\n'), depth));
      }
    });

    const visibleSubtasks: ObsidianTemplateTask[] = [];
    for (const subtask of task.subtasks || []) {
      if (visibleTasks.has(subtask)) visibleSubtasks.push(subtask);
    }
    for (const subtask of sortTasks(visibleSubtasks)) {
      lines.push(...renderTask(subtask, depth + 1));
    }

    return lines;
  };

  const lines: string[] = [];
  for (const task of sortTasks(tasks)) {
    if (!visibleTasks.has(task)) continue;
    lines.push(...renderTask(task, 0));
  }
  return lines;
}

export { collectVisibleTaskStats } from './obsidianTemplateTaskVisibility';
