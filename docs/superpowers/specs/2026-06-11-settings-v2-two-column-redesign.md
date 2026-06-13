# DailyTodo 设置页 v2 两栏重构设计稿

> 版本: v2.0
> 最后更新: 2026-06-11
> 用途: 交付开发者/AI 用于重构全部设置页面。本稿吸收用户 v2 规格文档 + 主题联动约束 + AI 管理修复。

---

## 零、本次重构的三条主线

1. **结构**: 设置页从"长滚动钻取页"改为**左侧固定导航(168px) + 右侧滚动内容**的两栏布局,7 个 Tab 重新分三组(常用/系统/高级)。
2. **窗口与主题**: 点设置时**主窗口从 240px 临时撑宽到 ~720px**,内部渲染全屏两栏 overlay;关闭缩回 240px。设置页**主题完全跟随主窗口 + 实时联动**(同一渲染进程,零成本)。
3. **Companion 拆解 + 修复**: Obsidian Companion 独立面板整个拆掉,内容分流到各 Tab;同时修复 AI 账号管理因字段删除导致的崩溃/错乱。

---

## 一、窗口策略(地基)

### 1.1 形态:主窗口临时变宽 + 全屏 overlay

**不**新建独立 BrowserWindow。原因:独立窗口要做跨窗口主题同步管道(改动大、有延迟风险),而 overlay 天然共享 React 树和 CSS 变量,主题联动零成本。

| 状态 | 主窗口宽度 | 渲染 |
|---|---|---|
| 常态(任务列表) | 240px | 主界面 |
| 打开设置 | 临时撑到 720px | 主界面之上覆盖全屏两栏设置 overlay |
| 关闭设置 | 缩回 240px(恢复用户之前的宽度) | 主界面 |

### 1.2 实现要点

- **窗口尺寸控制**: 渲染进程通过 IPC 请求主进程调整窗口宽度。新增 IPC: `window:setSettingsMode(open: boolean)`。
  - `open=true`: 记录当前宽度到变量 `prevWidth`,把窗口宽度 setBounds 到 `SETTINGS_WINDOW_WIDTH = 720`(若屏幕放不下取 `min(720, workArea.width - 40)`)。
  - `open=false`: 恢复 `prevWidth`(默认回 240)。
- **窗口最小宽度临时放宽**: 打开设置时 `setMinimumSize(720, ...)`,关闭时恢复 `setMinimumSize(240, ...)`,避免 setBounds 被 minWidth 卡住。
- **位置保持**: 变宽时若窗口右边缘超出屏幕,向左平移使其完整可见(参考现有 `RESET_WINDOW_WIDTH` 的边缘处理逻辑 `main.ts:1386-1388`)。
- **overlay 渲染**: `App.tsx` 中 `settingsOpen` 为真时渲染 `<SettingsPanel>`,该组件铺满主窗口(`position: fixed; inset: 0`)。
- **关闭动效**: overlay 淡出 + 窗口缩回,避免突兀。窗口缩回应等 overlay 动效结束后再 setBounds(否则会看到设置内容被压缩)。

### 1.3 主题联动

- overlay 在主窗口同一 React 根下,**直接继承** `document.documentElement` 上的 CSS 变量(`--personal-accent` / `--personal-secondary` / 各区域透明度变量 / 字体 / 圆角)。
- 用户在"外观"Tab 改主题 → `App.tsx` 的个性化 state 更新 → CSS 变量实时变 → 设置 overlay 自身样式实时跟随。**无需额外同步代码**。

---

## 二、导航结构(三组 7 Tab)

```
常用
  🎨 外观     (Appearance)
  🔄 同步     (Sync)
  📄 模板     (Templates)
  🤖 AI 复盘  (AI Review)
系统
  📅 日程     (Schedule)
  ⚙️ 通用     (General)
高级
  </> 开发者  (Developer)
```

### 关键迁移说明(对照旧结构)

| 旧位置 | 内容 | 新位置 | 原因 |
|---|---|---|---|
| 日程与同步 | 同步删除完成记录 + 删除前确认 | → 同步 | 属于 Obsidian 同步行为 |
| 通用 | 语言 | → 通用(系统组) | 语言是基础设置,不是高级 |
| 窗口(独立 Tab) | 置顶/自启/最小化托盘 | → 通用 | 内容太少,并入通用 |
| Companion | Vault 路径 | → 同步 | 与同步 Tab 重复,合并去重 |
| Companion | Rules(任务/灵感同步规则) | → 开发者 | 底层配置,普通用户不需要 |
| Companion | Templates(task line 等变量) | → 开发者 | 底层配置 |
| Companion | Preview/Sync(同步预览) | → 开发者 | 调试用 |
| Companion | Mobile Inbox(手机收集箱) | **删除** | 用户确认不使用 |

---

## 三、布局规范

### 3.1 整体框架

左侧导航(固定)+ 右侧内容区(可滚动),两栏布局。**禁止上下长页面**,所有内容必须通过左侧 Tab 导航分区。

```
┌────────────────────────────────────────────────┐
│  设置                                        ✕  │  ← 顶部条(sticky)
├──────────┬─────────────────────────────────────┤
│          │                                     │
│  侧边栏   │        当前 Tab 内容                 │
│ 168px    │        (可滚动)                     │
│ (固定)   │                                     │
└──────────┴─────────────────────────────────────┘
```

### 3.2 侧边栏规范

- 宽度: 168px
- 背景: `--color-background-secondary`(映射见第八节)
- 分组标签: 11px、全大写、`--color-text-tertiary`
- 导航项高度: 36px,左侧 2px 激活提示条
- 激活态: 背景 `--color-background-primary`,左边条 `--color-text-primary`,font-weight 500

### 3.3 字段行规范

- 最小高度: 42px
- 上下 padding: 9px
- 分隔线: `border-bottom: 0.5px solid var(--color-border-tertiary)`,最后一行无分隔线
- 左侧: 标签(13px text-primary)+ 可选副标题(11px text-secondary)
- 右侧: 控件(toggle / 下拉 / 文字链接 / 按钮)

### 3.4 Toggle 规范

- 尺寸: 32×18px,border-radius 9px
- 开启色: `#3C3489`
- 关闭色: `--color-border-secondary`
- **toggle 关闭时,其子项(sub-row)收起隐藏**

### 3.5 Sub-row(缩进子项)规范

- 左侧 margin: 8px
- 左边框: `border-left: 2px solid var(--color-border-tertiary)`
- 左侧内边距: 12px

---

## 四、各 Tab 详细规格

### Tab 1 — 外观

沿用现有个性化逻辑,重排为 Section:

- **主题**: 4 个主题卡片(2 列网格,52px 高,选中 `1.5px solid #3C3489`)。简洁纯白 / 拟物风 / 隐身 / 水彩玻璃
- **全局**: 字体大小(滑块 80~130,默认 100,单位%)、圆角大小(滑块 0~24,默认 20,单位px),滑块右侧实时显示数值
- **配色**: 主色、强调色(颜色选择器预览框)
- **透明度**: "区域透明度微调"手风琴(默认收起),展开后 7 个区域:主页背景/任务卡/输入框/顶栏按钮/弹窗/菜单/设置面板

### Tab 2 — 同步

- **Section: Obsidian**
  ```
  Vault 路径
    <当前路径>                       [选择 Vault]
  同步删除的完成记录                  [toggle]
    DailyTodo 作为 DAILYTODO:TASKS 管理区块的数据源
  删除前确认                          [toggle]
    删除完成记录前解释本地和 Obsidian 同步影响
  ```
  - Vault 路径与原 Companion 的 vaultPath **合并为一个**(都写 `obsidianTemplates.obsidianPath`)。
  - 两个 toggle 读写 `obsidianTemplates.syncDeletedReviewsToObsidian` / `confirmBeforeDeletingReview`。
- **Section: 路径设置(手风琴)**
  - 5 条路径用 Accordion,默认只展开"日报路径",其余折叠。
  - 折叠标题右侧显示路径缩略(超长用 `…`),展开后显示可编辑输入框。
  - 5 条: 日报路径 / 个人周报路径 / 个人月报路径 / 对外周报路径 / 对外月报路径
  - 支持变量: `{{date}}` `{{year}}` `{{week}}` `{{month}}`
  - 读写 `obsidianTemplates.dailyPath / weeklyPath / monthlyPath / externalWeeklyPath / externalMonthlyPath`

### Tab 3 — 模板

- **Section: 个人**
  ```
  日报模板      今日工作 · 灵感随笔 · 每日任务 · 复盘 · …   [编辑 →]
  个人周报模板  本周工作总结 · 完成任务 · 灵感汇总 · …       [编辑 →]
  个人月报模板  本月工作总结 · 完成任务 · 复盘 · …           [编辑 →]
  ```
- **分隔线**
- **Section: 对外**
  ```
  对外周报模板  本周工作总结 · 完成任务 · 项目进展 · …       [编辑 →]
  对外月报模板  本月工作总结 · 完成任务 · 下月计划 · …       [编辑 →]
  ```
- 规则:
  - `[编辑 →]` 是**文字链接按钮**(不是大空白按钮)。
  - 可标题显示当前模板的区块预览(块名用 `·` 连接),超过 4 个用 `· …` 省略。
  - 点击弹出 `TemplateEditorModal`(见前作设计稿 `2026-06-11-dailytodo-template-hub-rewrite-design.md`)。
  - 5 个 kind: daily / personalWeekly / personalMonthly / externalWeekly / externalMonthly。

### Tab 4 — AI 复盘

**本 Tab 必须先修复 AI 管理崩溃(见第七节),再按此排版。**

- **Section: 账号**
  ```
  模型             [<当前账号名> ▾]
  API Key / 账号    [管理账号 →]
  ```
- **Section: 个人自动生成**
  ```
  个人周报自动生成                    [toggle]
    触发时间      [每周日 ▾] [21:00 ▾]   ← toggle 关闭时收起
  个人月报自动生成                    [toggle]
    触发时间      [每月1日 ▾] [09:00 ▾]
  ```
- **分隔线**
- **Section: 对外自动生成**
  ```
  对外周报自动生成                    [toggle]
    触发时间      [每周五 ▾] [18:00 ▾]
  对外月报自动生成                    [toggle]
    触发时间      [每月1日 ▾] [09:00 ▾]
  ```
- **Section: 手动生成**(2 列网格,outline 次要样式)
  ```
  [生成个人周报]  [生成个人月报]
  [生成对外周报]  [生成对外月报]
        [重新生成今日日报]            ← 占满整行
  ```
- **约束**:
  - 手动生成按钮与 toggle 开关**必须分开**,不能混排。
  - toggle 关闭时,触发时间 sub-row 收起隐藏。
  - 读写 `aiReviewSettings`: `weeklyTimerEnabled/Time/Weekday`、`monthlyTimerEnabled/Time/Day`、`externalWeeklyTimerEnabled/Time/Weekday`、`externalMonthlyTimerEnabled/Time/Day`。
  - 账号读写 `aiReviewSettings.profiles` / `activeProfileId`。

### Tab 5 — 日程

- **Section: 每日切换**
  ```
  Rollover time
    默认 05:00,04:30 仍属于前一个业务日           [05:00 输入框]
  自动结转未完成任务                                [toggle]
    未完成或完成度低于 100% 的任务会结转
    结转规则说明文字(只读,灰色)
  ```
- **Section: 清理已完成**
  ```
  说明文字:只把当前日期的已完成任务从应用列表中隐藏…
  [清理「2026-06-11」的已完成 (0)]              (按钮,宽度100%)
  ```

### Tab 6 — 通用

- **Section: 语言**
  ```
  Language
    只影响应用外壳,不翻译任务/每日工作/灵感等已有笔记   [中文 ▾]
  ```
- **Section: 窗口**(原"窗口"独立 Tab 内容并入)
  ```
  置顶显示                    [toggle]
  开机自启动                  [toggle]
  关闭时最小化到托盘           [toggle]
  ```

### Tab 7 — 开发者

- **Section: 工具**(2 列网格)
  ```
  [重置模板草稿]  [代码结构说明]
  ```
- **Section: Obsidian 同步规则(原 Companion Rules,中文化)**
  ```
  任务 → 日记         目标 · 区块 · 模式 · 优先级    [编辑 →]
  灵感 → 日记         目标 · 区块 · 模式 · 优先级    [编辑 →]
  ```
  - 每条规则可展开编辑: 目标文件 / 区块标题 / 模式(追加 append / 托管块 managed-block)/ 优先级 / 匹配后(继续 continue / 停止 stop)。
  - 读写 `companionSettings.rules`。
- **Section: 底层模板变量(原 Companion Templates,中文化)**
  ```
  任务行模板        - [ ] {{content}} {{tags}}          [编辑 →]
  灵感行模板        - {{time}} {{content}} {{tags}}      [编辑 →]
  工作块模板        {{content}}                          [编辑 →]
  ```
  - 读写 `companionSettings.templates`。
- **Section: 同步预览(原 Companion Preview,中文化)**
  ```
  [预览同步]  [立即同步]
  <状态信息>
  <错误与变更列表>
  ```
  - 调用 `companion:previewSync` / `companion:writeSync`。
- **Section: 说明**(灰色只读)
  - 编辑风险说明(破坏 marker 可能导致内容重复)
  - 代码位置说明(各模块对应的源文件路径)

---

## 五、Companion 拆解详细映射

Companion 独立面板(`ObsidianCompanionPanel.tsx`)整个移除,不再在 `App.tsx` 渲染。其内容按下表分流:

| Companion 区块 | 字段/数据 | 去向 | 中文化 |
|---|---|---|---|
| Header | 标题、关闭 | 删除(整个面板没了) | — |
| Vault | `companionSettings.vaultPath` | → 同步 Tab,与 `obsidianTemplates.obsidianPath` **合并为一个真相源** | 是 |
| Mobile Inbox | `mobileInboxPath` + `importMobileInbox` IPC | **删除**(代码 + UI + IPC handler) | — |
| Rules | `companionSettings.rules[]` | → 开发者 Tab "Obsidian 同步规则" | 是 |
| Templates | `companionSettings.templates[]` | → 开发者 Tab "底层模板变量" | 是 |
| Preview/Sync | `previewSync` / `writeSync` IPC | → 开发者 Tab "同步预览" | 是 |

**Vault 合并策略**:
- 当前有两个 vault 路径来源:`obsidianTemplates.obsidianPath`(新)和 `companionSettings.vaultPath`(旧 Companion)。
- 统一以 `obsidianTemplates.obsidianPath` 为唯一真相源。
- 写入时同时同步给 `companionSettings.vaultPath`(因为 companion 的 previewSync/writeSync 仍用它),避免开发者 Tab 的同步预览找不到 vault。
- 迁移: 首次加载时若 `obsidianTemplates.obsidianPath` 为空但 `companionSettings.vaultPath` 有值,用后者填充前者。

---

## 六、CSS 设计令牌映射

v2 规格使用一套 `--color-*` 令牌,代码中**不存在**。建一层映射(在 `globals.css` 的 `:root` 中定义),让 v2 的 CSS 规则可直接套用,且令牌跟随主题变化。

```css
:root {
  --color-background-primary: var(--personal-surface, rgba(255,255,255,0.96));
  --color-background-secondary: var(--personal-surface-muted, rgba(248,248,250,0.96));
  --color-text-primary: var(--personal-text, #1f2937);
  --color-text-secondary: var(--personal-text-muted, #6b7280);
  --color-text-tertiary: var(--personal-text-faint, #9ca3af);
  --color-border-secondary: var(--personal-border, rgba(39,39,42,0.18));
  --color-border-tertiary: var(--personal-border-faint, rgba(39,39,42,0.10));
}
.dark {
  --color-background-primary: var(--personal-surface, rgba(15,23,42,0.97));
  --color-background-secondary: var(--personal-surface-muted, rgba(20,28,48,0.97));
  --color-text-primary: var(--personal-text, #e5e7eb);
  --color-text-secondary: var(--personal-text-muted, #9ca3af);
  --color-text-tertiary: var(--personal-text-faint, #6b7280);
  --color-border-secondary: var(--personal-border, rgba(148,163,184,0.22));
  --color-border-tertiary: var(--personal-border-faint, rgba(148,163,184,0.12));
}
```

- 实际映射变量名以代码中现有 `--personal-*` 为准(实现时核对 `globals.css` 现有定义,缺失的用 fallback 值)。
- 关键: 这些令牌**引用现有主题变量**,所以主题切换时自动跟随。

---

## 七、AI 账号管理修复(必须先做)

当前 AI 管理已损坏。根因:T6(commit cfcc602)删除了 `AiReviewSettings` 的多个字段,但旧 `AiReviewSection` 组件仍引用它们;新增的 `AiAccountZone` 给账号管理弹窗传了错误形状的 i18n prop。

### 7.1 问题清单(按严重度)

| # | 问题 | 位置 | 严重度 |
|---|---|---|---|
| 1 | `AiReviewSection` 引用已删字段 `weeklyDir/monthlyDir/externalWeeklyDir/externalMonthlyDir/weeklySourceMode/monthlySourceMode/weeklyPrompt/monthlyPrompt/externalWeeklyPrompt/externalMonthlyPrompt/backfillDays` | `SettingsPanel.tsx` ~870, 1078-1150 | 高(渲染即崩) |
| 2 | `AiAccountZone` 传给 `AiAccountManager` 的 `text` prop 形状错误:传了 `{ settings: { aiReview: text } }`,但 `AiAccountManager` 期望扁平的 `AiReviewText`(直接 `text.accountName`) | `SettingsPanel.tsx:571` | 高(文字显示不出/报错) |
| 3 | `AiAccountZone` 新建 profile 用了 `outputTokens`,但 `AiProfile` 类型字段名是 `maxTokens` | `SettingsPanel.tsx:580` | 中(字段被丢弃) |
| 4 | 两套账号管理(`AiReviewSection` 与 `AiAccountZone`)并存,`AiReviewSection` 现已是死代码但仍占文件、仍引用废弃字段 | `SettingsPanel.tsx:290-536 / 604+` | 中 |
| 5 | `AiReviewSection` 读 `settings.backfillDays`(已删)→ 输入框 NaN | `SettingsPanel.tsx:870` | 中 |

### 7.2 修复方案

1. **删除整个旧 `AiReviewSection` 组件**(`SettingsPanel.tsx` ~604 起的 600+ 行)。它已是死代码,且全是对废弃字段的引用。其有用功能(账号管理、定时、生成按钮)已由 `AiAccountZone` + Tab 4 的新排版承接。
2. **修 `AiAccountZone` 的 i18n prop**: `AiAccountManager` 期望 `text: AiReviewText`。直接传 `text={text}`(即 `getShellText(lang).settings.aiReview`),不要包一层 `{ settings: { aiReview } }`。核对 `AiAccountManager` 内所有 `text.xxx` 访问路径,确保扁平。
3. **修新建 profile 字段名**: `outputTokens` → `maxTokens`,与 `AiProfile` 类型一致。核对 `AiProfile` 全部字段(`id/name/provider/baseUrl/apiKey/model/maxTokens/timeoutSeconds/note` 等以代码实际为准),新建时补全。
4. **账号管理唯一化**: 保留 `AiAccountManager`(纯展示+回调的弹窗组件)+ `AiAccountZone`(状态容器)。删除 `AiReviewSection` 内重复的账号管理逻辑。
5. **回归验证**: 打开 AI Tab → 不崩;点"管理账号" → 弹窗文字正常显示中文;新增账号 → 字段完整保存;切换当前账号 → 生效。

---

## 八、模块边界与文件清单

| 文件 | 改动 | 职责 |
|---|---|---|
| `app/electron/main.ts` | 新增 `window:setSettingsMode` IPC + 窗口变宽/缩回逻辑;删除 `companion:importMobileInbox` | 窗口尺寸控制 |
| `app/electron/preload.ts` | 暴露 `window.setSettingsMode`;移除 mobile inbox API | IPC 桥 |
| `app/src/components/SettingsPanel.tsx` | 重写为两栏 + 7 Tab;删除旧 `AiReviewSection`;修 `AiAccountZone` | 设置主组件 |
| `app/src/components/SettingsSidebar.tsx`(新) | 168px 三组导航 | 侧边栏 |
| `app/src/components/settings/`(新目录) | 每个 Tab 拆成独立子组件: `AppearanceTab / SyncTab / TemplatesTab / AiReviewTab / ScheduleTab / GeneralTab / DeveloperTab` | 各 Tab |
| `app/src/components/ObsidianCompanionPanel.tsx` | **删除**(内容已分流) | — |
| `app/src/App.tsx` | 移除 Companion 渲染;设置打开/关闭时调 `setSettingsMode`;模板弹窗 wiring 保留 | 顶层编排 |
| `app/src/styles/globals.css` | 加 v2 令牌映射层 + 两栏/侧边栏/字段行/toggle/sub-row 样式 | 样式 |
| `app/src/i18n.ts` | 新增完整 Companion i18n(~30 key);7 Tab 标题/分组标签;补 `manageAccounts` 等缺失 key | i18n |
| `app/shared/obsidianCompanion.ts` | 移除 `mobileInboxPath` 字段及相关类型 | 数据类型 |

---

## 九、分阶段实现计划(每阶段可独立运行 + 验证)

> 大重构,分 4 个阶段。每阶段结束应用可正常启动、可手动验证,不留半成品。

### 阶段 A — 修复 + 地基(优先,先让现状不崩)
- A1: 修复 AI 账号管理(第七节全部 5 条)。删旧 `AiReviewSection`,修 `AiAccountZone` i18n/字段。
- A2: 窗口变宽/缩回 IPC(`window:setSettingsMode`)+ overlay 容器外壳(暂时把现有内容塞进去)。
- A3: CSS 令牌映射层(第六节)。
- **验收**: AI Tab 不崩;点设置窗口变宽、关闭缩回;主题切换设置页跟随。

### 阶段 B — 两栏导航 + Tab 骨架
- B1: `SettingsSidebar`(168px 三组 7 项)。
- B2: 两栏布局 CSS(字段行/toggle/sub-row 规范)。
- B3: 7 个 Tab 子组件骨架(空壳 + 标题),路由切换。
- **验收**: 左侧导航可切 7 Tab,布局符合规范,顶部返回/关闭常驻。

### 阶段 C — 各 Tab 内容迁移
- C1: 外观 Tab(迁移现有个性化)。
- C2: 同步 Tab(Vault 合并 + 5 路径手风琴 + 2 toggle)。
- C3: 模板 Tab(5 个文字链接 + 预览)。
- C4: AI 复盘 Tab(账号 + 4 toggle 自动生成 + 手动生成网格,toggle/按钮分开)。
- C5: 日程 Tab + 通用 Tab(语言 + 窗口并入)。
- **验收**: 每个 Tab 功能可用,逐 Tab 手动测试。

### 阶段 D — Companion 拆解 + 中文化
- D1: 删除 `ObsidianCompanionPanel` 渲染;Vault 合并迁移。
- D2: 开发者 Tab 三个 Section(规则/模板变量/同步预览)+ 完整 Companion i18n。
- D3: 删除 Mobile Inbox(UI + 字段 + IPC)。
- **验收**: Companion 面板消失;开发者 Tab 三块功能可用且中文;全程中英切换正常。

---

## 十、重要约束(必须遵守,来自 v2 规格)

1. 禁止上下长页面,所有内容通过左侧 Tab 导航分区。
2. 路径输入框必须用手风琴,不能全部平铺展开。
3. 模板入口必须是文字链接样式,不是大空白按钮。
4. 手动生成按钮与 toggle 开关必须分开,不能混排。
5. Toggle 关闭时,触发时间子项必须收起隐藏。
6. 个人/对外双轨在模板 Tab 和 AI 复盘 Tab 中用 Section 分组,不平铺。
7. Obsidian Companion 的 Rules 和 Templates 只放在开发者 Tab,不暴露给普通用户。
8. 设置页主题完全跟随主窗口 + 实时联动。

---

## 十一、风险与未决项

| 风险 | 缓解 |
|---|---|
| 窗口变宽时若用户屏幕很小(<760px)放不下 720px | 取 `min(720, workArea.width - 40)`,两栏在窄屏下侧边栏可压到 140px |
| overlay 与主界面 z-index/事件穿透 | overlay `position: fixed; inset: 0; z-index` 高于一切;打开时禁用主界面交互 |
| 删除旧 `AiReviewSection` 可能误删仍被引用的工具函数 | 删除前 grep 该组件内导出的辅助函数是否被外部引用 |
| Vault 双真相源合并出错导致同步预览失效 | 写入 `obsidianPath` 时同步回 `companionSettings.vaultPath` |
| Companion i18n 工作量大(~30 key) | 放在阶段 D,结构先搭好,翻译集中补 |

**未决项(后续)**:
- 窗口变宽的动画曲线细节(本稿只要求平滑,不指定缓动函数)。
- 开发者 Tab 各"编辑 →"弹窗的具体表单布局(本轮先复用现有 Companion 的行编辑形态,中文化即可)。
- 暗色主题下 v2 令牌的精细调色(阶段 A 先用 fallback,后续微调)。

---

## 十二、相关参考

- v2 规格原文: 用户上传的 `设置.md`
- 前作模板系统设计: `docs/superpowers/specs/2026-06-11-dailytodo-template-hub-rewrite-design.md`
- 现有代码: `SettingsPanel.tsx` / `ObsidianCompanionPanel.tsx` / `obsidianCompanion.ts` / `aiReviewSettings.ts` / `main.ts` / `i18n.ts` / `globals.css`
