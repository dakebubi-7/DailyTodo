# Changelog

All notable changes to DailyTodo are documented here.

The format follows the spirit of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions use [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-08-20

### Added

- Windows-first Electron productivity workspace for daily task execution.
- Daily, weekly, monthly, and external AI-assisted review workflows.
- Multi-account AI provider configuration with protected renderer boundaries.
- Obsidian daily-note synchronization and managed review blocks.
- Built-in Simplified Chinese / English language switching.
- Desktop focus surface, compact window modes, transparent styling, and edge auto-hide.
- Regression coverage for review generation, account settings, app state, task styling, and review dialog behavior.
- Public bilingual project documentation and Windows release packaging.

### Fixed

- Review detail dialogs can be closed with `Escape`.
- Review detail content remains scrollable in short windows.
- Existing daily reviews require explicit confirmation before regeneration.
- AI review generation reports a failure when no writable review block is available.
- Empty AI account states no longer expose unsafe or misleading actions.

[1.0.0]: https://github.com/dakebubi-7/DailyTodo/releases/tag/v1.0.0
