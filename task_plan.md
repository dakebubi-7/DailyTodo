# DailyTodo 调整任务计划

Goal: 按用户「今日工作」笔记里列出的需求,一项一项实现并经用户检查后推进。
开发方式:`npm run dev` 热更新(已修复 dev 加载旧 dist 的根因)。每项做完由用户验收,通过后再做下一项。

## 待办清单(按顺序)

### 第一阶段:Bug 修复
- [x] 1. 窗口变窄时「置顶/锁定/设置」按钮被整组隐藏 → 改为始终可见(globals.css ≤320px 媒体查询)✅ 用户验收通过
- [x] 2. 右侧透明竖条 → 根因是滚动条占位(scrollbar-gutter + 透明轨道);最终方案:主内容区隐藏滚动条、内容贴边,滚轮照滚(globals.css)✅ 用户验收通过
- [x] 3. `/` 命令:光标前有手动输入后就不再弹出菜单 → 根因是 IME 中文输入法(keydown 抢判 + 未兼容全角斜杠);改为 onChange 唯一判定 + onCompositionEnd 补判 + 兼容全角 ／(dailyCommandEditor.ts / DailyWorkPanel.tsx)✅ 用户验收通过

### 额外完成(用户追加)
- [x] 悬浮式可拖动滚动条:不占位、内容贴边,仅可滚动且滚动/悬停/拖动时淡入,跳过顶栏区域,宽 5px 贴右缘(useFloatingScrollbar.ts + TaskList.tsx + App.tsx + globals.css)✅ 用户验收通过
- [x] UI 主题预设:4 套(经典墨绿/莫兰迪灰藕蓝/极简纯白/深色夜间)在设置→个性化顶部卡片一键切换,大面积视觉覆盖(背景色温/顶栏/任务卡);默认外观改为极简纯白(themePresets.ts/personalization.ts/App.tsx/SettingsPanel.tsx/globals.css)✅ 用户验收通过
- [~] 新应用图标:太阳+对勾圆角白底蓝渐变(build/app-icon.svg + generate-icons.mjs 生成 icon.ico/icon.png/tray.png),接入 electron-builder + main.ts 托盘/窗口图标。待打包验证。

### 第二阶段:编辑器体验
- [x] 4. Markdown 输入辅助(方案A,保留 textarea 不引入编辑器框架):Tab/Shift+Tab 缩进、回车续列表(无序/任务/有序,空项结束)、Ctrl+B/I 加粗斜体。纯文本输出不破坏同步。新增 markdownEditor.ts + verify-markdown-editor.ts(markdownEditor.ts / DailyWorkPanel.tsx / package.json)✅ 用户验收通过
- [x] 5. 「今日工作/灵感闪念」改成就地下拉面板(去 portal/遮罩);标签按钮 toggle 开关;编辑框矮(4rem)+底部整条手柄拖动调高;去掉聚焦光圈、标题描述、关闭按钮(DailyWorkPanel.tsx / App.tsx / globals.css)✅ 用户验收通过

### 第三阶段:文档
- [~] 6. 使用说明中文版 → 用户跳过(docs/ 现有文档基本已是中文,未能精准定位缺中文处)

### 第四阶段:Obsidian 侧(独立于本 app)
- [x] 7. Obsidian 各级标题整行背景色块,莫兰蒂低饱和配色,亮/暗主题适配 → 新建 .obsidian/snippets/heading-blocks.css(用户需在 Obsidian 设置里启用)✅ 用户验收通过
- [x] 8. 小红书模板 → 升级为「有设计感」交付:美化片段 xhs-cards.css(仅作用 cssclasses:[xhs])+ 套路速查 + 4 套风格模板(杂志卡片/手账可爱/极简冷淡/仪表盘卡片),放 Personal-KB/templates/小红书模板/ ✅ 用户验收通过

## 已完成(本轮之前)
- [x] 「今日工作」编辑框宽度随窗口缩放、无上限、两端留舒服边距(globals.css)
- [x] 修复 dev 模式加载旧 dist 的根因:main.ts 改用 ELECTRON_RENDERER_URL

## 错误记录
| 错误 | 尝试 | 解决 |
|------|------|------|
| `npm run dev` 改源码不生效 | 重启 dev、排查单实例锁 | 根因是 main.ts 检查了错误的环境变量名(VITE_DEV_SERVER_URL),electron-vite 用的是 ELECTRON_RENDERER_URL |
| taskkill /F 被当成路径 F:/ | MSYS 路径转换 | 用 `//F //IM` 双斜杠 |
