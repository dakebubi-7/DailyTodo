# Findings — DailyTodo UI 反馈修复（2026-06-18）

## 已知项目事实

- DailyTodo 是 Electron + React app，验证通常通过 `app/scripts/verify-*.ts` 的 tsx 脚本完成。
- 现有 package scripts 包含 `verify:theme-visual-isolation`、`verify:task-list-interactions`、`verify:settings-v2-window-mode`、`verify:ai-runner`、`typecheck` 等。

## 初步定位

- 窗口尺寸相关：`app/electron/main.ts` 中 `DEFAULT_WINDOW_WIDTH/HEIGHT`、`RESET_WINDOW_WIDTH/HEIGHT`、`loadWindowState()`、`BrowserWindow` 创建、设置模式宽度逻辑。
- 任务列表/按钮相关：`app/src/components/TaskItem.tsx`、`TaskList.tsx`、`globals.css` 中 task action classes。
- 完成弹窗：`app/src/components/TaskCompletionDialog.tsx` + `globals.css` completion dialog/theme rules。
- 设置页/下拉：`app/src/components/SettingsPanel.tsx`、`PriorityPicker.tsx` 或原生 select 样式 + `globals.css` theme rules。
- AI 进度：可能在 `app/electron/main.ts` AI runner/report generation IPC progress 或 `SettingsPanel.tsx` 的进度显示逻辑中。

## Agent 根因补充（2026-06-18）

- 默认窗口过大：`app/electron/main.ts` 的窗口状态恢复与设置页放宽窗口宽度耦合，关闭设置页后可能把大宽度持久化并在下次启动复用。
- 子任务按钮对齐：`TaskItem.tsx` 的子任务 review/delete slot 存在，但 CSS 混用了 absolute、grid、重复宽度/translateY 覆盖，导致查看/删除按钮基线漂移。
- 主题颜色：`themePresets.ts`、`App.tsx` class/data-theme 与 `globals.css`/`watercolor-theme.css` 中 legacy `.theme-*`、`.dark`、`[data-theme]` 规则重叠，黑灰/无感/极简/新拟态/水彩容易被蓝色或旧暗色覆盖。
- 完成弹窗/下拉：`TaskCompletionDialog.tsx`、`TaskReviewDialog.tsx` 使用共享 `.completion-dialog` 和 native select/textarea，暗色只局部 patch，Windows 下箭头、背景、选项对比容易不一致。
- AI 日报进度：`SettingsPanel.tsx` 的 `fallbackProgress()` / `scheduleFallbackProgress()` 会每 1200ms 合成固定阶段，可能在后端慢或少事件时重复显示假流程；应以真实 IPC progress 为主，fallback 只表示“等待真实进度”。

## UI 设计原则（本次）

- 黑灰/无感/极简黑/新拟态黑：用主界面的中性色 surface/text/border，不使用蓝色作为基础面色；蓝色只允许作为明确 AI/链接/少量 accent，且不能污染设置页、顶栏、底部输入、弹窗底色。
- 极简纯白/无感白：surface 应偏白/灰白，文字深灰，控件边框浅灰；完成记录跟随白色主题。
- 水彩黑：今日工作编辑框与完成记录编辑框蓝色；日期栏不再保留“今天”白底特例，需按当前主题主体背景显示，暗色文字纯白。
- “标记完成”在无感主题中应降噪：降低填充强度/阴影/对比，保留可见触控目标。

## 手测问题 1 根因（2026-06-20）

- 截图中的日期下方白/黑条不是组件结构问题，而是 `globals.css` 后置主题覆盖给 `.date-current` 写入了 `background-color: var(--theme-neutral-surface)`；水彩深色样式还通过 `.dark .theme-watercolor :is(.date-current, ...)` 给日期文本加了蓝色渐变背景。
- 日期栏样式存在多段重复覆盖：基础 `.date-card/.date-stepper/.date-calendar-button`、无感主题两段 `.theme-invisible`、水彩主题文件、以及末尾 `[data-theme]` 隔离规则。修复必须放在 `globals.css` 末尾，才能压住旧规则。
- 用户 2026-06-20 新要求覆盖 2026-06-18 的旧水彩黑“今天按钮白色”要求：现在所有主题日期栏都应贴合当前主题主体背景；浅色主题 `< 今天 >` 与日期文字为纯黑，深色主题为纯白。
- 不能只修水彩：当前可选主题是 `forest`、`morandi`、`minimal`、`neumorphism`、`invisible`、`watercolor`，另外 `custom` 也会进入 `data-theme`。日期栏最终覆盖必须显式覆盖这些主题，否则旧的 `.theme-*` / `[data-theme]` 级联仍可能在某个主题漏出白/黑条。
- 关键 CSS 细节：旧的 `.app-shell[data-theme='minimal/neumorphism/invisible'] :is(.date-current, ...)` 与新规则同为 `!important`，且 specificity 高于 `.app-shell :is(.date-current, ...)`；因此清除条带必须使用 `.app-shell[data-theme='...'] .date-current` 级别或更高 specificity。
- 更可靠的根治点：不要让 `.date-current` 进入设置 `background-color: var(--theme-neutral-surface)` 的通用控件组合选择器。该组合选择器服务于 tab/input/dialog/list，不应包含纯文本日期显示。
- 无感主题日期栏不能使用实体 `--date-nav-surface`：即使 `.date-current` 透明，`.date-card` 自身如果铺 `rgba(16,18,22,var(--card-opacity))`，黑色模式仍会出现一整条黑栏。无感明暗日期栏 surface 应为 `transparent`，hover 才用极弱对比。
- 无感主题选中态不应使用实体胶囊背景：`tabbar button.font-semibold` 和 `daily-panel-tab-active` 只应显示底部下划线；通用暗色 active pill 规则必须被无感专用规则覆盖。
- 无感 tab 的黄色线来自 `TabBar.tsx` 内置 active indicator：`bg-forest dark:bg-gold`。若只改 button 的 `box-shadow`，黄色线仍会显示；需要给 indicator class 并在无感主题下覆盖颜色。
- 如果隐藏内置 indicator 改用 `::after`，会丢失 Framer Motion `layoutId="activeTab"` 的滑动效果。无感主题应保留 `.tabbar-active-indicator`，只改颜色与左右 inset。
- 主/子任务查看/删除按钮列对齐以主任务为准：不要给 `.task-subtask-action-layer` 单独 `right` 偏移。应通过共享 `--task-action-right` 让主任务和子任务 action layer 使用同一个右侧列基准。
- 子任务查看/删除按钮垂直居中不能只依赖 `top: 50% + translateY(-50%)`；在主题 padding/border/按钮尺寸变化后会产生视觉偏移。更稳的是让 `.task-subtask-action-layer` 跨整行 `inset-block: 0`，再用 grid `align-content: center` 和 slot/button 自身居中。
- 若按钮仍视觉偏下，检查按钮盒模型而不是继续移动 layer：子任务按钮需要清 `padding/margin/line-height`，使用 `inline-grid/place-items:center`；内部 SVG 需要 `display:block`，避免 inline SVG 的 baseline/line-box 造成视觉下沉。
- 子任务 action layer 不能用 `place-content:center` 来做整层居中，因为会让整个 review/delete grid 偏离主任务右侧列。正确组合是横向 `right: var(--task-action-right)` + 主任务同款 `grid-template-columns/min-width/gap/justify-content:end`，纵向 `inset-block:0` + `align-content/items:center`。
- 仅共享 `right` 仍可能不对齐：主任务 action layer 相对 `.task-card`，子任务 action layer 相对缩进后的 `.task-subtask-row`。需要让子任务 row 的右边界回到主任务同宽参照（宽度补偿 + 负 margin），再用 padding 保留左侧视觉缩进。
- 上述宽度补偿会引入新的偏移风险：若补偿值不等于实际缩进链，子任务 review/delete grid 会被推错。更稳的做法是避免猜参照盒宽度，直接让主/子 `.task-action-layer` 使用相同固定 action-grid `width/min-width/grid-template-columns/gap/right`，从各自右边界用同一模型展开。
- 最终级联必须同时覆盖主任务和子任务：旧 `.task-action-layer, .task-subtask-action-layer { grid-template-columns: 1.38rem 1.38rem !important; }` 会压住主任务。如果只给子任务 final `!important`，主/子实际列宽不同，截图仍会显示不对齐。
