# DailyTodo

[English](README.md) · **简体中文**

[![CI](https://github.com/dakebubi-7/DailyTodo/actions/workflows/ci.yml/badge.svg)](https://github.com/dakebubi-7/DailyTodo/actions/workflows/ci.yml)
[![最新版本](https://img.shields.io/github/v/release/dakebubi-7/DailyTodo-backup?display_name=tag&style=flat-square)](https://github.com/dakebubi-7/DailyTodo/releases)
[![许可证](https://img.shields.io/github/license/dakebubi-7/DailyTodo-backup?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-34-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

> 面向 Windows 的桌面效率工作区：把每日任务转化为专注执行、复盘总结和下一步行动。

DailyTodo 将本地任务管理、Obsidian 日记同步、AI 辅助复盘和轻量桌面工作区整合在一起。软件本身支持 **简体中文和 English**，可在 **设置 → 语言** 中切换。

## 为什么做 DailyTodo

很多任务清单只能回答“今天要做什么”。DailyTodo 关注完整闭环：

```text
规划 → 专注 → 完成 → 复盘 → 选择下一步行动
```

核心任务管理以本地为主，不要求用户为了记录基础任务而注册云端账号，同时保留 Obsidian 和 AI 等可选集成能力。

## 主要功能

- **每日执行工作区**：支持优先级、子任务、完成进度、跨日结转和任务来源。
- **AI 辅助复盘**：支持根据配置的 AI 服务生成日报、周报、月报和外部复盘。
- **多账户 AI 设置**：支持新增、复制、删除、切换和测试服务配置，API Key 留在 Electron 主进程处理。
- **Obsidian 集成**：将任务日记和受管理的复盘区块同步到 Obsidian Vault。
- **桌面优先交互**：紧凑窗口模式、透明/玻璃效果、边缘自动隐藏、窗口恢复和隐形专注面板。
- **复盘到专注的交接**：查看复盘结果，编辑 AI 建议的下一步，并明确采纳为当天专注事项。
- **中英双语界面**：在软件设置中切换 `简体中文` 和 `English`。

## 下载和安装

最新版 Windows 安装包位于 [GitHub Releases](https://github.com/dakebubi-7/DailyTodo/releases/latest)。

1. 在最新 Release 的附件中下载 `DailyTodo.exe`。
2. 运行安装程序，需要时选择安装目录。
3. 从开始菜单或桌面快捷方式启动 DailyTodo。

> 当前 Windows 构建尚未进行代码签名，首次启动时 Windows SmartScreen 可能显示警告。安装前请核对 Release 附件和源代码。

## 软件内语言切换

软件已经内置语言设置：

1. 打开 **设置**。
2. 进入 **常规** 区域。
3. 在 **语言** 中选择 **简体中文** 或 **English**。

选择结果会保存到本地应用设置，并应用于主界面、任务列表、复盘面板、设置页面和相关工作流。

## 开发运行

### 环境要求

- Windows 10 或更高版本
- Node.js 20+
- npm
- 用于编译 Windows 原生命中测试辅助模块的 Visual Studio Build Tools

### 安装并启动

```bash
cd app
npm install
npm run dev
```

### 类型检查、测试和构建

```bash
cd app
npm run typecheck
npm test -- --run
npm run build
```

### 构建 Windows 安装包

```powershell
cd app
npm.cmd run electron:build
```

安装包和解压版程序会生成在 `app/release/`。构建产物被 `.gitignore` 排除，避免个人配置、日志和二进制文件进入源码仓库。

## 项目结构

```text
app/electron/   Electron 主进程、IPC、持久化、AI 和集成服务
app/src/        React 渲染进程、Hooks、组件、设置和样式
app/shared/     跨进程类型以及 AI/复盘契约
app/tests/      单元测试、DOM 测试和回归测试
app/scripts/    验证脚本与原生模块构建辅助脚本
app/docs/       产品规格、实现计划和发布说明
```

## 安全和隐私

- API Key 通过 Electron 主进程设置流程处理，渲染进程只接触脱敏后的配置。
- 核心任务管理采用本地优先方式，Obsidian 和 AI 集成均需要用户主动配置。
- 不要提交 API Key、Vault 路径、本地任务数据、`.test-version*` 配置、日志或构建产物。
- 安全问题请按照 [SECURITY.md](app/SECURITY.md) 的方式私下报告。

## 后续计划

- 优化首次启动引导和 AI 服务配置指引。
- 增加更完整的产品截图和短流程演示。
- 继续补充高级集成设置中的双语覆盖。
- 为后续 Windows 版本完善签名和自动更新分发。

## 文档导航

- [English project overview](README.md)
- [发布说明](app/docs/releases/v1.0.0.md)
- [版本记录](app/CHANGELOG.md)
- [贡献指南](app/CONTRIBUTING.md)
- [安全策略](app/SECURITY.md)
- [项目规格](app/SPEC.md)

## 开源许可

本项目使用 [MIT License](LICENSE) 开源。
