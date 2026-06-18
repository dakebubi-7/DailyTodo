# DailyTodo Quick Capture Center Design

Date: 2026-06-17
Status: Approved for first implementation

## Goal

Add a first-version quick capture workflow that lets the user create tasks faster from one line of text. The feature should reduce clicks, keep keyboard flow smooth, and stay reliable by using deterministic rules instead of AI parsing.

## Scope

Included:

- Enhance the existing task add flow with a quick-capture parser.
- Support lightweight inline syntax for priority, source/group, context tags, and simple date words.
- Show a small live preview of the parsed result while typing.
- Create the task with Enter through the existing task creation path.
- Add verification coverage for parser behavior and basic UI structure.

Excluded from v1:

- AI task parsing or automatic multi-task splitting.
- Global system-wide shortcuts.
- Storage schema changes unless an existing field already supports the data.
- Obsidian template or sync format changes.
- Complex recurrence or natural-language date parsing.

## User Experience

The quick capture entry lives where task creation already happens, preferably by enhancing the current add-task input rather than introducing a full command palette. The input remains simple: the user types a sentence and presses Enter.

Example inputs:

- `明天 写周报 !高 #工作`
- `今天 整理 DailyTodo 设置页 !中`
- `周五 20:00 复盘 @AI`

While the user types, a compact preview shows the interpreted fields:

- Task title
- Target day intent
- Priority
- Source/group
- Context tags

If parsing fails partially, task creation still works. Unrecognized text stays in the title. If the parsed title is empty, the app shows an inline error and does not create a blank task.

## Parsing Rules

The first version uses a pure shared parser with no Electron or React dependency.

Supported tokens:

- `!高`, `!中`, `!低` map to high, medium, and low priority.
- `#工作`, `#生活`, or any `#name` token maps to source/group if possible.
- `@AI`, `@Obsidian`, or any `@name` token maps to context tags.
- `今天`, `明天`, `后天`, `周一` through `周日` map to a simple date intent.
- Simple time tokens such as `20:00` and `8点` may be recognized as metadata, but do not need new UI in v1.

Conflict handling:

- Multiple priority tokens: use the last one.
- Multiple source tokens: use the first as source/group; preserve the rest as tags or warnings depending on existing task fields.
- Unknown tokens: leave them in the title.
- Empty title after parsing: return a validation warning.

## Architecture

### Shared Parser

Add a module such as `app/shared/quickCapture.ts` that exports a pure parsing function. It accepts the raw input and returns a structured result containing title, date intent, priority, source/group, tags, time intent, and warnings.

This module should be independently testable with a `tsx` verification script.

### Renderer Integration

Enhance the current task input component rather than adding a separate modal. The renderer calls the parser on input change and displays a small preview. On Enter, it maps the parsed result into the existing task creation function.

The UI should preserve accessibility:

- Keep a clear input label or accessible label.
- Keep keyboard submission predictable.
- Show validation errors near the input.
- Do not rely on hover-only feedback.

### Task Mapping

The v1 implementation should reuse existing task fields. If the model has no dedicated tags or time fields, the parser can expose them for preview while task creation uses only fields the current model already supports.

Date behavior:

- `今天` maps to the current selected date.
- `明天`, `后天`, and weekday tokens map to target date strings where possible.
- If creating into non-current dates is already supported, use it. If not, keep v1 constrained to current-date creation and show the date intent in preview only.

## Error Handling

- Empty input or empty parsed title prevents creation and shows a clear inline message.
- Invalid or unsupported tokens do not block creation.
- Parser errors should be defensive: return warnings rather than throwing for normal user input.
- The existing task creation error handling remains responsible for persistence failures.

## Verification

Add or update verification scripts for:

- Parser cases:
  - `明天 写周报 !高 #工作`
  - `今天 整理 DailyTodo !中`
  - `写点东西 !高 !低`
  - `#工作 !高`
  - `周五 20:00 复盘 @AI`
- UI structure:
  - quick-capture preview exists near the add input
  - empty parsed title has an inline error path
  - existing task list interactions still have their verifier available

Run targeted checks first, then typecheck if practical.

## Implementation Order

1. Add parser verification with expected behavior.
2. Implement the shared parser.
3. Wire parser into the add-task UI with preview and validation.
4. Map parsed priority/source/date intent into existing task creation where supported.
5. Add UI structure verification.
6. Run targeted verification and typecheck.
