# DailyTodo Knowledge Flow Design

## Goal

DailyTodo should help plan today, capture work and inspiration, and save useful material into the personal knowledge base without needing Codex to manually move content.

## Selected Approach

Use a lightweight automated flow with controlled knowledge capture:

- Keep DailyTodo's current daily Obsidian sync as the source of daily history.
- Add compact dropdown inputs for "今日工作" and "灵感闪念" so the app remains usable in a small floating window.
- Generate independent knowledge cards from inspiration and completion reviews when content is meaningful.
- Carry unfinished or partially completed goals from yesterday into today as new tasks marked with their source date.

## UI Design

The top area separates window actions from content actions.

- The title bar contains window-level controls: mode, settings, pin, reset position, hide, close.
- The header contains knowledge actions: vault folder, open daily note, theme, clear completed.
- Header buttons are kept compact and icon-led so they do not crowd the title.

The daily work and inspiration editor becomes a collapsed preview row:

- Collapsed state shows the title, first-line preview, and chevron.
- Empty state shows a short placeholder.
- Clicking expands a textarea for editing.
- The existing auto-save behavior remains unchanged.

## Data Design

Tasks keep existing fields and gain optional inheritance metadata:

- `carriedFromDate`: original task date.
- `carriedFromTaskId`: original task id.

The app also stores a carryover ledger keyed by target date so the same source task is not duplicated for the same day.

Knowledge cards are Markdown files in the selected Obsidian vault under:

`01 每日记录/DailyTodo/knowledge/`

Each card includes frontmatter, source date, content type, tags, and a backlink to the daily note.

## Carryover Rule

When the app starts on a new day or moves to today's date, it checks yesterday's tasks.

Carry over tasks when:

- The task is not completed.
- Or the task has a latest completion review with `percent < 100`.

For each matching task, DailyTodo creates a new task for today:

`原任务文本（继承自 YYYY-MM-DD）`

The yesterday task remains unchanged.

## Error Handling

If no Obsidian vault is configured, the app keeps saving locally and shows the existing "choose folder" state.

If knowledge card generation fails, daily note sync should still continue. Sync status can become error, but task data must not be lost.

## Testing

Verification should cover:

- TypeScript build passes.
- Carryover creates tasks once and preserves yesterday's records.
- Partial completion reviews below 100 percent are carried over.
- Daily work and inspiration can expand/collapse and still save.
- Obsidian sync writes daily notes plus knowledge card files.
