# Settings Text Contract Extraction Design

## Goal

Make the English and Chinese settings-text modules independently type-check against one shared contract without changing their exported object names, text values, runtime composition, or consumer imports.

## Scope

- Add `src/i18n/settingsTextTypes.ts` as a type-only owner for `SettingsText`.
- Update `shellTextEnSettings.ts` and `shellTextZhSettings.ts` to import and satisfy that shared type.
- Extend the existing i18n shell-text structural verifier to protect the new contract boundary and preserve runtime text checks.
- Register a focused verifier command only if the current verifier cannot clearly cover this boundary.

## Non-Goals

- Do not alter, translate, normalize, or re-encode any localized string.
- Do not split localized data by domain.
- Do not change `zhSettingsText`, `enSettingsText`, `zhShellText`, `enShellText`, or `getShellText` export paths.
- Do not change the runtime object composition in `shellTextZh.ts`, `shellTextEn.ts`, or `src/i18n.ts`.

## Design

`settingsTextTypes.ts` will define `SettingsText` from the current Chinese settings object shape. The Chinese payload remains the canonical structural source, because making that same inferred object satisfy a type derived from itself would create a TypeScript type cycle. The module is compile-time-only and has no runtime exports or side effects.

The English module will import `SettingsText` with `import type` and finish its existing object literal with `satisfies SettingsText`. The Chinese module remains unchanged as the contract source. This removes the English module's current direct type-only dependency on the Chinese data module without duplicating a nearly 300-line schema.

The existing `verify-i18n-shell-text-module.ts` will assert that the contract module exists, the English locale uses the shared type, the Chinese locale remains the contract source, and the English module no longer imports `zhSettingsText`. Its current runtime checks will continue proving that `getShellText` returns the same observed localized values.

## Data Flow

```text
settingsTextTypes.ts (type only)
  -> shellTextZhSettings.ts (zhSettingsText data)
  -> shellTextEnSettings.ts (enSettingsText data)
  -> shellTextZh.ts / shellTextEn.ts
  -> src/i18n.ts getShellText(...)
```

No runtime path changes: TypeScript erases the new imports, while the shell modules continue importing their own language data exactly as before.

## Error Handling And Compatibility

Missing, renamed, or structurally divergent settings keys become compile-time errors in the affected language module. Existing runtime behavior remains unchanged because the values and composition imports are untouched.

## Verification

1. Add a structural assertion first and run it to observe the expected RED failure before the type module exists.
2. Implement the type-only module and locale imports, then rerun the focused i18n verifier for GREEN.
3. Run `npm.cmd run typecheck` and `npm.cmd run build`.
4. Run scoped `git diff --check` for phase files.
