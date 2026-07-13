import type { ObsidianTemplateSettings } from '../shared/appSettings';
import { buildTaskLines as buildTemplateTaskLines } from '../shared/obsidianTemplates';
import type { ElectronTask } from './sharedTypes';

type CreateObsidianBlogDraftBuilderOptions = {
  getDateKey(date?: string): string;
  getTaskDate(task: ElectronTask): string;
  getTemplates(): ObsidianTemplateSettings;
  zh(text: string): string;
};

export function createObsidianBlogDraftBuilder({
  getDateKey,
  getTaskDate,
  getTemplates,
  zh,
}: CreateObsidianBlogDraftBuilderOptions) {
  function buildBlogDraft(
    date: string,
    tasks: ElectronTask[],
    obsidianContent = '',
    templates = getTemplates(),
  ) {
    const selected = getDateKey(date);
    const taskLines = buildTemplateTaskLines(tasks, selected, templates);
    let completed = 0;
    let total = 0;
    for (const task of tasks) {
      if (getTaskDate(task) !== selected) continue;
      total += 1;
      if (task.completed) completed += 1;
    }

    return [
      '---',
      `title: "${selected} ${zh('\u6bcf\u65e5\u5de5\u4f5c\u4e0e\u7075\u611f\u95ea\u5ff5')}"`,
      `date: "${selected}"`,
      `category: "${zh('\u6bcf\u65e5\u8bb0\u5f55')}"`,
      `tags: ["${zh('\u5de5\u4f5c\u8bb0\u5f55')}", "${zh('\u7075\u611f\u95ea\u5ff5')}", "DailyTodo"]`,
      `excerpt: "${zh('\u4eca\u65e5\u5b8c\u6210')} ${completed}/${total} ${zh('\u9879\u4efb\u52a1\uff0c\u6574\u7406\u5de5\u4f5c\u8fdb\u5c55\u548c\u7075\u611f\u7247\u6bb5\u3002')}"`,
      'draft: true',
      '---',
      '',
      `# ${selected} ${zh('\u6bcf\u65e5\u5de5\u4f5c\u4e0e\u7075\u611f\u95ea\u5ff5')}`,
      '',
      `## ${zh('\u4eca\u5929\u505a\u4e86\u4ec0\u4e48')}`,
      obsidianContent.trim() || zh('\u4eca\u5929\u7684\u5de5\u4f5c\u8bb0\u5f55\u8fd8\u6ca1\u6709\u586b\u5199\u3002'),
      '',
      `## ${zh('\u4efb\u52a1\u56de\u987e')}`,
      taskLines.length ? taskLines.join('\n') : `- ${zh('\u4eca\u5929\u8fd8\u6ca1\u6709\u8bb0\u5f55\u4efb\u52a1\u3002')}`,
      '',
      `## ${zh('\u53ef\u4ee5\u7ee7\u7eed\u6c89\u6dc0\u7684\u5185\u5bb9')}`,
      `- ${zh('\u8fd9\u91cc\u53ef\u4ee5\u5728\u53d1\u5e03\u524d\u8865\u5145\u66f4\u5b8c\u6574\u7684\u590d\u76d8\u3001\u94fe\u63a5\u6216\u56fe\u7247\u3002')}`,
      '',
      `> ${zh('\u8fd9\u7bc7\u6587\u7ae0\u7531')} DailyTodo ${zh('\u81ea\u52a8\u751f\u6210\u8349\u7a3f\uff0c\u53d1\u5e03\u524d\u53ef\u4ee5\u628a')} \`draft: true\` ${zh('\u6539\u4e3a')} \`draft: false\`${zh('\u3002')}`,
      '',
    ].join('\n');
  }

  return { buildBlogDraft };
}
