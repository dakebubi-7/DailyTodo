import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runReviewForFile } from '../electron/aiReview/runner';
import { readWithStamp } from '../electron/aiReview/atomicWrite';
import { createDefaultDailyTemplate, createDefaultSections } from '../shared/aiReview/sectionConfig';
import { REVIEW_MARKERS, customBlockMarker, readBlockBody } from '../shared/aiReview/markers';
import { hashMatches } from '../shared/aiReview/hash';

const runnerSource = fs.readFileSync(path.join(import.meta.dirname, '../electron/aiReview/runner.ts'), 'utf-8');
assert.doesNotMatch(
  runnerSource,
  /const carried = tasks\s*\.filter\([\s\S]*?\)\s*\.map\(/,
  'Deterministic carryover should build lines in one task traversal.',
);
assert.doesNotMatch(
  runnerSource,
  /const start = lines\.findIndex\([\s\S]*?const end = lines\.findIndex\(/,
  'Final-block extraction should locate its start and end markers in one line traversal.',
);
assert.doesNotMatch(
  runnerSource,
  /const beforeMarker = content\.slice\(0, markerIndex\);\s*const lines = beforeMarker\.split\(\/\\r\?\\n\/\)\.reverse\(\);/s,
  'Heading lookup should scan backward from the marker without allocating and reversing every preceding line.',
);
assert.doesNotMatch(
  runnerSource,
  /function stripDuplicateSectionHeading[\s\S]*?const lines = content\.split\(\/\\r\?\\n\/\);[\s\S]*?lines\.shift\(\);/,
  'Duplicate-heading cleanup should scan leading lines without shifting a full response array.',
);
assert.doesNotMatch(
  runnerSource,
  /function cleanLlmContent[\s\S]*?\.split\(\/\\r\?\\n\/\)[\s\S]*?lines\.shift\(\);/,
  'LLM content cleanup should scan leading metadata without allocating and shifting a full response array.',
);
assert.doesNotMatch(
  runnerSource,
  /function extractFinalBlock\(content: string\) \{\s*const lines = content\.split\(\/\\r\?\\n\/\);/,
  'Final-block extraction should scan the response without allocating every input line.',
);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-runner-'));
const file = path.join(dir, '2026-06-07.md');
fs.writeFileSync(
  file,
  [
    '# 2026-06-07',
    '## 复盘',
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

const fakeLlm = async () => ({ ok: true as const, content: 'AI 生成的复盘正文' });

const result = await runReviewForFile({
  filePath: file,
  date: '2026-06-07',
  tasks: [{ completed: true, taskDate: '2026-06-07' }],
  sections: createDefaultSections(),
  callLlm: fakeLlm,
});

assert.equal(result.ok, true);
const after = fs.readFileSync(file, 'utf-8');
const reviewBody = readBlockBody(after, REVIEW_MARKERS.REVIEW);
assert.ok(reviewBody.includes('AI 生成的复盘正文'), 'AI body filled');
assert.ok(reviewBody.includes('<!-- DAILYTODO:AI_HASH:sha256:'), 'AI hash marker present');
assert.ok(hashMatches(reviewBody), 'embedded hash matches → unmodified');

// 第二次跑（幂等 + 用户未改 → AiUnmodified → overwrite）
const second = await runReviewForFile({
  filePath: file, date: '2026-06-07',
  tasks: [{ completed: true, taskDate: '2026-06-07' }],
  sections: createDefaultSections(), callLlm: fakeLlm,
});
assert.equal(second.ok, true);

const cachedSnapshot = readWithStamp(file);
const originalReadFileSync = fs.readFileSync;
let cachedRunnerReadCount = 0;
try {
  fs.readFileSync = ((target: fs.PathOrFileDescriptor, options?: BufferEncoding | { encoding?: BufferEncoding | null; flag?: string } | null) => {
    if (String(target) === file) cachedRunnerReadCount += 1;
    return originalReadFileSync(target, options as never) as never;
  }) as typeof fs.readFileSync;
  const cachedRun = await runReviewForFile({
    filePath: file,
    initialSnapshot: cachedSnapshot,
    date: '2026-06-07',
    tasks: [],
    sections: createDefaultSections(),
    callLlm: fakeLlm,
  });
  assert.equal(cachedRun.ok, true, 'review runner should accept a caller-provided snapshot.');
} finally {
  fs.readFileSync = originalReadFileSync;
}
assert.equal(cachedRunnerReadCount, 0, 'review runner should not reread a file when given its current snapshot.');

// 用户改过 → 再跑应跳过
fs.writeFileSync(file, fs.readFileSync(file, 'utf-8').replace('AI 生成的复盘正文', '用户改写了'), 'utf-8');
const third = await runReviewForFile({
  filePath: file, date: '2026-06-07',
  tasks: [], sections: createDefaultSections(), callLlm: fakeLlm,
});
assert.ok(fs.readFileSync(file, 'utf-8').includes('用户改写了'), 'user edit preserved (skipped)');

// 明日待办：确定性结转未完成任务（不经 LLM）
const file2 = path.join(dir, '2026-06-08.md');
fs.writeFileSync(
  file2,
  [
    '# 2026-06-08',
    '## 复盘',
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
const det = await runReviewForFile({
  filePath: file2,
  date: '2026-06-08',
  tasks: [
    { completed: false, taskDate: '2026-06-08', text: '未完成项A' },
    { completed: true, taskDate: '2026-06-08', text: '已完成项B' },
  ],
  sections: createDefaultSections(),
  callLlm: fakeLlm,
});
assert.equal(det.ok, true);
const tomorrowBody = readBlockBody(fs.readFileSync(file2, 'utf-8'), REVIEW_MARKERS.TOMORROW);
assert.ok(tomorrowBody.includes('未完成项A'), '未完成任务结转到明日待办');
assert.ok(tomorrowBody.includes('（待结转）'), '待结转标记');
assert.ok(!tomorrowBody.includes('已完成项B'), '已完成任务不结转');

// LLM 返回可能混有解释/思考；写入 Obsidian 前只截取显式最终结果块。
const file3 = path.join(dir, '2026-06-09.md');
fs.writeFileSync(
  file3,
  [
    '# 2026-06-09',
    '## 复盘',
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
const finalBlockLlm = async () => ({
  ok: true as const,
  content: [
    'The user wants me to write the "复盘" (Review) section for 2026-06-09. Let me look at what\'s provided:',
    '',
    'DAILYTODO_FINAL_START',
    '今天完成了核心功能验证，下一步是把复盘写得更聚焦。',
    'DAILYTODO_FINAL_END',
    '',
    'I should now provide only the final answer.',
  ].join('\n'),
});
const extracted = await runReviewForFile({
  filePath: file3,
  date: '2026-06-09',
  tasks: [],
  sections: createDefaultSections(),
  callLlm: finalBlockLlm,
});
assert.equal(extracted.ok, true);
const extractedReviewBody = readBlockBody(fs.readFileSync(file3, 'utf-8'), REVIEW_MARKERS.REVIEW);
assert.ok(!extractedReviewBody.includes('The user wants me'), 'text before final block stripped');
assert.ok(!extractedReviewBody.includes('DAILYTODO_FINAL'), 'final block markers stripped');
assert.ok(!extractedReviewBody.includes('I should now provide'), 'text after final block stripped');
assert.ok(extractedReviewBody.includes('今天完成了核心功能验证'), 'final review content preserved');

// 回归：模型复述旧说明句时，不能把两个 inline 标签中间的 "and" 当成最终正文。
const file4 = path.join(dir, '2026-06-10.md');
fs.writeFileSync(
  file4,
  [
    '# 2026-06-10',
    '## 复盘',
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
const inlineEchoLlm = async () => ({
  ok: true as const,
  content: [
    'The final answer should be between <DAILYTODO_FINAL> and </DAILYTODO_FINAL>.',
    '',
    '今天没有足够信息可复盘。',
  ].join('\n'),
});
const inlineEcho = await runReviewForFile({
  filePath: file4,
  date: '2026-06-10',
  tasks: [],
  sections: createDefaultSections(),
  callLlm: inlineEchoLlm,
});
assert.equal(inlineEcho.ok, true);
const inlineEchoBody = readBlockBody(fs.readFileSync(file4, 'utf-8'), REVIEW_MARKERS.REVIEW);
assert.ok(!/^and$/m.test(inlineEchoBody.trim()), 'inline marker echo must not extract "and" as body');
assert.ok(inlineEchoBody.includes('今天没有足够信息可复盘'), 'fallback final content preserved when no line fence exists');

// 回归：模板已经在 marker 外有标题；AI 正文里的同段标题不能再次写入块内。
const file5 = path.join(dir, '2026-06-12.md');
fs.writeFileSync(
  file5,
  [
    '# 2026-06-12',
    '## 复盘',
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
const headingEchoLlm = async () => ({
  ok: true as const,
  content: [
    'DAILYTODO_FINAL_START',
    '## 2026-06-12 复盘',
    '',
    '今天只完成了 1 个任务。',
    'DAILYTODO_FINAL_END',
  ].join('\n'),
});
const headingEcho = await runReviewForFile({
  filePath: file5,
  date: '2026-06-12',
  tasks: [],
  sections: createDefaultSections(),
  callLlm: headingEchoLlm,
});
assert.equal(headingEcho.ok, true);
const headingEchoBody = readBlockBody(fs.readFileSync(file5, 'utf-8'), REVIEW_MARKERS.REVIEW);
assert.ok(!/^## .*复盘$/m.test(headingEchoBody), 'duplicate review heading stripped from managed block body');
assert.ok(headingEchoBody.includes('今天只完成了 1 个任务'), 'review body preserved after heading strip');

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

// 回归：自定义 AI 块按自己的 marker 写回，且不会带出 final fence。
const template = createDefaultDailyTemplate();
const customReview = template.customBlocks[0]!;
const customFile = path.join(dir, '2026-06-15.md');
const customMarker = customBlockMarker(customReview.id);
fs.writeFileSync(
  customFile,
  [
    '# 2026-06-15',
    `## ${customReview.name}`,
    customMarker.start,
    customMarker.end,
  ].join('\n'),
  'utf-8',
);
const customRun = await runReviewForFile({
  filePath: customFile,
  date: '2026-06-15',
  tasks: [],
  sections: createDefaultSections(),
  customBlocks: [customReview],
  callLlm: async () => ({ ok: true as const, content: ['DAILYTODO_FINAL_START', '自定义块内容', 'DAILYTODO_FINAL_END'].join('\n') }),
});
assert.equal(customRun.ok, true);
const customBody = readBlockBody(fs.readFileSync(customFile, 'utf-8'), customMarker);
assert.ok(customBody.includes('自定义块内容'), 'custom block body filled');
assert.ok(!customBody.includes('DAILYTODO_FINAL'), 'custom fence stripped');

// 回归：AI 返回不同于外层标题的子标题时，不能误删。
const file7 = path.join(dir, '2026-06-14.md');
fs.writeFileSync(
  file7,
  [
    '# 2026-06-14',
    '## 复盘',
    REVIEW_MARKERS.REVIEW.start,
    REVIEW_MARKERS.REVIEW.end,
  ].join('\n'),
  'utf-8',
);
const differentHeadingLlm = async () => ({
  ok: true as const,
  content: [
    'DAILYTODO_FINAL_START',
    '## 今日重点',
    '',
    '完成 AI 复盘标题去重设计。',
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

fs.rmSync(dir, { recursive: true, force: true });
console.log('AI runner verification passed');
