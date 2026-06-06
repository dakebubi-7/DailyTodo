# DailyTodo Template Adjustment Manual and Cases / 模板调整手册与案例

## 中文

### 1. RC 默认输出

DailyTodo RC 默认只写一个 Obsidian 每日总文件：

`logs/daily/DailyTodo/{{date}}.md`

历史任务导出文件：

`logs/daily/DailyTodo/tasks/{{date}}.md`

RC 默认不再写入这个路径，也不会自动删除已有文件。需要整理时，建议手动移动到 Obsidian 的归档目录，例如：

`logs/daily/DailyTodo/_legacy-task-exports/`

### 2. 可调整字段

模板设置来自 `app/shared/appSettings.ts`：

- `dailyNotePath`：每日总文件路径。
- `workSectionTitle`：今日工作标题。
- `inspirationSectionTitle`：灵感标题。
- `taskSectionTitle`：任务标题。
- `reviewSectionTitle`：复盘标题。
- `tomorrowTaskSectionTitle`：明日待办标题。
- `reusableKnowledgeSectionTitle`：可复用知识标题。
- `taskLineTemplate`：任务行格式。
- `completionReviewTemplate`：完成记录格式。

路径必须相对于 Obsidian vault，不能使用绝对路径，也不能跳出 vault。

### 3. 管理区块规则

不要删除或改名这些 marker，除非你清楚后果：

```md
<!-- DAILYTODO:WORK:START -->
<!-- DAILYTODO:WORK:END -->

<!-- DAILYTODO:INSPIRATION:START -->
<!-- DAILYTODO:INSPIRATION:END -->

<!-- DAILYTODO:TASKS:START -->
<!-- DAILYTODO:TASKS:END -->
```

DailyTodo 依靠这些 marker 替换管理内容。marker 损坏会导致重复区块或无法同步。

### 4. 模板变量

`taskLineTemplate` 支持：

- `{{checked}}`
- `{{text}}`
- `{{priority}}`
- `{{dateNote}}`

`completionReviewTemplate` 支持：

- `{{index}}`
- `{{status}}`
- `{{percent}}`
- `{{reviewedAt}}`
- `{{summary}}`
- `{{unknowns}}`
- `{{nextStep}}`

### 5. 中文示例

```md
任务行：
- [{{checked}}] {{text}} #{{priority}}{{dateNote}}

完成记录：
  - 阶段记录 {{index}}：{{status}}，完成度 {{percent}}%，记录时间 {{reviewedAt}}
    - 今天情况：{{summary}}
    - 还没懂/卡点：{{unknowns}}
    - 下一步：{{nextStep}}
```

### 6. English Example

```md
Task line:
- [{{checked}}] {{text}} #{{priority}}{{dateNote}}

Completion review:
  - Review {{index}}: {{status}}, {{percent}}%, recorded at {{reviewedAt}}
    - Summary: {{summary}}
    - Unknowns / blockers: {{unknowns}}
    - Next step: {{nextStep}}
```

## English

### 1. RC Default Output

DailyTodo RC writes one Obsidian daily note by default:

`logs/daily/DailyTodo/{{date}}.md`

The old task export path is legacy:

`logs/daily/DailyTodo/tasks/{{date}}.md`

The RC no longer writes it by default and never deletes existing files automatically.

### 2. Adjustable Fields

Template settings live in `app/shared/appSettings.ts`. Paths must stay relative to the selected vault.

### 3. Managed Markers

Do not remove or rename the `DAILYTODO:*` markers unless you are intentionally testing recovery behavior. They are how DailyTodo replaces only its own managed content.

### 4. Safe Workflow

1. Back up or duplicate the target daily note.
2. Change one template field.
3. Use Settings > Obsidian Sync > Preview sync.
4. Sync once.
5. Confirm user-owned content outside markers remains untouched.
6. Restore defaults if generated content starts duplicating sections.
