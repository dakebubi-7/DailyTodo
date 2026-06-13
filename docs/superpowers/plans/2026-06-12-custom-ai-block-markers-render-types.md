# Custom AI Block Markers and Render Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let DailyTodo support any number of user-defined daily AI blocks with independent Obsidian markers, optional prompts, and render-type-aware Markdown output.

**Architecture:** Add marker helpers for unique custom block markers (`DAILYTODO:CUSTOM:<blockId>`), keep old fixed markers compatible, and update daily AI generation to iterate over `templates.dailyTemplate.customBlocks` instead of only the three legacy `SectionConfig` entries. Build prompts from each `CustomBlock`, append render-type instructions, extract final results, strip duplicate outer headings, hash, and write each block independently.

**Tech Stack:** Electron main process TypeScript, shared DailyTodo/Obsidian template utilities, existing `tsx` verification scripts with Node `assert`, OpenAI-compatible chat abstraction.

---

## File Structure

- Modify `app/shared/aiReview/markers.ts`
  - Add safe custom marker helper for arbitrary custom block IDs.
  - Keep legacy `REVIEW_MARKERS` unchanged.
- Modify `app/shared/obsidianTemplates.ts`
  - Render daily AI custom blocks with unique custom markers.
- Modify `app/shared/templateRenderer.ts`
  - Keep secondary renderer aligned with unique markers.
- Modify `app/shared/aiReview/promptBuilder.ts`
  - Add block-based message builder that accepts `CustomBlock` + `renderType`.
  - Reuse render-type instruction text from report generation behavior.
- Modify `app/electron/aiReview/runner.ts`
  - Add `runCustomReviewForFile` or extend `runReviewForFile` to process custom blocks.
  - Preserve legacy section path for old markers/backfill compatibility.
- Modify `app/electron/main.ts`
  - Pass `getObsidianTemplateSettings().dailyTemplate.customBlocks` into daily AI generation.
- Modify `app/src/components/TemplateEditorModal.tsx`
  - Expose optional custom-block prompt field in the UI.
- Add/modify verification scripts:
  - `app/scripts/verify-ai-markers.ts`
  - `app/scripts/verify-daily-review-blocks.ts`
  - `app/scripts/verify-ai-runner.ts`
  - `app/scripts/verify-section-config.ts`

## Important Context

Current daily custom block rendering maps arbitrary custom blocks to one of three legacy markers, causing collisions:

```ts
function markerForCustomBlock(block: CustomBlock) {
  if (/明日|待办|tomorrow|next/i.test(block.name)) return REVIEW_MARKERS.TOMORROW;
  if (/知识|knowledge|灵感|inspiration|insight/i.test(block.name)) return REVIEW_MARKERS.KNOWLEDGE;
  return REVIEW_MARKERS.REVIEW;
}
```

Current daily AI generation calls:

```ts
runReviewForFile({
  filePath,
  date,
  tasks: tasks as StatTask[],
  sections: getReviewSections(),
  callLlm: getLlmCaller(),
});
```

The upgrade should not break old notes using `DAILYTODO:REVIEW`, `DAILYTODO:TOMORROW`, or `DAILYTODO:KNOWLEDGE` markers.

---

### Task 1: Add unique custom marker helper

**Files:**
- Modify: `app/shared/aiReview/markers.ts`
- Test: `app/scripts/verify-ai-markers.ts`

- [ ] **Step 1: Write failing marker tests**

Append these assertions to `app/scripts/verify-ai-markers.ts` after the existing `REVIEW_MARKERS` assertions:

```ts
import { customBlockMarker } from '../shared/aiReview/markers';

const custom = customBlockMarker('abc-123');
assert.equal(custom.start, '<!-- DAILYTODO:CUSTOM:abc-123:START -->');
assert.equal(custom.end, '<!-- DAILYTODO:CUSTOM:abc-123:END -->');

const sanitized = customBlockMarker(' weird id / 42 ');
assert.equal(sanitized.start, '<!-- DAILYTODO:CUSTOM:weird-id-42:START -->');
assert.equal(sanitized.end, '<!-- DAILYTODO:CUSTOM:weird-id-42:END -->');
```

If `verify-ai-markers.ts` currently imports named functions from `markers.ts`, merge `customBlockMarker` into that import instead of adding a duplicate import.

- [ ] **Step 2: Run test to verify it fails**

Run from `app/`:

```bash
npm run verify:ai-markers
```

Expected before implementation: TypeScript/runtime failure because `customBlockMarker` is not exported.

- [ ] **Step 3: Implement marker helper**

Add this to `app/shared/aiReview/markers.ts` after `REVIEW_MARKERS`:

```ts
export function safeCustomBlockId(id: string): string {
  const safe = String(id || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return safe || 'untitled';
}

export function customBlockMarker(id: string): BlockMarker {
  const safeId = safeCustomBlockId(id);
  return {
    start: `<!-- DAILYTODO:CUSTOM:${safeId}:START -->`,
    end: `<!-- DAILYTODO:CUSTOM:${safeId}:END -->`,
  };
}
```

- [ ] **Step 4: Run marker verification**

Run from `app/`:

```bash
npm run verify:ai-markers
```

Expected: PASS and output includes:

```text
AI markers verification passed
```

---

### Task 2: Render daily custom AI blocks with unique markers

**Files:**
- Modify: `app/shared/obsidianTemplates.ts`
- Modify: `app/shared/templateRenderer.ts`
- Test: `app/scripts/verify-daily-review-blocks.ts`

- [ ] **Step 1: Add failing daily rendering coverage**

Append this block to `app/scripts/verify-daily-review-blocks.ts` before `console.log(...)`:

```ts
const customTemplates = createDefaultObsidianTemplateSettings();
customTemplates.dailyTemplate = {
  ...customTemplates.dailyTemplate,
  customBlocks: [
    { id: 'project-progress', name: '项目进展', aiGenerate: true, renderType: 'table', prompt: '' },
    { id: 'reading-summary', name: '阅读总结', aiGenerate: true, renderType: 'list', prompt: '' },
  ],
  blockOrder: [
    ...customTemplates.dailyTemplate.fixedBlocks.map((block) => ({ type: 'fixed' as const, id: block.id })),
    { type: 'custom' as const, id: 'project-progress' },
    { type: 'custom' as const, id: 'reading-summary' },
  ],
};
const customContent = buildDailyNoteContent({
  date: '2026-06-15',
  tasks: [],
  dailyWork: '',
  dailyInspiration: '',
  templates: customTemplates,
});
assert.ok(customContent.includes('## 项目进展'), 'custom heading rendered');
assert.ok(customContent.includes('<!-- DAILYTODO:CUSTOM:project-progress:START -->'), 'first custom marker rendered');
assert.ok(customContent.includes('<!-- DAILYTODO:CUSTOM:reading-summary:START -->'), 'second custom marker rendered');
assert.ok(!customContent.includes('<!-- DAILYTODO:REVIEW:START -->'), 'custom AI blocks should not collapse to REVIEW marker');
```

- [ ] **Step 2: Run test to verify it fails**

Run from `app/`:

```bash
npm run verify:daily-review-blocks
```

Expected before implementation: FAIL because custom blocks still render legacy markers.

- [ ] **Step 3: Update `obsidianTemplates.ts` rendering**

In `app/shared/obsidianTemplates.ts`, update imports:

```ts
import { REVIEW_MARKERS, customBlockMarker } from './aiReview/markers';
```

Replace `buildCustomAiBlock` with:

```ts
function buildCustomAiBlock(block: CustomBlock) {
  if (!block.aiGenerate) return [`## ${block.name}`, ''].join('\n');
  const marker = customBlockMarker(block.id);
  return [`## ${block.name}`, marker.start, marker.end].join('\n');
}
```

Keep `markerForCustomBlock` for legacy compatibility if other code still references it; do not use it for new daily custom AI rendering.

- [ ] **Step 4: Update `templateRenderer.ts` rendering**

In `app/shared/templateRenderer.ts`, update imports:

```ts
import {
  REVIEW_MARKERS,
  customBlockMarker,
} from './aiReview/markers';
```

In `renderDailyTemplate`, replace:

```ts
const marker = getMarker(inferBlockMarkerKey(block));
lines.push(marker.start, marker.end);
```

with:

```ts
const marker = customBlockMarker(block.id);
lines.push(marker.start, marker.end);
```

Do not change `renderReportTemplate` in this task; report generation can continue using the legacy report separator flow.

- [ ] **Step 5: Run daily block verification**

Run from `app/`:

```bash
npm run verify:daily-review-blocks
```

Expected: PASS and output includes:

```text
Daily review blocks verification passed
```

---

### Task 3: Build render-type-aware daily custom block prompts

**Files:**
- Modify: `app/shared/aiReview/promptBuilder.ts`
- Test: `app/scripts/verify-section-config.ts`

- [ ] **Step 1: Add failing prompt-builder coverage**

Update the import in `app/scripts/verify-section-config.ts`:

```ts
import { buildReviewMessages, buildCustomBlockReviewMessages } from '../shared/aiReview/promptBuilder';
```

Append this block before the final `console.log(...)`:

```ts
const tableMessages = buildCustomBlockReviewMessages({
  date: '2026-06-15',
  dailyContent: '## 今日工作\n推进项目 A',
  block: { id: 'project-progress', name: '项目进展', aiGenerate: true, renderType: 'table', prompt: '' },
  stats: { date: '2026-06-15', total: 2, completed: 1, completionRate: 50 },
});
assert.ok(tableMessages[1].content.includes('项目进展'), 'custom block name included');
assert.ok(tableMessages[1].content.includes('请根据今天的记录生成「项目进展」这一段内容'), 'blank prompt gets default instruction');
assert.ok(tableMessages[1].content.includes('Markdown 表格'), 'table renderType instruction included');

const calloutMessages = buildCustomBlockReviewMessages({
  date: '2026-06-15',
  dailyContent: '## 灵感随笔\n提醒自己早点休息',
  block: { id: 'daily-note', name: '今日提醒', aiGenerate: true, renderType: 'callout', prompt: '提炼一句提醒' },
  stats: { date: '2026-06-15', total: 1, completed: 1, completionRate: 100 },
});
assert.ok(calloutMessages[1].content.includes('提炼一句提醒'), 'custom prompt included');
assert.ok(calloutMessages[1].content.includes('Obsidian Callout'), 'callout renderType instruction included');
```

- [ ] **Step 2: Run test to verify it fails**

Run from `app/`:

```bash
npm run verify:section-config
```

Expected before implementation: FAIL because `buildCustomBlockReviewMessages` is not exported.

- [ ] **Step 3: Add prompt builder types and render instructions**

In `app/shared/aiReview/promptBuilder.ts`, update imports:

```ts
import type { CustomBlock, RenderType, SectionConfig } from './sectionConfig';
```

Add this interface after `BuildMessagesParams`:

```ts
export interface BuildCustomBlockMessagesParams {
  date: string;
  dailyContent: string;
  block: CustomBlock;
  stats: DailyStats;
}
```

Add these helpers before `buildReviewMessages`:

```ts
function defaultBlockPrompt(blockName: string) {
  return [
    `请根据今天的记录生成「${blockName}」这一段内容。`,
    `只输出和「${blockName}」相关的正文。`,
    '如果今天没有相关素材，就如实说明没有足够内容。',
  ].join('\n');
}

function renderTypeInstruction(renderType: RenderType) {
  switch (renderType) {
    case 'list':
      return '输出格式：请用 Markdown 列表输出，每行使用 - item。';
    case 'table':
      return '输出格式：请用 Markdown 表格输出，必须包含表头行和分隔行。';
    case 'callout':
      return '输出格式：请用 Obsidian Callout 输出，例如 > [!note] 标题，并保持每行以 > 开头。';
    case 'dataview':
      return '输出格式：请输出 dataview 代码块；如果素材不足以形成查询，就说明没有足够结构化数据。';
    case 'text':
    default:
      return '输出格式：普通 Markdown 正文，不要额外添加同名标题。';
  }
}
```

- [ ] **Step 4: Add custom block message builder**

Add this function after `buildReviewMessages` in `app/shared/aiReview/promptBuilder.ts`:

```ts
export function buildCustomBlockReviewMessages(params: BuildCustomBlockMessagesParams): ChatMessage[] {
  const { date, dailyContent, block, stats } = params;
  const prompt = block.prompt.trim() || defaultBlockPrompt(block.name);
  const user = [
    `日期：${date}`,
    `任务：『${block.name}』`,
    `要求：${prompt}`,
    renderTypeInstruction(block.renderType),
    '',
    '确定性统计（必须以此为准，不得改写）：',
    `- 当天任务数：${stats.total}`,
    `- 已完成：${stats.completed}`,
    `- 完成率：${stats.completionRate}%`,
    '',
    '今天的日记原文：',
    dailyContent.trim() || '（今天没有记录正文）',
  ].join('\n');

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ];
}
```

- [ ] **Step 5: Run section config verification**

Run from `app/`:

```bash
npm run verify:section-config
```

Expected: PASS and output includes:

```text
Section config verification passed
```

---

### Task 4: Generate and write custom AI blocks independently

**Files:**
- Modify: `app/electron/aiReview/runner.ts`
- Modify: `app/electron/main.ts`
- Test: `app/scripts/verify-ai-runner.ts`

- [ ] **Step 1: Add failing runner coverage for two independent custom blocks**

Update `app/scripts/verify-ai-runner.ts` import from runner:

```ts
import { runReviewForFile, runCustomReviewForFile } from '../electron/aiReview/runner';
```

Update marker import:

```ts
import { REVIEW_MARKERS, customBlockMarker, readBlockBody } from '../shared/aiReview/markers';
```

Append this block before the final cleanup:

```ts
const file8 = path.join(dir, '2026-06-16.md');
const projectMarker = customBlockMarker('project-progress');
const readingMarker = customBlockMarker('reading-summary');
fs.writeFileSync(
  file8,
  [
    '# 2026-06-16',
    '## 项目进展',
    projectMarker.start,
    projectMarker.end,
    '## 阅读总结',
    readingMarker.start,
    readingMarker.end,
  ].join('\n'),
  'utf-8',
);
const seenPrompts: string[] = [];
const customResult = await runCustomReviewForFile({
  filePath: file8,
  date: '2026-06-16',
  tasks: [{ completed: true, taskDate: '2026-06-16' }],
  blocks: [
    { id: 'project-progress', name: '项目进展', aiGenerate: true, renderType: 'table', prompt: '' },
    { id: 'reading-summary', name: '阅读总结', aiGenerate: true, renderType: 'list', prompt: '总结今天阅读过的内容' },
  ],
  callLlm: async (messages) => {
    seenPrompts.push(messages[1].content);
    const titleLine = messages[1].content.includes('阅读总结') ? '## 阅读总结' : '## 项目进展';
    const body = messages[1].content.includes('阅读总结') ? '- 读完一章' : '| 项目 | 进展 |\n| --- | --- |\n| DailyTodo | 推进 |';
    return { ok: true as const, content: ['DAILYTODO_FINAL_START', titleLine, '', body, 'DAILYTODO_FINAL_END'].join('\n') };
  },
});
assert.equal(customResult.ok, true);
const customAfter = fs.readFileSync(file8, 'utf-8');
const projectBody = readBlockBody(customAfter, projectMarker);
const readingBody = readBlockBody(customAfter, readingMarker);
assert.ok(projectBody.includes('| DailyTodo | 推进 |'), 'project block table body written');
assert.ok(!/^## 项目进展$/m.test(projectBody), 'project duplicate heading stripped');
assert.ok(readingBody.includes('- 读完一章'), 'reading block list body written');
assert.ok(!/^## 阅读总结$/m.test(readingBody), 'reading duplicate heading stripped');
assert.equal(seenPrompts.length, 2, 'each custom block calls LLM independently');
assert.ok(seenPrompts[0].includes('Markdown 表格'), 'table renderType reached prompt');
assert.ok(seenPrompts[1].includes('Markdown 列表'), 'list renderType reached prompt');
```

- [ ] **Step 2: Run test to verify it fails**

Run from `app/`:

```bash
npm run verify:ai-runner
```

Expected before implementation: FAIL because `runCustomReviewForFile` is not exported.

- [ ] **Step 3: Update runner imports and types**

In `app/electron/aiReview/runner.ts`, update imports:

```ts
import { REVIEW_MARKERS, customBlockMarker, readBlockBody, upsertBlock } from '../../shared/aiReview/markers';
import { buildCustomBlockReviewMessages, buildReviewMessages } from '../../shared/aiReview/promptBuilder';
import type { CustomBlock } from '../../shared/aiReview/sectionConfig';
```

Keep existing `SectionConfig, SectionType` imports.

Add interface after `RunParams`:

```ts
export interface RunCustomParams {
  filePath: string;
  date: string;
  tasks: StatTask[];
  blocks: CustomBlock[];
  callLlm: (messages: ReturnType<typeof buildCustomBlockReviewMessages>) => Promise<LlmResult>;
  force?: boolean;
}
```

- [ ] **Step 4: Extract shared block-write helper**

Add this helper before `runReviewForFile`:

```ts
async function generateAiBody(params: {
  content: string;
  date: string;
  markerStart: string;
  fallbackTitle: string;
  call: () => Promise<LlmResult>;
}) {
  const llm = await params.call();
  if (!llm.ok) return llm;
  const outerHeading = findNearestHeadingBeforeMarker(params.content, params.markerStart);
  const rawCleaned = cleanLlmContent(llm.content);
  const cleaned = stripDuplicateSectionHeading(rawCleaned, outerHeading, params.fallbackTitle, params.date);
  return { ok: true as const, content: cleaned, truncated: llm.truncated };
}
```

Then in the existing AI branch of `runReviewForFile`, replace the manual `callLlm` / cleaning block with:

```ts
const messages = buildReviewMessages({ date, dailyContent: content, section, stats });
const generated = await generateAiBody({
  content,
  date,
  markerStart: marker.start,
  fallbackTitle: section.title,
  call: () => callLlm(messages),
});
if (!generated.ok) {
  skipped.push(section.markerKey);
  continue;
}
const newBody = embedHash(generated.content);
content = upsertBlock(content, marker, newBody);
filled.push(section.markerKey);
```

- [ ] **Step 5: Add custom block runner**

Add this exported function after `runReviewForFile`:

```ts
export async function runCustomReviewForFile(params: RunCustomParams): Promise<RunResult> {
  const { filePath, date, tasks, blocks, callLlm, force } = params;
  const snap = readWithStamp(filePath);
  if (snap.stamp === null) {
    return { ok: false, error: '日记文件不存在', filledMarkers: [], skippedMarkers: [] };
  }

  const fileFrozen = snap.content.includes(FREEZE_TAG);
  const stats = computeDailyStats(tasks, date);
  let content = snap.content;
  const filled: string[] = [];
  const skipped: string[] = [];

  for (const block of blocks) {
    if (!block.aiGenerate) continue;
    const marker = customBlockMarker(block.id);
    const body = readBlockBody(content, marker);
    const blockFrozen = fileFrozen || body.includes(FREEZE_TAG);
    const decision = decideBlock(body, { frozen: blockFrozen, force });

    if (decision.action === BlockAction.Skip) {
      skipped.push(block.id);
      continue;
    }

    const messages = buildCustomBlockReviewMessages({ date, dailyContent: content, block, stats });
    const generated = await generateAiBody({
      content,
      date,
      markerStart: marker.start,
      fallbackTitle: block.name,
      call: () => callLlm(messages),
    });
    if (!generated.ok) {
      skipped.push(block.id);
      continue;
    }

    content = upsertBlock(content, marker, embedHash(generated.content));
    filled.push(block.id);
  }

  if (!filled.length) return { ok: true, filledMarkers: [], skippedMarkers: skipped };

  const write = atomicReplace(filePath, content, snap.stamp);
  if (!write.ok) return { ok: false, error: write.error, filledMarkers: [], skippedMarkers: skipped };
  return { ok: true, filledMarkers: filled, skippedMarkers: skipped };
}
```

- [ ] **Step 6: Wire main daily generation to custom blocks**

In `app/electron/main.ts`, update runner import:

```ts
import { runCustomReviewForFile, runReviewForFile } from './aiReview/runner';
```

In `runReviewForDate`, replace the direct `runReviewForFile(...)` call with:

```ts
const templates = getObsidianTemplateSettings();
const customBlocks = templates.dailyTemplate.customBlocks.filter((block) => block.aiGenerate);
if (customBlocks.length) {
  return runCustomReviewForFile({
    filePath,
    date,
    tasks: tasks as StatTask[],
    blocks: customBlocks,
    callLlm: getLlmCaller(),
  });
}
return runReviewForFile({
  filePath,
  date,
  tasks: tasks as StatTask[],
  sections: getReviewSections(),
  callLlm: getLlmCaller(),
});
```

Rationale: new templates use custom blocks; legacy fallback remains for settings without custom blocks.

- [ ] **Step 7: Run runner verification**

Run from `app/`:

```bash
npm run verify:ai-runner
```

Expected: PASS and output includes:

```text
AI runner verification passed
```

---

### Task 5: Expose optional prompt field for custom AI blocks

**Files:**
- Modify: `app/src/components/TemplateEditorModal.tsx`
- Test: `app/scripts/verify-template-source-settings.ts` or create `app/scripts/verify-template-editor-prompt-field.ts` and add npm script if needed.

- [ ] **Step 1: Add static verification script**

Create `app/scripts/verify-template-editor-prompt-field.ts`:

```ts
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const root = cwd.endsWith('app') ? cwd : join(cwd, 'app');
const source = readFileSync(join(root, 'src/components/TemplateEditorModal.tsx'), 'utf-8');

assert.ok(source.includes('生成要求（可选）'), 'prompt field label should explain prompt is optional');
assert.ok(source.includes('DailyTodo 会根据区块名称自动生成'), 'prompt field should explain default prompt behavior');
assert.ok(source.includes('prompt: e.target.value') || source.includes('prompt: event.target.value'), 'prompt field should update CustomBlock.prompt');

console.log('Template editor prompt field verification passed');
```

Add this script to `app/package.json` scripts:

```json
"verify:template-editor-prompt-field": "tsx scripts/verify-template-editor-prompt-field.ts"
```

- [ ] **Step 2: Run test to verify it fails**

Run from `app/`:

```bash
npm run verify:template-editor-prompt-field
```

Expected before implementation: FAIL because the prompt field is not rendered.

- [ ] **Step 3: Add prompt field UI**

In `app/src/components/TemplateEditorModal.tsx`, update `renderCustomControls` to include a prompt textarea after the render type selector and before delete button:

```tsx
<label className="template-block-prompt-field">
  <span>生成要求（可选）</span>
  <small>不填时，DailyTodo 会根据区块名称自动生成。</small>
  <textarea
    value={block.prompt}
    disabled={!block.aiGenerate}
    rows={2}
    onChange={(e) => updateBlock(block.id, { prompt: e.target.value })}
    placeholder="例如：总结今天推进的项目、进度和下一步"
  />
</label>
```

If the row layout becomes cramped, keep the field in the same row for this task and rely on existing CSS; do not do a broad UI redesign.

- [ ] **Step 4: Run prompt field verification**

Run from `app/`:

```bash
npm run verify:template-editor-prompt-field
```

Expected: PASS and output includes:

```text
Template editor prompt field verification passed
```

---

### Task 6: Final verification

**Files:**
- No code changes unless a verification failure points to a missed implementation detail.

- [ ] **Step 1: Run targeted verification scripts**

Run from `app/`:

```bash
npm run verify:ai-markers
npm run verify:daily-review-blocks
npm run verify:section-config
npm run verify:ai-runner
npm run verify:template-editor-prompt-field
```

Expected outputs:

```text
AI markers verification passed
Daily review blocks verification passed
Section config verification passed
AI runner verification passed
Template editor prompt field verification passed
```

- [ ] **Step 2: Manual app verification**

In DailyTodo:

1. Open template editor.
2. Add two AI blocks:
   - `项目进展`, render type `表格`, prompt blank.
   - `阅读总结`, render type `列表`, prompt `总结今天阅读过的内容`.
3. Save template.
4. Sync/create a daily note.
5. Confirm Obsidian raw Markdown has unique markers:

```md
## 项目进展
<!-- DAILYTODO:CUSTOM:<project-id>:START -->
<!-- DAILYTODO:CUSTOM:<project-id>:END -->

## 阅读总结
<!-- DAILYTODO:CUSTOM:<reading-id>:START -->
<!-- DAILYTODO:CUSTOM:<reading-id>:END -->
```

6. Trigger AI daily review generation.
7. Confirm `项目进展` contains table-like Markdown and `阅读总结` contains list-like Markdown.
8. Confirm neither block contains duplicate same-name heading inside its marker body.
9. Confirm `DAILYTODO_FINAL_START`, `DAILYTODO_FINAL_END`, and standalone `and` do not appear in Obsidian.

- [ ] **Step 3: Git handling**

Do not commit unless the user explicitly asks. If asked to commit, stage only relevant files:

```bash
git add \
  app/shared/aiReview/markers.ts \
  app/shared/obsidianTemplates.ts \
  app/shared/templateRenderer.ts \
  app/shared/aiReview/promptBuilder.ts \
  app/electron/aiReview/runner.ts \
  app/electron/main.ts \
  app/src/components/TemplateEditorModal.tsx \
  app/scripts/verify-ai-markers.ts \
  app/scripts/verify-daily-review-blocks.ts \
  app/scripts/verify-section-config.ts \
  app/scripts/verify-ai-runner.ts \
  app/scripts/verify-template-editor-prompt-field.ts \
  app/package.json
```

Use commit message:

```text
feat(ai-review): support unique custom AI blocks

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

---

## Self-Review

- Spec coverage: Unique markers, legacy compatibility, prompt optional defaulting, renderType prompt behavior, independent generation, heading de-duplication, UI prompt field, and verification are covered.
- Placeholder scan: No TBD/TODO placeholders remain; all code and commands are explicit.
- Type consistency: Uses existing `CustomBlock`, `RenderType`, `StatTask`, `LlmResult`, `BlockMarker`, and existing runner result types.
- Scope: Focused on daily custom AI blocks. Report templates are not upgraded in this plan except reusing prompt ideas, matching the spec's daily-block focus.
- Commit behavior: Plan explicitly says not to commit unless the user asks.
