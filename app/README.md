# Daily Todo

一个精美优雅的每日清单桌面应用，采用温暖纸张质感与现代极简风格的混合设计。

![Daily Todo](https://img.shields.io/badge/Electron-34.2.0-47848F?style=flat-square&logo=electron)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-06B6D4?style=flat-square&logo=tailwind-css)

## 特性

- **精美界面**：温暖纸张质感背景、柔和投影、流畅动画
- **任务管理**：添加、完成、编辑、删除任务
- **优先级支持**：高/中/低三级优先级，用彩色圆点标识
- **分组筛选**：今日/全部/已完成三个视图
- **进度追踪**：实时显示完成进度
- **深色模式**：一键切换深色主题
- **数据持久化**：electron-store 本地存储
- **撒花动画**：完成所有任务时触发庆祝动画

## 技术栈

| 类别 | 技术 |
|------|------|
| 桌面框架 | Electron |
| UI 框架 | React 18 |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 动画 | Framer Motion |
| 数据存储 | electron-store |
| 字体 | Playfair Display + DM Sans |

## 开始使用

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建应用 / Build

```bash
npm run build
```

### Windows RC 打包 / Windows RC Packaging

```powershell
npm.cmd run verify:rc
npm.cmd run electron:build
```

Release artifacts are written to `app/release/`. The NSIS installer is unsigned, so Windows SmartScreen may show a warning on first launch.

RC notes:

- DailyTodo writes one Obsidian daily note by default: `logs/daily/DailyTodo/{{date}}.md`.
- Legacy `logs/daily/DailyTodo/tasks/{{date}}.md` files are not deleted automatically.
- See `../docs/DailyTodo-Developer-Manual-and-Cases.zh-en.md` and `../docs/DailyTodo-Template-Adjustment-Manual-and-Cases.zh-en.md`.

## 快捷键

| 操作 | 快捷键 |
|------|--------|
| 添加任务 | Enter |
| 编辑任务 | 双击任务文字 |
| 取消编辑 | Escape |

## 界面预览

```
┌────────────────────────────────────┐
│  2025年5月19日 星期一    ─  ✕     │
├────────────────────────────────────┤
│  Daily Todo                    🌙  │
│  ████████████░░░░  6/10 完成       │
├────────────────────────────────────┤
│  今日    |    全部    |   已完成    │
├────────────────────────────────────┤
│  ● 完成设计稿审查                  │
│  ✓ 发周报邮件                      │
│  ○ 整理桌面文件                    │
│  ...                               │
├────────────────────────────────────┤
│  [+] 添加新任务...                  │
└────────────────────────────────────┘
```

## 项目结构

```
daily-todo/
├── electron/
│   ├── main.ts           # 主进程
│   └── preload.ts        # 预加载脚本
├── src/
│   ├── App.tsx           # 应用入口
│   ├── main.tsx          # React 入口
│   ├── components/       # UI 组件
│   ├── hooks/           # 自定义 Hooks
│   ├── store/           # 数据存储
│   ├── types/            # TypeScript 类型
│   └── styles/           # 全局样式
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## 许可证

MIT
