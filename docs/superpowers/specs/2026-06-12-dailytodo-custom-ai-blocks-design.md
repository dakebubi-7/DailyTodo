# DailyTodo Custom AI Blocks Design

## Goal

DailyTodo should support any number of user-added AI daily-note blocks without marker collisions, and each block's selected output style (`text`, `list`, `table`, `callout`, `dataview`) should affect the Markdown written to Obsidian.

Users should not need to understand prompts or marker internals. A user can add a block, name it, optionally choose an output style, optionally write a generation prompt, and DailyTodo will manage the correct Obsidian block independently.

## Current Problem

Daily AI review generation currently relies on three fixed markers:

```md
<!-- DAILYTODO:REVIEW:START -->
<!-- DAILYTODO:REVIEW:END -->

<!-- DAILYTODO:TOMORROW:START -->
<!-- DAILYTODO:TOMORROW:END -->

<!-- DAILYTODO:KNOWLEDGE:START -->
<!-- DAILYTODO:KNOWLEDGE:END -->
```

Custom blocks are inferred into one of those three marker keys by title keywords. If a user creates multiple AI blocks that map to the same marker, they collide. One block can overwrite or skip another, and DailyTodo cannot independently update each custom topic.

The template editor already stores `CustomBlock.renderType`, but daily AI generation does not pass that value into the prompt or validate/format output from it. This is why choosing pure text/table/callout/dataview in the UI does not visibly change the generated Obsidian content.

## Design Summary

1. Keep old fixed markers working for backward compatibility.
2. Add unique custom markers for user-defined daily AI blocks:

```md
<!-- DAILYTODO:CUSTOM:<blockId>:START -->
<!-- DAILYTODO:CUSTOM:<blockId>:END -->
```

3. Daily template rendering should emit unique custom markers for all AI custom blocks.
4. Daily AI generation should generate each custom AI block independently using that block's:
   - `id`
   - `name`
   - `prompt`
   - `renderType`
5. If `prompt` is blank, DailyTodo supplies a default prompt based on the block name.
6. The output-style selector should be honored by adding render-type-specific instructions to the model prompt.
7. Duplicate-heading stripping should derive the outer heading before each marker, so it works for arbitrary custom topic names.

## Backward Compatibility

Existing daily notes with old markers remain supported. DailyTodo does not actively migrate old notes.

Compatibility behavior:

- If a note has the new unique marker for a custom block, use it.
- If a note does not have the new marker but has an old marker for the matching default-style block, old generation can still use the existing fixed marker path.
- New templates and newly rendered custom AI blocks should use unique custom markers.
- Old `REVIEW`, `TOMORROW`, and `KNOWLEDGE` markers should remain valid so historical notes are not broken.

This avoids destructive changes to existing Obsidian files while making new user-defined blocks safe.

## Marker Model

Add marker helpers rather than hard-coding every marker in one fixed object.

Conceptual API:

```ts
customBlockMarker(blockId: string): BlockMarker
```

returns:

```ts
{
  start: `<!-- DAILYTODO:CUSTOM:${safeBlockId}:START -->`,
  end: `<!-- DAILYTODO:CUSTOM:${safeBlockId}:END -->`,
}
```

`safeBlockId` should be sanitized to avoid invalid marker text. Existing UUID-like IDs should work unchanged. If an id contains unsupported characters, normalize to letters, numbers, `_`, or `-`.

## Template Rendering

When rendering daily templates:

```md
## 项目进展
<!-- DAILYTODO:CUSTOM:<blockId>:START -->
<!-- DAILYTODO:CUSTOM:<blockId>:END -->
```

Manual custom blocks (`aiGenerate === false`) continue to render as a heading and empty editable body.

The old keyword-based marker inference should not be used for newly rendered daily custom AI blocks because it creates collisions.

## Generation Data Flow

Daily generation needs access to the current daily template, not only the old `SectionConfig[]`.

For each AI custom block in `templates.dailyTemplate.customBlocks`:

1. Find its marker using `customBlockMarker(block.id)`.
2. Read the body between that marker.
3. Apply existing skip/overwrite/freeze/hash rules.
4. Build messages from the block definition:
   - title = block.name
   - prompt = block.prompt if present, otherwise default block prompt
   - renderType = block.renderType
   - date, daily content, deterministic stats
5. Call the LLM.
6. Extract the final result fence.
7. Strip duplicate heading using the nearest outer heading before that custom marker.
8. Optionally validate or normalize output according to `renderType`.
9. Write the block body with the existing AI hash.

## Prompt Behavior

Prompt is optional.

If the user prompt is blank, use:

```text
请根据今天的记录生成「${block.name}」这一段内容。
只输出和「${block.name}」相关的正文。
如果今天没有相关素材，就如实说明没有足够内容。
```

Then append render-type-specific instructions:

- `text`: ordinary Markdown prose; no extra structure required.
- `list`: output Markdown list items only, e.g. `- item`.
- `table`: output a Markdown table with a header row and separator row.
- `callout`: output an Obsidian callout, e.g. `> [!note] 标题` followed by quoted lines.
- `dataview`: output a fenced dataview block only when useful; otherwise explain that there is not enough structured data.

The final result must still be wrapped by line-only fences:

```text
DAILYTODO_FINAL_START
...
DAILYTODO_FINAL_END
```

DailyTodo strips those fences before writing to Obsidian.

## RenderType Validation

DailyTodo should not over-correct model output, but it should avoid silently ignoring the selected render type.

Recommended minimum behavior:

- Add render-type instructions to the prompt.
- For `list`, `table`, `callout`, and `dataview`, perform light validation after generation.
- If the output does not match the selected type, keep the model output but prefix a short HTML comment for maintainers, not visible in Obsidian preview:

```md
<!-- DAILYTODO:FORMAT_DOWNGRADED:table -->
```

This avoids destroying useful content while making the mismatch detectable in tests and raw Markdown.

## Heading De-duplication

Duplicate-heading stripping must use the actual outer heading in the daily note.

Example:

```md
## 项目进展
<!-- DAILYTODO:CUSTOM:abc:START -->
## 项目进展
正文
<!-- DAILYTODO:CUSTOM:abc:END -->
```

should become:

```md
## 项目进展
<!-- DAILYTODO:CUSTOM:abc:START -->
正文
<!-- DAILYTODO:CUSTOM:abc:END -->
```

But this should be preserved:

```md
## 项目进展
<!-- DAILYTODO:CUSTOM:abc:START -->
## 今日重点
- 正文
<!-- DAILYTODO:CUSTOM:abc:END -->
```

because `今日重点` is not the same as the outer heading.

## UI Behavior

The existing template editor can keep the current controls:

- block name
- AI generate toggle
- render type selector
- delete button

But the prompt field should be exposed clearly for custom AI blocks. It should be optional and described as:

```text
生成要求（可选）：不填时，DailyTodo 会根据区块名称自动生成。
```

This makes the feature understandable for ordinary users.

## Error Handling

- If a custom marker is missing in an existing note, the runner can append the marker block at the end using existing `upsertBlock` behavior. New note rendering should normally prevent this.
- If LLM generation fails for one custom block, skip that block and continue generating other blocks.
- Existing freeze behavior continues to apply at file level and block level.
- User-modified hashed blocks should continue to be skipped unless force generation is used.

## Testing Strategy

Add focused verification scripts for:

1. Unique custom markers render for multiple AI custom blocks.
2. Two custom blocks that would previously map to `REVIEW` no longer collide.
3. Each custom block receives its own prompt and render type.
4. `table` prompt includes Markdown table instructions.
5. `callout` prompt includes Obsidian callout instructions.
6. Duplicate outer heading is stripped for custom markers.
7. Different AI subheadings are preserved.
8. Old fixed markers remain supported.

## Non-Goals

- Do not automatically rewrite historical Obsidian notes.
- Do not build a full template migration wizard in this change.
- Do not guarantee perfect LLM formatting for every render type; prompt and light validation are sufficient.
- Do not remove the old fixed markers yet.
