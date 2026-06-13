# AI 自动复盘功能 - 架构文档

> 面向开发者：解释 AI 自动复盘 / 周月报功能的代码结构、核心机制与扩展方式。
> 对应分支 `worktree-feat+ai-review`，实施计划见 [`docs/superpowers/plans/2026-06-07-dailytodo-auto-review-weekly-monthly.md`](../superpowers/plans/2026-06-07-dailytodo-auto-review-weekly-monthly.md)。

---

## 1. 设计原则

1. **全部在 Electron 主进程内用 TypeScript 实现** —— 不外挂 Python 子进程。应用本身就在写 Obsidian daily 文件，复盘作为主进程内模块最自然。
2. **纯函数引擎 / I/O 编排分离** —— 可测的纯逻辑放 `app/shared/`，触碰文件系统与网络的编排放 `app/electron/`。
3. **永不破坏用户文件** —— 任何失败路径（无 key / 断网 / 超时 / 认不出模板 / 外部并发改动）都不得写坏 daily 文件。LLM 调用绝不把异常抛进文件写流程；写入走原子替换 + 外部修改守卫。
4. **用户改动优先** —— AI 产出的是「草稿」，一旦用户动过就不再覆盖（靠 `AI_HASH` 指纹判定）。
5. **数字由代码算，不让 AI 编** —— 完成率、活跃天数、连续天数等统计是确定性计算，作为事实注入 prompt。

---

## 2. 分层结构

```
app/shared/aiReview/        纯函数引擎（tsx verify 脚本可独立测试）
  markers.ts                REVIEW/TOMORROW/KNOWLEDGE 标记块常量 + 幂等读写 upsert
  hash.ts                   AI_HASH sha256 指纹：embed / extract / 比对
  scanDecision.ts           状态机：块当前文本 → 状态 → 动作(fill/overwrite/skip)
  stats.ts                  确定性统计：日统计 + 范围统计(活跃天/连续天)
  aiReviewSettings.ts       AI 设置 schema(baseUrl/apiKey/model/...) + normalize
  sectionConfig.ts          段落配置 schema + 默认段落 + normalize
  sectionOverrides.ts       预设 + 用户覆盖层合并 / 恢复默认
  promptBuilder.ts          daily 正文 + 段落配置 + 统计 → LLM messages
  recognizeTemplate.ts      AI 认日记模板：构建识别 prompt + 安全解析 JSON
  recognizeReportTemplate.ts AI 认报告(周/月报)模板
  fuzzyMatch.ts             离线近义词词典模糊匹配(认模板兜底，不经 AI)
  weekly.ts                 周报聚合(ISO 周键 + messages 构建)
  monthly.ts                月报聚合
  onboarding.ts             首次向导是否应弹出的纯判定
  timer.ts                  下一次定时触发延迟计算

app/shared/llm/
  openaiClient.ts           OpenAI 兼容调用，错误归一化为 {ok:false}，永不抛

app/electron/aiReview/      I/O 编排（依赖注入 LLM + 文件，便于测试）
  atomicWrite.ts            读前记 size+mtime → 写临时文件 → 写前复查 → renameSync
  runner.ts                 单文件编排：读 daily → 逐段决策 → 调 LLM → 填块 → 原子写
  backfill.ts               扫描近 N 天 daily，逐个补偿，单文件失败不中断
  exportReports.ts          周/月报 + 对外报告写入(隔离目录 + 脱敏)

app/electron/main.ts        接线：syncTasksToObsidian 末尾触发 runner、IPC、启动补偿、定时器
app/electron/preload.ts     暴露 window.api.aiReview.*
app/src/components/SettingsPanel.tsx   AI 配置区 + 段落编辑器 + 报告生成按钮 + 认模板流
app/src/components/AiOnboarding.tsx    首次向导
```

依赖方向单向：`electron/aiReview/*` → `shared/aiReview/*` 与 `shared/llm/*`；`shared/*` 之间无循环依赖；`shared/*` 不 import `electron/*`。

---

## 3. 核心机制

### 3.1 标记块（markers.ts）

每个托管段落用 HTML 注释包裹，便于精确替换而不碰兄弟段落：

```markdown
<!-- DAILYTODO:REVIEW:START -->
...块正文...
<!-- DAILYTODO:REVIEW:END -->
```

`upsertBlock(existing, marker, body)` 只替换 start/end 之间的内容；无块则在文末追加；**幂等**（同一块替换两次结果一致）。三个 marker：`REVIEW`（复盘）、`TOMORROW`（明日待办）、`KNOWLEDGE`（可复用知识）。

### 3.2 AI_HASH 指纹（hash.ts）

AI 写入的块正文里嵌一行 `<!-- DAILYTODO:AI_HASH:sha256:<hex> -->`，hash 基于「去掉 hash 行后、normalize 过（逐行 trimEnd、统一换行、去首尾空行）的正文」。
- `embedHash(body)` 写入时盖指纹。
- `hashMatches(stamped)` 重算正文 hash 与嵌入值比对：一致 = 仍是未被用户改动的 AI 草稿。
- 仅尾随空格/空行差异不算改动（normalize 抹平），避免编辑器格式化误判。

### 3.3 决策状态机（scanDecision.ts）

`decideBlock(body, { frozen, force })` 把一个块映射到状态与动作：

| 状态 | 条件 | 默认动作 |
|------|------|---------|
| `Frozen` | 存在冻结标签 `<!-- DAILYTODO:FREEZE -->` | `skip`（force 也不绕过） |
| `Unprocessed` | 去标签后为空 | `fill` |
| `AiUnmodified` | 有 hash 且匹配 | `overwrite` |
| `UserModified` | 有 hash 但不匹配 | `skip`（force → overwrite） |
| `UserAuthored` | 无 hash 但有内容 | `skip`（force → overwrite） |

优先级：`Frozen` > 空判定 > hash 判定。`force` 只绕过 `Skip`，**绝不**绕过 `Frozen`。

### 3.4 原子写 + 外部修改守卫（atomicWrite.ts）

- `readWithStamp(path)` 返回 `{ content, stamp:{size,mtimeMs} }`。
- `atomicReplace(path, next, expected)`：写前复查文件 size+mtime 是否仍与读取时一致；不一致（被 Obsidian / 同步盘 / 用户改过）则**拒绝写入并报冲突**，绝不覆盖；一致则写临时文件 `*.tmp-<pid>` 再 `renameSync`（同目录 → 同分区 → 原子）。

### 3.5 单文件 runner（runner.ts）

`runReviewForFile({ filePath, date, tasks, sections, callLlm, force })` 流程：
1. `readWithStamp`，文件不存在直接返回 `ok:false`（不创建）。
2. 计算 `computeDailyStats(tasks, date)`。
3. 逐段：读块正文 → `decideBlock`。
   - `Skip` → 记 skipped。
   - **Deterministic 段（明日待办）**：把今天未完成且有文本的任务结转为 `- [ ] <text>（结转）`，`embedHash` 后 upsert，不经 LLM。
   - **AI 段**：`buildReviewMessages` → `callLlm`。失败则跳过该段（不破坏文件），成功则 `embedHash('🤖 AI 草稿\n'+content)` 后 upsert。
4. 若没有任何段被填充，直接 `ok:true` 返回（不写盘）。
5. 否则 `atomicReplace` 整篇写回；冲突则 `ok:false`。

依赖注入 `callLlm`，使 verify 脚本能用 fake LLM + 临时文件全流程测试。

### 3.6 补偿扫描（backfill.ts）

`backfillReviews({ dates, resolveFilePath, tasksForDate, sections, callLlm, fileExists })` 串行处理近 N 天：文件不存在跳过；逐个调 `runReviewForFile`；单文件失败记入 `errors` 但不中断整体。启动时与定时器到点时触发（渲染层持有 tasks，经 IPC 回传）。

### 3.7 报告生成（exportReports.ts）

- `generatePersonalWeekly` / `generatePersonalMonthly`：聚合 daily + RangeStats → LLM → 写 `logs/weekly-review/<isoWeek>.md` / `logs/monthly-review/<YYYY-MM>.md`，带 frontmatter + 「🤖 AI 草稿，请复核」。
- **对外报告**：先 `redactForExport`（物理脱敏，硬规则、AI 不参与）剔除 `private`/`secret`、只放行 `work` 段，再套模板调 LLM，写 `exports/weekly-reports/` `exports/monthly-reports/`（**物理隔离**，绝不写 `logs/`）。脱敏在调 LLM 之前完成，确保私人内容永不出网。

---

## 4. 数据流（日复盘）

```
用户点同步
  └─ main.syncTasksToObsidian()  写 daily 任务/工作段
        └─ void runReviewForDate(date, tasks)   ← 末尾触发，不 await，失败静默
              ├─ getAiReviewSettings()  未启用/无 key → 直接返回，不动文件
              ├─ runReviewForFile(...)
              │     ├─ readWithStamp(daily)
              │     ├─ 逐段 decideBlock → callLlm / 确定性结转
              │     └─ atomicReplace(daily, content, stamp)   ← 外部改动则放弃
              └─ 结果仅用于日志
```

启动补偿与定时器走同一条 `runReviewForFile`，只是 date 来源不同（近 N 天 / 到点当天）。

---

## 5. 设置与存储

- electron-store key `aiReviewSettings`（`aiReviewSettings.ts` 的 schema + normalize 兜底非法值）。
- 段落配置 key `aiReviewSections`（`sectionConfig.normalizeSections` 兜底）。
- 预设 + 覆盖（`sectionOverrides.ts`）：base 升级时用户未改字段自动跟随，改过的保留；`resetToDefault` 清空覆盖。
- 所有 IPC 在 `aiReview:` 命名空间下，preload 暴露为 `window.api.aiReview.*`：
  `getSettings/setSettings`、`getSections/setSections`、`runForDate`、`backfill`、
  `generateWeekly/generateMonthly`、对外报告生成、`recognizeTemplate`。

---

## 6. 测试约定

本仓库**没有 Jest/Vitest**。测试 = `app/scripts/verify-<name>.ts`，用 `import { strict as assert } from 'node:assert'` 断言，结尾 `console.log('... passed')`，在 `app/package.json` 注册 `verify:<name>` 并入 `verify:rc` 聚合。

```bash
cd app
npx tsx scripts/verify-ai-runner.ts   # 单个
npm run verify:rc                      # 全量(含全部 ai-review 脚本)
npm run typecheck
npm run build                          # electron-vite，main/preload/renderer
```

纯函数模块逐个有对应 verify 脚本；runner / backfill / exportReports 用「注入 fake LLM + 临时目录」做全流程测试。

> ⚠️ 环境限制：无 GUI 的沙箱 bash 里 `npm run dev` 起不来（`app.commandLine.appendSwitch` 在 `electron.app` undefined 时崩，main.ts，纯属无头会话限制）。真机桌面正常。

---

## 7. 扩展指南

### 新增一个托管段落类型
1. 在 `markers.ts` 的 `REVIEW_MARKERS` 加一对 start/end 常量。
2. 在 `sectionConfig.ts` 的 `createDefaultSections()` 加默认项（选 `SectionType.Ai` 或 `Deterministic`）。
3. 若是确定性段，在 `runner.ts` 的 Deterministic 分支加对应生成逻辑。
4. 若改了 daily 模板，更新 `obsidianTemplates.buildDailyNoteContent` 并补 `verify-daily-review-blocks.ts`。
5. `fuzzyMatch.ts` 词典 + `recognizeTemplate.ts` 的 schema 视需要扩 markerKey。

### 接入新的 LLM 服务商
`openaiClient.callChatCompletion` 已是 OpenAI 兼容（base_url + key + model）。DeepSeek / Ollama / 本地模型只需在设置里换 baseUrl/model，无需改代码。若要支持非兼容接口，新增 client 并在 `llmCaller()` 选择。

### 调整脱敏规则
`redaction.ts` 的 `redactForExport` 是硬规则纯函数（只放行 work 段、剔除 private/secret）。改规则改这里，并更新 `verify-redaction.ts`。**注意这是兜底安全线，AI 不参与，不要把脱敏交给 prompt。**

---

## 8. 已知边界

- M8（账号登录 / SaaS 代付）明确延后，本实现不含。
- 首次使用需用户自配 API Key（无内置 key）。
- `backfill` 的 `tasksForDate` 当前对全部 tasks 调用（runner 内部按 date 过滤统计）；如需严格按日切分，可后续增强。
