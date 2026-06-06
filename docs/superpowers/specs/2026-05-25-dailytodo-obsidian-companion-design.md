# DailyTodo Obsidian Companion Design

## Goal

DailyTodo should become a standalone desktop companion for Obsidian that can be installed and used without Codex, ChatGPT, or any other AI application.

The app should let users capture daily tasks, work notes, and inspiration, then organize those records into their own Obsidian vault through configurable rules and templates. AI can be added later as an optional enhancement, but the core product must work fully offline with deterministic local logic.

## Product Direction

DailyTodo should evolve from a personal todo window into a configurable Obsidian capture and publishing tool:

- Capture tasks, work notes, inspiration, and imported mobile records.
- Store records locally first so no data is lost when Obsidian sync fails.
- Match records against user-defined rules.
- Render Markdown with user-defined templates.
- Write the result into a selected Obsidian vault.
- Show what will be changed before writing when the user wants review.

The app should support both approachable graphical configuration and advanced JSON or YAML editing. This keeps the default experience friendly while still giving Obsidian power users enough control to fit their own vault structure.

## Non-Goals

- Do not require any AI service to run the app.
- Do not require a hosted backend for the first version.
- Do not hardcode personal machine paths, vault paths, or folder names.
- Do not attempt to replace Obsidian. DailyTodo should remain a fast capture and organization layer.
- Do not build a native mobile app in the first version. Mobile capture should start with a synced folder inbox.

## Selected Approach

Use a local-first architecture with three configurable layers:

1. Capture items
2. Organization rules
3. Markdown templates

Every input becomes a capture item. Rules decide where each item should be written. Templates decide how each item becomes Markdown.

The app ships with useful presets, but users can customize the details.

## First-Run Experience

On first launch, DailyTodo shows an onboarding flow:

1. Choose an Obsidian vault folder.
2. Choose a default workflow preset.
3. Choose whether to enable mobile inbox import.
4. Confirm the default output locations.

Suggested presets:

- Minimal Daily Notes
- PARA
- Inbox First
- Task Review
- Blog Drafts

The user can skip advanced setup and start with defaults. All choices can be changed later in settings.

## Data Model

DailyTodo should normalize all captured material into a shared capture item shape.

```ts
type CaptureItem = {
  id: string;
  type: 'task' | 'inspiration' | 'work' | 'note';
  content: string;
  tags: string[];
  priority?: 'high' | 'medium' | 'low';
  source: 'desktop' | 'mobile-inbox' | 'clipboard';
  status: 'new' | 'synced' | 'archived' | 'error';
  createdAt: string;
  updatedAt?: string;
  syncedAt?: string;
};
```

Existing task data can remain compatible, but the sync layer should consume normalized capture items so future sources do not need custom Obsidian export code.

## Rule System

Rules define when an item should be written and where it should go.

Graphical mode should expose common fields:

- Item type
- Tags include any or all
- Content contains keywords
- Priority
- Source
- Target file path
- Target section
- Template
- Rule priority
- Enabled state

Advanced mode should expose the same rule as JSON or YAML.

Example:

```json
{
  "name": "Inspiration goes to daily note",
  "enabled": true,
  "priority": 10,
  "when": {
    "type": "inspiration",
    "tagsAny": ["idea"]
  },
  "write": {
    "target": "logs/daily/{{date}}.md",
    "section": "## Inspiration",
    "template": "- {{time}} {{content}} {{tags}}"
  }
}
```

Rule matching should be deterministic:

- Disabled rules are ignored.
- Higher-priority rules run first.
- A rule can either continue matching or stop further processing.
- Invalid rules are not executed and should show a clear validation error.

## Template System

Templates define how records become Markdown.

Supported variables for the first version:

- `{{date}}`
- `{{time}}`
- `{{content}}`
- `{{tags}}`
- `{{priority}}`
- `{{source}}`
- `{{status}}`
- `{{createdAt}}`

Templates should be editable through a simple text editor. The app should include a preview panel that renders the selected capture item through the current template.

Template packs should be stored locally and copied into user configuration when selected, so users can safely edit their own version without changing app defaults.

## Obsidian Writing

The app writes Markdown files directly into the selected vault.

Writing behavior:

- Create missing folders.
- Create missing files.
- Find the configured section heading.
- Insert the rendered Markdown below that section.
- If the section is missing, append it to the file.
- Preserve content outside DailyTodo-managed sections.

For managed blocks, DailyTodo should use stable comments only where replacement is required:

```md
<!-- DAILYTODO:START rule-id -->
...
<!-- DAILYTODO:END rule-id -->
```

Append-only sections should avoid replacing user-written content unless the rule explicitly uses managed block mode.

## Sync Preview

Before writing, users should be able to preview planned changes:

- Files to be created
- Files to be updated
- Sections to be created
- Markdown lines to be inserted or replaced
- Items that failed rule matching

The preview should be optional. Quick sync can write immediately using the current rules.

## Mobile Inbox

Mobile capture should use a synced folder inbox in the first version.

The user chooses a folder such as:

```text
MobileInbox/
```

DailyTodo watches or periodically scans the folder for supported files:

- `.md`
- `.txt`
- `.json`

Imported files become capture items with `source: "mobile-inbox"`. After successful import, files move to:

```text
MobileInbox/_processed/
```

Files that cannot be parsed move to:

```text
MobileInbox/_failed/
```

This allows users to pair DailyTodo with iCloud Drive, OneDrive, Dropbox, Syncthing, or another file sync tool without requiring DailyTodo to operate a backend.

## Settings

Settings should include:

- Obsidian vault path
- Local data path, defaulting to the app data directory
- Mobile inbox path
- Rule list
- Template list
- Default workflow preset
- Sync behavior: manual, on change, or timed interval
- Conflict behavior: preview, append, managed replace

Personal development defaults can exist in development builds, but packaged builds must not rely on machine-specific paths.

## Error Handling

DailyTodo must never lose local records because Obsidian sync fails.

Expected behavior:

- Missing vault: save locally and ask the user to choose a vault.
- Invalid vault path: disable sync and show a clear settings warning.
- Invalid rule: skip the rule and show validation details.
- Template render failure: skip that item and mark it as error.
- File write failure: keep the item unsynced and show retry options.
- Mobile inbox parse failure: move the file to `_failed` and keep an error record.

## Packaging And Distribution

The packaged app should work on a new machine without manual source setup.

Distribution requirements:

- No hardcoded personal paths.
- No dependency on a local repository checkout.
- No dependency on Codex or external AI applications.
- User configuration stored in the OS app data directory.
- Obsidian vault selected through the app UI.
- Sensible defaults available immediately after first launch.

## Testing

Verification should cover:

- First launch without existing config.
- Selecting and changing an Obsidian vault.
- Rule validation in graphical and advanced modes.
- Template rendering with all supported variables.
- Writing to existing files with existing section headings.
- Writing to missing files and folders.
- Sync preview before write.
- Mobile inbox import for `.md`, `.txt`, and `.json`.
- Failed mobile inbox parse flow.
- Packaged app launch without development-only paths.

## Open Decisions

- Whether advanced configuration should use JSON, YAML, or both.
- Whether rules should support multiple output targets in the first version.
- Whether quick sync should be enabled by default or require preview first.
- Whether mobile inbox scans should use file watching, timed polling, or both.
