import { buildBlockPrompt, validateBlockOutput } from '../../shared/reportGenerator';
import type { ReportTemplate } from '../../shared/aiReview/sectionConfig';
import type { LlmResult } from '../../shared/llm/openaiClient';
import { writeReport, type ReportResult } from './reportOutput';

export type ReportMessage = { role: 'system' | 'user'; content: string };
export type LlmCaller = (messages: ReportMessage[]) => Promise<LlmResult>;

export async function generateLlmBackedReport<Messages extends ReportMessage[]>({
  buildMessages,
  callLlm,
  filePath,
  frontmatter,
}: {
  buildMessages(): Messages;
  callLlm(messages: Messages): Promise<LlmResult>;
  filePath: string;
  frontmatter: string;
}): Promise<ReportResult> {
  const messages = buildMessages();
  const llm = await callLlm(messages);
  if (!llm.ok) return { ok: false, error: llm.error };
  return writeReport(filePath, frontmatter, llm.content, llm.truncated);
}

export async function generateTemplateBackedReport({
  reportTemplate,
  buildMessages,
  callLlm,
  periodKey,
  filePath,
  frontmatter,
}: {
  reportTemplate?: ReportTemplate;
  buildMessages(): ReportMessage[];
  callLlm: LlmCaller;
  periodKey: string;
  filePath: string;
  frontmatter: string;
}): Promise<ReportResult> {
  const enabledBlocks = reportTemplate?.customBlocks.filter((block) => block.aiGenerate) ?? [];
  if (!reportTemplate) {
    return generateLlmBackedReport({ buildMessages, callLlm, filePath, frontmatter });
  }

  const messages = buildMessages();
  const sourceParts: string[] = [];
  let systemPrompt = '';
  for (const message of messages) {
    if (message.role === 'system' && !systemPrompt) systemPrompt = message.content;
    if (message.role === 'user') sourceParts.push(message.content);
  }
  const sourceContent = sourceParts.join('\n\n');
  const blockResults = await Promise.all(enabledBlocks.map(async (block) => {
    const llm = await callLlm([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: buildBlockPrompt({ block, sourceContent, period: periodKey }) },
    ]);
    return { block, llm };
  }));

  let truncated = false;
  for (const { llm } of blockResults) {
    if (!llm.ok) return { ok: false, error: llm.error };
    truncated ||= Boolean(llm.truncated);
  }

  const renderedBlocks = blockResults.map(({ block, llm }) => {
    const output = validateBlockOutput(llm.content, block.renderType).output;
    return `## ${block.name}\n\n${output}`;
  });

  return writeReport(filePath, frontmatter, renderedBlocks.join('\n\n'), truncated);
}
