# Dynamic AI Review Heading Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent duplicate headings in Obsidian AI review blocks for arbitrary custom daily-note topics by stripping only the AI-generated heading that matches the outer template heading.

**Architecture:** Daily-note templates already render the section heading outside the managed marker block. The AI runner should derive the nearest Markdown heading before each marker from the actual note content, then remove only a matching first heading from the generated body before hashing and writing it. If no outer heading is found, it falls back to the configured `SectionConfig.title`.

**Tech Stack:** Electron main process TypeScript, shared AI review marker utilities, `tsx` verification scripts, Node `assert`.

---

## File Structure

- Modify `app/electron/aiReview/runner.ts`
  - Add a helper to find the nearest outer Markdown heading before a marker.
  - Change `stripDuplicateSectionHeading` to accept the derived outer heading.
  - Use the derived heading in the AI branch before `embedHash()`.
- Modify `app/scripts/verify-ai-runner.ts`
  - Extend the current duplicate-heading regression to cover arbitrary custom topic headings.
  - Assert different AI subheadings are preserved.
- Optional verification command: `npm run verify:ai-runner` from `app/`.

## Important Existing Context

Template rendering places headings outside managed markers:

```md
## 项目进展
<!-- DAILYTODO:REVIEW:START -->
<!-- DAILYTODO:REVIEW:END -->
```

So the runner must not write another `## 项目进展` inside the marker body. It must still preserve a different useful AI subheading like `## 今日重点`.

Current AI write path in `app/electron/aiReview/runner.ts`:

```ts
const cleaned = stripDuplicateSectionHeading(cleanLlmContent(llm.content), section, date);
const newBody = embedHash(cleaned || llm.content.trim());
content = upsertBlock(content, marker, newBody);
```

This must change so `stripDuplicateSectionHeading` uses the actual outer heading from the note, not only `section.title`.

---

### Task 1: Add regression coverage for arbitrary custom topic headings

**Files:**
- Modify: `app/scripts/verify-ai-runner.ts`

- [ ] **Step 1: Add a failing test for custom outer heading stripping**

Insert this block before the final cleanup in `app/scripts/verify-ai-runner.ts`, after the existing duplicate-heading regression that uses `file5`:

```ts
// 回归：自定义主题标题来自模板本身；AI 正文里重复该自定义标题时只删重复标题。
const file6 = path.join(dir, '2026-06-13.md');
fs.writeFileSync(
  file6,
  [
    '# 2026-06-13',
    '## 项目进展',
    REVIEW_MARKERS.REVIEW.start,
    REVIEW_MARKERS.REVIEW.end,
    '## 明日待办',
    REVIEW_MARKERS.TOMORROW.start,
    REVIEW_MARKERS.TOMORROW.end,
    '## 可复用知识',
    REVIEW_MARKERS.KNOWLEDGE.start,
    REVIEW_MARKERS.KNOWLEDGE.end,
  ].join('\n'),
  'utf-8',
);
const customHeadingLlm = async () => ({
  ok: true as const,
  content: [
    'DAILYTODO_FINAL_START',
    '## 项目进展',
    '',
    '推进了 DailyTodo 的 AI 复盘写入规则。',
    'DAILYTODO_FINAL_END',
  ].join('\n'),
});
const customHeading = await runReviewForFile({
  filePath: file6,
  date: '2026-06-13',
  tasks: [],
  sections: createDefaultSections(),
  callLlm: customHeadingLlm,
});
assert.equal(customHeading.ok, true);
const customHeadingBody = readBlockBody(fs.readFileSync(file6, 'utf-8'), REVIEW_MARKERS.REVIEW);
assert.ok(!/^## 项目进展$/m.test(customHeadingBody), 'duplicate custom outer heading stripped from managed block body');
assert.ok(customHeadingBody.includes('推进了 DailyTodo 的 AI 复盘写入规则'), 'custom-topic body preserved after heading strip');
```

- [ ] **Step 2: Add a test that different AI subheadings are preserved**

Insert this block immediately after the `file6` assertions and before cleanup:

```ts
// 回归：AI 生成的不同小标题不是重复外层标题，必须保留。
const file7 = path.join(dir, '2026-06-14.md');
fs.writeFileSync(
  file7,
  [
    '# 2026-06-14',
    '## 项目进展',
    REVIEW_MARKERS.REVIEW.start,
    REVIEW_MARKERS.REVIEW.end,
    '## 明日待办',
    REVIEW_MARKERS.TOMORROW.start,
    REVIEW_MARKERS.TOMORROW.end,
    '## 可复用知识',
    REVIEW_MARKERS.KNOWLEDGE.start,
    REVIEW_MARKERS.KNOWLEDGE.end,
  ].join('\n'),
  'utf-8',
);
const differentHeadingLlm = async () => ({
  ok: true as const,
  content: [
    'DAILYTODO_FINAL_START',
    '## 今日重点',
    '',
    '- 完成 AI 复盘标题去重设计',
    'DAILYTODO_FINAL_END',
  ].join('\n'),
});
const differentHeading = await runReviewForFile({
  filePath: file7,
  date: '2026-06-14',
  tasks: [],
  sections: createDefaultSections(),
  callLlm: differentHeadingLlm,
});
assert.equal(differentHeading.ok, true);
const differentHeadingBody = readBlockBody(fs.readFileSync(file7, 'utf-8'), REVIEW_MARKERS.REVIEW);
assert.ok(/^## 今日重点$/m.test(differentHeadingBody), 'different AI subheading preserved');
assert.ok(differentHeadingBody.includes('完成 AI 复盘标题去重设计'), 'content under different subheading preserved');
```

- [ ] **Step 3: Run test to verify it fails before implementation**

Run from `app/`:

```bash
npm run verify:ai-runner
```

Expected before implementation: FAIL on the `file6` assertion because `stripDuplicateSectionHeading` only knows `section.title` (`复盘`) and will not strip the custom outer heading `项目进展`.

---

### Task 2: Derive the nearest outer heading before the marker

**Files:**
- Modify: `app/electron/aiReview/runner.ts`

- [ ] **Step 1: Add a helper to find the outer heading**

Add this helper near the existing cleaning helpers in `app/electron/aiReview/runner.ts`, after `isMetaPrefixLine` and before `stripDuplicateSectionHeading`:

```ts
function findNearestHeadingBeforeMarker(content: string, markerStart: string) {
  const markerIndex = content.indexOf(markerStart);
  if (markerIndex < 0) return '';
  const beforeMarker = content.slice(0, markerIndex);
  const lines = beforeMarker.split(/\r?\n/).reverse();
  for (const line of lines) {
    const match = line.trim().match(/^#{1,6}\s+(.+)$/);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return '';
}
```

- [ ] **Step 2: Change heading stripping signature**

Replace the current `stripDuplicateSectionHeading` function in `app/electron/aiReview/runner.ts` with:

```ts
function stripDuplicateSectionHeading(content: string, outerHeading: string, fallbackTitle: string, date: string) {
  const lines = content.split(/\r?\n/);
  while (lines.length && !lines[0].trim()) lines.shift();

  const first = lines[0]?.trim() ?? '';
  if (!/^#{1,6}\s+/.test(first)) return lines.join('\n').trim();

  const generatedHeading = first.replace(/^#{1,6}\s+/, '').trim();
  const expectedHeading = outerHeading.trim() || fallbackTitle.trim();
  if (!expectedHeading) return lines.join('\n').trim();

  const isDuplicate =
    generatedHeading === expectedHeading ||
    generatedHeading === `${date} ${expectedHeading}` ||
    generatedHeading.includes(expectedHeading);

  if (!isDuplicate) return lines.join('\n').trim();

  lines.shift();
  while (lines.length && !lines[0].trim()) lines.shift();
  return lines.join('\n').trim();
}
```

Rationale: The function removes only the first Markdown heading and only if it matches the actual outer template heading or the date-prefixed form. Different headings are preserved.

- [ ] **Step 3: Use derived heading in the AI write path**

In the AI branch of `runReviewForFile`, replace:

```ts
const cleaned = stripDuplicateSectionHeading(cleanLlmContent(llm.content), section, date);
const newBody = embedHash(cleaned || llm.content.trim());
```

with:

```ts
const outerHeading = findNearestHeadingBeforeMarker(content, marker.start);
const cleaned = stripDuplicateSectionHeading(cleanLlmContent(llm.content), outerHeading, section.title, date);
const newBody = embedHash(cleaned || llm.content.trim());
```

Important: compute `outerHeading` using the current `content` before calling `upsertBlock()`, so it reflects the title already present outside the marker.

- [ ] **Step 4: Run targeted verification**

Run from `app/`:

```bash
npm run verify:ai-runner
```

Expected: PASS and output includes:

```text
AI runner verification passed
```

---

### Task 3: Keep prompt guidance aligned with dynamic headings

**Files:**
- Inspect: `app/shared/aiReview/promptBuilder.ts`

- [ ] **Step 1: Confirm no hard-coded-only heading guidance remains**

Verify `SYSTEM_PROMPT` contains both of these lines:

```ts
'标记中间只放最终正文，不要放分析过程、提示词复述、来源材料标签、代码块围栏或额外标题。',
'不要在正文里重复写当前段落标题，例如“复盘”“明日待办”“可复用知识”或带日期的同名标题。',
```

No code change is required if those lines already exist.

- [ ] **Step 2: Run prompt-related verification**

Run from `app/`:

```bash
npm run verify:section-config
```

Expected: PASS and output includes:

```text
Section config verification passed
```

---

### Task 4: Final verification and manual check

**Files:**
- No code changes.

- [ ] **Step 1: Run targeted checks**

Run from `app/`:

```bash
npm run verify:ai-runner
npm run verify:section-config
npm run verify:daily-review-blocks
```

Expected outputs:

```text
AI runner verification passed
Section config verification passed
Daily review blocks verification passed
```

- [ ] **Step 2: Manual software verification**

In the app, use a daily template with a custom AI section title such as `项目进展`:

```md
## 项目进展
<!-- DAILYTODO:REVIEW:START -->
<!-- DAILYTODO:REVIEW:END -->
```

Trigger AI review generation. Expected Obsidian result:

```md
## 项目进展
<!-- DAILYTODO:REVIEW:START -->
推进了……
<!-- DAILYTODO:REVIEW:END -->
```

Not allowed:

```md
## 项目进展
<!-- DAILYTODO:REVIEW:START -->
## 项目进展
推进了……
<!-- DAILYTODO:REVIEW:END -->
```

Allowed because it is a different subheading:

```md
## 项目进展
<!-- DAILYTODO:REVIEW:START -->
## 今日重点
- 推进了……
<!-- DAILYTODO:REVIEW:END -->
```

- [ ] **Step 3: Git handling**

Do not commit unless the user explicitly asks. If the user asks for a commit, use a message like:

```bash
git add app/electron/aiReview/runner.ts app/scripts/verify-ai-runner.ts app/shared/aiReview/promptBuilder.ts
git commit -m "fix(ai-review): strip duplicate custom section headings"
```

Include the required co-author trailer in the commit message when committing via Claude Code.

---

## Self-Review

- Spec coverage: The plan derives the outer heading from the actual note content, strips only matching headings, preserves different headings, and falls back to `section.title` when no outer heading exists.
- Placeholder scan: No TBD/TODO placeholders remain; all code snippets and commands are explicit.
- Type consistency: Helper signatures use existing `content`, `marker.start`, `section.title`, and `date` values available in `runReviewForFile`.
- Scope: Focused only on duplicate headings in daily AI review marker blocks; no unrelated template or UI refactor.
