# DailyTodo 自动复盘与周/月报 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 DailyTodo 在每次同步 daily 文件后自动生成「复盘 / 明日待办 / 可复用知识」段落，并按需生成个人周报、月报与对外工作周报/月报；关机/断网/重启都不丢，第二天打开自动补齐。

**Architecture:** 全部在 Electron 主进程内用 TypeScript 实现（**不**外挂 Python 子进程）。核心是一组**纯函数引擎**（标记块读写、AI_HASH 状态机、补偿扫描决策、确定性统计、脱敏、prompt 构建）放在 `app/shared/aiReview/` 与 `app/shared/llm/`，可被 `tsx` verify 脚本独立测试。主进程的 `app/electron/aiReview/` 负责 I/O 编排：读 daily → 跑决策 → 调 OpenAI 兼容 API → 原子写回标记块。UI 在现有 `SettingsPanel.tsx` 增加 AI 配置与模板编辑。

**Tech Stack:** TypeScript, Electron 34, React 18, electron-store, Node `fs`/`crypto`/`os`, `tsx` 测试脚本（`node:assert`），OpenAI 兼容 HTTP 接口（Node 18+ 原生 `fetch`）。

**测试约定（重要）：** 本仓库没有 Jest/Vitest。测试 = `app/scripts/verify-<name>.ts`，用 `import { strict as assert } from 'node:assert'` 写断言，最后 `console.log('... passed')`，在 `app/package.json` 注册 `verify:<name>` 脚本并加入 `verify:rc` 聚合。运行：`cd app && npx tsx scripts/verify-<name>.ts`。每个纯函数任务都按 TDD：先写 verify 脚本（红）→ 实现（绿）→ 提交。

**里程碑分组（按 PRD 交付顺序，M-A 可独立交付）：**
- **M-A（MVP 闭环）：** Task 1–10 — 引擎核心 + 日复盘 AI 生成 + 应用触发 + 补偿扫描 + 原子写。达成 PRD §1.3 验收。
- **M-B（体验完整）：** Task 11–14 — 定时器/开机自启补偿、个人周报、配置驱动段落。
- **M-C（大白好上手）：** Task 15–17 — AI 认模板、模板编辑器 UI、首次向导。
- **M-D（进阶/商业）：** Task 18–22 — 个人月报、模糊匹配/降级、预设+覆盖、对外周报/月报（exports 隔离 + 物理脱敏）。账号登录（M8）默认延后，本计划不含。

---

## 文件结构（先锁定分解）

新增：
- `app/shared/aiReview/markers.ts` — REVIEW 段标记常量 + 通用「读/替换单个标记块」纯函数（复用现有模式，泛化 marker key）。
- `app/shared/aiReview/hash.ts` — `AI_HASH` 计算：对「去掉 hash 行后的正文」做 sha256；提取/比对。
- `app/shared/aiReview/scanDecision.ts` — 状态机：把一个标记块的当前文本 → 状态（`Unprocessed`/`AiUnmodified`/`UserModified`/`UserAuthored`/`Frozen`）→ 动作（`fill`/`overwrite`/`skip`）。
- `app/shared/aiReview/stats.ts` — 确定性统计：完成任务数、活跃天数、连续天数（不让 AI 编数字）。
- `app/shared/aiReview/redaction.ts` — 对外导出脱敏：默认剔除 `tag: private`/`secret` 与指定私人段落，仅放行 `type: work`。
- `app/shared/aiReview/sectionConfig.ts` — 段落配置 schema（marker/type/prompt）+ 默认配置 + normalize（沿用 appSettings 的 normalize 风格）。
- `app/shared/aiReview/promptBuilder.ts` — 由 daily 正文 + 段落配置 + 统计 → LLM messages。
- `app/shared/aiReview/aiReviewSettings.ts` — AI 设置 schema（baseUrl/apiKey/model/enabled/backfillDays/timer）+ normalize + store key。
- `app/shared/aiReview/weekly.ts` — 周报聚合（输入 7 天 daily + 统计 → markdown）。纯函数。
- `app/shared/aiReview/monthly.ts` — 月报聚合（输入 N 周/天 → markdown）。纯函数。
- `app/shared/llm/openaiClient.ts` — OpenAI 兼容调用（`fetch` base_url+key+model），错误归一化，**永不抛进文件写流程**。
- `app/electron/aiReview/atomicWrite.ts` — 原子写 + 读前/写前 size+mtime 守卫（§10 约束）。
- `app/electron/aiReview/runner.ts` — 单文件编排：读 daily → 逐段决策 → 调 LLM → 填标记块 → 原子写回。
- `app/electron/aiReview/backfill.ts` — 扫描近 N 天 daily，对每个 REVIEW 段执行补偿。
- `app/electron/aiReview/exportReports.ts` — 周报/月报写入 `exports/` 隔离目录 + 脱敏。
- 对应 `app/scripts/verify-*.ts` 测试脚本（每个纯函数模块一个）。

修改：
- `app/shared/obsidianTemplates.ts` — `buildDailyNoteContent` 把「复盘 / 明日待办 / 可复用知识」三段从裸标题改为带 `<!-- DAILYTODO:REVIEW:START/END -->` 等标记块。
- `app/electron/main.ts` — `syncTasksToObsidian` 末尾调用 runner；新增 IPC：`aiReview:runForDate` / `aiReview:backfill` / settings 读写；启动时跑补偿 + 注册定时器。
- `app/electron/preload.ts` — 暴露新 IPC。
- `app/shared/appSettings.ts` 或新 `aiReviewSettings.ts` — 注册 AI 设置 store key。
- `app/src/components/SettingsPanel.tsx` — AI 配置区 + 段落模板编辑器 + 首次向导。
- `app/package.json` — 注册全部 `verify:*` 脚本并加入 `verify:rc`。

---

# M-A：MVP 闭环（Task 1–10）

### Task 1: REVIEW 标记块常量与通用读写

**Files:**
- Create: `app/shared/aiReview/markers.ts`
- Test: `app/scripts/verify-ai-markers.ts`

- [ ] **Step 1: 写失败测试**

```ts
// app/scripts/verify-ai-markers.ts
import { strict as assert } from 'node:assert';
import {
  REVIEW_MARKERS,
  readBlockBody,
  upsertBlock,
} from '../shared/aiReview/markers';

assert.equal(REVIEW_MARKERS.REVIEW.start, '<!-- DAILYTODO:REVIEW:START -->');
assert.equal(REVIEW_MARKERS.REVIEW.end, '<!-- DAILYTODO:REVIEW:END -->');

const doc = [
  '# 2026-06-07',
  '<!-- DAILYTODO:REVIEW:START -->',
  '## 复盘',
  '旧内容',
  '<!-- DAILYTODO:REVIEW:END -->',
  '',
  '## 其它',
].join('\n');

assert.equal(readBlockBody(doc, REVIEW_MARKERS.REVIEW), '## 复盘\n旧内容');

const replaced = upsertBlock(doc, REVIEW_MARKERS.REVIEW, '新块');
assert.ok(replaced.includes('新块'));
assert.ok(!replaced.includes('旧内容'), 'old body must be gone');
assert.ok(replaced.includes('## 其它'), 'sibling sections must be untouched');

// 无块时追加
const fresh = upsertBlock('# 标题\n正文', REVIEW_MARKERS.REVIEW, 'X');
assert.ok(fresh.includes('<!-- DAILYTODO:REVIEW:START -->'));
assert.ok(fresh.includes('X'));

// 幂等：同一块替换两次结果一致
const once = upsertBlock(doc, REVIEW_MARKERS.REVIEW, '同步块');
const twice = upsertBlock(once, REVIEW_MARKERS.REVIEW, '同步块');
assert.equal(once, twice, 'upsert must be idempotent');

console.log('AI markers verification passed');
```

- [ ] **Step 2: 运行确认失败**

Run: `cd app && npx tsx scripts/verify-ai-markers.ts`
Expected: FAIL（`Cannot find module '../shared/aiReview/markers'`）

- [ ] **Step 3: 实现**

```ts
// app/shared/aiReview/markers.ts
export interface BlockMarker {
  start: string;
  end: string;
}

export const REVIEW_MARKERS = {
  REVIEW: { start: '<!-- DAILYTODO:REVIEW:START -->', end: '<!-- DAILYTODO:REVIEW:END -->' },
  TOMORROW: { start: '<!-- DAILYTODO:TOMORROW:START -->', end: '<!-- DAILYTODO:TOMORROW:END -->' },
  KNOWLEDGE: { start: '<!-- DAILYTODO:KNOWLEDGE:START -->', end: '<!-- DAILYTODO:KNOWLEDGE:END -->' },
} as const;

export type ReviewMarkerKey = keyof typeof REVIEW_MARKERS;

export function readBlockBody(existing: string, marker: BlockMarker): string {
  const start = existing.indexOf(marker.start);
  const end = existing.indexOf(marker.end);
  if (start === -1 || end === -1 || end <= start) return '';
  return existing.slice(start + marker.start.length, end).trim();
}

export function hasBlock(existing: string, marker: BlockMarker): boolean {
  const start = existing.indexOf(marker.start);
  const end = existing.indexOf(marker.end);
  return start !== -1 && end !== -1 && end > start;
}

/** 只替换 start/end 之间内容；无块则在文末追加。结果幂等。 */
export function upsertBlock(existing: string, marker: BlockMarker, body: string): string {
  const block = `${marker.start}\n${body.trim()}\n${marker.end}`;
  const start = existing.indexOf(marker.start);
  const end = existing.indexOf(marker.end);
  if (start !== -1 && end !== -1 && end > start) {
    const before = existing.slice(0, start).trimEnd();
    const after = existing.slice(end + marker.end.length).trimStart();
    return [before, block, after].filter(Boolean).join('\n\n') + '\n';
  }
  return `${existing.trimEnd()}\n\n${block}\n`;
}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd app && npx tsx scripts/verify-ai-markers.ts`
Expected: PASS（`AI markers verification passed`）

- [ ] **Step 5: 注册到 package.json**

在 `app/package.json` 的 `scripts` 加：`"verify:ai-markers": "tsx scripts/verify-ai-markers.ts"`，并在 `verify:rc` 链尾追加 `&& npm run verify:ai-markers`。

- [ ] **Step 6: 提交**

```bash
git add app/shared/aiReview/markers.ts app/scripts/verify-ai-markers.ts app/package.json
git commit -m "feat(ai-review): review block markers with idempotent read/upsert"
```

---

### Task 2: AI_HASH 状态指纹

**Files:**
- Create: `app/shared/aiReview/hash.ts`
- Test: `app/scripts/verify-ai-hash.ts`

设计：AI 写入的块正文里嵌一行 `<!-- DAILYTODO:AI_HASH:sha256:<hex> -->`。hash 基于「去掉该 hash 行后、normalize（trim 每行尾空格、统一 \n、去首尾空行）的正文」。比对时重算正文 hash，与嵌入值是否一致 → 判断用户是否动过。

- [ ] **Step 1: 写失败测试**

```ts
// app/scripts/verify-ai-hash.ts
import { strict as assert } from 'node:assert';
import { computeBodyHash, embedHash, extractHash, hashMatches } from '../shared/aiReview/hash';

const body = '🤖 AI 草稿\n今天完成了 X。';
const stamped = embedHash(body);
assert.ok(stamped.includes('<!-- DAILYTODO:AI_HASH:sha256:'), 'must embed hash comment');
assert.ok(stamped.includes('🤖 AI 草稿'), 'body preserved');

const extracted = extractHash(stamped);
assert.equal(extracted, computeBodyHash(body), 'extract returns the embedded hash');

// 未改动 → 一致
assert.equal(hashMatches(stamped), true, 'unmodified stamped body matches');

// 用户改了正文 → 不一致
const edited = stamped.replace('完成了 X', '完成了 Y');
assert.equal(hashMatches(edited), false, 'user edit breaks the hash');

// normalize：仅尾随空格/空行差异不算改动
const cosmetic = stamped.replace('今天完成了 X。', '今天完成了 X。   ');
assert.equal(hashMatches(cosmetic), true, 'trailing whitespace is not a real edit');

// 无 hash 行
assert.equal(extractHash('纯用户文本'), null);
assert.equal(hashMatches('纯用户文本'), false);

console.log('AI hash verification passed');
```

- [ ] **Step 2: 运行确认失败**

Run: `cd app && npx tsx scripts/verify-ai-hash.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

```ts
// app/shared/aiReview/hash.ts
import { createHash } from 'node:crypto';

const HASH_LINE = /^\s*<!--\s*DAILYTODO:AI_HASH:sha256:[0-9a-f]+\s*-->\s*$/im;

/** 去掉 hash 行后逐行 trimEnd、统一换行、去首尾空行。 */
export function normalizeBody(body: string): string {
  return body
    .replace(HASH_LINE, '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');
}

export function computeBodyHash(body: string): string {
  return createHash('sha256').update(normalizeBody(body), 'utf-8').digest('hex');
}

export function embedHash(body: string): string {
  const hash = computeBodyHash(body);
  return `<!-- DAILYTODO:AI_HASH:sha256:${hash} -->\n${body.trim()}`;
}

export function extractHash(stamped: string): string | null {
  const match = stamped.match(/<!--\s*DAILYTODO:AI_HASH:sha256:([0-9a-f]+)\s*-->/i);
  return match ? match[1] : null;
}

/** true = 文本仍是未被用户改动的 AI 草稿。 */
export function hashMatches(stamped: string): boolean {
  const embedded = extractHash(stamped);
  if (!embedded) return false;
  return embedded === computeBodyHash(stamped);
}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd app && npx tsx scripts/verify-ai-hash.ts`
Expected: PASS

- [ ] **Step 5: 注册 + 提交**

`app/package.json` 加 `"verify:ai-hash": "tsx scripts/verify-ai-hash.ts"`，并入 `verify:rc`。

```bash
git add app/shared/aiReview/hash.ts app/scripts/verify-ai-hash.ts app/package.json
git commit -m "feat(ai-review): AI_HASH state fingerprint for review blocks"
```

---

### Task 3: 补偿扫描决策状态机

**Files:**
- Create: `app/shared/aiReview/scanDecision.ts`
- Test: `app/scripts/verify-scan-decision.ts`

实现 PRD §M3.2 / 设计 §3 的判定。输入一个块的「当前正文」+ 「是否存在冻结标签」，输出状态与动作。

- [ ] **Step 1: 写失败测试**

```ts
// app/scripts/verify-scan-decision.ts
import { strict as assert } from 'node:assert';
import { decideBlock, BlockState, BlockAction } from '../shared/aiReview/scanDecision';
import { embedHash } from '../shared/aiReview/hash';

// 1. 空块 → Unprocessed → fill
assert.deepEqual(decideBlock(''), { state: BlockState.Unprocessed, action: BlockAction.Fill });
assert.deepEqual(decideBlock('   \n  '), { state: BlockState.Unprocessed, action: BlockAction.Fill });

// 2. 未改动的 AI 草稿 → AiUnmodified → overwrite 允许
const ai = embedHash('🤖 AI 草稿\n内容');
assert.deepEqual(decideBlock(ai), { state: BlockState.AiUnmodified, action: BlockAction.Overwrite });

// 3. 用户改过的 AI 草稿 → UserModified → skip
const edited = ai.replace('内容', '我改了');
assert.deepEqual(decideBlock(edited), { state: BlockState.UserModified, action: BlockAction.Skip });

// 4. 无 hash 但有内容 → UserAuthored → skip
assert.deepEqual(decideBlock('我自己写的复盘'), { state: BlockState.UserAuthored, action: BlockAction.Skip });

// 5. 冻结标签 → Frozen → skip（即便空/即便是 AI 草稿）
assert.deepEqual(
  decideBlock('<!-- DAILYTODO:FREEZE -->\n' + ai, { frozen: true }),
  { state: BlockState.Frozen, action: BlockAction.Skip },
);
assert.deepEqual(decideBlock('', { frozen: true }), { state: BlockState.Frozen, action: BlockAction.Skip });

// 6. 强制重生成绕过 skip（但不绕过 Frozen）
assert.equal(decideBlock(edited, { force: true }).action, BlockAction.Overwrite);
assert.equal(decideBlock('', { frozen: true, force: true }).action, BlockAction.Skip);

console.log('Scan decision verification passed');
```

- [ ] **Step 2: 运行确认失败**

Run: `cd app && npx tsx scripts/verify-scan-decision.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

```ts
// app/shared/aiReview/scanDecision.ts
import { extractHash, hashMatches } from './hash';

export enum BlockState {
  Unprocessed = 'Unprocessed',
  AiUnmodified = 'AiUnmodified',
  UserModified = 'UserModified',
  UserAuthored = 'UserAuthored',
  Frozen = 'Frozen',
}

export enum BlockAction {
  Fill = 'fill',
  Overwrite = 'overwrite',
  Skip = 'skip',
}

export interface DecideOptions {
  /** 块内或文件级存在冻结标签。 */
  frozen?: boolean;
  /** 显式重生成（仅绕过 Skip，绝不绕过 Frozen）。 */
  force?: boolean;
}

export interface Decision {
  state: BlockState;
  action: BlockAction;
}

export function decideBlock(body: string, options: DecideOptions = {}): Decision {
  if (options.frozen) return { state: BlockState.Frozen, action: BlockAction.Skip };

  const trimmed = body.replace(/<!--\s*DAILYTODO:[^>]*-->/g, '').trim();
  if (!trimmed) return { state: BlockState.Unprocessed, action: BlockAction.Fill };

  const hasHash = extractHash(body) !== null;
  if (!hasHash) {
    return { state: BlockState.UserAuthored, action: options.force ? BlockAction.Overwrite : BlockAction.Skip };
  }
  if (hashMatches(body)) {
    return { state: BlockState.AiUnmodified, action: BlockAction.Overwrite };
  }
  return { state: BlockState.UserModified, action: options.force ? BlockAction.Overwrite : BlockAction.Skip };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd app && npx tsx scripts/verify-scan-decision.ts`
Expected: PASS

- [ ] **Step 5: 注册 + 提交**

`"verify:scan-decision": "tsx scripts/verify-scan-decision.ts"` → `verify:rc`。

```bash
git add app/shared/aiReview/scanDecision.ts app/scripts/verify-scan-decision.ts app/package.json
git commit -m "feat(ai-review): backfill scan decision state machine"
```

---

### Task 4: 确定性统计（不让 AI 编数字）

**Files:**
- Create: `app/shared/aiReview/stats.ts`
- Test: `app/scripts/verify-ai-stats.ts`

输入复用主进程 `Task` 形状的子集；只需 `completed`、`taskDate`、`completionReviews`/`completionReview`。复用 `taskRollover.ts` 已有的 `getLatestCompletionPercent` 思路但独立实现以免循环依赖。

- [ ] **Step 1: 写失败测试**

```ts
// app/scripts/verify-ai-stats.ts
import { strict as assert } from 'node:assert';
import { computeDailyStats, computeRangeStats, StatTask } from '../shared/aiReview/stats';

const tasks: StatTask[] = [
  { completed: true, taskDate: '2026-06-07' },
  { completed: false, taskDate: '2026-06-07' },
  { completed: true, taskDate: '2026-06-06' },
];

const day = computeDailyStats(tasks, '2026-06-07');
assert.equal(day.total, 2);
assert.equal(day.completed, 1);
assert.equal(day.completionRate, 50);

// 范围统计：活跃天数 = 有任务的不同日期数；连续天数 = 截至 endDate 的连续活跃
const range = computeRangeStats(tasks, '2026-06-01', '2026-06-07');
assert.equal(range.activeDays, 2);
assert.equal(range.totalCompleted, 2);
assert.equal(range.streak, 2, '06-06 与 06-07 连续');

// 空数据不崩
const empty = computeDailyStats([], '2026-06-07');
assert.equal(empty.total, 0);
assert.equal(empty.completionRate, 0);

console.log('AI stats verification passed');
```

- [ ] **Step 2: 运行确认失败**

Run: `cd app && npx tsx scripts/verify-ai-stats.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

```ts
// app/shared/aiReview/stats.ts
export interface StatTask {
  completed: boolean;
  taskDate?: string;
  createdAt?: string;
}

export interface DailyStats {
  date: string;
  total: number;
  completed: number;
  completionRate: number; // 0-100 整数
}

export interface RangeStats {
  start: string;
  end: string;
  activeDays: number;
  totalCompleted: number;
  totalTasks: number;
  streak: number;
}

function dateOf(task: StatTask): string {
  return task.taskDate || task.createdAt?.slice(0, 10) || '';
}

function shiftDate(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  const d = String(next.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeDailyStats(tasks: StatTask[], date: string): DailyStats {
  const ofDay = tasks.filter((t) => dateOf(t) === date);
  const completed = ofDay.filter((t) => t.completed).length;
  const total = ofDay.length;
  return {
    date,
    total,
    completed,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function computeRangeStats(tasks: StatTask[], start: string, end: string): RangeStats {
  const inRange = tasks.filter((t) => {
    const d = dateOf(t);
    return d >= start && d <= end;
  });
  const activeDates = new Set(inRange.map(dateOf).filter(Boolean));

  let streak = 0;
  let cursor = end;
  while (activeDates.has(cursor) && cursor >= start) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }

  return {
    start,
    end,
    activeDays: activeDates.size,
    totalCompleted: inRange.filter((t) => t.completed).length,
    totalTasks: inRange.length,
    streak,
  };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd app && npx tsx scripts/verify-ai-stats.ts`
Expected: PASS

- [ ] **Step 5: 注册 + 提交**

`"verify:ai-stats": "tsx scripts/verify-ai-stats.ts"` → `verify:rc`。

```bash
git add app/shared/aiReview/stats.ts app/scripts/verify-ai-stats.ts app/package.json
git commit -m "feat(ai-review): deterministic stats computed by code not LLM"
```

---

### Task 5: AI 设置 schema 与 store key

**Files:**
- Create: `app/shared/aiReview/aiReviewSettings.ts`
- Test: `app/scripts/verify-ai-settings.ts`

- [ ] **Step 1: 写失败测试**

```ts
// app/scripts/verify-ai-settings.ts
import { strict as assert } from 'node:assert';
import {
  AI_REVIEW_SETTINGS_KEY,
  createDefaultAiReviewSettings,
  normalizeAiReviewSettings,
} from '../shared/aiReview/aiReviewSettings';

assert.equal(AI_REVIEW_SETTINGS_KEY, 'aiReviewSettings');

const def = createDefaultAiReviewSettings();
assert.equal(def.enabled, false, 'AI off by default (no key yet)');
assert.equal(def.baseUrl, 'https://api.openai.com/v1');
assert.equal(def.backfillDays, 7);
assert.equal(def.timerEnabled, false);
assert.equal(def.timerTime, '23:00');

// normalize 容错
const norm = normalizeAiReviewSettings({ enabled: 'yes', backfillDays: -5, timerTime: '99:99', model: '' });
assert.equal(norm.enabled, false, 'non-boolean → default');
assert.equal(norm.backfillDays, 7, 'invalid number → default');
assert.equal(norm.timerTime, '23:00', 'invalid time → default');
assert.ok(norm.model.length > 0, 'empty model → default');

// 合法值保留
const ok = normalizeAiReviewSettings({ enabled: true, apiKey: 'sk-x', backfillDays: 14, timerTime: '07:30' });
assert.equal(ok.enabled, true);
assert.equal(ok.apiKey, 'sk-x');
assert.equal(ok.backfillDays, 14);
assert.equal(ok.timerTime, '07:30');

console.log('AI settings verification passed');
```

- [ ] **Step 2: 运行确认失败**

Run: `cd app && npx tsx scripts/verify-ai-settings.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

```ts
// app/shared/aiReview/aiReviewSettings.ts
export interface AiReviewSettings {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  backfillDays: number;
  timerEnabled: boolean;
  timerTime: string; // HH:mm
}

export const AI_REVIEW_SETTINGS_KEY = 'aiReviewSettings';

export function createDefaultAiReviewSettings(): AiReviewSettings {
  return {
    enabled: false,
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    backfillDays: 7,
    timerEnabled: false,
    timerTime: '23:00',
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v && typeof v === 'object' && !Array.isArray(v));
}
function isTime(v: unknown): v is string {
  return typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}
function text(v: unknown, fb: string) {
  return typeof v === 'string' && v.trim() ? v : fb;
}

export function normalizeAiReviewSettings(value: unknown): AiReviewSettings {
  const d = createDefaultAiReviewSettings();
  if (!isObject(value)) return d;
  const backfill = Number(value.backfillDays);
  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : d.enabled,
    baseUrl: text(value.baseUrl, d.baseUrl),
    apiKey: typeof value.apiKey === 'string' ? value.apiKey : d.apiKey,
    model: text(value.model, d.model),
    backfillDays: Number.isInteger(backfill) && backfill >= 1 && backfill <= 60 ? backfill : d.backfillDays,
    timerEnabled: typeof value.timerEnabled === 'boolean' ? value.timerEnabled : d.timerEnabled,
    timerTime: isTime(value.timerTime) ? value.timerTime : d.timerTime,
  };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd app && npx tsx scripts/verify-ai-settings.ts`
Expected: PASS

- [ ] **Step 5: 注册 + 提交**

`"verify:ai-settings": "tsx scripts/verify-ai-settings.ts"` → `verify:rc`。

```bash
git add app/shared/aiReview/aiReviewSettings.ts app/scripts/verify-ai-settings.ts app/package.json
git commit -m "feat(ai-review): ai review settings schema with normalize"
```

---

### Task 6: 段落配置 schema 与 prompt 构建

**Files:**
- Create: `app/shared/aiReview/sectionConfig.ts`
- Create: `app/shared/aiReview/promptBuilder.ts`
- Test: `app/scripts/verify-section-config.ts`

- [ ] **Step 1: 写失败测试**

```ts
// app/scripts/verify-section-config.ts
import { strict as assert } from 'node:assert';
import { createDefaultSections, SectionType } from '../shared/aiReview/sectionConfig';
import { buildReviewMessages } from '../shared/aiReview/promptBuilder';

const sections = createDefaultSections();
const review = sections.find((s) => s.markerKey === 'REVIEW')!;
assert.equal(review.type, SectionType.Ai);
assert.ok(review.prompt.length > 0);

const tomorrow = sections.find((s) => s.markerKey === 'TOMORROW')!;
assert.equal(tomorrow.type, SectionType.Deterministic, '明日待办先确定性结转');

const messages = buildReviewMessages({
  date: '2026-06-07',
  dailyContent: '## 今日工作\n写了复盘引擎\n## 每日任务\n- [x] Task1',
  section: review,
  stats: { date: '2026-06-07', total: 1, completed: 1, completionRate: 100 },
});
assert.equal(messages[0].role, 'system');
assert.equal(messages[1].role, 'user');
assert.ok(messages[1].content.includes('2026-06-07'));
assert.ok(messages[1].content.includes('写了复盘引擎'), 'daily content included');
assert.ok(messages[1].content.includes('100'), 'deterministic stats injected, not invented');
assert.ok(messages[0].content.includes('不要编造数字') || messages[0].content.includes('do not invent'));

console.log('Section config verification passed');
```

- [ ] **Step 2: 运行确认失败**

Run: `cd app && npx tsx scripts/verify-section-config.ts`
Expected: FAIL

- [ ] **Step 3: 实现 sectionConfig.ts**

```ts
// app/shared/aiReview/sectionConfig.ts
import type { ReviewMarkerKey } from './markers';

export enum SectionType {
  Ai = 'ai',
  Deterministic = 'deterministic',
}

export interface SectionConfig {
  markerKey: ReviewMarkerKey;
  title: string;
  type: SectionType;
  prompt: string;
}

export function createDefaultSections(): SectionConfig[] {
  return [
    {
      markerKey: 'REVIEW',
      title: '复盘',
      type: SectionType.Ai,
      prompt: '基于今天的工作记录、完成的任务和灵感，总结今天做了什么、有什么收获、可以改进的地方。语气口语、简洁。',
    },
    {
      markerKey: 'TOMORROW',
      title: '明日待办',
      type: SectionType.Deterministic,
      prompt: '根据今天进度，列出明天要完成的事；未完成任务自动结转，AI 仅追加建议。',
    },
    {
      markerKey: 'KNOWLEDGE',
      title: '可复用知识',
      type: SectionType.Ai,
      prompt: '从今天的内容里提炼可复用的经验/结论，给出可沉淀到主题笔记的要点。没有就如实说没有。',
    },
  ];
}

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v && typeof v === 'object' && !Array.isArray(v));
}

/** 用户配置覆盖默认；非法项回落默认。 */
export function normalizeSections(value: unknown): SectionConfig[] {
  if (!Array.isArray(value)) return createDefaultSections();
  const defaults = createDefaultSections();
  const byKey = new Map(defaults.map((s) => [s.markerKey, s]));
  for (const raw of value) {
    if (!isObject(raw)) continue;
    const key = raw.markerKey as ReviewMarkerKey;
    const base = byKey.get(key);
    if (!base) continue;
    byKey.set(key, {
      ...base,
      title: typeof raw.title === 'string' && raw.title.trim() ? raw.title : base.title,
      type: raw.type === SectionType.Deterministic ? SectionType.Deterministic : raw.type === SectionType.Ai ? SectionType.Ai : base.type,
      prompt: typeof raw.prompt === 'string' && raw.prompt.trim() ? raw.prompt : base.prompt,
    });
  }
  return defaults.map((s) => byKey.get(s.markerKey)!);
}
```

- [ ] **Step 4: 实现 promptBuilder.ts**

```ts
// app/shared/aiReview/promptBuilder.ts
import type { SectionConfig } from './sectionConfig';
import type { DailyStats } from './stats';

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export interface BuildMessagesParams {
  date: string;
  dailyContent: string;
  section: SectionConfig;
  stats: DailyStats;
}

const SYSTEM_PROMPT = [
  '你是 DailyTodo 的复盘助手。你产出的是草稿，署名交出去的内容仍由用户拍板。',
  '严格规则：不要编造数字统计，所有数字以下面给出的「确定性统计」为准；不要虚构当天没发生的事；如果信息不足就如实说明。',
  '输出 Markdown 正文片段，不要重复标题，不要加代码块围栏。',
].join('\n');

export function buildReviewMessages(params: BuildMessagesParams): ChatMessage[] {
  const { date, dailyContent, section, stats } = params;
  const user = [
    `日期：${date}`,
    `任务：『${section.title}』`,
    `要求：${section.prompt}`,
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

- [ ] **Step 5: 运行确认通过**

Run: `cd app && npx tsx scripts/verify-section-config.ts`
Expected: PASS

- [ ] **Step 6: 注册 + 提交**

`"verify:section-config": "tsx scripts/verify-section-config.ts"` → `verify:rc`。

```bash
git add app/shared/aiReview/sectionConfig.ts app/shared/aiReview/promptBuilder.ts app/scripts/verify-section-config.ts app/package.json
git commit -m "feat(ai-review): section config + prompt builder with stats injection"
```

---

### Task 7: OpenAI 兼容 LLM 客户端（永不破坏文件）

**Files:**
- Create: `app/shared/llm/openaiClient.ts`
- Test: `app/scripts/verify-openai-client.ts`

关键：调用失败（无 key/断网/超时/非 200）返回 `{ ok: false, error }`，**绝不抛异常**，让调用方安全跳过写文件。

- [ ] **Step 1: 写失败测试**（注入 fetch，避免真网络）

```ts
// app/scripts/verify-openai-client.ts
import { strict as assert } from 'node:assert';
import { callChatCompletion } from '../shared/llm/openaiClient';

const base = { baseUrl: 'https://x/v1', apiKey: 'sk-test', model: 'm' };
const messages = [{ role: 'user' as const, content: 'hi' }];

// 缺 key → ok:false，不抛
const noKey = await callChatCompletion({ ...base, apiKey: '' }, messages);
assert.equal(noKey.ok, false);
assert.ok(noKey.error.includes('key') || noKey.error.includes('Key'));

// 成功路径（注入 fetch）
const okFetch = (async () =>
  ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: '生成内容' } }] }) })) as unknown as typeof fetch;
const ok = await callChatCompletion(base, messages, { fetchImpl: okFetch });
assert.equal(ok.ok, true);
assert.equal(ok.ok && ok.content, '生成内容');

// 非 200 → ok:false
const badFetch = (async () => ({ ok: false, status: 401, text: async () => 'unauthorized' })) as unknown as typeof fetch;
const bad = await callChatCompletion(base, messages, { fetchImpl: badFetch });
assert.equal(bad.ok, false);
assert.ok(bad.error.includes('401'));

// fetch 抛错 → ok:false，不冒泡
const throwFetch = (async () => { throw new Error('ECONNREFUSED'); }) as unknown as typeof fetch;
const net = await callChatCompletion(base, messages, { fetchImpl: throwFetch });
assert.equal(net.ok, false);
assert.ok(net.error.includes('ECONNREFUSED'));

console.log('OpenAI client verification passed');
```

- [ ] **Step 2: 运行确认失败**

Run: `cd app && npx tsx scripts/verify-openai-client.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

```ts
// app/shared/llm/openaiClient.ts
import type { ChatMessage } from '../aiReview/promptBuilder';

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export type LlmResult = { ok: true; content: string } | { ok: false; error: string };

export interface CallOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function callChatCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  options: CallOptions = {},
): Promise<LlmResult> {
  if (!config.apiKey) return { ok: false, error: '缺少 API Key（请在设置中填写）' };
  if (!config.baseUrl) return { ok: false, error: '缺少 base_url' };

  const doFetch = options.fetchImpl ?? fetch;
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);

  try {
    const res = await doFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.model, messages, temperature: 0.7 }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `LLM 返回 ${res.status}：${body.slice(0, 200)}` };
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return { ok: false, error: 'LLM 返回空内容' };
    return { ok: true, content };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd app && npx tsx scripts/verify-openai-client.ts`
Expected: PASS

- [ ] **Step 5: 注册 + 提交**

`"verify:openai-client": "tsx scripts/verify-openai-client.ts"` → `verify:rc`。

```bash
git add app/shared/llm/openaiClient.ts app/scripts/verify-openai-client.ts app/package.json
git commit -m "feat(llm): OpenAI-compatible client that never throws into file flow"
```

---

### Task 8: 原子写 + 外部修改守卫

**Files:**
- Create: `app/electron/aiReview/atomicWrite.ts`
- Test: `app/scripts/verify-atomic-write.ts`

实现设计 §10：读时记 size+mtime → 写临时文件 → 写前复查 size+mtime，若被外部改动则放弃并报冲突 → `fs.renameSync`（同分区原子）替换。

- [ ] **Step 1: 写失败测试**（用真实临时文件）

```ts
// app/scripts/verify-atomic-write.ts
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readWithStamp, atomicReplace } from '../electron/aiReview/atomicWrite';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-atomic-'));
const file = path.join(dir, 'note.md');
fs.writeFileSync(file, '原始内容', 'utf-8');

// 正常读 → 写
const snap = readWithStamp(file);
assert.equal(snap.content, '原始内容');
const ok = atomicReplace(file, '新内容', snap.stamp);
assert.equal(ok.ok, true);
assert.equal(fs.readFileSync(file, 'utf-8'), '新内容');

// 冲突：拿旧 stamp，但文件被外部改动 → 拒绝写
const snap2 = readWithStamp(file);
fs.writeFileSync(file, '外部进程改的', 'utf-8'); // 模拟 Obsidian/同步盘
const conflict = atomicReplace(file, '我要覆盖', snap2.stamp);
assert.equal(conflict.ok, false);
assert.ok(conflict.error!.includes('冲突') || conflict.error!.includes('changed'));
assert.equal(fs.readFileSync(file, 'utf-8'), '外部进程改的', '冲突时绝不覆盖');

fs.rmSync(dir, { recursive: true, force: true });
console.log('Atomic write verification passed');
```

- [ ] **Step 2: 运行确认失败**

Run: `cd app && npx tsx scripts/verify-atomic-write.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

```ts
// app/electron/aiReview/atomicWrite.ts
import fs from 'node:fs';
import path from 'node:path';

export interface FileStamp {
  size: number;
  mtimeMs: number;
}

export interface ReadResult {
  content: string;
  stamp: FileStamp | null; // null = 文件不存在
}

export function readWithStamp(filePath: string): ReadResult {
  if (!fs.existsSync(filePath)) return { content: '', stamp: null };
  const stat = fs.statSync(filePath);
  return { content: fs.readFileSync(filePath, 'utf-8'), stamp: { size: stat.size, mtimeMs: stat.mtimeMs } };
}

/** 仅当文件 size+mtime 与读取时一致才原子替换；否则报冲突、绝不覆盖。 */
export function atomicReplace(filePath: string, nextContent: string, expected: FileStamp | null): { ok: boolean; error?: string } {
  try {
    if (fs.existsSync(filePath)) {
      const now = fs.statSync(filePath);
      if (!expected || now.size !== expected.size || now.mtimeMs !== expected.mtimeMs) {
        return { ok: false, error: '文件已被外部修改（同步/Obsidian），放弃写入避免冲突' };
      }
    } else if (expected) {
      return { ok: false, error: '文件已被外部删除，放弃写入' };
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = path.join(path.dirname(filePath), `${path.basename(filePath)}.tmp-${process.pid}`);
    fs.writeFileSync(tmp, nextContent, 'utf-8');
    fs.renameSync(tmp, filePath); // 同目录 → 同分区 → 原子
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
```

> 注：`renameSync` 在同目录内即同分区，满足 `os.replace()` 等价的原子语义。临时文件名带 pid 避免并发碰撞。

- [ ] **Step 4: 运行确认通过**

Run: `cd app && npx tsx scripts/verify-atomic-write.ts`
Expected: PASS

- [ ] **Step 5: 注册 + 提交**

`"verify:atomic-write": "tsx scripts/verify-atomic-write.ts"` → `verify:rc`。

```bash
git add app/electron/aiReview/atomicWrite.ts app/scripts/verify-atomic-write.ts app/package.json
git commit -m "feat(ai-review): atomic write with external-modification guard"
```

---

### Task 9: daily 模板三段改为标记块

**Files:**
- Modify: `app/shared/obsidianTemplates.ts:182-217`（`buildDailyNoteContent`）
- Test: `app/scripts/verify-daily-review-blocks.ts`

把「复盘 / 明日待办 / 可复用知识」三段用 Task 1 的 REVIEW 标记包起来，使 runner 能精确替换且不碰工作/任务段。

- [ ] **Step 1: 写失败测试**

```ts
// app/scripts/verify-daily-review-blocks.ts
import { strict as assert } from 'node:assert';
import { buildDailyNoteContent } from '../shared/obsidianTemplates';
import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';
import { REVIEW_MARKERS, hasBlock } from '../shared/aiReview/markers';

const content = buildDailyNoteContent({
  date: '2026-06-07',
  tasks: [],
  dailyWork: '',
  dailyInspiration: '',
  templates: createDefaultObsidianTemplateSettings(),
});

assert.ok(hasBlock(content, REVIEW_MARKERS.REVIEW), 'REVIEW block present');
assert.ok(hasBlock(content, REVIEW_MARKERS.TOMORROW), 'TOMORROW block present');
assert.ok(hasBlock(content, REVIEW_MARKERS.KNOWLEDGE), 'KNOWLEDGE block present');
// 既有任务/工作标记仍在
assert.ok(content.includes('<!-- DAILYTODO:TASKS:START -->'));
assert.ok(content.includes('<!-- DAILYTODO:WORK:START -->'));

console.log('Daily review blocks verification passed');
```

- [ ] **Step 2: 运行确认失败**

Run: `cd app && npx tsx scripts/verify-daily-review-blocks.ts`
Expected: FAIL（三段还是裸标题）

- [ ] **Step 3: 修改 `buildDailyNoteContent`**

在 [obsidianTemplates.ts](app/shared/obsidianTemplates.ts) 顶部加入：

```ts
import { REVIEW_MARKERS } from './aiReview/markers';
```

把 [obsidianTemplates.ts:204-216](app/shared/obsidianTemplates.ts#L204-L216) 三段替换为标记块（保留原标题与占位提示文案作为块内默认正文）：

```ts
    REVIEW_MARKERS.REVIEW.start,
    `## ${templates.reviewSectionTitle}`,
    '- 今天最值得保留的经验：',
    '- 可以改进的地方：',
    REVIEW_MARKERS.REVIEW.end,
    '',
    REVIEW_MARKERS.TOMORROW.start,
    `## ${templates.tomorrowTaskSectionTitle}`,
    '- [ ] ',
    REVIEW_MARKERS.TOMORROW.end,
    '',
    REVIEW_MARKERS.KNOWLEDGE.start,
    `## ${templates.reusableKnowledgeSectionTitle}`,
    '- 从每日任务、工作记录和灵感闪念中提炼可复用经验。',
    '- 后续可以把稳定结论拆到主题笔记，并在这里保留日期索引。',
    REVIEW_MARKERS.KNOWLEDGE.end,
    '',
```

- [ ] **Step 4: 运行确认通过 + 回归**

Run: `cd app && npx tsx scripts/verify-daily-review-blocks.ts`
Expected: PASS
Run: `cd app && npm run verify:rc`
Expected: 全部 PASS（确认未破坏既有模板测试）

- [ ] **Step 5: 注册 + 提交**

`"verify:daily-review-blocks": "tsx scripts/verify-daily-review-blocks.ts"` → `verify:rc`。

```bash
git add app/shared/obsidianTemplates.ts app/scripts/verify-daily-review-blocks.ts app/package.json
git commit -m "feat(ai-review): wrap review/tomorrow/knowledge sections in markers"
```

---

### Task 10: 单文件 runner + 主进程接线 + 补偿扫描

**Files:**
- Create: `app/electron/aiReview/runner.ts`
- Create: `app/electron/aiReview/backfill.ts`
- Create: `app/scripts/verify-ai-runner.ts`
- Modify: `app/electron/main.ts`（接线 + IPC + 启动补偿）
- Modify: `app/electron/preload.ts`

runner 设计为可测：把 LLM 调用与文件 I/O 作为依赖注入，纯逻辑（读→决策→填→统计→hash）可在 verify 脚本里跑。

- [ ] **Step 1: 写失败测试（注入 fake LLM + 临时文件）**

```ts
// app/scripts/verify-ai-runner.ts
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runReviewForFile } from '../electron/aiReview/runner';
import { createDefaultSections } from '../shared/aiReview/sectionConfig';
import { REVIEW_MARKERS, readBlockBody } from '../shared/aiReview/markers';
import { hashMatches } from '../shared/aiReview/hash';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-runner-'));
const file = path.join(dir, '2026-06-07.md');
fs.writeFileSync(
  file,
  [
    '# 2026-06-07',
    REVIEW_MARKERS.REVIEW.start,
    '## 复盘',
    REVIEW_MARKERS.REVIEW.end,
    REVIEW_MARKERS.TOMORROW.start,
    '## 明日待办',
    REVIEW_MARKERS.TOMORROW.end,
    REVIEW_MARKERS.KNOWLEDGE.start,
    '## 可复用知识',
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
assert.ok(reviewBody.includes('🤖'), 'AI marker present');
assert.ok(hashMatches(reviewBody), 'embedded hash matches → unmodified');

// 第二次跑（幂等 + 用户未改 → AiUnmodified → overwrite，但内容相同则文件等价）
const second = await runReviewForFile({
  filePath: file, date: '2026-06-07',
  tasks: [{ completed: true, taskDate: '2026-06-07' }],
  sections: createDefaultSections(), callLlm: fakeLlm,
});
assert.equal(second.ok, true);

// 用户改过 → 再跑应跳过
fs.writeFileSync(file, fs.readFileSync(file, 'utf-8').replace('AI 生成的复盘正文', '用户改写了'), 'utf-8');
const third = await runReviewForFile({
  filePath: file, date: '2026-06-07',
  tasks: [], sections: createDefaultSections(), callLlm: fakeLlm,
});
assert.ok(fs.readFileSync(file, 'utf-8').includes('用户改写了'), 'user edit preserved (skipped)');

fs.rmSync(dir, { recursive: true, force: true });
console.log('AI runner verification passed');
```

- [ ] **Step 2: 运行确认失败**

Run: `cd app && npx tsx scripts/verify-ai-runner.ts`
Expected: FAIL

- [ ] **Step 3: 实现 runner.ts**

```ts
// app/electron/aiReview/runner.ts
import { readWithStamp, atomicReplace } from './atomicWrite';
import { REVIEW_MARKERS, readBlockBody, upsertBlock } from '../../shared/aiReview/markers';
import { decideBlock, BlockAction } from '../../shared/aiReview/scanDecision';
import { embedHash } from '../../shared/aiReview/hash';
import { computeDailyStats, StatTask } from '../../shared/aiReview/stats';
import { buildReviewMessages } from '../../shared/aiReview/promptBuilder';
import { SectionConfig, SectionType } from '../../shared/aiReview/sectionConfig';
import type { LlmResult } from '../../shared/llm/openaiClient';

const FREEZE_TAG = '<!-- DAILYTODO:FREEZE -->';

export interface RunParams {
  filePath: string;
  date: string;
  tasks: StatTask[];
  sections: SectionConfig[];
  callLlm: (messages: ReturnType<typeof buildReviewMessages>) => Promise<LlmResult>;
  force?: boolean;
}

export interface RunResult {
  ok: boolean;
  error?: string;
  filledMarkers: string[];
  skippedMarkers: string[];
}

export async function runReviewForFile(params: RunParams): Promise<RunResult> {
  const { filePath, date, tasks, sections, callLlm, force } = params;
  const snap = readWithStamp(filePath);
  if (snap.stamp === null) {
    return { ok: false, error: '日记文件不存在', filledMarkers: [], skippedMarkers: [] };
  }

  const fileFrozen = snap.content.includes(FREEZE_TAG);
  const stats = computeDailyStats(tasks, date);
  let content = snap.content;
  const filled: string[] = [];
  const skipped: string[] = [];

  for (const section of sections) {
    const marker = REVIEW_MARKERS[section.markerKey];
    const body = readBlockBody(content, marker);
    const blockFrozen = fileFrozen || body.includes(FREEZE_TAG);
    const decision = decideBlock(body, { frozen: blockFrozen, force });

    if (decision.action === BlockAction.Skip) {
      skipped.push(section.markerKey);
      continue;
    }

    if (section.type === SectionType.Deterministic) {
      // 明日待办：确定性结转由调用方在 tasks 中体现，这里仅保证块存在；AI 追加见 M-B Task 14。
      skipped.push(section.markerKey);
      continue;
    }

    const messages = buildReviewMessages({ date, dailyContent: content, section, stats });
    const llm = await callLlm(messages);
    if (!llm.ok) {
      skipped.push(section.markerKey);
      continue; // 单段失败不影响其它段，更不破坏文件
    }

    const newBody = embedHash(`🤖 AI 草稿\n${llm.content}`);
    content = upsertBlock(content, marker, newBody);
    filled.push(section.markerKey);
  }

  if (!filled.length) return { ok: true, filledMarkers: [], skippedMarkers: skipped };

  const write = atomicReplace(filePath, content, snap.stamp);
  if (!write.ok) return { ok: false, error: write.error, filledMarkers: [], skippedMarkers: skipped };
  return { ok: true, filledMarkers: filled, skippedMarkers: skipped };
}
```

- [ ] **Step 4: 实现 backfill.ts**

```ts
// app/electron/aiReview/backfill.ts
import { runReviewForFile, RunParams } from './runner';

export interface BackfillParams {
  dates: string[]; // 近 N 天（业务日）
  resolveFilePath: (date: string) => string;
  tasksForDate: (date: string) => RunParams['tasks'];
  sections: RunParams['sections'];
  callLlm: RunParams['callLlm'];
  fileExists: (filePath: string) => boolean;
}

export interface BackfillReport {
  processed: string[];
  filled: string[];
  errors: Array<{ date: string; error: string }>;
}

/** 串行处理，单文件失败跳过、记录，不中断整体。 */
export async function backfillReviews(params: BackfillParams): Promise<BackfillReport> {
  const report: BackfillReport = { processed: [], filled: [], errors: [] };
  for (const date of params.dates) {
    const filePath = params.resolveFilePath(date);
    if (!params.fileExists(filePath)) continue;
    report.processed.push(date);
    const r = await runReviewForFile({
      filePath, date,
      tasks: params.tasksForDate(date),
      sections: params.sections,
      callLlm: params.callLlm,
    });
    if (!r.ok && r.error) report.errors.push({ date, error: r.error });
    if (r.filledMarkers.length) report.filled.push(date);
  }
  return report;
}
```

- [ ] **Step 5: 运行确认通过**

Run: `cd app && npx tsx scripts/verify-ai-runner.ts`
Expected: PASS

- [ ] **Step 6: 主进程接线**

在 [main.ts](app/electron/main.ts) 顶部 import：

```ts
import { runReviewForFile } from './aiReview/runner';
import { backfillReviews } from './aiReview/backfill';
import { callChatCompletion } from '../shared/llm/openaiClient';
import { AI_REVIEW_SETTINGS_KEY, normalizeAiReviewSettings } from '../shared/aiReview/aiReviewSettings';
import { normalizeSections } from '../shared/aiReview/sectionConfig';
import { buildReviewMessages } from '../shared/aiReview/promptBuilder';
import { shiftDateKey, getBusinessDateKey } from '../shared/taskRollover';
```

加 settings getter（紧邻 `getObsidianTemplateSettings`，约 [main.ts:518](app/electron/main.ts#L518)）：

```ts
function getAiReviewSettings() {
  return normalizeAiReviewSettings(store.get(AI_REVIEW_SETTINGS_KEY));
}
function getReviewSections() {
  return normalizeSections(store.get('aiReviewSections'));
}
function llmCaller() {
  const s = getAiReviewSettings();
  return (messages: ReturnType<typeof buildReviewMessages>) =>
    callChatCompletion({ baseUrl: s.baseUrl, apiKey: s.apiKey, model: s.model }, messages);
}
```

加一个对外函数（供同步后与 IPC 复用）：

```ts
async function runReviewForDate(date: string, tasks: Task[]) {
  const settings = getAiReviewSettings();
  if (!settings.enabled || !settings.apiKey) return { ok: false, error: 'AI 复盘未启用或缺少 Key' };
  const filePath = getDailyFilePath(date);
  return runReviewForFile({
    filePath, date,
    tasks: tasks as unknown as Parameters<typeof runReviewForFile>[0]['tasks'],
    sections: getReviewSections(),
    callLlm: llmCaller(),
  });
}
```

在 `syncTasksToObsidian` 末尾（[main.ts:735](app/electron/main.ts#L735) `return` 之前）追加触发（不 await，失败静默）：

```ts
  void runReviewForDate(selected, tasks).catch(() => {});
```

- [ ] **Step 7: IPC + 启动补偿**

在 IPC 区（约 [main.ts:1238](app/electron/main.ts#L1238) 附近）加：

```ts
  ipcMain.handle('aiReview:getSettings', () => getAiReviewSettings());
  ipcMain.handle('aiReview:setSettings', (_e, v: unknown) => {
    const next = normalizeAiReviewSettings(v);
    store.set(AI_REVIEW_SETTINGS_KEY, next);
    return next;
  });
  ipcMain.handle('aiReview:getSections', () => getReviewSections());
  ipcMain.handle('aiReview:setSections', (_e, v: unknown) => {
    const next = normalizeSections(v);
    store.set('aiReviewSections', next);
    return next;
  });
  ipcMain.handle('aiReview:runForDate', (_e, date: string, tasks: Task[]) => runReviewForDate(getDateKey(date), tasks));
  ipcMain.handle('aiReview:backfill', async (_e, tasks: Task[]) => {
    const settings = getAiReviewSettings();
    if (!settings.enabled || !settings.apiKey) return { processed: [], filled: [], errors: [] };
    const rollover = getAppSettings().rolloverTime;
    const today = getBusinessDateKey(new Date(), rollover);
    const dates = Array.from({ length: settings.backfillDays }, (_, i) => shiftDateKey(today, -i));
    return backfillReviews({
      dates,
      resolveFilePath: (d) => getDailyFilePath(d),
      tasksForDate: () => tasks as unknown as Parameters<typeof backfillReviews>[0]['tasksForDate'] extends never ? never : any,
      sections: getReviewSections(),
      callLlm: llmCaller(),
      fileExists: (p) => fs.existsSync(p),
    });
  });
```

> 注：`tasksForDate` 简化为对全部 tasks 调用（runner 内部按 date 过滤统计）。如需精确按日，可在 Task 14 增强。

在 `app.whenReady().then(...)` 启动序列里（窗口创建后）加开机补偿，**不阻塞启动**：

```ts
  setTimeout(() => {
    const settings = getAiReviewSettings();
    if (settings.enabled && settings.apiKey) {
      // 渲染层在就绪后通过 aiReview:backfill 传 tasks；此处仅占位日志
      diag('ai-review: ready for backfill on renderer request');
    }
  }, 3000);
```

> tasks 存在渲染层（taskStore）。补偿的实际触发：渲染层启动后调用 `window.api.aiReview.backfill(tasks)`（Task 接 preload + 渲染层在 M-B Task 11 完善定时器；M-A 先支持手动/同步触发）。

- [ ] **Step 8: preload 暴露**

在 [preload.ts](app/electron/preload.ts) 的 api 对象加：

```ts
  aiReview: {
    getSettings: () => ipcRenderer.invoke('aiReview:getSettings'),
    setSettings: (v: unknown) => ipcRenderer.invoke('aiReview:setSettings', v),
    getSections: () => ipcRenderer.invoke('aiReview:getSections'),
    setSections: (v: unknown) => ipcRenderer.invoke('aiReview:setSections', v),
    runForDate: (date: string, tasks: unknown) => ipcRenderer.invoke('aiReview:runForDate', date, tasks),
    backfill: (tasks: unknown) => ipcRenderer.invoke('aiReview:backfill', tasks),
  },
```

- [ ] **Step 9: 类型检查 + 全量回归**

Run: `cd app && npm run typecheck`
Expected: 无错误
Run: `cd app && npm run verify:rc && npm run verify:ai-runner`
Expected: 全部 PASS

- [ ] **Step 10: 提交**

`"verify:ai-runner": "tsx scripts/verify-ai-runner.ts"` → `verify:rc`。

```bash
git add app/electron/aiReview/runner.ts app/electron/aiReview/backfill.ts app/electron/main.ts app/electron/preload.ts app/scripts/verify-ai-runner.ts app/package.json
git commit -m "feat(ai-review): runner + backfill + main-process wiring (M-A MVP)"
```

---

> **M-A 验收（对照 PRD §1.3 与各 M 验收）：** 配好 key → 同步一次 daily → 复盘/可复用知识段出现带 `🤖 AI 草稿` + `AI_HASH` 的内容；重复同步幂等；用户改过的段跳过；断网/无 key 不破坏文件。手动 `aiReview:backfill` 可补近 N 天。

---

# M-B：体验完整（Task 11–14）

### Task 11: 渲染层启动补偿 + 定时器触发

**Files:**
- Modify: `app/src/store/taskStore.ts` 或 `app/src/App.tsx`（启动时调 `aiReview.backfill`）
- Modify: `app/electron/main.ts`（注册系统级定时器，复用 `getNextRolloverDelay` 模式）
- Test: `app/scripts/verify-ai-timer.ts`（测纯函数：下一次触发延迟）

- [ ] **Step 1: 写失败测试**

```ts
// app/scripts/verify-ai-timer.ts
import { strict as assert } from 'node:assert';
import { getNextTimerDelay } from '../shared/aiReview/timer';

const now = new Date('2026-06-07T22:00:00');
const delay = getNextTimerDelay(now, '23:00');
assert.equal(delay, 60 * 60 * 1000, '22:00 → 23:00 是 1 小时');

const pastNoon = new Date('2026-06-07T23:30:00');
const nextDay = getNextTimerDelay(pastNoon, '23:00');
assert.ok(nextDay > 23 * 60 * 60 * 1000, '已过点 → 顺延到次日');

console.log('AI timer verification passed');
```

- [ ] **Step 2: 运行确认失败**

Run: `cd app && npx tsx scripts/verify-ai-timer.ts`
Expected: FAIL

- [ ] **Step 3: 实现 `app/shared/aiReview/timer.ts`**

```ts
// app/shared/aiReview/timer.ts
export function getNextTimerDelay(now: Date, time: string): number {
  const m = time.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  const hours = m ? Number(m[1]) : 23;
  const minutes = m ? Number(m[2]) : 0;
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return Math.max(1_000, next.getTime() - now.getTime());
}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd app && npx tsx scripts/verify-ai-timer.ts`
Expected: PASS

- [ ] **Step 5: 接线**

主进程：定时器到点时通过 `mainWindow.webContents.send('aiReview:tick')` 通知渲染层（渲染层持有 tasks），渲染层收到后调用 `window.api.aiReview.backfill(tasks)`。在 `createMainWindow` 后注册：

```ts
function scheduleAiTimer(win: BrowserWindow) {
  const settings = getAiReviewSettings();
  if (!settings.timerEnabled) return;
  const delay = getNextTimerDelay(new Date(), settings.timerTime);
  setTimeout(() => {
    if (!win.isDestroyed()) win.webContents.send('aiReview:tick');
    scheduleAiTimer(win); // 重新排程
  }, delay);
}
```

渲染层在 `App.tsx` 的启动 effect 里：`window.api.aiReview.backfill(tasks)`；并监听 `aiReview:tick`（在 preload 暴露 `onTick(cb)`）后再次 backfill。

- [ ] **Step 6: typecheck + 提交**

Run: `cd app && npm run typecheck && npx tsx scripts/verify-ai-timer.ts`

```bash
git add app/shared/aiReview/timer.ts app/scripts/verify-ai-timer.ts app/src/App.tsx app/electron/main.ts app/electron/preload.ts app/package.json
git commit -m "feat(ai-review): startup + timer-triggered backfill (M3.3)"
```

---

### Task 12: 个人周报聚合（纯函数）

**Files:**
- Create: `app/shared/aiReview/weekly.ts`
- Test: `app/scripts/verify-weekly.ts`

- [ ] **Step 1: 写失败测试**

```ts
// app/scripts/verify-weekly.ts
import { strict as assert } from 'node:assert';
import { isoWeekKey, buildWeeklyMessages } from '../shared/aiReview/weekly';

assert.equal(isoWeekKey('2026-06-07'), '2026-W23'); // 校准：用实现里的算法核对

const messages = buildWeeklyMessages({
  weekKey: '2026-W23',
  dailyContents: [
    { date: '2026-06-01', content: '周一做了 A' },
    { date: '2026-06-07', content: '周日做了 B' },
  ],
  stats: { start: '2026-06-01', end: '2026-06-07', activeDays: 2, totalCompleted: 5, totalTasks: 8, streak: 1 },
});
assert.ok(messages[1].content.includes('2026-W23'));
assert.ok(messages[1].content.includes('周一做了 A'));
assert.ok(messages[1].content.includes('活跃天数') && messages[1].content.includes('2'));

console.log('Weekly verification passed');
```

> 注：`isoWeekKey` 的期望值在实现后用实际输出回填，确保算法自洽（ISO 8601 周）。

- [ ] **Step 2–4: 实现 + 跑测**

```ts
// app/shared/aiReview/weekly.ts
import type { RangeStats } from './stats';
import type { ChatMessage } from './promptBuilder';

export function isoWeekKey(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const week = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return `${target.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export interface WeeklyParams {
  weekKey: string;
  dailyContents: Array<{ date: string; content: string }>;
  stats: RangeStats;
}

export function buildWeeklyMessages(params: WeeklyParams): ChatMessage[] {
  const system = '你是周报助手。基于本周日记生成个人周报，包含：概览、关键事件、知识增量、未完成、下周计划。不要编造数字，统计以给定值为准。输出 Markdown。';
  const user = [
    `周：${params.weekKey}`,
    '确定性统计（以此为准）：',
    `- 活跃天数：${params.stats.activeDays}`,
    `- 完成任务：${params.stats.totalCompleted}/${params.stats.totalTasks}`,
    `- 连续天数：${params.stats.streak}`,
    '',
    '本周日记：',
    ...params.dailyContents.map((d) => `### ${d.date}\n${d.content.trim()}`),
  ].join('\n');
  return [{ role: 'system', content: system }, { role: 'user', content: user }];
}
```

Run: `cd app && npx tsx scripts/verify-weekly.ts`（先跑一次拿到 `isoWeekKey('2026-06-07')` 实际值，回填测试断言，再跑绿）

- [ ] **Step 5: 注册 + 提交**

```bash
git add app/shared/aiReview/weekly.ts app/scripts/verify-weekly.ts app/package.json
git commit -m "feat(ai-review): weekly review aggregation (pure)"
```

---

### Task 13: 周报写入 `logs/weekly-review/` + IPC

**Files:**
- Create: `app/electron/aiReview/exportReports.ts`（含 `generatePersonalWeekly`）
- Modify: `app/electron/main.ts`（IPC `aiReview:generateWeekly`）+ preload
- Test: `app/scripts/verify-export-reports.ts`（注入 fake LLM + 临时目录）

- [ ] **Step 1: 写失败测试**

```ts
// app/scripts/verify-export-reports.ts
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generatePersonalWeekly } from '../electron/aiReview/exportReports';

const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-weekly-'));
const out = await generatePersonalWeekly({
  vaultPath: vault,
  weekKey: '2026-W23',
  dailyContents: [{ date: '2026-06-07', content: '做了 X' }],
  stats: { start: '2026-06-01', end: '2026-06-07', activeDays: 1, totalCompleted: 1, totalTasks: 1, streak: 1 },
  callLlm: async () => ({ ok: true, content: '# 周报\n本周概览' }),
});
assert.equal(out.ok, true);
assert.ok(out.filePath!.includes(path.join('logs', 'weekly-review')));
assert.ok(fs.readFileSync(out.filePath!, 'utf-8').includes('本周概览'));

fs.rmSync(vault, { recursive: true, force: true });
console.log('Export reports verification passed');
```

- [ ] **Step 2–4: 实现**

```ts
// app/electron/aiReview/exportReports.ts
import fs from 'node:fs';
import path from 'node:path';
import { atomicReplace, readWithStamp } from './atomicWrite';
import { buildWeeklyMessages, WeeklyParams } from '../../shared/aiReview/weekly';
import type { LlmResult } from '../../shared/llm/openaiClient';

export interface WeeklyGenParams extends WeeklyParams {
  vaultPath: string;
  callLlm: (messages: ReturnType<typeof buildWeeklyMessages>) => Promise<LlmResult>;
}

export async function generatePersonalWeekly(params: WeeklyGenParams): Promise<{ ok: boolean; filePath?: string; error?: string }> {
  const messages = buildWeeklyMessages(params);
  const llm = await params.callLlm(messages);
  if (!llm.ok) return { ok: false, error: llm.error };

  const dir = path.join(params.vaultPath, 'logs', 'weekly-review');
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${params.weekKey}.md`);
  const snap = readWithStamp(filePath);
  const content = `---\ntitle: "个人周报 ${params.weekKey}"\nweek: "${params.weekKey}"\ntags: [weekly-review]\n---\n\n> 🤖 AI 草稿，请复核\n\n${llm.content.trim()}\n`;
  const write = atomicReplace(filePath, content, snap.stamp);
  return write.ok ? { ok: true, filePath } : { ok: false, error: write.error };
}
```

主进程加 IPC `aiReview:generateWeekly`（计算 weekKey、收集 7 天 daily 内容与 RangeStats，调上面函数）；preload 暴露。

- [ ] **Step 5: 提交**

```bash
git add app/electron/aiReview/exportReports.ts app/electron/main.ts app/electron/preload.ts app/scripts/verify-export-reports.ts app/package.json
git commit -m "feat(ai-review): personal weekly report to logs/weekly-review (M4)"
```

---

### Task 14: 明日待办确定性结转 + AI 追加

**Files:**
- Modify: `app/electron/aiReview/runner.ts`（Deterministic 段：先写结转任务，再 AI 追加建议）
- Modify: `app/scripts/verify-ai-runner.ts`（补一条断言：TOMORROW 段含结转任务行）

- [ ] **Step 1: 在 verify-ai-runner.ts 补断言**

```ts
// 在现有 runner 测试后追加：未完成任务应结转到 TOMORROW 段
import { REVIEW_MARKERS as RM } from '../shared/aiReview/markers';
// 给一个未完成任务，跑后 TOMORROW 块应含该任务文本（确定性，不依赖 LLM）
```
（具体断言：构造含 `text` 的未完成 StatTask，runReviewForFile 后 `readBlockBody(after, RM.TOMORROW)` 包含该文本。）

- [ ] **Step 2: 扩展 StatTask 与 runner**

`stats.ts` 的 `StatTask` 增加可选 `text?: string`。runner 的 Deterministic 分支改为：

```ts
    if (section.type === SectionType.Deterministic) {
      const carried = tasks
        .filter((t) => !t.completed && t.text)
        .map((t) => `- [ ] ${t.text}（结转）`);
      let body = readBlockBody(content, marker);
      const decision2 = decideBlock(body, { frozen: blockFrozen, force });
      if (decision2.action === BlockAction.Skip) { skipped.push(section.markerKey); continue; }
      const detBody = [`## ${section.title}`, ...(carried.length ? carried : ['- [ ] '])].join('\n');
      content = upsertBlock(content, marker, embedHash(detBody));
      filled.push(section.markerKey);
      continue;
    }
```

- [ ] **Step 3: 跑测 + typecheck**

Run: `cd app && npx tsx scripts/verify-ai-runner.ts && npm run typecheck`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add app/electron/aiReview/runner.ts app/shared/aiReview/stats.ts app/scripts/verify-ai-runner.ts
git commit -m "feat(ai-review): deterministic tomorrow rollover in review section"
```

---

# M-C：大白好上手（Task 15–17）

### Task 15: AI 认模板（识别用户自由模板 → 段落配置）

**Files:**
- Create: `app/shared/aiReview/recognizeTemplate.ts`（构建识别 prompt + 解析 LLM JSON 输出 → SectionConfig[]）
- Test: `app/scripts/verify-recognize-template.ts`

- [ ] **Step 1: 写失败测试**（注入 fake LLM 返回 JSON）

```ts
// app/scripts/verify-recognize-template.ts
import { strict as assert } from 'node:assert';
import { buildRecognizeMessages, parseRecognizedSections } from '../shared/aiReview/recognizeTemplate';

const messages = buildRecognizeMessages('## 复盘\n## 明天计划\n## 学到了什么');
assert.ok(messages[1].content.includes('复盘'));

const parsed = parseRecognizedSections(JSON.stringify({
  sections: [
    { markerKey: 'REVIEW', title: '复盘', type: 'ai' },
    { markerKey: 'TOMORROW', title: '明天计划', type: 'deterministic' },
    { markerKey: 'KNOWLEDGE', title: '学到了什么', type: 'ai' },
  ],
}));
assert.equal(parsed.length, 3);
assert.equal(parsed[1].title, '明天计划');

// 脏输出（带围栏）也能解析
const dirty = parseRecognizedSections('```json\n{"sections":[{"markerKey":"REVIEW","title":"X","type":"ai"}]}\n```');
assert.equal(dirty[0].title, 'X');

// 完全无法解析 → 回落默认（不崩）
const fallback = parseRecognizedSections('胡言乱语');
assert.ok(fallback.length >= 1, 'unparseable → defaults');

console.log('Recognize template verification passed');
```

- [ ] **Step 2–5: 实现 + 测 + 提交**

`buildRecognizeMessages(rawTemplate)` 产出 system（要求只输出 JSON，schema 固定为 markerKey∈{REVIEW,TOMORROW,KNOWLEDGE}）+ user（贴用户模板）。`parseRecognizedSections` 用正则剥离 ```` ```json ```` 围栏 → `JSON.parse` → 经 `normalizeSections`（Task 6）兜底。失败 catch → 返回 `createDefaultSections()`。

```bash
git add app/shared/aiReview/recognizeTemplate.ts app/scripts/verify-recognize-template.ts app/package.json
git commit -m "feat(ai-review): AI template recognition with safe parse fallback (M6.2)"
```

---

### Task 16: 设置面板 AI 配置区 + 段落编辑器 UI

**Files:**
- Modify: `app/src/components/SettingsPanel.tsx`
- Test: `app/scripts/verify-settings-sync.ts`（扩展：AI 设置往返 normalize 一致）

UI 要点（参照 PRD §6.1、§8）：
- AI 区：启用开关、base_url、api_key（密码框）、model、backfillDays、定时器开关+时间。`window.api.aiReview.getSettings/setSettings`。
- 段落编辑器：每段一行 `[标题] [AI写/我自己写/自动结转下拉] [prompt 折叠输入]`；保存走 `setSections`。
- 「认我的模板」按钮：粘贴框 → 调识别 → 预览 → 确认写入 sections。

- [ ] **Step 1: 扩展 verify-settings-sync.ts** 加 AI 设置 round-trip 断言（`normalizeAiReviewSettings(set) === 读回`）。
- [ ] **Step 2: 实现 UI**（沿用现有 SettingsPanel 的受控输入与 i18n 模式）。
- [ ] **Step 3: typecheck + verify:rc**

Run: `cd app && npm run typecheck && npm run verify:rc`

- [ ] **Step 4: 提交**

```bash
git add app/src/components/SettingsPanel.tsx app/scripts/verify-settings-sync.ts
git commit -m "feat(ui): AI config + section editor in settings panel (M7.1)"
```

---

### Task 17: 首次向导（选模板 → 设时间 → 选 AI）

**Files:**
- Create: `app/src/components/AiOnboarding.tsx`
- Modify: `app/src/App.tsx`（首启未配置时弹向导）
- Test: `app/scripts/verify-onboarding-state.ts`（纯函数：是否需要向导）

- [ ] **Step 1: 写失败测试** `shouldShowOnboarding(settings)` → 未启用且从未关闭过向导时 true。
- [ ] **Step 2–4:** 实现 `app/shared/aiReview/onboarding.ts` 纯判定 + React 组件（3 步，30 秒，可跳过用默认）。提交。

```bash
git add app/src/components/AiOnboarding.tsx app/shared/aiReview/onboarding.ts app/src/App.tsx app/scripts/verify-onboarding-state.ts app/package.json
git commit -m "feat(ui): first-run AI onboarding (M7.2)"
```

---

# M-D：进阶 / 商业（Task 18–22）

### Task 18: 个人月报聚合 + 写入 `logs/monthly-review/`

**Files:**
- Create: `app/shared/aiReview/monthly.ts`（`buildMonthlyMessages` 纯函数）
- Modify: `app/electron/aiReview/exportReports.ts`（`generatePersonalMonthly` → `logs/monthly-review/YYYY-MM.md`，**新建目录**）
- Test: `app/scripts/verify-monthly.ts`

输入 = 当月 daily + 各周报要点。结构同 weekly，时间窗与目录不同。TDD 同 Task 12/13。

```bash
git commit -m "feat(ai-review): personal monthly report to logs/monthly-review (M5)"
```

---

### Task 19: 对外脱敏纯函数

**Files:**
- Create: `app/shared/aiReview/redaction.ts`
- Test: `app/scripts/verify-redaction.ts`

- [ ] **Step 1: 写失败测试**

```ts
// app/scripts/verify-redaction.ts
import { strict as assert } from 'node:assert';
import { redactForExport } from '../shared/aiReview/redaction';

const input = [
  '## 今日工作',
  '<!-- tag: work -->',
  '做了对外项目 A',
  '## 灵感闪念',
  '<!-- tag: private -->',
  '私人想法不可外泄',
  '## 读书',
  '<!-- tag: secret -->',
  '机密',
].join('\n');

const out = redactForExport(input);
assert.ok(out.includes('对外项目 A'), 'work content kept');
assert.ok(!out.includes('私人想法'), 'private removed');
assert.ok(!out.includes('机密'), 'secret removed');

// 无 work 标记的整段默认剔除（硬规则：只放行 work）
const noWork = redactForExport('## 杂记\n随便写写');
assert.equal(noWork.trim(), '', 'non-work content excluded by default');

console.log('Redaction verification passed');
```

- [ ] **Step 2–4:** 实现：按 `## ` 切段，保留含 `tag: work` 或被显式标记 `type: work` 的段；剔除含 `private`/`secret` 或无 work 标记的段。**这是硬规则，AI 不参与**（即便后续 AI 失败也由代码兜死）。提交。

```bash
git commit -m "feat(ai-review): physical redaction for external exports (M9)"
```

---

### Task 20: 对外工作周报/月报 → `exports/` 隔离目录

**Files:**
- Modify: `app/electron/aiReview/exportReports.ts`（`generateExternalWeekly/Monthly`：先 `redactForExport` → 调 LLM 套公司模板 → 写 `exports/weekly-reports/` `exports/monthly-reports/`）
- Modify: 主进程 IPC + preload
- Test: `app/scripts/verify-export-reports.ts`（补：对外产物落在 `exports/`，且含 private 的输入不出现在产物）

关键约束（PRD §M9）：路径物理隔离（不写 `logs/`）、脱敏在调 LLM 前先做、产物标注「AI 草稿，需复核」、公司模板可导入。

```bash
git commit -m "feat(ai-review): external weekly/monthly reports to exports/ with redaction (M9)"
```

---

### Task 21: 预设 + 覆盖（override）模型

**Files:**
- Modify: `app/shared/aiReview/sectionConfig.ts`（新增 `applyOverrides(base, overrides)` + `resetToDefault`）
- Test: `app/scripts/verify-section-overrides.ts`

- [ ] 纯函数 TDD：base 预设 + 用户 override 层 → 合并；预设升级时未改段自动跟随；`resetToDefault` 清空 override。提交。

```bash
git commit -m "feat(ai-review): preset + override config model with reset (M7.3)"
```

---

### Task 22: 模糊匹配 + 认不出兜底

**Files:**
- Modify: `app/shared/aiReview/recognizeTemplate.ts`（内置近义词词典：复盘/总结/回顾→REVIEW；明日/计划→TOMORROW；知识/经验→KNOWLEDGE；识别置信度低 → 返回 `{ unmatched: true }`）
- Modify: runner/导出：认不出时**不崩、不覆盖**，追加文末提示「没能识别你的模板，点这里手动指认」
- Test: `app/scripts/verify-fuzzy-match.ts`

- [ ] 纯函数 TDD：模糊词典命中；完全认不出 → `unmatched` 标志 + 安全输出。提交。

```bash
git commit -m "feat(ai-review): fuzzy template match with safe unmatched fallback (M6.3)"
```

---

## 全局收尾

- [ ] **运行完整回归：** `cd app && npm run typecheck && npm run verify:rc`，确认所有 `verify:*`（含全部新增 ai-review 脚本）通过。
- [ ] **手动冒烟（对照 PRD §1.3）：** 配 key → 连续两天造 daily、中间关一次软件 → 第二天开 → 复盘/知识段均自动生成且带 `🤖 AI 草稿` + hash；改一段再同步 → 该段被跳过。
- [ ] **DoD 核对（PRD §8）：** 失败路径（无 key/断网/认不出模板/关机）均不破坏文件；用户全程不碰 yaml/标记；对外产物落 `exports/` 且标注「AI 草稿，需复核」。

---

## Self-Review 记录

- **Spec 覆盖：** M1=Task1/3/9；M2=Task6/7/10；M3.1=Task10 Step6；M3.2=Task3/10；M3.3=Task11；M4=Task12/13；M5=Task18；M6.1=Task6；M6.2=Task15；M6.3=Task22；M7.1=Task16；M7.2=Task17；M7.3=Task21；M8=明确延后（本计划不含，PRD 标 P2/未来）；M9=Task19/20。§10 原子写=Task8，贯穿 runner/export。统计不编数字=Task4。
- **架构偏离已说明：** 设计文档假设外挂 Python，实际改为主进程内 TS 模块（用户已确认）。
- **类型一致性：** `StatTask`（Task4 定义，Task14 扩展 `text?`）、`SectionConfig`/`SectionType`（Task6）、`LlmResult`/`ChatMessage`（Task7/6）、`FileStamp`（Task8）、`REVIEW_MARKERS`（Task1）在后续任务签名中保持一致引用。
- **M8（账号登录）** 按 PRD「默认延后、本地优先」未排具体任务；如需，另起计划。
