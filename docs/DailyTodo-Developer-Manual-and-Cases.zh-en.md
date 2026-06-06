# DailyTodo Developer Manual and Cases / 开发者使用手册与案例

## 中文

### 1. 项目结构

DailyTodo 是 Electron + React + TypeScript 桌面应用。

- `app/electron/main.ts`：Electron 主进程、窗口、托盘、Obsidian 写入。
- `app/electron/preload.ts`：安全暴露给渲染层的 IPC API。
- `app/src/App.tsx`：应用主界面组合。
- `app/src/hooks/useTasks.ts`：任务状态、日期切换、结转、自动同步。
- `app/src/store/taskStore.ts`：渲染层调用主进程的包装。
- `app/src/components/`：标题栏、设置、任务、每日工作弹窗等 UI。
- `app/shared/appSettings.ts`：应用设置和 Obsidian 模板默认值。
- `app/shared/obsidianTemplates.ts`：DailyTodo 每日笔记模板和管理区块替换。
- `app/shared/taskRollover.ts`：业务日期和任务结转规则。

### 2. 本地数据

开发模式下，应用数据目录固定为：

`G:\Personal-AI\DailyTodo\data`

常用存储键：

- `tasks`：任务列表。
- `dailyWorkNotes`：每日工作记录。
- `dailyInspirationNotes`：每日灵感记录。
- `selectedDate`：当前选中的业务日期。
- `appBehaviorSettings`：语言、结转时间、删除同步、锁定窗口等设置。
- `obsidianTemplateSettings`：每日笔记路径和模板标题。

不要直接编辑 `data/config.json`，除非先备份。格式损坏时应用会备份并重建空配置。

### 3. Obsidian 同步边界

RC 版本默认只写一个每日总文件：

`logs/daily/DailyTodo/{{date}}.md`

旧的 `logs/daily/DailyTodo/tasks/{{date}}.md` 是历史任务导出路径，默认不再写入，也不会自动删除。

DailyTodo 只替换以下管理区块：

- `<!-- DAILYTODO:WORK:START -->` 到 `<!-- DAILYTODO:WORK:END -->`
- `<!-- DAILYTODO:INSPIRATION:START -->` 到 `<!-- DAILYTODO:INSPIRATION:END -->`
- `<!-- DAILYTODO:TASKS:START -->` 到 `<!-- DAILYTODO:TASKS:END -->`

区块外内容属于用户，不应被代码覆盖。

### 4. 常用命令

在 `app/` 目录运行：

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run verify:rc
npm.cmd run electron:build
```

如果 PowerShell 阻止 `npm.ps1`，使用 `npm.cmd`。

### 5. 修改案例

#### 案例 A：修改每日笔记标题

修改 `app/shared/appSettings.ts` 中 `createDefaultObsidianTemplateSettings()` 的标题字段，例如 `workSectionTitle`。已有用户设置不会自动被覆盖，用户可在设置中恢复默认模板。

#### 案例 B：检查任务为什么结转

查看 `app/shared/taskRollover.ts` 的 `shouldCarryTaskForward()`：

- 未完成任务会结转。
- 最近一次完成度低于 100% 的任务会结转。
- 100% 完成的任务不结转。
- 直接完成且无复盘的任务不结转。

#### 案例 C：新增设置项

1. 在 `app/shared/appSettings.ts` 扩展类型和默认值。
2. 在 `normalizeAppSettings()` 中提供兼容旧配置的 fallback。
3. 在 `app/src/hooks/useTasks.ts` 或 `App.tsx` 读取和保存。
4. 在 `SettingsPanel.tsx` 增加 UI。
5. 增加验证脚本或更新现有脚本。

## English

### 1. Project Map

DailyTodo is an Electron + React + TypeScript desktop app.

- `app/electron/main.ts`: main process, window, tray, Obsidian writes.
- `app/electron/preload.ts`: safe IPC bridge for the renderer.
- `app/src/App.tsx`: main UI composition.
- `app/src/hooks/useTasks.ts`: task state, business date, carryover, autosync.
- `app/src/store/taskStore.ts`: renderer wrappers for main-process APIs.
- `app/src/components/`: titlebar, settings, tasks, daily editor, dialogs.
- `app/shared/appSettings.ts`: settings and Obsidian template defaults.
- `app/shared/obsidianTemplates.ts`: daily note rendering and managed-block replacement.
- `app/shared/taskRollover.ts`: business-date and carryover helpers.

### 2. Local Data

In development, app data is stored at:

`G:\Personal-AI\DailyTodo\data`

Important keys:

- `tasks`: task list.
- `dailyWorkNotes`: daily work notes.
- `dailyInspirationNotes`: daily inspiration notes.
- `selectedDate`: selected business date.
- `appBehaviorSettings`: language, rollover time, delete sync, window lock.
- `obsidianTemplateSettings`: daily note path and template headings.

Do not edit `data/config.json` without a backup.

### 3. Obsidian Sync Boundary

The RC writes one daily note by default:

`logs/daily/DailyTodo/{{date}}.md`

The old `logs/daily/DailyTodo/tasks/{{date}}.md` path is a legacy task export. It is no longer written by default and is not deleted automatically.

DailyTodo only owns content inside its managed markers. Content outside those markers belongs to the user.

### 4. Common Commands

Run from `app/`:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run verify:rc
npm.cmd run electron:build
```

Use `npm.cmd` if PowerShell blocks `npm.ps1`.

### 5. Development Cases

#### Case A: Change Daily Note Headings

Edit `createDefaultObsidianTemplateSettings()` in `app/shared/appSettings.ts`. Existing saved user settings are not overwritten unless the user restores defaults.

#### Case B: Explain Carryover

Read `shouldCarryTaskForward()` in `app/shared/taskRollover.ts`.

#### Case C: Add a Setting

Update the shared type/defaults, normalize old configs, wire renderer state, add Settings UI, and add or update a verification script.
