# DailyTodo

[English](README.md) · [简体中文](README.zh-CN.md)

[![CI](https://github.com/dakebubi-7/DailyTodo-backup/actions/workflows/ci.yml/badge.svg)](https://github.com/dakebubi-7/DailyTodo-backup/actions/workflows/ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/dakebubi-7/DailyTodo-backup?display_name=tag&style=flat-square)](https://github.com/dakebubi-7/DailyTodo-backup/releases)
[![License](https://img.shields.io/github/license/dakebubi-7/DailyTodo-backup?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-34-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

> A Windows-first desktop workspace for turning a daily task list into focused execution, reflection, and better next actions.

DailyTodo combines local task management, Obsidian daily-note synchronization, AI-assisted reviews, and a compact desktop surface that stays close to the work. The application supports **Simplified Chinese and English** through **Settings → Language**.

## Why DailyTodo

Most task lists stop at “what should I do?”. DailyTodo is designed around the complete loop:

```text
Plan → Focus → Complete → Review → Choose the next action
```

The result is a desktop workflow that keeps execution, evidence, and reflection in one place without requiring a cloud account for basic task management.

## Highlights

- **Daily execution workspace** — priorities, subtasks, completion progress, carry-over work, and task sources.
- **AI-assisted reviews** — generate daily, weekly, monthly, or external reviews from configured providers.
- **Multi-account AI settings** — create, duplicate, delete, switch, and test provider profiles while keeping API keys behind the Electron main process.
- **Obsidian integration** — synchronize DailyTodo task notes and managed review blocks with an Obsidian vault.
- **Desktop-focused interaction** — compact window modes, transparent/glass styling, edge auto-hide, recovery behavior, and an invisible focus surface.
- **Review-to-focus handoff** — inspect review results, edit an AI-suggested next action, and explicitly adopt it as today’s focus.
- **Bilingual UI** — switch between `简体中文` and `English` in the application settings.

## Download and install

The latest Windows installer is available on the [Releases page](https://github.com/dakebubi-7/DailyTodo-backup/releases/latest).

1. Download `DailyTodo.exe` from the latest release.
2. Run the installer and choose an installation directory if needed.
3. Launch DailyTodo from the Start menu or desktop shortcut.

> The Windows build is currently unsigned. Windows SmartScreen may display a warning during first launch. Review the release asset and source before installing.

## Language switching

The app has built-in language support:

1. Open **Settings**.
2. Open the **General** section.
3. Select **简体中文** or **English** in **Language**.

The selected language is persisted in the local application settings and is used by the main shell, task views, review panels, settings, and related workflows.

## Development

### Requirements

- Windows 10 or later
- Node.js 20+
- npm
- Visual Studio Build Tools for the native Windows hit-test helper

### Install and run

```bash
cd app
npm install
npm run dev
```

### Verify and build

```bash
cd app
npm run typecheck
npm test -- --run
npm run build
```

### Build the Windows installer

```powershell
cd app
npm.cmd run electron:build
```

The installer and unpacked application are written to `app/release/`. Build output is intentionally ignored by Git so personal profiles, logs, and generated binaries are not committed to the source repository.

## Project structure

```text
app/electron/   Electron main process, IPC, persistence, AI, and integrations
app/src/        React renderer, hooks, components, settings, and styles
app/shared/     Cross-process types and AI/review contracts
app/tests/      Unit, DOM, and regression tests
app/scripts/    Verification and native-build helpers
app/docs/       Product specs, implementation plans, and release notes
```

## Security and privacy

- API keys are handled through the Electron main-process settings flow; renderer-facing settings are masked.
- DailyTodo is local-first for core task management. Obsidian and AI integrations are opt-in configurations.
- Never commit API keys, vault paths, local task data, `.test-version*` profiles, logs, or generated release output.
- Security issues should be reported privately using the process in [SECURITY.md](app/SECURITY.md).

## Roadmap

- Improve first-run onboarding and provider setup guidance.
- Add richer release screenshots and short workflow demonstrations.
- Continue expanding bilingual coverage across advanced integration settings.
- Improve signed distribution and update delivery for future Windows releases.

## Documentation

- [Chinese project overview](README.zh-CN.md)
- [Release notes](app/docs/releases/v1.0.0.md)
- [Changelog](app/CHANGELOG.md)
- [Contributing guide](app/CONTRIBUTING.md)
- [Security policy](app/SECURITY.md)
- [Project specification](app/SPEC.md)

## License

Distributed under the [MIT License](LICENSE).
