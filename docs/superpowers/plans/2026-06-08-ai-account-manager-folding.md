# 实现计划 · 账号管理弹窗 + 设置页折叠（含 P0 竞态修复）

> 日期：2026-06-08 · 分支：worktree-feat+ai-review
> 对应「改进意见」第 3、4、5(第一步) 点。第 1、2、5(余额) 点不在本次范围。

## 目标
1. **修 P0 竞态 Bug**（第3点）：新增/编辑账号不再丢数据。
2. **账号管理弹窗**（第5点第一步，CC Switch 式）：列表 + 详情左右分栏，每个账号独立设置。
3. **设置页折叠**（第4点）：AI 复盘下的 6 个子区块改为可折叠，默认只展开「账号」。
4. 余额徽章：本次只**预留位置**，不实现查询。

## 设计要点

### A. 把账号操作抽成纯函数（可测试 + 根治竞态的数据层）
新增 `app/shared/aiReview/profileOps.ts`，纯函数、返回新的 `AiReviewSettings`：
- `selectProfile(settings, id)`
- `updateProfile(settings, id, patch)`
- `addProfile(settings, profile)` —— 追加并设为当前
- `duplicateProfile(settings, sourceId, newId, newName)` —— 克隆并设为当前
- `deleteProfile(settings, id, fallback)` —— 删除；删空时用 fallback 兜底；删当前则当前移到第一个

组件只负责「调纯函数 + 持久化」，数据变换不再依赖闭包。

### B. 修竞态（组件持久化层）
当前 `patchSettings` 的 `setSettings(next)` + 异步 `setSettings(saved)` 回写是竞态根源。改为：
```ts
const persist = (updater: (prev: AiReviewSettings) => AiReviewSettings) => {
  setSettings((prev) => {
    const next = updater(prev);
    void window.electronAPI?.aiReview.setSettings(next); // fire-and-forget，不再回写覆盖
    return next;
  });
};
```
- 用**函数式更新**，永远基于最新 state，消除多次在途保存互相覆盖。
- 不再用 IPC 返回值整体覆盖本地 state（store 端仍会 normalize 落盘）。
- StrictMode 下 updater 可能被调两次 → IPC 是幂等 set，无副作用。

### C. 账号管理弹窗 `AiAccountManager`（新组件，复用 `daily-dialog` 遮罩样式）
- 触发：账号区块里「管理」按钮 → `manageOpen`。
- 弹窗内部状态 `editingId`（在弹窗里选中要编辑的账号，默认=当前账号），与全局 `activeProfileId` 解耦。
- **左栏**：账号列表（名称 + 模型；当前账号有标记）。底部 `[+ 新增] [复制当前]`。
- **右栏**：选中账号的完整设置 —— 名称 / 快速预设 / 接口协议 / baseUrl / API Key(password) / 模型 / 超时 / 备注；底部预留「余额：留待第二步」占位行。
- **操作**：`设为当前账号`（setActive）、`删除`（≤1 个时禁用）、`关闭`。
- 预设(PRESETS) 逻辑从主区块移入弹窗右栏。

### D. 主区块「账号」瘦身
折叠区块「账号」（默认展开）只留：
- 启用 AI 复盘（全局开关）
- 当前账号下拉（`selectProfile`） + `[管理]` 按钮
- 当前账号只读摘要（协议 / 模型 / baseUrl 截断）
- 回溯天数（全局，保留在此）

把原来一长串接口字段（协议/baseUrl/key/model/超时/备注）**移进弹窗**。

### E. 折叠组件 `Collapsible`
小组件：标题行（按钮 + ▾/▸）+ 条件渲染 body，套用 `settings-section` 外壳。
包裹这 6 块，默认展开仅「账号」：
`账号(开) / 定时生成 / 复盘段落 / 报告生成 / 报告路径&模板 / 认我的复盘模板`
在 `globals.css` 加少量 `.settings-collapsible-head` 样式（flex、两端对齐、可点）。

### F. i18n（中英各加）
`manage`(管理) `manageTitle`(管理账号) `setActive`(设为当前账号) `accountEdit`(编辑) `close`(关闭) `balancePlaceholder`(余额：稍后支持) `accountListEmpty` 等。

## 文件改动清单
- **新增** `app/shared/aiReview/profileOps.ts` —— 纯函数账号操作
- **新增** `app/scripts/verify-profile-ops.ts` —— 测试（先 RED）
- **改** `app/package.json` —— 加 `verify:profile-ops` 到脚本和 `verify:rc` 链
- **改** `app/src/components/SettingsPanel.tsx` —— persist 重构、Collapsible、账号区块瘦身、接入 AiAccountManager
- **新增** `AiAccountManager`（放在 SettingsPanel.tsx 内或同目录新文件）
- **改** `app/src/i18n.ts` —— 新增文案（中英）
- **改** `app/src/styles/globals.css` —— `.settings-collapsible-head` + 弹窗左右分栏样式

## TDD 顺序
1. **RED**：写 `verify-profile-ops.ts`，覆盖 select / update / add / duplicate / delete（含删当前→当前移位、删空→fallback、删非当前→当前不变、update 不存在 id→不变）。先跑确认失败。
2. **GREEN**：实现 `profileOps.ts` 至测试通过。
3. 接入组件（persist 重构 + 弹窗 + 折叠），`npm run typecheck` 通过。
4. `npm run verify:profile-ops` + `npm run verify:ai-settings` + `typecheck` 全绿。
5. UI 手测（我会列清单，由你 `npm run dev` 实点）：
   - 新增→填A→新增→填B→关弹窗重开，A、B 都在（验证竞态已修）
   - 复制当前→改名/key；删除（剩 1 个时禁用）；设为当前后生成走对账号
   - 各折叠区块开合正常

## 不在本次范围
- 余额查询（第5点第二步）、生成完整性（第1点）、文件识别（第2点）。

## 风险
- 把字段从主区块迁入弹窗后，要确保已存账号在弹窗里正确显示、编辑即时生效。
- 折叠默认态：仅「账号」展开，避免用户找不到原有报告/模板入口（标题保持原名）。
