# DailyTodo Cleanup Findings

## Requirements
- 用户希望“可以整理的都整理”，目标是一个完整、分模块、以后方便更改的代码库。
- 保持软件现有行为，不做无关视觉或产品变更。
- 尽量一次推进到可验证状态，但大风险拆分要分阶段落地。

## Research Findings
- `src/hooks/useTasks.ts` 已经在前一阶段拆出多个任务核心模块：`taskTransforms`、`taskSelectors`、`taskCarryover`、`taskPersistence`、`taskObsidianSync`、`taskMutations`、`taskReviewMutations`、`taskOrderingState`、`taskHookState`。
- `package.json` 已有多个专项验证命令，但还缺少把任务核心和清理回归串起来的一键脚本。
- `src/main.tsx` 已导入 `./styles/globals.css` 和 `./styles/context-menu.css`。
- `src/App.tsx` 也导入了 `./styles/context-menu.css`，与 `src/main.tsx` 重复。
- `src/styles/globals.css` 内部导入了 `./watercolor-theme.css`。
- `src/components/SettingsPanel.tsx` 文件较大，里面包含可抽出的通用控件：`RangeControl`、`Field`、`AutoStartToggle`、`ToggleRow` 等。
- `electron/main.ts` 文件较大，包含 store、窗口、图标、Win32、IPC、AI、Obsidian 等逻辑，适合后续按低耦合边界拆分。

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 新增组合验证脚本 | 以后重构前后可快速跑核心回归。 |
| 先清理重复 CSS import | 影响面小，结构收益明确。 |
| 设置面板先抽 `settings` 子目录 | 保留组件邻近性，同时避免一个文件继续膨胀。 |
| Electron main 先抽 icon/store 等纯模块 | 降低 IPC 和运行时生命周期被误改的概率。 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| 工作区已有大量修改和未跟踪文件 | 只在当前目标范围内追加/修改，不回退用户或前序改动。 |
| 中文输出存在疑似 mojibake | 本轮先不批量改运行时中文文案，只记录并谨慎处理。 |

## Resources
- `src/hooks/useTasks.ts`
- `src/components/SettingsPanel.tsx`
- `src/App.tsx`
- `src/main.tsx`
- `electron/main.ts`
- `package.json`

## Visual/Browser Findings
- 本轮尚未进行视觉或浏览器检查。
