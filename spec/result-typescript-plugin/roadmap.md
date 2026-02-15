# Roadmap

Planned future additions to the `@hex-di/result-typescript-plugin` specification. Each item describes scope and rationale. These are **not** part of the current spec — they will be developed as separate documents or as behavior spec additions.

## VS Code Extension Wrapper

**Status**: Planned.

**Scope**: A VS Code extension that bundles the TypeScript Language Service Plugin and provides additional features:

- **Diagnostic panel**: Dedicated panel showing all Result-related diagnostics across the workspace
- **Configuration UI**: Settings page for plugin configuration (instead of editing tsconfig.json manually)
- **Status bar indicator**: Show plugin status and diagnostic count in the VS Code status bar
- **Result chain visualization**: A tree view that shows the type flow through an andThen/pipe chain

**Rationale**: While the Language Service Plugin works in any editor that uses the TypeScript language server, a VS Code extension can provide richer UI features. VS Code is the dominant TypeScript editor (>70% market share).

**Deliverable**: `@hex-di/result-vscode` (separate package, spec TBD)

## ESLint Rule Equivalents

**Status**: Superseded by this plugin for type-aware diagnostics. Planned for AST-only rules.

**Scope**: An ESLint plugin providing rules that do NOT require type checking, complementing this TypeScript plugin:

- `prefer-match` — Suggest `.match()` over manual `_tag` checks when all branches return the same type (AST pattern matching only)
- `no-nested-result` — Warn on `Result<Result<T, E1>, E2>` (suggest `.flatten()`)
- `no-empty-match-handler` — Warn when a `.match()` handler is `() => {}` (empty function body)

**Rationale**: Some rules can be implemented purely via AST inspection without the type checker. ESLint rules run faster than TS plugin analyzers and integrate with existing ESLint infrastructure.

**Deliverable**: `eslint-plugin-hex-result` (separate package, spec TBD)

## Additional Code Fixes

**Status**: Planned.

**Scope**: Expand the code fix capabilities with:

- **Convert `try/catch` chain to `safeTry` generator** — When a try block contains multiple sequential Result-producing calls, suggest converting to `safeTry(function*() { ... })` with `yield*` early returns
- **Convert `if/else` chain to `match` + `switch`** — When nested `if` checks handle multiple error tags, suggest a single `match()` with a `switch` in the onErr callback
- **Add missing import** — When a Result API function is used but not imported, suggest adding the import
- **Convert Promise chain to ResultAsync** — When a `.then().catch()` chain could be expressed as a `ResultAsync` chain, suggest the conversion

**Rationale**: More code fixes improve developer productivity and encourage idiomatic `@hex-di/result` patterns.

## Option Type Analysis

**Status**: Planned.

**Scope**: Extend all analyzers to also cover `Option<T>`, `Some<T>`, and `None` from `@hex-di/result/option`:

- **must-use for Option** — Warn when an `Option`-returning call is discarded
- **Exhaustiveness for Option match** — Detect missing `Some`/`None` handling
- **Phantom type translation for Option** — Translate `Some<T, never>` / `None<never>` errors

**Rationale**: `Option<T>` follows the same discriminated union pattern as `Result<T, E>` and benefits from identical analysis.

## Auto-Import Suggestions

**Status**: Planned.

**Scope**: When the developer types a `@hex-di/result` function name that is not imported, the plugin suggests an auto-import from the optimal subpath:

- `map` → `import { map } from "@hex-di/result/fn/map"` (individual) or `import { map } from "@hex-di/result/fn"` (barrel)
- `unwrap` → `import { unwrap } from "@hex-di/result/unsafe"` (with a warning about unsafe usage)
- `fromThrowable` → `import { fromThrowable } from "@hex-di/result"`

**Rationale**: TypeScript's built-in auto-import does not always pick the optimal subpath. The plugin can suggest the most tree-shakeable import path.

## Diagnostic Suppression Comments

**Status**: Planned.

**Scope**: Support inline suppression comments for plugin diagnostics:

```ts
// @hex-di-ignore must-use
getResult(); // No diagnostic on this line

// @hex-di-ignore-next-line unsafe-import
import { unwrap } from "@hex-di/result/unsafe";
```

**Rationale**: Sometimes developers need to suppress a diagnostic for a specific line. While `// @ts-ignore` or `// @ts-expect-error` suppress TypeScript diagnostics, they suppress ALL diagnostics at that location. A plugin-specific suppression comment allows surgical suppression.

## Performance Benchmarks

**Status**: Planned.

**Scope**: Automated benchmarks that measure the plugin's impact on TypeScript language server performance:

- **Diagnostic latency**: Time from file change to diagnostic availability, with and without the plugin
- **Hover latency**: Time for `getQuickInfoAtPosition` with and without error union tracking
- **Memory overhead**: Additional memory consumption per file analyzed
- **Scaling**: Performance on projects of varying sizes (100, 1000, 10000 files)

**Rationale**: [PINV-6](invariants.md#pinv-6-sub-perceptible-editor-latency) requires sub-perceptible latency. Benchmarks provide regression detection and evidence for the claim.

## Telemetry / Usage Analytics

**Status**: Under consideration.

**Scope**: Optional, opt-in telemetry that reports:

- Which capabilities are enabled/disabled
- Diagnostic frequency by code
- Code fix usage frequency
- TypeScript version distribution

**Rationale**: Understanding how the plugin is used helps prioritize future development. Must be strictly opt-in with clear privacy documentation.

**Note**: This item requires careful consideration of privacy, GxP compliance (no data exfiltration from regulated environments), and user trust. It may be rejected based on these concerns.
