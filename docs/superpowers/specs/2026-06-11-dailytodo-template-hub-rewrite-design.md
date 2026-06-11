# DailyTodo 模板中心重构设计稿

> 版本: v1.0
> 最后更新: 2026-06-11
> 用途: 交付开发者用于重构设置页面与模板系统

---

## 背景与目标

当前设置页面配置项过多、结构混乱,用户难以理解和维护。本次重构目标:

- 将模板逻辑收敛为「固定区块 + 自定义区块」的统一结构
- 设置页面大幅简化,模板编辑通过独立弹窗完成
- 日报 / 周报 / 月报复用同一套模板编辑器组件(5 套实例,见下文)
- 每个区块支持选择渲染类型,AI 按类型生成对应格式
- 支持 AI 识别用户上传的模板文件,自动解析区块结构
- 修复"双份生成"bug,简化模板配置项,改善中英混排问题

---

## 一、核心数据模型

### 1.1 区块类型

```typescript
// app/shared/obsidianTemplates.ts

export type RenderType = 'text' | 'list' | 'table' | 'callout' | 'dataview';

export interface CustomBlock {
  id: string;              // uuid
  name: string;            // 用户可见名(可改)
  aiGenerate: boolean;     // true=AI 生成, false=手动编辑
  renderType: RenderType;  // 5 种全局可选
  prompt: string;          // 块级 prompt(用户可改,默认空)
}

export interface FixedBlock {
  id: 'work' | 'inspire' | 'tasks';
  displayName: string;     // 必现,可改
  // 顺序由数组内位置决定
}

export interface DailyTemplate {
  fixedBlocks: FixedBlock[];   // 始终 3 个,顺序可调
  customBlocks: CustomBlock[]; // N 个,默认 3 个(复盘/明日待办/可复用知识)
}

export interface ReportTemplate {
  customBlocks: CustomBlock[]; // N 个,见下方默认模板
}

export interface ObsidianTemplateSettings {
  // 路径(5 条)
  obsidianPath: string;
  dailyPath: string;            // 日报路径
  weeklyPath: string;           // 个人周报路径
  monthlyPath: string;          // 个人月报路径
  externalWeeklyPath: string;   // 对外周报路径
  externalMonthlyPath: string;  // 对外月报路径

  // 模板(5 套)
  dailyTemplate: DailyTemplate;
  weeklyTemplate: ReportTemplate;
  monthlyTemplate: ReportTemplate;
  externalWeeklyTemplate: ReportTemplate;
  externalMonthlyTemplate: ReportTemplate;

  // 行为
  syncDeletedReviewsToObsidian: boolean;
  confirmBeforeDeletingReview: boolean;
}

// app/shared/aiReview/aiReviewSettings.ts (大幅精简)
export interface AiReviewSettings {
  enabled: boolean;
  account: AiAccount;            // 账号(原有,不展开)

  // 4 套自动生成
  weeklyTimerEnabled: boolean;
  weeklyTimerTime: string;       // HH:mm
  weeklyTimerWeekday: number;    // 0-6
  monthlyTimerEnabled: boolean;
  monthlyTimerTime: string;
  monthlyTimerDay: number;       // 1-31
  externalWeeklyTimerEnabled: boolean;
  externalWeeklyTimerTime: string;
  externalWeeklyTimerWeekday: number;
  externalMonthlyTimerEnabled: boolean;
  externalMonthlyTimerTime: string;
  externalMonthlyTimerDay: number;

  // 对外轻量脱敏(默认开)
  anonymizeExternalReports: boolean;
}
```

### 1.2 渲染类型映射

| 渲染类型 | Obsidian 效果 | 导出兼容处理 | AI Prompt 附加 |
|---|---|---|---|
| `text` (默认) | 普通段落 | 正常 | (无) |
| `list` | `- item` 无序列表 | 正常 | "请用 Markdown 无序列表格式(- item)输出" |
| `table` | Markdown 标准表格 | 基本正常 | "请用 Markdown 表格格式输出" |
| `callout` | Obsidian Callout `> [!note]` | 降级为普通引用 | "请用 Obsidian Callout 格式输出,如 `> [!note]`" |
| `dataview` | 动态查询表格(需 Dataview 插件) | 替换为说明文字 | "请生成一段 Dataview 查询语句,用代码块包裹" |

### 1.3 默认模板

**日报默认:**
```
固定区块: 今日工作 / 灵感随笔 / 每日任务
自定义区块:
  - 复盘     (AI ✓, text)
  - 明日待办 (AI ✓, list)
  - 可复用知识 (AI ✓, text)
```

**个人周报默认:**
```
自定义区块:
  - 本周工作总结 (AI ✓, text, prompt 含"请用口语化总结")
  - 本周完成任务 (AI ✓, table)
  - 本周灵感汇总 (AI ✓, callout, prompt 含"请用 Callout 突出显示")
  - 下周计划     (AI ✓, list)
```

**个人月报默认:**
```
自定义区块:
  - 本月工作总结 (AI ✓, text, prompt 含"请用口语化总结")
  - 本月完成任务 (AI ✓, table)
  - 本月灵感汇总 (AI ✓, callout)
  - 本月复盘     (AI ✓, text)
  - 下月计划     (AI ✓, list)
```

**对外周报默认:**
```
自定义区块:
  - 本周工作概览 (AI ✓, text, prompt 含"请用正式书面语,不要包含个人情绪")
  - 关键交付     (AI ✓, table)
  - 下周计划     (AI ✓, list)
```

**对外月报默认:**
```
自定义区块:
  - 本月工作概览 (AI ✓, text, prompt 含"请用正式书面语,不要包含个人情绪")
  - 关键交付     (AI ✓, table)
  - 下月计划     (AI ✓, list)
```

### 1.4 5 条路径默认值

| 字段 | 默认值 | 变量说明 |
|---|---|---|
| `dailyPath` | `logs/daily/{{date}}.md` | `{{date}}` = YYYY-MM-DD |
| `weeklyPath` | `logs/weekly/personal/{{year}}-W{{week}}.md` | `{{year}}` = YYYY, `{{week}}` = ISO 周数(补零到 2 位) |
| `monthlyPath` | `logs/monthly/personal/{{year}}-{{month}}.md` | `{{month}}` = MM |
| `externalWeeklyPath` | `logs/weekly/external/{{year}}-W{{week}}.md` | 同上 |
| `externalMonthlyPath` | `logs/monthly/external/{{year}}-{{month}}.md` | 同上 |

---

## 二、模板编辑器(弹窗组件)

### 2.1 入口

设置页"模板设置"区 5 个 [编辑模板 →] 按钮,各自实例化:

```tsx
<TemplateEditorModal
  kind="daily" | "personalWeekly" | "personalMonthly" | "externalWeekly" | "externalMonthly"
  onSave={...}
/>
```

### 2.2 布局(日报,`kind="daily"`)

```
┌─ 日报模板编辑器 ──────────────────────────────┐
│                                              │
│ ── 固定区块(不可删除) ──                     │
│                                              │
│  [≡] 今日工作          [改名]                │
│  [≡] 灵感随笔          [改名]                │
│  [≡] 每日任务          [改名]                │
│                                              │
│ ── 自定义区块 ──                             │
│                                              │
│  [≡] 复盘     [AI ✓] [渲染:纯文本 ▾]  [删]  │
│  [≡] 明日待办 [AI ✓] [渲染:列表   ▾]  [删]  │
│  [≡] 可复用知识 [AI✓] [渲染:纯文本 ▾]  [删]  │
│                                              │
│  [+ 添加区块]  [📎 上传 .md/.txt 让 AI 识别] │
│                                              │
│  [恢复默认]                       [取消] [保存] │
└──────────────────────────────────────────────┘
```

### 2.3 布局(周/月报,无固定区块)

```
┌─ 个人周报模板编辑器 ──────────────────────────┐
│                                              │
│ ── 自定义区块 ── (无"固定区块"分组)          │
│                                              │
│  [≡] 本周工作总结 [AI ✓] [纯文本 ▾]  [删]   │
│  [≡] 本周完成任务 [AI ✓] [表格   ▾]  [删]   │
│  [≡] 本周灵感汇总 [AI ✓] [Callout ▾] [删]   │
│  [≡] 下周计划     [AI ✓] [列表   ▾]  [删]   │
│                                              │
│  [+ 添加区块]  [📎 上传 .md/.txt 让 AI 识别] │
│                                              │
│  [恢复默认]                       [取消] [保存] │
└──────────────────────────────────────────────┘
```

### 2.4 交互规则

1. **拖拽排序 `[≡]`**:用 HTML5 drag-and-drop,固定区块只能在固定组内,自定义区块只能在自己组内。跨组拖入 → 红框 + 拒绝。
2. **改名 [改名]** → 行内 `<input>`,回车或失焦保存,Esc 撤销。
3. **AI ✓ toggle** → 关闭后,该块渲染类型下拉变灰,下方提示"该块已切换为手动编辑"。
4. **渲染类型下拉** → 5 项(纯文本/列表/表格/Callout/Dataview),选 Dataview 弹确认 dialog "导出 PDF/Word 时该块会降级为说明文字,继续?"。
5. **删除 [删]** → 自定义块弹确认 dialog "删除后该块及其内容将被移除,确定?";固定块无 [删] 按钮。
6. **+ 添加区块** → 行内展开:输入块名 + 选初始渲染类型(默认纯文本 + AI ✓),回车确认。
7. **📎 上传 .md/.txt 让 AI 识别** → 弹二级模态:
   ```
   ┌─ AI 识别模板 ─────────────────┐
   │ [选择文件] 或 [粘贴文本]       │
   │ ┌────────────────────────┐    │
   │ │ (粘贴框)                │    │
   │ └────────────────────────┘    │
   │                                │
   │         [取消] [开始识别]      │
   └────────────────────────────────┘
   ```
   识别后弹预览:识别的区块以可编辑行出现,用户**二次调整**后点 [替换自定义区块] 或 [追加到自定义区块] 或 [取消]。
8. **恢复默认** → 弹确认 "将重置为默认模板,自定义内容丢失,确定?"。
9. **保存** → 写入对应模板字段,关闭弹窗。
10. **取消** → 弹"有未保存的修改"确认(若 dirty)。

### 2.5 AI 识别 Prompt

```
请识别这份文档中的区块结构,返回纯 JSON 数组,格式为:
[{"name": "区块名", "aiGenerate": true/false, "renderType": "text/list/table/callout/dataview"}]

注意:
- 忽略「今日工作」「灵感随笔」「每日任务」这三项,系统已固定提供
- renderType 根据区块内容形态判断,默认为 text
- 只返回 JSON,不要任何说明文字
```

**AI 识别后 renderType 推断规则:**
- 二级标题(## 复盘)→ 默认 `text`
- 二级标题下全是 `- item` → `list`
- 二级标题下首行是 `|` 表格 → `table`
- 二级标题下首行是 `> [!xxx]` → `callout`
- 二级标题下首行是 ```` ```dataview ```` → `dataview`

**错误处理:**
- AI 返回非 JSON / JSON 不合规 → 提示"识别失败,请手动添加区块",保留用户已上传的文本在粘贴框
- 上传非 .md/.txt 文件 → 拒绝,提示"仅支持 .md / .txt 格式"

---

## 三、生成管线(模板渲染层 + AI 填充层分离)

### 3.1 双层架构

```
┌────────────────────────────────────────────────────────────┐
│ 触发:每日定时 / 周报定时 / 月报定时 / 立即生成按钮 /        │
│      日报手动"保存并同步"按钮                              │
└────────────────────┬───────────────────────────────────────┘
                     ▼
        ┌────────────────────────────┐
        │ ① 模板渲染层(templateRenderer)│
        │ - 读模板(5 套之一)            │
        │ - 把固定块 + 自定义块结构    │
        │   写为 Obsidian 文件骨架      │
        │ - **不写 AI 内容**,只铺空 marker│
        │ - 固定块内容直接写(产品数据)  │
        │ - aiGenerate=false 块也直接写  │
        │   (取自产品数据/用户编辑)      │
        └────────────┬─────────────────┘
                     ▼
        ┌────────────────────────────┐
        │ ② AI 填充层(runner)         │
        │ - 读骨架文件,扫 marker       │
        │ - 收集切片(下面详述)         │
        │ - 对每个 aiGenerate=true 块  │
        │   调一次 LLM                  │
        │ - 按 renderType 校验/包裹    │
        │ - upsertBlock 写入 marker    │
        │   内(只写一次)               │
        └────────────┬─────────────────┘
                     ▼
        ┌────────────────────────────┐
        │ ③ 对外脱敏(可选)             │
        │ - 仅对 external* 报告生效     │
        │ - 用户配置 anonymizeExternal │
        │   Reports = true(默认)        │
        │ - 轻量脱敏:替换姓名/项目名等  │
        └────────────────────────────┘
```

### 3.2 双份生成 bug 修复

**根因:** 旧 `buildDailyNoteFromTemplate`(`obsidianTemplates.ts:237-287`)在写模板时,把 `{{review}}` 替换为"空 marker + 老 AI 草稿",而 `runReviewForFile` 又往同一个 marker 写一次新 AI 草稿,导致文件里出现两份。

**修复:**
- `buildDailyNoteFromTemplate` **只写空 marker**(DAILYTODO:REVIEW:START/END),不写任何 AI 内容
- `runReviewForFile` 是**唯一**写 AI 草稿的入口
- 模板层和填充层职责严格分离,绝无重复

### 3.3 切片策略(token 优化)

**日报生成:**
- 数据来源:当天 3 个固定块(今日工作 + 灵感随笔 + 每日任务)
- 单次 LLM 调用,prompt 包含所有 3 块内容 + 待生成的 N 个自定义块
- 每个 aiGenerate=true 块,prompt 中附带"渲染格式指令"(如"用 Markdown 列表格式")

**周/月报生成(为控 token,分切片):**

```
渲染"工作总结"块时:
  切片 B = [每天的"今日工作"详情]
  LLM prompt: "请把以下 N 天的今日工作合并为本周/本月总结:\n{切片 B}"

渲染其他自定义块时:
  切片 A = [每天的任务列表 + 复盘 + 灵感随笔](**不含**今日工作详情)
  LLM prompt: "以下是过去 N 天的日报摘录,请按块生成:\n{切片 A}\n{每块带 renderType 指令}"
```

### 3.4 renderType 校验(填充层)

LLM 返回后,按 renderType 校验:
- `text` → 直接写入
- `list` → 检查每行是否以 `- ` 开头,不满足的自动加 `- `
- `table` → 检查首尾 `|`,缺失时降级为 `text` 并附 `⚠️ 表格格式识别失败,降级为文本`
- `callout` → 必须 `> [!xxx]`,缺失时降级为 `text`
- `dataview` → 必须 ``` ```dataview 代码块包裹,缺失时降级为 `text`

失败时附加降级提示(让用户能看出原因)。

### 3.5 对外轻量脱敏

仅对 `externalWeekly*` / `externalMonthly*` 报告生效。

**轻量脱敏规则(`lightAnonymize`):**
- 替换人名为 `[人员]`(基于用户配置的"我"姓名白名单 + 简单正则匹配)
- 替换项目代号/客户名为 `[项目A]` `[项目B]`(基于配置的项目白名单,或简单正则匹配)
- 替换电话号码 / 邮箱为 `[联系方式]`
- 不做语义级脱敏(避免影响内容质量),只做明显敏感词替换

**降级处理:** 若用户关闭 `anonymizeExternalReports`,对外报告按原内容写入。

### 3.6 错误处理

- LLM 调用失败 → marker 内写 `<!-- 生成失败: <原因> -->`,不阻塞其他块
- 切片为空 → marker 内写 `<!-- 无素材,可手动填写 -->`,不调 LLM
- 全部块都失败 → 状态栏显示"报告生成失败: N 块错误,详见文件"

---

## 四、设置页面最终结构

### 4.1 nav 入口

```
旧 nav(7 个):                          新 nav(6 个):
- Personalization                      - 外观           (i18n 翻译)
- Window                               - 窗口           (i18n 翻译)
- Obsidian Sync                        - 设置 ★合并★   (含 4 个区)
- Daily Rollover                       - 每日结转       (i18n 翻译)
- AI Review   ← 删除                   - 通用           (i18n 翻译)
- General                              - 开发者         (i18n 翻译)
- Developer
```

### 4.2 "设置"区页面布局

```
┌─ 设置区(原 Obsidian Sync + AI 复盘合并) ───┐
│ 顶部工具栏(sticky):[返回上一级] [✕ 关闭]   │
│                                            │
│ ▼ Obsidian 同步                            │
│   Vault 路径            [选择 Vault]       │
│   日报路径              [输入 logs/daily/...]│
│   个人周报路径          [输入 logs/weekly/...]│
│   个人月报路径          [输入 logs/monthly/...]│
│   对外周报路径          [输入 logs/weekly/...]│
│   对外月报路径          [输入 logs/monthly/...]│
│   同步删除的完成记录    [toggle]            │
│   删除前确认            [toggle]            │
│                                            │
│ ▼ 模板设置                                  │
│   日报模板              [编辑 →]           │
│   个人周报模板          [编辑 →]           │
│   个人月报模板          [编辑 →]           │
│   对外周报模板          [编辑 →]           │
│   对外月报模板          [编辑 →]           │
│                                            │
│ ▼ AI 设置                                   │
│   模型                  [下拉选择]         │
│   API Key               [输入框]           │
│                                            │
│ ▼ 周/月报自动生成                            │
│   开启个人周报 [toggle]                     │
│     触发星期 [下拉]  触发时间 [HH:mm]      │
│   开启个人月报 [toggle]                     │
│     触发几号 [数字]  触发时间 [HH:mm]      │
│   开启对外周报 [toggle]                     │
│     触发星期 [下拉]  触发时间 [HH:mm]      │
│   开启对外月报 [toggle]                     │
│     触发几号 [数字]  触发时间 [HH:mm]      │
│   [对外脱敏]  [toggle](默认开)              │
│                                            │
│   [立即生成本人周报] [立即生成本人月报]      │
│   [立即生成对外周报] [立即生成对外月报]      │
└────────────────────────────────────────────┘
```

### 4.3 设置面板布局改造(两栏 + 顶部 sticky 工具栏)

- 左栏(`<nav>`)~ 200px,sticky,scroll 内
- 右栏内容区,scroll 内
- 顶部工具栏(返回 / ✕)sticky,scroll 内
- 三块都是"内部滚动,父容器不再滚",这样 sticky 才生效

---

## 五、字段迁移映射(老用户首启自动迁移)

| 旧字段 | 新归宿 | 迁移策略 |
|---|---|---|
| `obsidianPath` | `obsidianPath` | 保留 |
| `dailyNotePath` | `dailyPath` | 保留,变量名改 |
| `dailyMarkdownTemplate`(文本) | `dailyTemplate`(结构化) | 解析 `{{work}} {{inspire}} {{tasks}} {{review}}` 还原为块结构;无 token 走默认 |
| `taskExportPath` | **删除** | 提示一次"任务导出功能已移除" |
| `workSectionTitle` 等 6 个段标题 | 删 | 固定块 displayName 默认值:今日工作/灵感随笔/每日任务;自定义块默认 3 个(复盘/明日待办/可复用知识) |
| `taskLineTemplate` | 删 | 改为块级 `prompt` 字段(若用户改过这个模板,迁移到"每日任务"块的 prompt) |
| `completionReviewTemplate` | 删 | 改为"复盘"块自带 prompt(默认空) |
| `weeklyDir / monthlyDir` | `weeklyPath / monthlyPath` | 自动补全文件名:目录后加 `{{year}}-W{{week}}.md` / `{{year}}-{{month}}.md` |
| `externalWeeklyDir / externalMonthlyDir` | `externalWeeklyPath / externalMonthlyPath` | 同上,加 `external/` 子目录 |
| `weeklyPrompt / monthlyPrompt` | 删 | 块级 prompt |
| `externalWeeklyPrompt / externalMonthlyPrompt` | 删 | 块级 prompt |
| `weeklySourceMode / monthlySourceMode` | 删 | 周月报统一"按对应路径的日报聚合",无策略切换 |
| `externalWeeklySourceMode / externalMonthlySourceMode` | 删 | 同上 |
| `syncDeletedReviewsToObsidian` | 保留 | 移到 Obsidian 同步区 |
| `confirmBeforeDeletingReview` | 保留 | 移到 Obsidian 同步区 |
| 账号 / API Key / 模型 | AI 设置区 | 保留 |
| `backfillDays` | 删 | 默认 7 |
| `weeklyTimerEnabled / weekday / time` | 周/月报自动生成区 | 保留 |
| `monthlyTimerEnabled / day / time` | 周/月报自动生成区 | 保留 |
| `externalWeeklyTimerEnabled / weekday / time` | 周/月报自动生成区 | 保留(本轮新增字段) |
| `externalMonthlyTimerEnabled / day / time` | 周/月报自动生成区 | 保留(本轮新增字段) |

**迁移特殊处理:**
- 老用户首启时弹一次"我们重构了模板系统,需要重新保存"提示
- 若老 `dailyMarkdownTemplate` 含非内置 token(`{{xxx}}`),先弹"以下自定义变量无法识别"确认,默认保留在"高级文本模板"备用(本次暂不渲染,只存)
- 老对内/对外文件**保留**在原路径,不再生成新的对内/对外

---

## 六、i18n 改造清单

具体改哪些硬编码英文 → i18n key:

1. `SettingsPanel.tsx:63-71` 的 7 个 nav 标题(本次实际只保留 6 个)
2. `ObsidianTemplateCenter.tsx` 内的英文 heading(本次实际会被新组件替换)
3. `SettingsPanel.tsx:1331/1376/1456/1566` 4 个 section heading
4. `SettingsPanel.tsx:1334-1337` 的主题筛选词

**新增 i18n key(中英对照):**

| key | 中文 | 英文 |
|---|---|---|
| `nav.appearance` | 外观 | Appearance |
| `nav.window` | 窗口 | Window |
| `nav.settings` | 设置 | Settings |
| `nav.rollover` | 每日结转 | Daily Rollover |
| `nav.general` | 通用 | General |
| `nav.developer` | 开发者 | Developer |
| `settings.section.obsidian` | Obsidian 同步 | Obsidian Sync |
| `settings.section.templates` | 模板设置 | Templates |
| `settings.section.ai` | AI 设置 | AI Settings |
| `settings.section.timers` | 周/月报自动生成 | Weekly/Monthly Auto-Generate |
| `settings.path.daily` | 日报路径 | Daily Note Path |
| `settings.path.personalWeekly` | 个人周报路径 | Personal Weekly Path |
| `settings.path.personalMonthly` | 个人月报路径 | Personal Monthly Path |
| `settings.path.externalWeekly` | 对外周报路径 | External Weekly Path |
| `settings.path.externalMonthly` | 对外月报路径 | External Monthly Path |
| `template.kind.daily` | 日报模板 | Daily Template |
| `template.kind.personalWeekly` | 个人周报模板 | Personal Weekly Template |
| `template.kind.personalMonthly` | 个人月报模板 | Personal Monthly Template |
| `template.kind.externalWeekly` | 对外周报模板 | External Weekly Template |
| `template.kind.externalMonthly` | 对外月报模板 | External Monthly Template |
| `template.editor.title.daily` | 日报模板编辑器 | Daily Template Editor |
| `template.editor.title.personalWeekly` | 个人周报模板编辑器 | Personal Weekly Template Editor |
| `template.editor.title.personalMonthly` | 个人月报模板编辑器 | Personal Monthly Template Editor |
| `template.editor.title.externalWeekly` | 对外周报模板编辑器 | External Weekly Template Editor |
| `template.editor.title.externalMonthly` | 对外月报模板编辑器 | External Monthly Template Editor |
| `template.fixedSection` | 固定区块(不可删除) | Fixed Sections (cannot delete) |
| `template.customSection` | 自定义区块 | Custom Sections |
| `template.action.rename` | 改名 | Rename |
| `template.action.delete` | 删除 | Delete |
| `template.action.add` | 添加区块 | Add Section |
| `template.action.upload` | 上传 .md/.txt 让 AI 识别 | Upload .md/.txt for AI Recognition |
| `template.action.reset` | 恢复默认 | Reset to Default |
| `template.action.save` | 保存 | Save |
| `template.action.cancel` | 取消 | Cancel |
| `template.aiToggle` | AI 生成 | AI Generate |
| `template.renderType.text` | 纯文本 | Plain Text |
| `template.renderType.list` | 列表 | List |
| `template.renderType.table` | 表格 | Table |
| `template.renderType.callout` | Callout 高亮块 | Callout Highlight |
| `template.renderType.dataview` | Dataview 查询(实验性) | Dataview Query (Experimental) |
| `template.confirm.delete` | 删除后该块及其内容将被移除,确定? | This will remove the section and its content. Confirm? |
| `template.confirm.reset` | 将重置为默认模板,自定义内容丢失,确定? | This will reset to default template and lose customizations. Confirm? |
| `template.confirm.dirty` | 有未保存的修改,确定离开? | You have unsaved changes. Leave anyway? |
| `template.confirm.dataview` | 导出 PDF/Word 时该块会降级为说明文字,继续? | This block will be downgraded to plain text on PDF/Word export. Continue? |
| `template.recognition.failed` | 识别失败,请手动添加区块 | Recognition failed. Please add sections manually. |
| `template.recognition.unsupported` | 仅支持 .md / .txt 格式 | Only .md / .txt formats are supported |
| `timer.personalWeekly.enable` | 开启个人周报 | Enable Personal Weekly |
| `timer.personalMonthly.enable` | 开启个人月报 | Enable Personal Monthly |
| `timer.externalWeekly.enable` | 开启对外周报 | Enable External Weekly |
| `timer.externalMonthly.enable` | 开启对外月报 | Enable External Monthly |
| `timer.weekday` | 触发星期 | Trigger Weekday |
| `timer.dayOfMonth` | 触发几号 | Trigger Day of Month |
| `timer.time` | 触发时间 | Trigger Time |
| `timer.anonymizeExternal` | 对外脱敏 | Anonymize External Reports |
| `timer.generateNow.personalWeekly` | 立即生成本人周报 | Generate Personal Weekly Now |
| `timer.generateNow.personalMonthly` | 立即生成本人月报 | Generate Personal Monthly Now |
| `timer.generateNow.externalWeekly` | 立即生成对外周报 | Generate External Weekly Now |
| `timer.generateNow.externalMonthly` | 立即生成对外月报 | Generate External Monthly Now |
| `error.generate.failed` | 报告生成失败: N 块错误,详见文件 | Report generation failed: N sections error, see file |
| `error.noSource` | 无素材,可手动填写 | No source material, you can fill manually |

---

## 七、模块边界(分而治之)

| 模块 | 职责 | 关键文件 |
|---|---|---|
| 模板数据结构 + 路径 | 5 套模板 + 5 条路径的类型定义、默认值、迁移 | `app/shared/obsidianTemplates.ts` |
| 模板渲染层 | "模板 → Obsidian 文件"的纯渲染(只写空 marker,只写固定块,只写非 AI 块) | `app/shared/templateRenderer.ts` (新增) |
| AI 填充层 | 读骨架文件,扫 marker,对每个 aiGenerate=true 块调 LLM,按 renderType 校验 | `app/electron/aiReview/runner.ts` |
| 对外脱敏 | 轻量脱敏(替换姓名/项目名等) | `app/electron/aiReview/anonymize.ts` (新增) |
| 模板编辑器弹窗 | 共用组件,kind 参数化 | `app/src/components/TemplateEditorModal.tsx` (新增) |
| AI 识别二级模态 | 上传/粘贴 → LLM 识别 → 预览 | `app/src/components/TemplateRecognitionModal.tsx` (新增) |
| 设置面板 | 4 个区(obsidian/模板/ai/timers),nav 改 i18n,顶部 sticky 工具栏 | `app/src/components/SettingsPanel.tsx` |
| 设置面板布局 | 两栏 + 顶部 sticky 工具栏 | `app/src/components/SettingsPanel.tsx` |
| 路径模板变量替换 | `{{date}} {{year}} {{month}} {{week}}` 替换 | `app/shared/pathTemplate.ts` (新增或合并到 obsidianTemplates) |

---

## 八、验证方案

写一个 `app/scripts/verify-template-hub-rewrite.ts` 验证脚本(参考现有的 `verify-context-menu.ts` / `verify-ux-polish.ts` 风格,项目里有这个范式)。

**验证项(每条对应到反馈):**

1. **i18n** — 切到中文后,扫 SettingsPanel 渲染输出,无 `personalization / window / obsidian sync / daily rollover / ai review / general / developer` 任何一个英文串出现
2. **导航合并** — 6 个 nav 入口(无 AI Review),"设置"区包含 4 个折叠区(obsidian / 模板 / ai / timers)
3. **5 条路径** — 设置页有 5 个路径输入框(日报/个人周/个人月/对外周/对外月),无 taskExportPath
4. **5 个 [编辑模板 →] 入口** — 都在,点击各自打开对应 kind 的弹窗
5. **弹窗交互** — 日报弹窗有 3 必现 + N 自定义;周/月报弹窗只有 N 自定义;改名、aiGenerate、renderType 都能改;固定块不可删;跨组拖动拒绝
6. **AI 识别流程** — 上传合法 .md → 返回 JSON 列表 → 预览 → 二次调整 → 替换/追加/取消;上传非法格式 → 拒绝
7. **双份生成 bug** — 跑一次"用户上传含 {{review}} 的模板 + AI 填充"全流程,断言生成的 Obsidian 文件里**只有 1 份 AI 草稿**
8. **路径模板变量** — 5 条路径都支持 `{{date}} / {{year}} / {{month}} / {{week}}` 变量,生成文件时被正确替换
9. **周月报切片优化** — 生成周报时,LLM 收到的 prompt **不含**"今日工作"详情;只有"工作总结"块单独收到工作详情
10. **renderType 校验** — LLM 返回不合规格式时,降级为 text 并附 `⚠️ 降级提示`,不抛错
11. **空素材** — 周/月报对应周期没日报时,marker 写 `<!-- 无素材 -->`,不调 LLM
12. **对内/对外独立生成** — 4 套周月报(个人周/个人月/对外周/对外月)各自独立生成,路径/模板/触发时间都互不干扰
13. **对外脱敏** — 开启 anonymizeExternalReports 后,对外报告生成后跑 lightAnonymize,敏感词被替换;关闭后不替换
14. **设置面板布局** — 滚动到任何位置,顶部工具栏的 [返回上一级] 和 [✕ 关闭] 都可见且可点
15. **smoke test** — 完整跑一遍:新建日报 → 加 3 个任务 → 同步到 Obsidian → 文件里 5 块(3 必现 + 2 自定义)结构正确

---

## 九、风险清单

| 风险 | 等级 | 缓解 |
|---|---|---|
| 老用户 `dailyMarkdownTemplate`(纯文本)迁移到结构化时数据丢失 | 中 | 迁移时若模板含非内置 token,先弹"以下自定义变量无法识别"确认,默认保留在"高级文本模板"备用(本次暂不渲染,只存) |
| 周月报对内/对外 4 套独立后,设置项数量增加 | 低 | 4 套默认参数清晰,用户感知不到复杂度 |
| AI 识别 LLM 返回不稳定,影响编辑体验 | 中 | 失败时降级路径完备(手动添加块) |
| 弹窗拖拽在 webview 内性能 | 低 | 块数上限 ~ 20,无压力 |
| i18n 漏翻译 | 中 | 验证脚本扫硬编码英文 |
| 双份 bug 修复后,旧的 `dailyMarkdownTemplate` 文本模板不再被 buildDailyNoteFromTemplate 走 | 中 | 老用户**首启强制迁移**为结构化,弹一次"我们重构了模板系统,需要重新保存"提示 |
| 对外脱敏替换了不该替换的内容 | 中 | 轻量脱敏只替换明显敏感词,不做语义级替换,提供预览确认 |
| 5 套模板迁移数据冲突 | 中 | 首启时弹一次确认,默认从老对内/对外模板迁移过来 |

---

## 十、未决项(后续 PR 跟进)

- 任务导出(本次删除)
- 周/月报 4 套 sourceMode(本次只保留"按日报聚合")
- 多账号 / 账号选择(本次保留单账号)
- LLM 协议变体(本次不动,沿用现有 aiReview 协议)
- 对外脱敏的项目白名单配置(本次先做通用正则替换)
- 模板编辑器的"导出模板为 .md"功能
- 模板的导入/导出(用户间分享)
- 模板版本管理

---

## 十一、相关参考

- 用户原话反馈(10 条):见对话历史
- PRD v1.0:见 `docs/superpowers/plans/2026-06-11-*.md` (用户上传)
- 验收清单:见 `docs/验收清单-模板素材i18n重构.md`
- 现有代码:见 `app/src/components/SettingsPanel.tsx`、`app/src/components/ObsidianTemplateCenter.tsx`、`app/shared/obsidianTemplates.ts`、`app/shared/aiReview/aiReviewSettings.ts`、`app/electron/aiReview/runner.ts`
