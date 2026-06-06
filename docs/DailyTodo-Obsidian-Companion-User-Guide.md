# DailyTodo Obsidian Companion 使用说明

这份说明给第一次使用 DailyTodo 的人看。DailyTodo 是一个桌面待办和每日记录工具，可以把任务、今日工作、灵感和阶段记录同步到 Obsidian。

## 1. 启动软件

优先使用最新成品目录里的快捷方式：

`G:\Personal-AI\DailyTodo\app\release-companion-2026-05-26\Start DailyTodo Obsidian Companion.lnk`

这个快捷方式会先关闭旧的 DailyTodo 进程，再打开最新版本，避免 Windows/Electron 把旧窗口拉起来。

## 2. 基本概念

- 任务：当天要做的事情。
- 优先级：高、中、低，用来排序和筛选。
- 今日工作：当天的工作记录、推进、阻塞、复盘。
- 灵感闪念：临时想法、问题、素材。
- 阶段记录：一个任务完成或阶段性推进后的复盘记录，会写入 Obsidian。
- Obsidian 同步：把 DailyTodo 本地数据生成 Markdown，写到你的 Obsidian vault。
- Obsidian Companion：高级规则/模板/预览同步面板，可以预览写入哪些文件。

## 3. 第一次设置 Obsidian

1. 打开 DailyTodo。
2. 在顶部 Obsidian 区域点击选择文件夹。
3. 选择你的 Obsidian vault 根目录。
4. 选择后，DailyTodo 会自动把当天记录同步到 vault 里。

默认每日记录路径类似：

`logs/daily/DailyTodo/2026-05-26.md`

## 4. 添加和管理任务

1. 在底部输入框写任务。
2. 选择优先级。
3. 回车或点击添加。
4. 点击任务左侧圆圈可以标记完成。
5. 鼠标悬停任务，可以看到删除、查看记录等按钮。

任务数据保存在 DailyTodo 本地，不是只保存在 Obsidian。Obsidian 文件是同步结果。

## 5. 完成任务和阶段记录

当你点击任务完成时，软件会弹出完成记录窗口。

可以填写：

- 完成情况：全部完成、部分完成、有卡点。
- 完成度：0-100%。
- 今天情况：今天这个任务推进到哪里。
- 还没懂 / 卡点：还有什么问题。
- 下一步：后面怎么继续。

保存后，这条记录会进入任务的阶段记录里，并在下次同步时写入 Obsidian。

## 6. 删除错误的阶段记录

如果 Obsidian 里出现了测试内容，例如：

```md
- 阶段记录 1：全部完成，完成度 100%
  - 今天情况：sad
  - 还没懂/卡点：dadasd
  - 下一步：asdasssdas
```

不要只在 Obsidian 里删。因为这条内容来自 DailyTodo 本地数据，下一次同步可能会再写回来。

正确删除方式：

1. 在 DailyTodo 里找到对应任务。
2. 点击任务右侧的查看记录按钮。
3. 在阶段记录列表里找到错误记录。
4. 点击这条记录右上角的“删除记录”。
5. 等待自动同步，或手动触发 Obsidian 同步。

删除后，DailyTodo 本地数据会更新，Obsidian 下一次同步就不会再生成这条测试记录。

## 7. 追加新的阶段记录

如果一个任务已经有记录，还想再补一条：

1. 点击任务的查看记录按钮。
2. 点击“追加记录”。
3. 记录查看页会关闭，新记录填写框会打开。
4. 填写并保存。

这样一个任务可以有多条阶段记录，适合记录连续推进过程。

## 8. 今日工作和灵感闪念

顶部有两个入口：

- 今日工作：写今天实际做了什么、遇到什么问题。
- 灵感闪念：写临时想法、素材、待研究问题。

这些内容也会随 DailyTodo 同步到 Obsidian。

## 9. Obsidian Companion 面板

打开方式：

1. 点击设置按钮。
2. 点击 `Obsidian Companion`。

Companion 面板可以做这些事：

- 查看或选择 Obsidian vault。
- 编辑同步规则。
- 编辑写入模板。
- 预览本次会写入哪些文件。
- 手动执行 Companion 同步。
- 导入 mobile inbox 文件。

普通使用者可以先不改规则，只使用默认同步。

## 10. Mobile Inbox 导入

如果你有一个手机同步过来的 inbox 文件夹，可以在 Companion 面板里填写路径。

支持导入：

- `.txt`
- `.md`
- `.json`

导入后：

- 成功处理的文件会移动到 `_processed`。
- 失败的文件会移动到 `_failed`。
- 导入的内容会进入 Companion preview/sync 流程。

## 11. 常见问题

### Obsidian 里删了，为什么又出现？

因为那段内容来自 DailyTodo 本地数据。请回到 DailyTodo 里删除对应任务或阶段记录。

### 快捷方式打开的好像是旧版本？

使用这个快捷方式：

`G:\Personal-AI\DailyTodo\app\release-companion-2026-05-26\Start DailyTodo Obsidian Companion.lnk`

它会先关闭旧 DailyTodo，再启动最新版。

### 我可以直接改 `data/config.json` 吗？

不建议。`config.json` 是本地数据文件，手改容易破坏格式。优先在 DailyTodo 软件里删任务、删阶段记录、改内容。

### 同步失败怎么办？

先检查：

1. Obsidian vault 路径是否存在。
2. DailyTodo 是否有写入权限。
3. Obsidian 里的目标文件是否被其他程序锁定。
4. 如果是 Companion 规则，先点 Preview 看错误信息。

## 12. 推荐日常流程

1. 每天打开 DailyTodo。
2. 写下今天的任务。
3. 做完任务后填写阶段记录。
4. 把零散想法写到灵感闪念。
5. 把当天工作写到今日工作。
6. 打开 Obsidian 查看自动生成的每日记录。
7. 如果发现测试记录或错误记录，回 DailyTodo 删除对应阶段记录，而不是只删 Markdown。
