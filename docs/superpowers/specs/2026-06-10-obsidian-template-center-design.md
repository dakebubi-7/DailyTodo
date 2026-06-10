# Obsidian 模板中心设计

## 背景

当前 DailyTodo 的 Obsidian 每日记录模板主要由 `ObsidianTemplateSettings` 和 `buildDailyNoteContent()` 控制。设置页直接暴露路径、标题、任务行模板、复盘记录模板等字段，适合懂模板变量的用户，但普通用户需要理解 `{{text}}`、`{{priority}}`、marker 块等内部规则，使用门槛偏高。

本设计把 Obsidian 模板设置改成“模板中心”：普通用户通过预设、模块开关、标题编辑和 AI 导入完成配置；原始模板字段保留在高级设置里。

## 目标

- 用户不需要理解模板变量，也能调整每日记录输出格式。
- 支持三类入口：选择预设、开关模块、AI 识别导入 Obsidian 模板。
- AI 识别结果先进入可编辑预览，用户确认后才应用到设置。
- 保留现有配置兼容性，避免破坏已有用户的 Obsidian 同步。
- 第一版保持范围克制，优先解决“好用”和“看得懂”。

## 非目标

- 第一版不做模板市场。
- 第一版不做任意自定义模块渲染器。
- 第一版不做复杂拖拽排序；AI 导入可以给出推荐顺序，但设置页先使用固定顺序。
- 第一版不把用户模板直接原样写成 DailyTodo 管理模板，避免破坏同步 marker 和 AI 复盘补偿逻辑。

## 用户体验

### 设置入口

在设置页的 Obsidian 区域中，把现有模板字段收拢为“模板中心”。主界面显示四块内容：

1. 每日记录位置
2. 模板风格
3. 记录模块
4. AI 识别模板

原始模板字段放进折叠的“高级模板设置”。

### 每日记录位置

主界面只显示每日记录路径，例如：

```text
logs/daily/DailyTodo/{{date}}.md
```

说明文字保持简短，只告诉用户 `{{date}}` 会替换为日期。旧的 `taskExportPath` 放进高级设置。

### 模板风格

提供三个预设：

- 简洁日记：今日工作、每日任务、复盘。
- 工作复盘：今日工作、每日任务、完成记录、明日待办。
- 知识沉淀：灵感闪念、复盘、可复用知识更突出。

选择预设会更新模块启用状态、标题和底层模板字段。用户后续手动修改后，模式进入自定义。

### 记录模块

固定展示这些模块开关和标题输入：

- 今日工作
- 灵感闪念
- 每日任务
- AI 复盘
- 明日待办
- 可复用知识

每个模块支持：

- 开启或关闭。
- 修改标题。

关闭模块后，新生成的每日记录不再输出该模块。对于已有文件，同步仍只替换 DailyTodo 管理的 marker 块；AI 复盘相关 marker 不主动删除已有用户内容。

### AI 识别模板

增加“导入 Obsidian 模板”入口，支持：

- 粘贴 Markdown 模板。
- 选择 `.md` 文件。
- 点击“AI 识别”。

识别完成后显示草稿预览：

- 识别到的模块。
- 每个模块映射到 DailyTodo 的哪个模块。
- 推荐标题。
- 推荐每日记录路径，如果模板中能识别到路径规律。
- 无法可靠映射的内容，显示为“未识别内容”，不自动写入 DailyTodo 管理区。

用户点击“应用到设置”后，草稿才保存为正式设置。

### 高级模板设置

高级区保留当前能力：

- `taskLineTemplate`
- `completionReviewTemplate`
- `taskExportPath`
- 各 section title 的底层字段

高级区默认折叠，并带有轻量提示：普通用户不需要修改这里。

## 数据结构

继续保留现有 `ObsidianTemplateSettings` 字段，新增更高层的用户友好配置。建议扩展为：

```ts
export type ObsidianTemplatePresetId = 'simple' | 'work-review' | 'knowledge' | 'custom';

export type ObsidianTemplateModuleId =
  | 'work'
  | 'inspiration'
  | 'tasks'
  | 'review'
  | 'tomorrow'
  | 'knowledge';

export interface ObsidianTemplateModuleSettings {
  enabled: boolean;
  title: string;
}

export interface ObsidianTemplateSettings {
  dailyNotePath: string;
  taskExportPath: string;
  workSectionTitle: string;
  inspirationSectionTitle: string;
  taskSectionTitle: string;
  reviewSectionTitle: string;
  tomorrowTaskSectionTitle: string;
  reusableKnowledgeSectionTitle: string;
  taskLineTemplate: string;
  completionReviewTemplate: string;
  presetId: ObsidianTemplatePresetId;
  modules: Record<ObsidianTemplateModuleId, ObsidianTemplateModuleSettings>;
}
```

兼容策略：

- 旧配置没有 `presetId` 和 `modules` 时，归一化为默认预设。
- 旧的 section title 字段仍然是渲染来源之一。
- `modules.*.title` 与旧标题字段保持同步，避免两套标题互相漂移。
- 保存设置时保留旧字段，保证现有同步逻辑和旧版本配置仍可读。

## 渲染规则

`buildDailyNoteContent()` 改为根据模块开关组装每日记录：

- `work.enabled` 控制今日工作块。
- `inspiration.enabled` 控制灵感闪念块。
- `tasks.enabled` 控制每日任务块。
- `review.enabled` 控制 AI 复盘 marker。
- `tomorrow.enabled` 控制明日待办 marker。
- `knowledge.enabled` 控制可复用知识 marker。

DailyTodo 托管内容仍使用 marker 包裹，避免更新已有笔记时误删用户手写内容。AI 复盘 marker 的标题保持在 marker 外，延续现有补偿扫描行为。

`buildSyncPreview()` 需要按模块启用状态生成预览。关闭的 managed block 不计入待替换块。

## AI 识别设计

新增主进程能力，风格参考现有 AI 复盘模板识别：

```ts
obsidianTemplate:recognize
obsidianTemplate:pickTemplateFile
```

识别输入：

```ts
interface RecognizeObsidianTemplateInput {
  rawTemplate: string;
}
```

识别输出：

```ts
interface RecognizedObsidianTemplateDraft {
  presetId: ObsidianTemplatePresetId;
  dailyNotePath?: string;
  modules: Record<ObsidianTemplateModuleId, ObsidianTemplateModuleSettings>;
  taskLineTemplate?: string;
  completionReviewTemplate?: string;
  unmappedSections: Array<{
    title: string;
    reason: string;
    excerpt: string;
  }>;
  notes: string[];
}
```

AI 识别原则：

- 用结构化输出返回草稿，不直接返回散文让前端解析。
- 优先识别标题和模块用途，而不是照抄用户模板。
- 不确定的内容放进 `unmappedSections`，由用户决定是否手动处理。
- 用户输入模板过长时不静默截断，应提示无法处理或要求缩短。
- 如果模板中包含 DailyTodo marker，应优先尊重已有 marker 语义。

如果新增 Claude API 调用，TypeScript 侧使用官方 Anthropic SDK，默认模型使用 `claude-opus-4-8`，复杂识别请求使用 adaptive thinking 和结构化输出。

## 组件与数据流

### Renderer

`SettingsPanel` 拆出或内联新增这些小组件：

- `ObsidianTemplateCenter`
- `TemplatePresetPicker`
- `TemplateModuleList`
- `ObsidianTemplateImportDialog`
- `AdvancedTemplateSettings`

数据流：

1. `App` 读取 `obsidianTemplates`。
2. `SettingsPanel` 展示模板中心。
3. 用户修改预设或模块后，生成新的 `ObsidianTemplateSettings`。
4. 调用现有 `setObsidianTemplateSettings()` 保存。
5. AI 导入只生成草稿；点击应用后才调用保存。

### Electron preload

扩展 `window.dailyTodo` 类型和 preload 暴露：

- `recognizeObsidianTemplate(rawTemplate)`
- `pickObsidianTemplateFile()`

### Main process

新增 IPC handler：

- 读取文件内容。
- 调用 AI 识别服务。
- 返回结构化草稿。
- 对输入大小做明确限制和错误提示。

## 错误处理

- 未配置 AI 服务：提示用户先配置 AI 复盘相关服务。
- 模板为空：禁用识别按钮或提示粘贴模板。
- 文件读取失败：显示简短错误，不改变现有设置。
- AI 识别失败：保留用户输入，允许重试。
- AI 返回无可用模块：显示无法识别，并建议使用预设。
- 应用草稿前不覆盖设置；只有用户点击应用才保存。

## 测试与验证

需要覆盖：

- 旧 `ObsidianTemplateSettings` 归一化后仍可用。
- 预设能生成预期模块和标题。
- 模块关闭后，新的每日记录不输出对应模块。
- 同步预览只显示启用模块的 managed blocks。
- AI 识别草稿能被转换成正式设置。
- 无法映射的模板片段不会被静默丢失。
- 设置页主流程可手动验证：选择预设、关闭模块、改标题、导入模板、预览、应用、重置。

项目现有验证方式优先使用 `tsx` verify scripts，并按需要补一个模板中心相关验证脚本。

## 第一版交付范围

第一版实现：

- 模板中心 UI。
- 三个预设。
- 六个模块的开关和标题编辑。
- AI 模板粘贴识别。
- `.md` 文件选择识别。
- 识别草稿预览和应用。
- 高级设置折叠保留。
- 兼容旧配置。

第一版不实现：

- 拖拽排序。
- 模板市场。
- 任意自定义模块渲染。
- 自动把未识别内容写入每日记录。
