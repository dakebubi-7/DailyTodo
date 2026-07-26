# DailyTodo Windows Release Checklist

This checklist prepares a locally audited Windows release candidate. It does
not publish a repository, create a release, upload artifacts, or enable update
delivery.

## Status

- Public repository creation: manual pending after the stable-release gate.
- GitHub Release publishing: manual pending after the stable-release gate.
- Code signing: manual pending; a certificate, protected CI secret, timestamp
  service, and signed-artifact verification are required before it can be
  marked complete.
- Clean-machine installation: manual pending; record the result in
  `docs/windows-product-qa.md`.

## Prepare The Candidate

- [ ] Work from the intended audited source snapshot and record its commit ID.
- [ ] Confirm `package.json` has the intended application version and that the
      version follows the planned release tag.
- [ ] Confirm the working tree contains no generated release output or local
      configuration that should not ship.
- [ ] Install dependencies from the lockfile:

  ```powershell
  npm ci
  ```

- [ ] Run static and automated quality checks:

  ```powershell
  npm run typecheck
  npm run lint
  npm test
  npm run verify:security
  npm run verify:build-output
  npm run verify:electron-store-bundle
  npm run verify:electron-app-environment-module
  npm run verify:electron-main-window-events-module
  npm run verify:electron-window-ipc-module
  ```

- [ ] Run the tracked-source audit described below and resolve every genuine
      finding before continuing.

## Source Audit

- [ ] Review tracked files, build configuration, imports, scripts, and release
      metadata for credentials, personal data, development-machine paths, and
      private operational material.
- [ ] Search source while excluding dependency and generated directories:

  ```powershell
  rg -n --glob '!node_modules/**' --glob '!dist/**' --glob '!dist-electron/**' --glob '!release/**' --glob '!coverage/**' '(?i)([A-Z]:\\Users\\|api[_-]?key|secret|password|access[_-]?token)' .
  ```

- [ ] Inspect each match in context. Expected fixtures, environment-variable
      names, and redaction tests are not credentials; actual values and private
      paths must be removed or replaced with portable configuration.
- [ ] Confirm development overrides are explicit, ignored where appropriate,
      and disabled for packaged builds.
- [ ] Confirm the backup artifact excludes API credentials and does not include
      an Obsidian vault or machine-specific integration paths.

## Build Windows Artifacts

- [ ] Build from the audited checkout on Windows:

  ```powershell
  npm run electron:build
  ```

- [ ] Confirm `release/` contains the NSIS installer, unpacked Windows
      application directory, blockmap, and electron-builder's generated
      `builder-debug.yml` when the current builder version emits it.
- [ ] Inspect the generated electron-builder configuration output (currently
      `release/builder-debug.yml`) and confirm:
  - product name and application identifier are DailyTodo values;
  - the targets include NSIS and unpacked (`dir`) output;
  - the NSIS installer allows an installation directory choice;
  - `asarUnpack` and extra resources include the native Win32 hit-test DLL and
    application/tray icons;
  - no publish provider or private URL has been introduced.
- [ ] Treat absolute paths in `builder-debug.yml` as local build diagnostics;
      it is a generated, ignored artifact and is not part of the audited source
      snapshot or published release payload.
- [ ] Inspect the unpacked app directory and start its executable once. Confirm
      that the executable, icon resources, and native DLL resource are present.
- [ ] Record the artifact names, SHA-256 hashes, build date, Node version,
      Electron version, and source commit in the release record.

## Installer And Upgrade Readiness

- [ ] Complete every item in `docs/windows-product-qa.md` on a clean Windows
      machine or VM.
- [ ] Verify the NSIS installer offers its expected installation location and
      creates the intended Start Menu entry.
- [ ] Verify an existing user's data behavior during upgrade/reinstall is
      documented from an observed test; do not promise migration behavior that
      was not exercised.
- [ ] Verify uninstall behavior is documented from an observed test. User data
      must not be represented as deleted unless that was explicitly chosen and
      tested.

## Stable Release Gate

- [ ] No known data-loss path remains in completion, carryover, backup, or
      restore flows.
- [ ] Recovery and support paths have been tested outside the development
      environment.
- [ ] AI-unavailable behavior is calm, non-destructive, and does not trigger
      hidden retry loops.
- [ ] The workspace remains efficient at normal task density.
- [ ] The audited snapshot has no personal paths, keys, private documents, or
      unsupported development defaults.
- [ ] The installer and clean-machine acceptance checks have passed from this
      reproducible build.
- [ ] Update behavior remains deferred until a user-controlled release-feed
      design is implemented and documented.

## Manual Actions After The Gate

- [ ] Create the separate public `DailyTodo` repository from the audited
      release snapshot and apply the MIT License.
- [ ] Publish reviewed source and reproducible artifacts through the approved
      release process.
- [ ] Establish code signing and verify the signed installer before publishing.
- [ ] Implement and test user-initiated update checking with explicit install
      confirmation before enabling any update feed.
