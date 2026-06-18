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
- 水彩黑：用户明确指定日期行“今天”按钮白色；今日工作编辑框与完成记录编辑框蓝色。
- “标记完成”在无感主题中应降噪：降低填充强度/阴影/对比，保留可见触控目标。
