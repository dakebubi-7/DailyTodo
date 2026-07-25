# AI Review and Daily Execution Design

## Purpose

Make AI review obey an explicit user confirmation to regenerate, make external failures visible, and establish structured task handoff data so tomorrow work does not depend on parsing a customizable Markdown review.

## Regeneration Semantics

The current confirmation dialog remains the consent boundary. Once a user confirms, every DailyTodo-managed block that is not frozen is eligible for replacement, including unchanged AI content and user-edited AI content. `<!-- DAILYTODO:FREEZE -->` remains an intentional, non-overridable protection mechanism.

Each block fill produces one of three outcomes: filled, intentionally skipped, or failed. Provider failures are never represented as skips. A daily run fails when requested AI work fails and no content is written; partial success remains successful with a warning and identifies failed blocks. The renderer presents the returned failure message and diagnostic instead of a success notice.

## Daily Execution Data

`Task` gains optional, backward-compatible workflow fields: date-scoped focus metadata, a typed handoff, and carryover context. These fields are validated while persisted tasks load; malformed optional metadata is removed without rejecting an otherwise valid legacy task.

When work is carried to the next business day, the new task copies the source task's handoff into `carryoverContext` but clears focus state. A carryover is therefore a contextual candidate, never an automatic focus decision.

## Tomorrow Projection

The review's Tomorrow block is a deterministic projection rather than a source of task state. It contains only incomplete tasks assigned to the reviewed date plus relevant next-day carryover records whose source date is the reviewed date. It cannot include arbitrary open tasks from another date, including during historical backfill.

## AI Handoff

The review Markdown remains user-owned presentation data. Separate AI handoff messages request a strict JSON payload with status, short progress summary, blocker, next step, and carry-forward choice. Shared parsing enforces type, length, and meaningful next-step constraints. Invalid model output is non-fatal and cannot overwrite manual task data. Valid handoffs are returned for explicit renderer application.

## Compatibility and Validation

All new task fields are optional. Existing task behavior, custom review templates, freeze markers, and manual task management remain intact. Tests cover the error classification, dates, persistence normalization, carryover behavior, and JSON handoff protocol before production behavior changes.
