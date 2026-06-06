# 三模式窗口 + occlusion 静默消失修复 — 设计

日期：2026-06-04
状态：已实现（待用户实机验证）

## 背景与根因

DailyTodo 是一个 `transparent: true` + `frame: false` + `skipTaskbar: true` 的 Electron 桌面挂件。

用户报告的 bug：Win+D 后从托盘点出窗口，再点击桌面其他地方，窗口又「消失」；点击别的软件后窗口恢复且之后稳定；点电量/Windows Ink 等会弹出系统浮窗的操作能让窗口立刻「弹回来」。

### 排查结论（systematic-debugging Phase 1）

- 主进程 `blur` 事件只记日志，**没有任何 `hide()`**（`electron/main.ts`）。
- 渲染层只有标题栏按钮主动调 `minimize()`（即 `hide()`），**无失焦自动隐藏**。
- 窗口透明无边框，且全项目**没有任何关闭 Chromium 遮挡计算 / 背景节流**的代码；Electron 34，`CalculateNativeWinOcclusion` 在 Windows 默认开启。

→ 「消失」不是真的隐藏，而是 **Chromium 原生窗口遮挡计算 (NativeWinOcclusion)** 在 Win+D / 点桌面（桌面 Progman 成为前台）时把这个透明窗口判定为「被遮挡」，暂停合成 → 窗口空白。系统浮窗 / 切到别的 app 触发重新计算遮挡 → 恢复。此假说命中用户描述的全部现象。

### 历史教训（来自代码注释 + 旧 diag.log）

- 曾加 `WS_EX_TOOLWINDOW` → 同样的失焦静默消失，已移除。
- 曾试「挂桌面属主」(SetParent) → 旧 diag.log 有 `exitCode=-1073741510`（0xC0000005 访问违例）主进程原生崩溃。
- 结论：**任何在事件回调里反复重设原生窗口标志的方案都高危**，设计上回避。

## 需求

用户要三种**互斥**窗口模式，可切换：

| 模式 | 入口 | 行为 |
|------|------|------|
| 普通 normal | 应用内图钉 | 普通 Z 序，可被盖住 |
| 置顶 onTop | 应用内图钉 | alwaysOnTop，压最前 |
| 桌面组件 desktop | 托盘菜单 | 免疫 Win+D、贴桌面、**仍可点击/拖动** |

「桌面组件」= 网上常见的可交互桌面小组件（能点能拖、一直在桌面），**不是**真壁纸层（真壁纸层沉到桌面图标下面会点不动，与需求冲突）。

## 设计

### 1. 状态模型（`shared/windowMode.ts`，纯函数，可单测）

- `WindowMode = 'normal' | 'onTop' | 'desktop'`。
- 存储键 `windowMode`；启动时 `resolveWindowMode` 从旧布尔 `alwaysOnTop` 迁移（`true→onTop`，`false→normal`），老用户无感。默认 `onTop`。
- `isAlwaysOnTop(mode)`：仅 `onTop` 为真。
- `needsDesktopGuard(mode)`：仅 `desktop` 为真。
- `togglePinnedMode(current)`：图钉切换，`onTop↔normal`，`desktop→onTop`（退出桌面）。
- `setDesktopMode(current, checked)`：托盘勾选，`checked→desktop`（强制退出置顶，保证互斥）；取消 → `desktop` 回 `normal`，其余不变。

### 2. 全局修复 occlusion（治本，所有模式受益）

- `app` ready 前：`app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')`。
- `webPreferences.backgroundThrottling: false`。

### 3. 桌面组件模式的 Win+D 守卫（方案 A，零原生风险）

- 主进程维护进程内 `windowMode` 变量（`applyWindowMode` 更新）。
- 监听窗口 `minimize` 事件：仅当 `needsDesktopGuard(windowMode)` 且非退出中 → `win.showInactive()` 弹回桌面、不抢焦点。
- 干净隔离：用户主动隐藏走 `hide()`（触发 `hide` 事件，非 `minimize`），不被守卫弹回；只有 Win+D/系统最小化触发 `minimize`。
- `showInactive` 不再触发 `minimize`，无循环；**绝不在 `blur` 里碰原生标志**。

### 4. IPC 与 UI

- 新接口：`window:getWindowMode` / `window:setWindowMode(mode)`；主进程 `setWindowMode` 持久化 + 应用 + `webContents.send('window:modeChanged', mode)` + 刷新托盘菜单勾选。
- 兼容垫片：`window:getAlwaysOnTop`（返回 `mode==='onTop'`）、`window:toggleAlwaysOnTop`（`togglePinnedMode`），保留旧调用点不破。
- preload 暴露 `getWindowMode` / `setWindowMode` / `onWindowModeChanged`。
- 标题栏图钉：反映 `mode==='onTop'`，点击走 `toggleAlwaysOnTop`；订阅 `onWindowModeChanged` 让托盘改模式时图钉同步熄灭/点亮。
- 托盘：新增 `钉在桌面（组件模式）` checkbox 项，`checked = windowMode==='desktop'`，点击走 `setDesktopMode`。

### 5. 互斥规则

| 当前 → 操作 | normal | onTop | desktop |
|---|---|---|---|
| 点图钉 | →onTop | →normal | →onTop |
| 托盘勾「钉桌面」 | →desktop | →desktop | →desktop |
| 托盘取消「钉桌面」 | (不变) | (不变) | →normal |

### 6. 错误处理 & 测试

- 所有窗口调用 `try/catch` + `diag()`；occlusion 开关失败无害。
- 纯逻辑单测：`electron/windowMode.verify.ts`（`npm run verify:window-mode`），覆盖迁移、互斥、守卫判定。
- 手动验证矩阵：三模式 × {Win+D、点桌面、点别的 app、电量浮窗}。

## 涉及文件

- 新增 `shared/windowMode.ts`、`electron/windowMode.verify.ts`
- 改 `electron/main.ts`、`electron/preload.ts`、`src/components/TitleBar.tsx`、`src/vite-env.d.ts`、`package.json`（verify 脚本）

## 不做（YAGNI）

- 不做真壁纸层 SetParent（高危且破坏交互）。
- 不在设置面板加模式选择（图钉 + 托盘已覆盖）。
