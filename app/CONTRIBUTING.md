# Contributing to DailyTodo

[English](CONTRIBUTING.md) · [简体中文](README.zh-CN.md)

Thank you for taking the time to improve DailyTodo. Contributions are welcome as focused bug fixes, tests, documentation improvements, and small, well-scoped features.

## Before opening an issue

- Search existing issues first.
- Reproduce the problem on the latest `master` commit or latest release.
- Remove API keys, vault paths, personal task data, and other private information from screenshots and logs.

## Local development

```powershell
npm install
npm run dev
```

Before submitting a change, run:

```powershell
npm.cmd run typecheck
npm.cmd test -- --run
npm.cmd run build
```

## Pull requests

1. Create a focused branch from `master`.
2. Keep the change small enough to review.
3. Add or update regression tests when behavior changes.
4. Update the relevant README, changelog, or release notes.
5. Explain what changed, how it was tested, and any known limitations.
6. Do not commit generated `release/` output, local profiles, logs, or credentials.

## Commit messages

Use a short imperative subject with a conventional prefix when practical:

```text
feat: add review export shortcut
fix: keep review details scrollable
 docs: clarify Obsidian setup
```

## Language support

User-facing changes should keep both `zh-CN` and `en-US` paths in mind. Reuse the existing i18n shell text and add regression coverage for language-sensitive UI when applicable.

## Code of conduct

By participating, you agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
