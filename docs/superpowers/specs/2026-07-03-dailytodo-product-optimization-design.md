# DailyTodo Product Optimization Design

Date: 2026-07-03

## Goal

Reposition DailyTodo from a polished general todo app into a focused daily execution product for independent developers. The product should help users choose the right work for today, reduce task-start friction, move through the day with less context switching, and turn daily activity into reusable review records.

The core product promise is:

> DailyTodo helps independent developers pick the 1-3 tasks that matter today, break them into actionable next steps, and automatically turn the day into a useful review.

## Background

This design consolidates the product strategy discussion from the resumed Claude Code session `86e7a77a-5412-4e6e-89fe-d04a27ee9f53`.

The original question was whether DailyTodo has market duplication and commercial value. The conclusion was:

- A generic todo, calendar, or task list product has high duplication and weak commercial differentiation.
- DailyTodo should not compete directly with TickTick, Todoist, Microsoft To Do, Things, Notion Calendar, Feishu Calendar, or enterprise scheduling tools.
- DailyTodo's stronger opportunity is a narrower local-first execution assistant for independent developers.
- The app should explicitly avoid team calendar, meeting-room scheduling, coworker availability, enterprise coordination, and broad project-management scope.

## Scope

In scope:

- Product positioning and target user definition.
- Core daily execution loop.
- Homepage and task-area information architecture.
- Today Focus concept and task hierarchy.
- AI intervention strategy.
- Product priority model for the next 1-2 months.
- Free vs Pro commercial boundary.
- High-level acceptance criteria and success metrics.

Out of scope for this spec:

- Implementing the Today Focus system in code.
- Changing persistence schema.
- Designing license activation or payment infrastructure in detail.
- Adding cloud sync, team collaboration, calendar replacement, or mobile apps.
- Final visual design tokens for task cards, glass effects, stack layers, or themes.
- Detailed prompt templates for AI review, weekly reports, or monthly reports.

## Chosen Direction

DailyTodo should be positioned as:

> **A local-first AI daily execution coach for independent developers.**

Plain-language version:

> DailyTodo helps independent developers choose what to push forward today, break it into the next small action, and end the day with a saved review.

This direction is preferred because it avoids the generic todo red ocean while building on DailyTodo's existing strengths: local desktop usage, daily files, AI review, weekly/monthly reports, Obsidian-friendly workflows, task grouping, visual task stacks, and a polished Electron experience.

## Target User

The first target user is an independent developer who has too many active contexts and needs daily execution clarity.

Typical traits:

- Maintains side projects, client work, bug fixes, learning tasks, documentation, release work, and operational chores.
- Opens a task list and sees many possible things to do, but struggles to choose the right starting point.
- Switches between small fixes, UI refinements, research, configuration cleanup, and unfinished features.
- Wants a record of what happened today, but does not want to manually write a diary, daily report, or weekly review.
- Prefers local-first tools, file exports, and control over AI credentials.
- Is more likely to pay once for a useful developer tool than subscribe to another generic productivity service.

The product should serve this user before expanding to creators, students, teams, or general consumers.

## Product Principle

DailyTodo should optimize for this question:

> Does this help the user start, continue, or review today's most important work?

If a feature does not support choosing focus, starting work, sustaining progress, reviewing the day, or carrying context into tomorrow, it should be deprioritized or moved out of the homepage.

## Core Loop

The product loop should be:

> **Choose focus -> Break next step -> Execute -> Review -> Suggest tomorrow**

DailyTodo should help answer five questions every day:

1. What matters most today?
2. Why are these the right tasks?
3. What is the smallest next action?
4. What actually moved forward today?
5. What should change tomorrow?

Existing task creation, editing, priority, grouping, completion, templates, reports, and AI blocks should serve this loop instead of competing with it.

## Homepage Information Architecture

The homepage should become a Today Execution Home instead of a generic task list page.

Recommended hierarchy:

1. **Today Navigation Layer**
   - Date, weekday, and lightweight day status.
   - Today's completion state.
   - Number of selected focus tasks.
   - A short status sentence, such as "You have 2 focus tasks today" or "One high-priority task carried over from yesterday."

2. **Today Focus Layer**
   - The visual center of the homepage.
   - Shows 1-3 focus tasks.
   - Each focus task includes title, reason, next step, and state.
   - AI may suggest focus tasks, but the user makes the final choice.

3. **Execution Pool Layer**
   - The main task list, reorganized around execution state rather than flat storage.
   - Suggested sections: In Progress, To Schedule, Blocked or Deferred, Completed.
   - A lighter alternative is Focus Tasks, Other Today Tasks, and Completed.

4. **Review and Suggestion Layer**
   - Yesterday's review summary.
   - Today's lightweight AI suggestion.
   - Tomorrow preparation hints.
   - Weekly/monthly report entry points.
   - This layer should be visually secondary and may be collapsed by default.

Supporting controls such as search, filters, sorting, tabs, and statistics should remain available but should not compete with Today Focus.

## Today Focus System

Today Focus is the product's central concept.

Rules:

- The user should be guided toward 1-3 focus tasks per day.
- A focus task should have a reason and a next step.
- The next step should be small enough to start within 5-20 minutes.
- Focus order should be adjustable.
- A focus task can be demoted back to the normal task pool.
- An unfinished focus task can be carried to tomorrow with context.
- AI suggestions should be accept/reject/edit, not automatic replacement.

A focus task should not just say:

> Refactor settings page

It should become:

> Refactor settings page  
> Reason: This blocks the next release polish pass.  
> Next step: Check whether the four settings sections save independently.

This makes DailyTodo different from a normal todo list: it does not only store tasks; it helps the user begin.

## Task-Area Hierarchy

Task cards should have clearer product roles.

### Focus task cards

Focus task cards should be the clearest surface in the task area. They should show:

- Task title.
- Current state.
- Why it matters today.
- Next step.
- A compact AI action entry, such as "Break next step" or "Re-rank today."

They do not need to be visually loud, but they must feel more decisive than normal tasks.

### Normal task cards

Normal task cards should remain easy to scan and edit, but should not compete with focus tasks. Their actions can appear on hover or selection when appropriate.

### Collapsed child tasks and visual stacks

Collapsed task stacks should communicate hidden complexity, not act as pure decoration. The stack should tell the user that a task has deeper structure available without forcing all details into the main view.

This connects the existing visual stack work to the product strategy: folded complexity supports execution clarity.

## AI Strategy

AI should be an execution coach, not a task owner.

AI should help with:

- Selecting today's focus tasks.
- Explaining why a task deserves focus.
- Breaking large tasks into the next small step.
- Identifying blocked or oversized tasks.
- Compressing the day when time or energy is limited.
- Drafting a short evening review.
- Suggesting what to carry into tomorrow.
- Generating weekly/monthly reports from saved daily records.

AI should avoid:

- Constantly interrupting the user.
- Automatically reordering all tasks by default.
- Turning the homepage into a chatbot.
- Replacing user judgment without confirmation.
- Producing long analysis cards where a short action suggestion would work.
- Acting like a general project manager or enterprise scheduling system.

Default behavior should be light assistance. Settings may later expose stronger modes, but the first-run experience should feel calm.

Suggested AI presentation forms:

1. **Embedded short suggestions** inside focus tasks or review areas.
2. **One-click actions** such as "Break next step," "Suggest focus," "Write review," or "Plan tomorrow."
3. **Periodic saved summaries** for daily review, weekly review, and monthly review.

## Feature Priority

### P1: Core execution loop

These are the highest priority because they define the product:

- Today Focus system.
- Focus task reason and next-step fields.
- Promote/demote tasks into and out of focus.
- Focus task ordering.
- Basic execution-state grouping.
- Evening short review.
- Tomorrow suggestion draft.
- Local-first data flow and BYOK readiness.

### P2: Retention and product feel

These should follow once the loop is usable:

- Better task state layering: In Progress, To Schedule, Blocked, Completed.
- Weekly and monthly review assets generated from real daily records.
- Task clusters and visual stacks as cognitive-load reduction.
- Desktop widget or always-available entry point, if it points back to today's focus.
- Obsidian-friendly export and review storage.

### P3: Later expansion

These are intentionally not first-priority:

- Full template marketplace.
- Large analytics dashboard.
- Broad external task-source integrations.
- Team collaboration.
- Shared calendars.
- Meeting scheduling.
- Full project-management replacement.
- Mobile app.
- Large AI chat workspace.

## Commercial Direction

DailyTodo should not charge for generic todo functionality alone. It should charge for saving planning effort, reducing start friction, and turning daily work into review assets.

Recommended first commercial model:

> **One-time Pro purchase + bring your own AI key.**

Why this fits:

- Independent developers are familiar with paid desktop tools and license keys.
- BYOK avoids the complexity of AI usage billing in the first commercial version.
- Local-first positioning is easier to trust when user data and AI credentials remain under user control.
- A buy-once product is easier to launch than a full SaaS subscription.

Suggested pricing range:

- Global early bird: $19.
- Global Pro purchase: $29-49.
- China early bird: ¥69-99.
- China standard purchase: ¥129-199.

Subscription can be considered later only if the product adds hosted AI, cloud sync, multi-device sync, or server-side collaboration.

## Free vs Pro Boundary

Free should preserve the basic method so users can feel the product value.

Free version:

- Add, edit, complete tasks.
- Use today's task list.
- Manually select Today Focus tasks.
- Basic task grouping.
- Local storage.
- Basic themes.
- Manual daily review.
- Simple export.

Pro version:

- AI Today Focus suggestions.
- AI reason generation for focus tasks.
- AI next-step breakdown.
- AI blocked/oversized-task detection.
- AI evening review.
- AI tomorrow suggestion.
- Weekly/monthly reports from daily records.
- Advanced export to Markdown or Obsidian.
- Advanced templates for reviews and reports.
- Premium themes or widget modes only if they reinforce the daily execution workflow.

Do not lock the entire core loop behind Pro. Pro should make the loop smarter and easier, not make the product unusable without payment.

## Roadmap: Next 1-2 Months

### Phase 1: Reframe the homepage

Goal: Turn the homepage from a task list into a Today Execution Home.

Work:

- Add or emphasize a today status summary.
- Create a Today Focus area.
- Make focus tasks visually primary.
- Reduce visual weight of search, filters, and secondary controls.
- Fold completed tasks by default or make them visually secondary.

Acceptance criteria:

- Within five seconds, the user can tell what matters today.
- The first screen is not a flat task dump.
- Normal task management remains available but is not the main visual story.

### Phase 2: Build the Today Focus system

Goal: Let users select and manage 1-3 daily focus tasks without needing AI.

Work:

- Promote a normal task to Today Focus.
- Demote a focus task back to normal tasks.
- Reorder focus tasks.
- Track focus state: not started, in progress, blocked, completed.
- Add next-step field.
- Add reason field.

Acceptance criteria:

- Each focus task can have a next step.
- Users can plan Today Focus manually.
- The product encourages 1-3 focus tasks instead of unlimited focus.

### Phase 3: Add low-interruption AI assistance

Goal: Let AI help only at the key moments.

Work:

- Suggest today's focus tasks.
- Generate reason text.
- Break a focus task into next steps.
- Detect task wording that is too broad or blocked.
- Draft a short evening review.
- Draft tomorrow's suggested focus.

Acceptance criteria:

- AI output is short, specific, and actionable.
- The user can accept, reject, or edit AI suggestions.
- The app still works as a manual local-first tool without an API key.

### Phase 4: Turn review into an asset

Goal: Make daily execution accumulate into weekly/monthly value.

Work:

- Save daily focus and review records locally.
- Generate weekly/monthly reports from daily records.
- Strengthen Markdown/Obsidian export.
- Make Pro boundaries visible but not aggressive.
- Polish BYOK settings.

Acceptance criteria:

- Users can review a week of focus tasks and outcomes.
- Weekly/monthly reports are based on real daily records, not disconnected generation.
- Pro can be explained as saving planning and review time.

## Non-Goals and Risks

### Non-goals

DailyTodo should not become:

- A team calendar.
- A meeting scheduler.
- A company project-management suite.
- A full Notion replacement.
- A generic AI chat app.
- A dashboard-heavy analytics product.
- A todo app that competes only on having more features.

### Risks

1. **Homepage portal creep**
   - Risk: Adding reports, templates, settings, AI panels, and statistics until the homepage loses its execution focus.
   - Mitigation: Keep the homepage centered on today.

2. **AI noise**
   - Risk: AI suggestions appear everywhere and users stop trusting them.
   - Mitigation: AI should appear at start, stuck, review, and weekly/monthly moments.

3. **Overbuilding before loop validation**
   - Risk: Building integrations, widgets, reports, or commercial features before Today Focus works.
   - Mitigation: Validate the focus -> next step -> review loop first.

4. **Charging too early for core behavior**
   - Risk: Free users never feel the value before hitting a paywall.
   - Mitigation: Keep manual focus and review free; charge for AI acceleration and long-term review assets.

5. **Losing local-first trust**
   - Risk: AI and Pro features feel like a cloud SaaS instead of a local desktop tool.
   - Mitigation: Make local storage, export, BYOK, and no forced cloud part of the product message.

## Success Metrics

Product usage:

- Daily open rate.
- Percentage of days with 1-3 focus tasks selected.
- Focus task completion rate.
- Number of tasks with next steps.
- Number of blocked tasks resolved or demoted.

Review behavior:

- Daily review creation rate.
- Consecutive review days.
- Weekly/monthly report generation from real daily records.
- Obsidian or Markdown export usage.

AI value:

- AI focus suggestions accepted or edited.
- AI next-step suggestions accepted or edited.
- AI review drafts saved.
- API key configuration rate.

Commercial signals:

- Interest in Pro features.
- Early-bird conversion rate.
- BYOK setup completion.
- Users recommending DailyTodo to other independent developers.

## Implementation Planning Notes

A future implementation plan should decompose this product strategy into smaller buildable units:

1. Data model for Today Focus and next-step metadata.
2. Homepage hierarchy changes.
3. Task card role and state presentation.
4. Manual focus management interactions.
5. AI suggestion actions and prompt boundaries.
6. Daily review persistence and export path.
7. Pro/BYOK visibility and settings polish.

The first implementation slice should be manual Today Focus, not AI. AI becomes valuable after the product has a clear focus target to assist.
