# Invariants

Analysis-time guarantees and contracts enforced by the `@hex-di/result-typescript-plugin` implementation.

## PINV-1: Accurate Result Type Detection

The `result-type-checker` module correctly identifies `Result<T, E>`, `Ok<T, E>`, `Err<T, E>`, and `ResultAsync<T, E>` types originating from `@hex-di/result`. Detection uses a hybrid strategy: symbol origin tracing (primary) with structural fallback.

**Symbol origin**: The type's symbol is traced to its declaration source file. If the file path contains `@hex-di/result/` (node_modules resolution) or `packages/result/` (workspace resolution), and the symbol name matches `Result`, `Ok`, `Err`, or `ResultAsync`, the type is positively identified.

**Structural fallback**: If symbol origin tracing is inconclusive (e.g., deeply aliased types, conditional types, or mapped types), the type is checked structurally: a union whose members each have a `_tag` property with literal type `"Ok"` or `"Err"`, plus a property keyed by a symbol named `RESULT_BRAND`.

**Source**: `analysis/result-type-checker.ts`

**Implication**: All downstream analyzers (must-use, exhaustiveness, error union tracking, code fixes) rely on this module for type identification. Accuracy here determines the absence of false positives and false negatives across the entire plugin.

## PINV-2: No False Positive Diagnostics

The plugin never reports a diagnostic for code that is correct. When type detection is ambiguous (cannot confirm the type originates from `@hex-di/result`), the plugin stays silent.

**Source**: All `analysis/*.ts` modules — each returns an empty array when detection is inconclusive.

**Implication**: Developers can trust that every plugin diagnostic represents a genuine issue. False positives would erode trust and lead to suppression comments that mask real problems.

## PINV-3: Diagnostic Parity Between LS and Transformer

For capabilities that run in both the Language Service Plugin and the Compiler Transformer (must-use, unsafe import gating, exhaustiveness hints), the same analysis modules are invoked with identical logic. A diagnostic that fires in the editor fires identically in CI, and vice versa.

**Source**: `language-service/diagnostics.ts` and `compiler/transformer-factory.ts` both import from `analysis/*.ts`.

**Implication**: No surprises in CI — if the editor shows no diagnostics, the build passes. The transformer does not run phantom type translation, error union tracking, or code fixes (editor-only features), but for shared capabilities the behavior is identical.

## PINV-4: Configuration Defaults Preserve Safety

When no explicit configuration is provided, all diagnostic capabilities are enabled with the following default severities:

| Capability | Default Enabled | Default Severity |
|------------|----------------|-----------------|
| Must-use | `true` | `warning` |
| Unsafe import gating | `true` | `error` |
| Exhaustiveness hints | `true` | `suggestion` |
| Phantom type translation | `true` | N/A (rewrites existing diagnostics) |
| Error union tracking | `true` | N/A (hover enhancement) |
| Code fixes | `true` | N/A (on-demand actions) |
| Result hover presentation | `true` | N/A (hover enhancement) |

**Source**: `config/schema.ts` — default values. `config/normalize.ts` — normalization logic.

**Implication**: A consumer adding `{ "name": "@hex-di/result-typescript-plugin" }` to their tsconfig gets full protection out of the box. No capability must be manually enabled.

## PINV-5: Diagnostic Codes Are Stable

Custom diagnostic codes (90001–90063) are assigned once and never reused for different purposes. Adding new diagnostics appends to the range; existing codes are never reassigned. The allocation scheme groups codes by capability in blocks of 10:

| Range | Capability |
|-------|-----------|
| 90001–90009 | Must-use diagnostics |
| 90010–90019 | Unsafe import gating |
| 90020–90029 | Exhaustiveness hints |
| 90030–90039 | Phantom type translation |
| 90040–90049 | Unsafe call-site analysis |
| 90050–90059 | Code quality lints |
| 90060–90069 | Error type quality lints |

**Source**: `language-service/diagnostic-codes.ts`

**Implication**: Consumers who filter or suppress diagnostics by code (e.g., in `// @ts-ignore` comments or CI scripts) can rely on code stability across versions.

## PINV-6: Sub-Perceptible Editor Latency

The plugin's `getSemanticDiagnostics` overhead is imperceptible to the developer. This is achieved through three mechanisms:

1. **Early exit**: Files without `@hex-di/result` imports skip all analysis. The import scan checks only top-level `ImportDeclaration` module specifiers — an O(n) scan on statement count, not on file size.
2. **Type check cache**: `WeakMap<ts.Type, ResultTypeInfo>` caches detection results per `ts.Type` object. Types are interned by the TypeScript checker, so the cache has high hit rates within a single program generation.
3. **Targeted traversal**: Each analyzer visits only the specific AST node kinds it needs (`ExpressionStatement` for must-use, `ImportDeclaration` for unsafe gating, `CallExpression` for exhaustiveness). No full-tree walk occurs.

**Source**: All `analysis/*.ts` modules, `utils/cache.ts`

**Implication**: The plugin can be enabled on large codebases without degrading the editor experience.

## PINV-7: No AST Modification in Transformer

The compiler transformer reports diagnostics via `context.addDiagnostic()` but never modifies the source AST. The transformer factory returns each `SourceFile` unchanged.

**Source**: `compiler/transformer-factory.ts` — returns `sourceFile` without modification after collecting diagnostics.

**Implication**: The plugin is a pure diagnostic pass. It cannot introduce runtime behavior changes, code generation bugs, or source map discrepancies. The emitted JavaScript is identical with or without the plugin.

## PINV-8: Allow Patterns Match File Paths Consistently

The glob matcher used for `unsafeImportGating.allowPatterns` operates on the normalized absolute file path of the source file (`sourceFile.fileName`). Patterns use forward slashes (`/`) as separators regardless of platform. The `**` wildcard matches zero or more path segments; `*` matches within a single segment.

**Source**: `utils/glob-match.ts`, `analysis/unsafe-import-detector.ts`

**Implication**: Allow patterns behave identically on Windows, macOS, and Linux. Patterns written on one platform work on another.

## PINV-9: Exhaustiveness Only for Tagged Unions

The exhaustiveness analyzer only reports diagnostics when the error type `E` is a union of objects where **every member** has a common discriminant property (default: `_tag`, configurable via `discriminantProperty`) with a **literal string type**. If any union member lacks the discriminant property, or if the property is typed as `string` (not a literal), the analyzer stays silent.

**Source**: `analysis/exhaustiveness-analyzer.ts` — validates all union members before reporting.

**Implication**: The analyzer does not produce false positives for error types that are not tagged unions. Only errors created via `createError()` or `createErrorGroup()` (or manually constructed types following the same discriminant pattern) trigger exhaustiveness analysis. Custom discriminant properties (e.g., `type`, `kind`, `code`) are supported via configuration.

## PINV-10: Phantom Type Translation Preserves Original Diagnostic

When the plugin rewrites a TypeScript diagnostic message for phantom type translation, the original diagnostic message is preserved as `relatedInformation` on the rewritten diagnostic. The original diagnostic code, file, position, and span are unchanged.

**Source**: `analysis/phantom-type-translator.ts`

**Implication**: Developers can always see the original TypeScript error message alongside the human-readable explanation. No diagnostic information is lost.

## PINV-11: Call-Site Analysis Respects Control-Flow Narrowing

The unsafe call-site analyzer (BEH-09) uses TypeScript's control-flow narrowing to determine whether an unwrap is always-panicking or unnecessary. The analyzer queries `checker.getTypeAtLocation()` at the exact call site position, which reflects narrowing from `isOk()`, `isErr()`, or discriminant checks in the enclosing scope.

**Source**: `analysis/unsafe-call-site-detector.ts`

**Implication**: Always-panicking unwrap detection (`90043`) is reliable — it only fires when TypeScript has provably narrowed the Result to `Err`. Unnecessary unwrap detection (`90044`) only fires when TypeScript has provably narrowed to `Ok`. No false positives from control-flow ambiguity.

## PINV-12: Code Quality Lints Do Not Break Builds by Default

Code quality lints (BEH-10) default to `suggestion` or `warning` severity — never `error`. They never prevent compilation or trigger build failures unless the consumer explicitly raises them to `error`. These lints suggest idiom improvements but do not flag correctness issues. Two lints (`MAP_VOID_RETURN` and `USELESS_IDENTITY_CONVERSION`) default to `warning` rather than `suggestion` because they indicate likely mistakes, but even at `warning` severity they do not fail builds.

**Source**: `analysis/code-quality-analyzer.ts`, `config/schema.ts`

**Implication**: Enabling code quality lints never breaks existing builds. They provide gradual improvement guidance without disrupting workflow.

## PINV-13: Error Type Quality Analysis Is Scope-Aware

The error type quality analyzer (BEH-11) distinguishes between exported (public) and non-exported (private) functions. The `missingErrorsDoc` lint only applies to exported functions. The `unnecessaryResultWrapping` lint only applies to non-exported functions. This distinction prevents false positives from applying library-author rules to internal code and vice versa.

**Source**: `analysis/error-type-quality-analyzer.ts`

**Implication**: The analyzer produces contextually appropriate diagnostics. Library authors get documentation reminders on their public API. Application developers get unnecessary-wrapping hints on their internal functions.

## PINV-14: Code Fixes Produce Valid TypeScript

Every code fix action (BEH-07) generates syntactically valid TypeScript code. The generated code compiles without introducing new errors (modulo placeholder values like `/* default value */` or `throw new Error("TODO: handle ...")`). Import management ensures no duplicate imports and no missing imports.

**Source**: `analysis/code-fix-analyzer.ts`, `language-service/code-fixes.ts`

**Implication**: Applying a code fix never leaves the file in a broken state. The developer may need to fill in placeholder values, but the surrounding code is correct.
