# Progress — DailyTodo UI 反馈修复（2026-06-18）

## 2026-06-18

- 收到用户 11 条截图反馈并明确授权自行执行、验证完成。
- 按技能要求启用系统调试、文件化计划、TDD、UI/UX 指南。
- 检查到工作目录是普通 git checkout（`.git == common dir`），但因用户要求不中断且当前已有大量未提交工作，决定在当前工作区继续，避免另起 worktree 丢失已有 UI 改动上下文。
- 创建/覆盖本轮 `task_plan.md`、创建 `findings.md`、`progress.md`，用于跨会话追踪。
- 读取 `app/package.json`，确认验证脚本入口。
- 启动只读 subagent 失败：当前模型安全分类服务临时不可用；改用本地 Read/Grep 静态定位。
- 新增 `app/scripts/verify-ui-feedback-regressions.ts`，并在 `package.json` 加入 `verify:ui-feedback-regressions`。
- 修复 `app/electron/main.ts`：设置页 720px 宽度只作为临时模式，不再污染下次启动默认小窗；启动时会归一化已保存的设置页大宽度。
- 修复 `app/src/components/SettingsPanel.tsx`：AI 生成进度不再用 timer 合成假阶段；真实 IPC 进度缺失时只显示“等待真实进度…”。
- 修复 `app/src/components/TaskItem.tsx`：高优先级或 AI/课程/学习类任务显示低噪声 AI 辅助徽标。
- 追加 `app/src/styles/globals.css` 主题隔离覆盖：黑灰设置页/完成弹窗/下拉选项、无感白色完成记录、极简顶栏与底部输入、水彩黑色指定按钮/编辑框、无感“标记完成”降噪、子任务操作按钮对齐。
- 更新旧 verifier 中与新反馈冲突的“无感蓝灰完成弹窗”和“AI fallback 合成阶段”断言。
- 多次尝试运行 Bash 验证命令均被工具层安全分类服务拦截：`claude-opus-4-8[1m] is temporarily unavailable...`。尚未获得实际命令通过输出。

## 2026-06-20

- 处理用户手测问题 1：所有主题日期栏下方出现白/黑条，且 `< 今天 >` 前后按钮在明暗主题下文字/背景不跟随主题。
- 根因定位到 `app/src/styles/globals.css` 末尾 `[data-theme]` 主题隔离规则给 `.date-current` 强行设置背景，以及水彩深色旧规则给 `.date-current` 加渐变背景；不是 `DateNavigator.tsx` 结构问题。
- 更新 `app/scripts/verify-ui-feedback-regressions.ts`：追加日期栏回归断言，覆盖日期文本透明背景、浅色纯黑文字、深色纯白文字、日期卡/按钮使用主题 surface、移除水彩暗色今天白底特例，并枚举 `forest/morandi/minimal/neumorphism/invisible/watercolor/custom` 全主题。
- 更新 `app/src/styles/globals.css`：追加 `2026-06-20 date navigator theme surface fix` 末尾覆盖层，统一 `.date-current` 透明无背景、明暗文字纯黑/纯白；并为 `forest/morandi/minimal/neumorphism/invisible/watercolor/custom` 每个主题显式声明 `--date-nav-surface` / hover / border token，避免只修水彩或只靠默认兜底。
- 按用户本次新要求移除旧的水彩暗色 `.date-today-button` 白底黑字覆盖；黑色主题日期导航现在应保持白字并使用主题背景。
- 用户截图确认上一版仍未消除条带；复查发现原因是旧规则 `.app-shell[data-theme='minimal/neumorphism/invisible'] :is(.date-current, ...) { background-color: var(--theme-neutral-surface) !important; }` specificity 高于新加的通用 `.app-shell :is(.date-current, ...)`，同为 `!important` 时旧规则仍胜出。
- 追加高优先级全主题规则：`.app-shell[data-theme='forest|morandi|minimal|neumorphism|invisible|watercolor|custom'] .date-current` 明确清除 background/background-color/background-image；同时对 `.date-card/.date-stepper/.date-calendar-button` 和明暗文字色也使用 `data-theme` 级别选择器。
- 更新 `verify-ui-feedback-regressions.ts`，断言 `.date-current` 背景清除必须达到 `data-theme` specificity，防止只靠通用 `.app-shell` 再次失效。
- 用户再次截图确认条带仍存在；进一步定位到真正源头是旧的主题中性控件组把 `.date-current` 和 `.tab-active`、输入框、弹窗一起设置 `background-color: var(--theme-neutral-surface) !important`。
- 从源头移除 `.date-current`：`minimal/neumorphism/invisible` 的中性控件背景组不再包含 `.date-current`；暗色通用文本组也移除 `.date-current`，日期栏文字只由专门日期规则控制。
- 更新 `verify-ui-feedback-regressions.ts`：新增负向断言，禁止 `:is(.date-current, .tab-active, ...)` 和 `:is(.date-current, .task-text, ...)` 这类会把日期文本重新拉入通用背景/文本组的写法。
- 用户指出无感黑色主题仍出现整条黑色日期栏；原因是上一版为 `invisible` 设置了实体 `--date-nav-surface: rgba(16, 18, 22, var(--card-opacity))`，这会让 `.date-card` 整条铺黑。
- 修复无感主题 token：`html/light` 与 `.dark` 下 `invisible` 的 `--date-nav-surface` 均改为 `transparent`，只保留极弱 hover 和细边框；日期文字仍按浅黑/深白规则显示。
- 更新 `verify-ui-feedback-regressions.ts`：断言无感明暗日期栏 surface 必须透明，并禁止旧的实体白/黑 date surface token。
- 用户指出无感主题 tab 选中态仍是黑色胶囊；定位到 `.theme-invisible .tabbar button.font-semibold` 和 `.dark .app-shell:not([data-theme='watercolor']) ... .tabbar button.font-semibold` 通用 active 规则在铺实体背景。
- 追加无感专用 active 覆盖：`daily-panel-tab-active`、`.tabbar button.font-semibold`、`.tabbar button[class*="font-semibold"]` 在无感明/暗主题下均为透明背景、透明边框、无圆角，仅用 `inset 0 -2px 0` 下划线表示选中；浅色黑线，暗色白线。
- 更新 `verify-ui-feedback-regressions.ts`：断言无感选中态必须有 underline-only override，并禁止使用通用 active pill 背景。
- 用户要求无感主题选中 tab 不要黄色段，白线再短一点；定位到黄色来自 `TabBar.tsx` 内置 active indicator 的 `bg-forest dark:bg-gold`，不是前一次的 `box-shadow` 下划线。
- 为 `TabBar.tsx` active indicator 增加 `tabbar-active-indicator` class；无感主题隐藏该内置 forest/gold indicator。
- 无感主题选中 tab 改为透明背景、无边框、无圆角、无 box-shadow；用 `button::after` 绘制短线，宽度 `1.85rem`，浅色黑线、暗色白线。
- 更新 `verify-ui-feedback-regressions.ts`：断言 TabBar indicator 有 class、无感隐藏内置 indicator、短线宽度为 `1.85rem`、暗色线为 `#ffffff` 且不再使用 box-shadow 全宽线。
- 用户要求无感 tab 下划线再长一点，并保留从“当天”切到“全部”的滑动效果。
- 调整方案：不再隐藏 `TabBar.tsx` 的 Framer Motion `layoutId="activeTab"` indicator；保留 `tabbar-active-indicator`，在无感主题下仅覆盖其颜色和左右 inset。
- 无感 indicator 改为 `display: block`、`left/right: 0.55rem`、高度 `0.08rem`；浅色黑线、暗色白线；去除前一版静态 `::after`，恢复滑动动画。
- 更新 `verify-ui-feedback-regressions.ts`：断言保留 `layoutId="activeTab"`、indicator 可见、左右 inset 为 `0.55rem`、暗色为纯白，并禁止无感使用静态 `::after` 替代动画。
- 用户指出所有主题子任务查看/删除按钮需与主任务查看/删除按钮列对齐，以主任务为准。
- 定位到 `globals.css` 中主任务 `.task-action-layer` 使用 `right: 0.62rem`，但子任务 `.task-subtask-action-layer` 之前被后置覆盖为 `right: 0.1rem !important`，导致子任务按钮列比主任务更靠右。
- 修复：为 `.task-card` 和 `.task-subtask-row` 定义共享 `--task-action-right: 0.62rem`；主任务 `.task-action-layer` 使用该变量；子任务 `.task-subtask-action-layer.task-action-layer` 也强制 `right: var(--task-action-right) !important`，按主任务列对齐。
- 更新 `verify-task-action-alignment.ts`：断言主/子任务共享 `--task-action-right`，禁止残留 `right: 0.1rem !important`，并要求子任务 action layer 使用同一 right 变量。
- 用户指出所有子任务查看/删除按钮需要保证在整行垂直中间。
- 定位到子任务 action layer 虽有 `top: 50%` / `translateY(-50%)`，但层本身没有覆盖整行高度，遇到不同主题 padding、border、按钮尺寸时视觉中心会漂。
- 修复：`.task-subtask-action-layer.task-action-layer` 改为 `inset-block: 0`、`top/bottom: 0`、`transform: none`、`align-content: center`，让 action layer 跨整行高度；子任务 review/delete slot 和按钮自身也显式 `align-self/justify-self: center`。
- 更新 `verify-task-action-alignment.ts`：断言子任务 action layer 必须跨整行高度居中，不能只依赖 `top: 50%` 和 `translateY`。
- 用户再次截图显示子任务查看/删除按钮整体仍偏下；继续定位到按钮盒模型层面：旧规则多次重写子任务 slot/button 尺寸，且按钮/SVG 没有清 `line-height`/padding，SVG 可能受文本行盒基线影响视觉偏下。
- 进一步修复：子任务 action layer 增加 `height: 100%`、`place-content: center`；子任务 review/delete zone 高度改为 `100%` 并 `display: grid; place-items: center`；子任务按钮改为 `inline-grid; place-items: center`，清 `padding/margin/line-height/transform`；子任务 SVG 强制 `display: block`、无 margin/transform。
- 更新 `verify-task-action-alignment.ts`：新增 line-height/padding/SVG block 等盒模型断言，防止按钮视觉中心再次被文本行盒拉偏。
- 用户强调子任务查看/删除按钮在保证垂直居中的同时，还必须与主任务查看/删除按钮列对齐。
- 合并最终规则：`.task-subtask-action-layer.task-action-layer` 同时使用 `right: var(--task-action-right)`、与主任务相同的 `grid-template-columns` / `min-width` / `gap` / `justify-content: end`，并保留 `inset-block: 0`、`align-content/items: center`、`transform: none`。
- 移除子任务 action layer 的 `place-content: center` 要求，避免把整个 action grid 水平居中而偏离主任务右侧列；slot/button/SVG 的视觉居中规则保留。
- 更新 `verify-task-action-alignment.ts`：断言横向列对齐和纵向居中必须同时成立，并禁止 `place-content: center` 破坏主任务列对齐。
- 用户截图确认即使共享 `right` 和 action grid，主/子任务按钮仍未对齐；进一步定位为主任务 action layer 相对 `.task-card` 定位，而子任务 action layer 相对被树形缩进后的 `.task-subtask-row` 定位，二者右边界参照盒不同。
- 修复参照盒：最终 `.task-subtask-row` 增加 `width: calc(100% + 2.8rem)` 与 `margin-left: -2.8rem`，把子任务行右边界拉回主任务同宽参照；同时 `padding-left: 3.3rem` 保留子任务内容缩进。
- 保留最终 action layer 规则：子任务仍使用主任务同款 `right/grid/min-width/gap/justify-content:end`，并保留整行垂直居中与按钮/SVG 盒模型居中。
- 更新 `verify-task-action-alignment.ts`：新增子任务行宽度补偿、负 margin 和 padding-left 断言，避免只检查 right 变量而漏掉参照盒不同。
- 用户再次截图确认宽度补偿方案仍未让子任务按钮与主任务对齐，且子任务 review 列明显偏左。
- 撤销猜测式参照盒补偿：移除 `.task-subtask-row` 的 `width: calc(100% + 2.8rem)`、`margin-left: -2.8rem`、`padding-left: 3.3rem`。
- 统一主/子 action layer 模型：主任务 `.task-action-layer` 增加固定 action grid `width`；子任务 `.task-subtask-action-layer.task-action-layer` 使用同一 `width/min-width/grid-template-columns/gap/right`，从同一右边界向左展开，避免因内容盒补偿导致 review 列偏移。
- 更新 `verify-task-action-alignment.ts`：禁止猜测式宽度/负 margin 补偿，要求主/子 action layer 使用相同固定 action-grid width，并保留垂直居中规则。
- 最终定位到主/子任务按钮列仍不对齐的关键级联根因：旧的 `.task-action-layer, .task-subtask-action-layer { grid-template-columns: 1.38rem 1.38rem !important; gap: 0.45rem !important; }` 会压住主任务 action layer；后续规则只把子任务提升到新的变量列宽，导致主任务和子任务实际 grid 列宽不同。
- 修复：将最终 `.task-action-layer` 也提升为 `display/grid/width/min-width/grid-template-columns/gap` 全部 `!important`，与 `.task-subtask-action-layer.task-action-layer` 使用同一 `--task-review-action-width` / `--task-delete-action-width` / `--task-action-gap` / `--task-action-right` 模型。
- 同步更新 `verify-task-action-alignment.ts` 与 `verify-ui-feedback-regressions.ts`，移除旧 1.38/1.28 模型断言，改为检查最终变量列宽和 `!important` 级联。
- 验证通过：`npm run verify:task-action-alignment`。
- 验证通过：`npm run verify:ui-feedback-regressions`。

## 待验证命令

- `cd app && npm run verify:ui-feedback-regressions`
- `cd app && npm run verify:settings-v2-window-mode`
- `cd app && npm run verify:ai-run-diagnostics`
- `cd app && npm run verify:theme-visual-isolation`
- `cd app && npm run verify:task-list-interactions`
- `cd app && npm run verify:task-layout-unified-glass`
- `cd app && npm run typecheck`
