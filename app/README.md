# DailyTodo

DailyTodo is a Windows-first Electron desktop application for turning a daily task list into a focused execution workspace. It combines local task management, Obsidian daily-note synchronization, AI-assisted reviews, and a lightweight desktop surface that can stay out of the way while work is in progress.

![Electron](https://img.shields.io/badge/Electron-34.2.0-47848F?style=flat-square&logo=electron)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-06B6D4?style=flat-square&logo=tailwind-css)

## Highlights

- **Daily execution workspace** — manage tasks, priorities, subtasks, completion progress, task sources, and carry-over work.
- **AI review workflow** — generate daily, weekly, monthly, and external reviews from configured AI providers.
- **Multi-account AI settings** — add, duplicate, delete, switch, and test provider profiles without exposing stored API keys to the renderer.
- **Obsidian integration** — keep DailyTodo-managed review blocks and daily task notes synchronized with an Obsidian vault.
- **Desktop-focused UI** — compact window modes, transparent/glass styling, edge auto-hide, recovery behavior, and an invisible focus surface.
- **Review result handoff** — inspect yesterday's review, edit an AI-suggested next action, and explicitly adopt it as today's focus.

## Recent update: August 20, 2026

This update consolidates the latest AI review and desktop interaction work:

- Added compatibility for previously persisted custom review block markers, so older daily-note templates can still be recognized safely by heading.
- Made AI review failures explicit when no writable review block is available instead of reporting a false success.
- Added a confirmation flow before regenerating an existing daily review, with an explicit cancel path.
- Improved AI account management when no profile is selected, including a clear empty state and guarded actions.
- Fixed the daily review detail dialog so it closes with **Escape** and its content remains scrollable on short windows.
- Added regression coverage for AI generation, account management, app-state accessors, invisible completed-task styling, and daily review dialog behavior.

## Tech stack

| Area | Technology |
| --- | --- |
| Desktop runtime | Electron 34 |
| UI | React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS + custom global styles |
| Local persistence | electron-store |
| Integrations | Obsidian daily notes, configurable AI providers |
| Testing | Vitest, Testing Library, jsdom |

## Getting started

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Type-check, test, and build

```bash
npm run typecheck
npm test -- --run
npm run build
```

### Build the Windows application

```powershell
npm.cmd run electron:build
```

Release artifacts are written to `release/`. The Windows installer is currently unsigned, so SmartScreen may show a warning on first launch.

## Project structure

```text
electron/   Electron main process, IPC, persistence, AI and integration services
src/        React renderer, hooks, components, settings and styles
shared/     Cross-process types and AI review contracts
tests/      Unit and DOM regression tests
docs/       Product specs, implementation plans and release/QA notes
```

## Security notes

- API keys are stored and revealed through the Electron main-process settings flow; renderer-facing settings are masked.
- Do not commit local `.test-version*` profiles, logs, `.out`/`.err` files, or other runtime data.
- Configure provider credentials locally and keep them out of source control.

## License

MIT
