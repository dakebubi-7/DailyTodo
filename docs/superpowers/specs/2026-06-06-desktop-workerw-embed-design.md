# DailyTodo 桌面模式 · WorkerW 壁纸层嵌入设计

- 日期：2026-06-06
- 状态：已与用户确认，待评审
- 范围：`g:/Personal-AI/DailyTodo/app` 的 Electron 主进程 + 渲染层桌面模式

## 背景与问题

DailyTodo 是一个 Electron + React 的桌面待办挂件。当前「桌面模式」用的是「智能置顶轮询」：每 32ms 查一次前台窗口，前台是桌面（WorkerW/Progman）时把窗口 `HWND_TOPMOST` 浮顶，前台是其他应用时 `HWND_BOTTOM` 沉底（见 `electron/main.ts` 的 `applyDesktopTopmost`）。

这套方案本质做不到「固定在桌面上」，存在两个用户痛点：

1. **Win+D 会把窗口收走/盖住**，只能从托盘「打开 DailyTodo」手动恢复。
2. 点桌面时窗口会错误地浮到其他应用之上（用户已明确此问题不在本次范围）。

用户的目标是「像滴答清单那样真正固定在桌面上」：Win+D 收不走、永不盖住其他应用，成为桌面的一部分。

## 目标

- 桌面模式下窗口真正嵌入壁纸层（WorkerW），固定在桌面上。
- Win+D 无法隐藏它；它永远在桌面图标层与所有应用之下/之间，不盖任何应用。
- 仍可交互（勾选任务、加任务、拖拽），通过「双击浮起编辑 → 失焦自动嵌回」实现。
- 嵌入失败时自动回退到现有的智能置顶轮询，**绝不让主进程崩溃**。

## 非目标

- 不修复「点桌面浮到其他应用之上」问题（用户排除）。
- embedded 态下不支持直接拖拽窗口（要挪位置先浮起）。
- 不改 `normal` / `onTop` 两种模式的现有行为。

## 关键约束：原生崩溃历史

`electron/main.ts` 多处注释记录：对透明无边框窗口调用 `SetParent` / `SetWindowLongPtr`（尤其在 blur「点击桌面」瞬间重设原生窗口标志）会导致**主进程原生崩溃**——无 JS 异常、无 minidump、进程直接消失，已由 diag.log 确认。当前轮询方案正是为躲此崩溃才只用纯 Z 序 `SetWindowPos`。

本设计采用 `SetParent`，因此所有实现必须遵守：

- `SetParent` 只在「进 / 出 embedded」时各调用一次；**绝不在 blur/focus/minimize 等高频窗口事件里调用**。
- 所有原生调用包 `try/catch`，任一步抛错 → 记 diag → 自动回退到智能置顶轮询。
- 发壁纸层创建消息用带超时的 `SendMessageTimeoutW`，不用阻塞版。
- 嵌入前检测 `win32` 绑定成功 + WorkerW 已找到，否则直接回退，不强行 `SetParent`。

## 架构总览

对外的窗口模式枚举 `WindowMode = 'normal' | 'onTop' | 'desktop'` **保持不变**。`desktop` 模式内部新增两个子状态，作为实现细节，不污染对外枚举，也不需要改动 `shared/windowMode.ts` 的纯函数与其测试。

### desktop 子状态机

- **embedded（嵌入态）**：窗口已 `SetParent` 到 WorkerW，固定在壁纸层。只看不点，Win+D 收不走、不盖应用。进入 desktop 模式后的默认态。
- **floating（浮起态）**：`SetParent(NULL)` 脱离桌面，变回普通顶层可交互窗口，用于勾选/加任务/拖拽。

切换触发：

| 事件 | 当前子态 | 目标子态 |
|---|---|---|
| 进入 desktop 模式 | — | embedded |
| 双击挂件空白区 | embedded | floating |
| 窗口失焦 (blur) | floating | embedded |
| 退出 desktop 模式（托盘取消 / 图钉） | 任意 | 先脱离嵌入，再到 normal/onTop |

子状态切换逻辑抽成纯函数（输入：当前子态 + 事件，输出：目标子态），配 `.verify.ts` 单测。

## 原生嵌入机制

### 定位 WorkerW

Win10/11 桌面结构：`Progman`（桌面根）下藏一个承载壁纸的 `WorkerW`，桌面图标在 `SHELLDLL_DefView` 上。标准流程：

1. 给 `Progman` 发 `0x052C` 消息（`SendMessageTimeoutW`，带超时），强制系统创建承载壁纸的 `WorkerW`。
2. `EnumWindows` 枚举顶层窗口，找到那个含 `SHELLDLL_DefView` 子窗口的窗口的**兄弟** `WorkerW`（即真正承载壁纸的那个）。

### 新增 koffi 绑定（均在已 load 的 user32.dll）

- `SendMessageTimeoutW` — 发 0x052C，带超时。
- `EnumWindows` + `FindWindowExW` — 枚举定位 WorkerW。
- `SetParent` — 嵌入 / 脱离。

（已有：`GetWindowLongPtrW` / `SetWindowLongPtrW` / `SetWindowPos` / `GetForegroundWindow` / `GetClassNameW`。）

### 嵌入（进 embedded）

1. 确保 WorkerW 已存在（发 0x052C）；找不到 → 回退。
2. 记录当前屏幕绝对坐标 `(x, y, w, h)`。
3. `SetParent(ourHwnd, workerW)`。
4. `SetWindowPos` 把窗口摆到记录坐标（SetParent 后坐标变为相对父窗口，必要时减去 WorkerW 屏幕原点换算）。
5. 停止智能置顶轮询（嵌入态不需要）。

### 脱离（进 floating / 退出 desktop）

1. `SetParent(ourHwnd, NULL)` 变回顶层窗口。
2. `SetWindowPos` 用记录的屏幕绝对坐标摆回，位置与嵌入时一致、不跳。

### 回退路径

任一原生步骤抛错或前置检测失败（无 win32 绑定 / 找不到 WorkerW）：记 diag 日志 → 启用现有的 `startDesktopGuard` 智能置顶轮询，作为 desktop 模式的降级实现。用户体验退化为「当前行为」，但不崩溃。

## 坐标与拖拽

- **进 embedded 前**记录屏幕绝对坐标（复用现有 `WINDOW_STATE_KEY` 持久化）。
- **embedded 后**用 `SetWindowPos` 显式摆位，处理多显示器/DPI 缩放下相对父窗口的坐标换算。
- **floating 浮起**用记录的绝对坐标摆回，与嵌入位置一致。
- **拖拽**：embedded 态不可拖（只看不点）。要挪位置先双击浮起，floating 态用现有标题栏 `WebkitAppRegion: 'drag'` 拖拽；新位置在嵌回时记录并持久化，下次启动还原。

## UI 改动

- **进 floating（编辑）**：embedded 态下双击挂件任意空白区 → 渲染层通过 IPC 通知主进程切到 floating。新增一个 IPC 通道（如 `window:desktopFloat`）。
- **回 embedded**：floating 态窗口失焦（blur）自动嵌回，无需手动按钮。
- **视觉**：embedded 与 floating **长得完全一样**，区别仅在能否点击。不去标题栏、不改透明度。
- **标题栏图钉 / 托盘**：保持现有语义。托盘「钉在桌面（组件模式）」勾选 = 进 desktop（embedded）；取消 = 回 normal。图钉在 desktop 时点击 = 退出到 onTop（沿用 `togglePinnedMode`）。

## 错误处理

- 所有原生调用 `try/catch`，失败 → diag 日志 + 回退到轮询。
- `SetParent` 仅在子状态切换时调用，不在高频窗口事件里调用。
- WorkerW 定位用带超时消息，避免主进程卡死。
- floating → embedded 的嵌回若失败，保持 floating（顶层可交互），不卡在不可用状态。

## 测试

- `shared/windowMode.ts` 纯函数不变，现有 `windowMode.verify.ts` 继续通过。
- 新增 desktop 子状态切换纯函数 + `.verify.ts` 单测（current 子态 + event → next 子态）。
- 原生 WorkerW 嵌入无法单测（依赖真实 Windows 桌面），靠 diag 打点 + 手动验收。
- 进 / 出 embedded、回退路径均加 diag 日志。

### 手动验收清单

1. 进桌面模式 → 窗口固定在桌面上。
2. Win+D → 窗口不消失、不被收走。
3. 打开全屏应用 → 窗口不被盖、也不浮到应用上。
4. 双击挂件 → 浮起，可勾选任务、加任务。
5. 点到别的窗口（失焦）→ 自动嵌回桌面。
6. 浮起拖拽挪位 → 嵌回后位置正确，重启后还原。
7. 模拟 WorkerW 找不到 → 回退到轮询模式，进程不崩溃。

## 受影响文件（预估）

- `electron/main.ts` — 新增 koffi 绑定、WorkerW 定位、SetParent 嵌入/脱离、子状态机接入、IPC 通道、回退逻辑。
- 新增 `shared/desktopSubmode.ts`（或类似）— desktop 子状态切换纯函数。
- 新增 `electron/desktopSubmode.verify.ts` — 子状态单测。
- `src/`（渲染层）— embedded 态双击浮起的监听 + IPC 调用；preload 暴露新通道。
- `electron/preload`（preload.ts 或等价）— 暴露 `window:desktopFloat` 等新 IPC。
