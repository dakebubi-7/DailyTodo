# DailyTodo GitHub Presentation and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the public DailyTodo repository into a polished bilingual portfolio project and publish a verified Windows installer for v1.0.0.

**Architecture:** Keep the existing application and its built-in `zh-CN` / `en-US` language setting unchanged. Add two localized repository entry points (`README.md` and `README.zh-CN.md`) linked by a language switch, plus standard open-source governance files and a GitHub Actions verification workflow. Build the NSIS installer from the current source, verify it locally, then upload it as a GitHub Release asset.

**Tech Stack:** Markdown, GitHub repository metadata, GitHub Actions, Electron Builder NSIS, PowerShell, npm scripts.

---

### Task 1: Create the bilingual project home pages

**Files:**
- Modify: `README.md`
- Create: `README.zh-CN.md`

- [ ] Add language switch links at the top of both pages.
- [ ] Add badges for release, stack, tests, and license.
- [ ] Add project value proposition, feature highlights, language-switch instructions, installation/download links, development commands, project structure, security notes, and roadmap/release notes links.
- [ ] Ensure all links use repository-relative paths or the public repository URL and do not claim an installer exists until the Release asset is verified.

### Task 2: Add open-source project standards

**Files:**
- Create: `LICENSE`
- Create: `CHANGELOG.md`
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/pull_request_template.md`
- Create: `.github/workflows/ci.yml`

- [ ] Use the MIT license with 2026 copyright attribution to DailyTodo contributors.
- [ ] Document v1.0.0 changes and the current verification commands.
- [ ] Document safe contribution, security-reporting, and community expectations.
- [ ] Add issue forms that collect reproducible bug and feature-request information.
- [ ] Add a CI workflow that installs dependencies, runs typecheck, tests, and production build on Windows.

### Task 3: Verify documentation and source behavior

**Files:**
- No source changes expected; inspect `shared/appSettings.ts`, `src/components/settings/GeneralSettingsSection.tsx`, and `src/i18n.ts`.

- [ ] Confirm the app already exposes `zh-CN` and `en-US` selection in Settings.
- [ ] Run `npm.cmd run typecheck`.
- [ ] Run `npm.cmd test -- --run`.
- [ ] Run `git diff --check`.

### Task 4: Build and verify the Windows installer

**Files:**
- Generated and ignored: `release/DailyTodo.exe`, `release/DailyTodo.exe.blockmap`, `release/latest.yml`, and unpacked build output.

- [ ] Run `npm.cmd run electron:build`.
- [ ] Confirm the installer timestamp is current, its file size is non-zero, and `release/DailyTodo.exe` is newer than the previous July artifact.
- [ ] Confirm the unpacked executable also reflects the current build.

### Task 5: Commit, push, and publish v1.0.0

**Files:**
- All tracked documentation and GitHub metadata from Tasks 1-2.

- [ ] Commit with a focused message describing repository polish and bilingual documentation.
- [ ] Push `master` through the verified Clash proxy at `127.0.0.1:7897`.
- [ ] Create GitHub Release `v1.0.0` with bilingual release notes and attach the freshly built NSIS installer.
- [ ] Verify the public repository page, release page, and installer asset return successfully.
