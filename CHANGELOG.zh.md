# DailyTodo 中文更新日志

> 这份更新日志按最近 git 历史和当前未提交修复整理，偏“用户能看懂的版本说明”，不是逐条技术 diff。

## 未发布：UI 反馈修复批次（2026-06-18）

### 界面与主题

- 恢复默认小窗口体验：设置页打开时仍可临时变宽，但不会把 720px 设置页宽度保存成下次启动默认窗口。
- 修复黑灰 / 无感 / 极简 / 新拟态 / 水彩黑主题之间的样式泄漏，减少蓝色底色、蓝色 hover 和旧暗色规则污染。
- 统一暗色完成弹窗为中性黑灰，不再出现偏蓝灰的完成弹窗。
- 修复 AI 复盘设置下拉框白底灰字不可读问题，暗色主题下拉选项使用黑灰背景和亮色文字。
- 修复无感白色主题下完成记录仍沿用黑色/蓝色的问题，改为跟随浅色 surface。
- 修复极简纯白 / 极简黑色下置顶栏、添加任务区域、设置页偏蓝的问题，改为白灰/黑灰中性色。
- 修复新拟态黑色模式设置页与主界面颜色不一致的问题。
- 修复水彩黑色主题下“今天”按钮、今日工作编辑框、完成记录编辑框的指定配色。
- 降低无感主题“标记完成”按钮视觉强度，让它保留可点击性但不再抢眼。
- 调整子任务查看/删除按钮右侧槽位，让两个按钮垂直居中、等宽对齐。

### 任务与 AI 复盘

- 高优先级任务，以及文本/标签里包含 AI、课程、学习、模型等关键词的任务，会显示低噪声 `AI` 辅助标识。
- AI 复盘生成进度不再用定时器合成假流程阶段；真实进度没回来时只显示“等待真实进度…”。
- 修正旧验证脚本中与新需求冲突的断言，例如“无感完成弹窗必须是蓝灰”和“AI fallback 必须自动推进假阶段”。

### 验证

- 新增 `verify:ui-feedback-regressions`，覆盖窗口尺寸、AI 真实进度等待、AI 任务标识、主题下拉/弹窗/水彩/无感等关键回归。
- 用户已在本地 PowerShell 跑过并通过：
  - `verify:ui-feedback-regressions`
  - `verify:settings-v2-window-mode`
  - `verify:ai-run-diagnostics`
  - `verify:theme-visual-isolation`
  - `verify:task-list-interactions`
  - `verify:task-layout-unified-glass`
- `typecheck` 已启动；是否通过还需要确认 `$LASTEXITCODE` 为 `0`。

---

## 2026-06-16：UI 稳定化与主题隔离

Commit: `662c3f7 feat(ui): theme isolation, task row layout, AI progress, glass fixes`

### 主题与视觉

- 加强主题隔离，减少不同主题之间的颜色、透明度、玻璃效果互相污染。
- 修复多主题下任务卡、设置页、顶部栏、弹窗、输入区域的视觉层级问题。
- 修复部分暗色模式文字、按钮、卡片背景可读性不足的问题。
- 调整玻璃透明层，让界面保持透明质感的同时不出现大面积黑块或灰块。

### 任务行布局

- 优化任务卡片内部布局，让完成圆圈、优先级、文本、查看按钮、删除按钮有更稳定的位置。
- 为右侧操作按钮预留安全空间，避免任务文字流到按钮下面。
- 改善任务行在不同主题和不同密度下的对齐一致性。

### AI 进度

- 改善 AI 复盘/报告生成时的进度显示。
- 让生成按钮和状态区域能显示当前阶段，而不是只显示固定“生成中”。

---

## 2026-06-14：毛玻璃与透明度控制

### 简化玻璃透明度设置

Commit: `2361aed feat: simplify glass opacity controls`

- 将复杂的透明度调节收敛为更容易理解的控制方式。
- 让窗口、卡片、输入框、菜单、弹窗等区域更倾向统一调节。
- 降低设置页里用户需要理解的透明度选项数量。

### 原生毛玻璃 fallback

Commit: `67be22e feat: add native frosted glass material fallback`

- 为 Windows / Electron 透明窗口加入原生毛玻璃材质兜底。
- 当 CSS 透明/模糊效果不稳定时，尽量使用系统级材质改善显示。
- 目标是让桌面壁纸透出更自然，减少透明窗口闪烁或显示异常。

### 任务拖拽验证增强

Commit: `53184db test: tighten task list drag interaction verifier`

- 加强任务列表拖拽 verifier。
- 更严格检查来源分组、任务卡片、完成/未完成分组之间的拖拽边界。
- 防止后续 UI 调整破坏拖拽交互。

### 细化毛玻璃透明度控制

Commit: `e110aef feat: refine frosted glass opacity controls`

- 增强不同 UI 区域的透明度控制能力。
- 为窗口、顶部栏、卡片、输入框、弹窗等区域设置更细的默认值和调节逻辑。
- 让不同主题可以有更合适的透明度预设。

### 毛玻璃设计文档

Commit: `55250df docs: design frosted glass opacity controls`

- 记录毛玻璃透明度控制的设计思路。
- 明确哪些区域应统一控制，哪些区域需要单独保留可读性。
- 约束透明度不要牺牲文本和控件可读性。

---

## 2026-06-13：任务拖拽、右键菜单、设置 v2 与功能快照

### 任务列表高级拖拽

Commit: `794c685 feat(tasks): drag-to-reorder source groups and tasks, bounce-free drop, card layout polish`

- 支持来源分组拖拽排序，例如个人任务和外部任务组可以换顺序。
- 支持同一来源内任务拖拽排序。
- 限制非法拖拽目标，避免任务跨来源、跨完成状态误放。
- 优化拖拽释放动画，减少释放后的明显弹跳。
- 优化任务卡片布局，使拖拽、文本和操作按钮更稳定。

### 多功能快照

Commit: `f09173a feat: snapshot pending app changes (task context menu, template hub, settings v2, AI review)`

- 保存当时并行推进的任务右键菜单、模板中心、设置页 v2、AI 复盘等大块工作。
- 这类提交更像阶段性集成点，表示多条功能线已经合入到同一个应用状态。

---

## 2026-06-11：模板 Hub 重写与设置页大升级

### 端到端 smoke test

Commit: `17190e1 test(smoke): end-to-end integration smoke test for template hub rewrite`

- 为模板 Hub 重写增加端到端集成冒烟测试。
- 覆盖模板模型、设置、识别、生成等关键路径，防止模块之间断裂。

### 对外周/月报 IPC

Commit: `10ef157 feat(main): add external weekly/monthly IPC handlers + verify runner idempotency`

- 主进程新增对外周报、对外月报生成 IPC handler。
- 渲染层可以直接触发外部报告生成。
- 增加验证 runner 幂等性检查，减少重复运行产生不同结果的问题。

### 设置页本地化

Commit: `0672798 feat(i18n): localize all nav titles and settings zone headings`

- 本地化设置页导航标题和设置区标题。
- 让设置页中文/英文结构更完整。

### 设置页 v2 布局

Commit: `3e1b650 feat(settings): 4-zone settings section, 2-col sticky layout, 5 paths, 4 timers, generate-now`

- 设置页改为 4 个主要区域。
- 使用双列 sticky 布局，左侧导航、右侧内容。
- 支持 5 条路径配置。
- 支持 4 个定时器配置。
- 增加立即生成入口。

### 模板识别 UI

Commit: `32ac9df feat(ui): TemplateRecognitionModal — file upload + paste + local block parsing + preview`

- 新增模板识别弹窗。
- 支持上传文件识别模板。
- 支持直接粘贴模板文本。
- 本地解析模板 block。
- 预览识别结果再应用。

### 模板编辑 UI

Commit: `ffdf45e feat(ui): TemplateEditorModal — 5 kinds, drag-reorder, AI toggle, renderType`

- 新增模板编辑弹窗。
- 支持 5 类模板。
- 支持模板 block 拖拽排序。
- 每个 block 支持 AI 开关。
- 每个 block 支持 renderType 配置。

### 报告生成器升级

Commit: `805ed31 feat(report-gen): N-block prompt builder + renderType validation + work-slice helper`

- 报告生成改为 N-block prompt builder。
- 增加 renderType 校验。
- 增加工作内容切片 helper，用于从任务/日报中提取报告素材。

### 模板识别模型升级

Commit: `81ed068 feat(recognition): N-block + 5-renderType template recognition`

- 模板识别支持 N 个 block。
- 支持 5 种 renderType。
- 让“认我的模板”可以映射到结构化模板，而不是简单文本匹配。

### AI 设置重构

Commit: `cfcc602 feat(ai-settings): add 4 timers + anonymize flag, remove dir/prompt/sourceMode fields`

- 新增 4 个定时器设置。
- 新增匿名化开关。
- 移除旧的目录、prompt、sourceMode 等字段。
- 让 AI 复盘设置从旧字段迁移到更结构化的配置。

### Obsidian 模板设置重写

Commit: `7cce7c4 feat(settings): rewrite ObsidianTemplateSettings to 5 paths + 5 templates with migration`

- 将 Obsidian 模板设置重写为 5 条路径 + 5 套模板。
- 增加旧设置迁移，降低升级后配置丢失风险。
- 为日报、个人周报、个人月报、对外周报、对外月报建立更清晰的结构。

### 修复双重生成

Commit: `f6fa09f fix(double-gen): split template render (skeleton only) from AI fill (marker content)`

- 将模板渲染和 AI 填充分离。
- 模板渲染只生成骨架。
- AI 只填 marker 内容。
- 避免模板和 AI 同时写同一块导致内容重复。

### 匿名化修复

Commit: `f2655f5 fix(anonymize): escape placeholders before surname regex to ensure idempotency`

- 修复匿名化流程中 placeholder 被姓氏正则误伤的问题。
- 保证匿名化多次执行结果一致。

### 外部报告轻量匿名化

Commit: `50c149e feat(anonymize): add lightAnonymize for external report generation`

- 为对外报告生成增加轻量匿名化。
- 降低外发周报/月报泄露敏感信息的风险。

### 路径模板展开

Commit: `cd84a0c feat(path-template): add expandPathTemplate for {{date}}/{{year}}/{{month}}/{{week}}`

- 支持路径中的 `{{date}}`、`{{year}}`、`{{month}}`、`{{week}}` 占位符。
- 用于日报、周报、月报、外部报告路径生成。

### 模板数据模型

Commit: `addf64f feat(template-model): add CustomBlock / FixedBlock / DailyTemplate / ReportTemplate types`

- 新增结构化模板类型。
- 支持自定义块、固定块、日报模板、报告模板。
- 为后续模板编辑、识别、生成奠定类型基础。

### 模板 Hub 设计与计划

Commits:

- `7c97b0d docs(plan): add template hub rewrite implementation plan (14 tasks, TDD, 5+5 model)`
- `f549a11 docs(spec): clarify sync button vs regenerate-today button behaviors`
- `941946f docs(spec): self-review fixes - empty marker format, AI toggle behavior, anonymization rules, block name matching, daily regen button, backfill simplification`
- `c634952 docs(spec): add template hub rewrite design (5 templates, 5 paths, share modal)`

主要内容：

- 明确模板 Hub 重写设计。
- 定义 5 模板、5 路径模型。
- 明确同步按钮和重新生成今日日报按钮的行为区别。
- 明确空 marker、AI toggle、匿名化、block 匹配、backfill 等规则。
- 制定 14 个任务的实现计划。

### 第一版可编辑模板与双语设置

Commit: `35d69c2 feat(templates): editable daily/report templates, source-gated AI reports, bilingual settings`

- 支持编辑日报/报告模板。
- AI 报告按来源控制生成。
- 设置页开始支持双语内容。

---

## 2026-06-10：Obsidian 模板中心

Commit: `87eb43f feat(obsidian): add template center with presets, modules, and AI import`

### 模板中心

- 新增 Obsidian 模板中心。
- 支持模板预设。
- 支持模块化模板片段。
- 支持 AI 导入模板。
- 为后续“模板 Hub 重写”提供基础。

---

## 2026-06-09：LLM 接口自动兼容

Commit: `78d46f1 feat(ai-review): auto-detect LLM endpoint and protocol variants`

### AI 账号兼容

- 自动识别 LLM endpoint 和协议变体。
- 减少用户手动选择接口协议的负担。
- 支持更多 OpenAI 兼容接口、中转站和不同 provider 的 URL 形态。
- 为后续多账号、模型列表、协议自动识别打基础。

---

## 2026-06-08：桌面挂件与 AI 复盘基础版

### 移除单独桌面 widget 窗口

Commit: `a3ee126 refactor(widget): remove separate desktop widget window`

- 移除独立桌面 widget 窗口架构。
- 将桌面挂件行为收敛到更统一的窗口实现。
- 降低双窗口同步和状态管理复杂度。

### 合并 AI 复盘到 widget 分支

Commit: `3e3b156 merge: integrate ai-review feature into widget branch`

- 将 AI 复盘功能线合入桌面挂件功能线。
- 让桌面任务应用同时具备 AI 复盘/报告能力。

### AI 复盘大功能

Commit: `9daf30c feat(ai-review): robust LLM client, scheduled reports, period picker, file templates`

- 新增更健壮的 LLM client。
- 支持定时生成报告。
- 支持周期选择器。
- 支持文件模板。
- 奠定 AI 日报、周报、月报生成基础。

### 桌面挂件前台守卫

Commit: `96f5d45 feat(widget): event-driven desktop raise/sink with foreground guard`

- 实现桌面挂件的前台应用守卫。
- 桌面可见时 DailyTodo 可以浮现。
- 用户切到其他应用时 DailyTodo 下沉，避免遮挡正常工作窗口。
- 为后续 normal / onTop / desktop 窗口模式奠定基础。

### AI 复盘路径与模板拆分修复

Commit: `666779b fix(ai-review): keep slash path input + split report templates 4 ways`

- 保留斜杠路径输入体验。
- 将报告模板拆成 4 类：个人周报、个人月报、对外周报、对外月报。
- 让不同报告类型可以独立配置模板。

---

## 更早的设计与产品主线

以下来自仓库里的设计/计划文档，属于更早阶段的产品演进记录。

### 知识流与 Obsidian Companion（2026-05-24 / 2026-05-25）

相关文档：

- `docs/superpowers/specs/2026-05-24-dailytodo-knowledge-flow-design.md`
- `docs/superpowers/plans/2026-05-24-dailytodo-knowledge-flow.md`
- `docs/superpowers/specs/2026-05-25-dailytodo-obsidian-companion-design.md`
- `docs/superpowers/plans/2026-05-25-dailytodo-obsidian-companion.md`

主要方向：

- 将 DailyTodo 和 Obsidian 日记/知识库连接起来。
- 让任务、每日记录、复盘和知识沉淀形成闭环。
- 建立 Obsidian companion 的基础交互和验证方案。

### UI Refresh（2026-05-24）

相关文档：

- `docs/superpowers/specs/2026-05-24-dailytodo-ui-refresh-design.md`
- `docs/superpowers/plans/2026-05-24-dailytodo-ui-refresh.md`

主要方向：

- 早期整体 UI 翻新。
- 确定 DailyTodo 小窗、任务列表、每日工作区的视觉方向。

### 设置同步（2026-05-27）

相关文档：

- `docs/superpowers/specs/2026-05-27-dt-settings-sync-design.md`

主要方向：

- 设计设置同步能力。
- 为后续本地设置、Obsidian 配置、主题配置打基础。

### Windows RC 与发布准备（2026-05-28）

相关文档：

- `docs/superpowers/specs/2026-05-28-dailytodo-windows-rc-design.md`
- `docs/superpowers/plans/2026-05-28-dailytodo-windows-rc.md`

主要方向：

- Windows 发布候选版本准备。
- Electron 打包、图标、安装包、运行验证等发布相关工作。

### 窗口模式与遮挡修复（2026-06-04）

相关文档：

- `docs/superpowers/specs/2026-06-04-window-modes-and-occlusion-fix-design.md`

主要方向：

- 设计普通窗口、置顶、桌面挂件等窗口模式。
- 解决 DailyTodo 在桌面和其他应用之间的遮挡问题。

### WorkerW / 双窗口桌面挂件探索（2026-06-06 / 2026-06-07）

相关文档：

- `docs/superpowers/specs/2026-06-06-desktop-workerw-embed-design.md`
- `docs/superpowers/plans/2026-06-06-desktop-workerw-embed.md`
- `docs/superpowers/plans/2026-06-06-desktop-widget-dual-window.md`
- `docs/superpowers/specs/2026-06-07-desktop-widget-dual-window-design.md`
- `docs/superpowers/plans/2026-06-07-desktop-widget-dual-window.md`

主要方向：

- 尝试将 DailyTodo 嵌入 Windows 桌面层。
- 探索 WorkerW、桌面 owner、双窗口挂件等方案。
- 后续架构逐步收敛为当前更稳定的单窗口桌面模式。

---

## 产品演进总览

1. DailyTodo 小窗任务应用。
2. Obsidian Companion 和知识流。
3. Windows 小窗、置顶、桌面挂件模式。
4. AI 日报/周报/月报复盘。
5. LLM 多接口自动兼容。
6. Obsidian 模板中心。
7. 模板 Hub 重写：5 模板、5 路径、block 模型、模板识别与编辑。
8. 设置页 v2：4 区域、双列布局、定时器、路径和模板管理。
9. 任务列表高级交互：来源组拖拽、任务拖拽、右键菜单、子任务树、完成记录。
10. 主题和毛玻璃系统：无感、极简、水彩、新拟态、透明度控制、原生毛玻璃 fallback。
11. 当前 UI 稳定化：按截图反馈修窗口尺寸、主题泄漏、进度展示、按钮对齐、下拉可读性。
