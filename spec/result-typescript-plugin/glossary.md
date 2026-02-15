# Glossary

Terminology used throughout the `@hex-di/result-typescript-plugin` specification. For `@hex-di/result`-specific terms (Result, Ok, Err, Brand, Phantom Type, etc.), see [../result/glossary.md](../result/glossary.md).

## Language Service Plugin

A TypeScript module loaded by the TypeScript language server at editor-time via `tsconfig.json` `compilerOptions.plugins[].name`. It receives a `ts.server.PluginCreateInfo` and returns a decorated `ts.LanguageService` proxy that can intercept diagnostic requests, hover queries, and code fix requests.

## Compiler Transformer

A TypeScript module loaded by `ts-patch` at compile-time via `tsconfig.json` `compilerOptions.plugins[].transform`. It receives a `ts.Program` and returns a `ts.TransformerFactory<ts.SourceFile>`. Used for build-time enforcement of diagnostics that should fail CI.

## ts-patch

A third-party tool that patches the TypeScript compiler to support custom transformers. Version 3.0+ supports `context.addDiagnostic()` for reporting diagnostics from transformers without modifying the AST. Required only for the compiler transformer delivery; the Language Service Plugin works without it.

## LanguageService Proxy

An object implementing `ts.LanguageService` that delegates to the original service for unmodified methods and intercepts specific methods (`getSemanticDiagnostics`, `getQuickInfoAtPosition`, `getCodeFixesAtPosition`) to augment their return values with plugin-provided diagnostics, hover info, and code fixes.

## Diagnostic

A structured message reported by the TypeScript language server to the editor or CLI. Contains a file, position, span, message, severity (error/warning/suggestion), and a numeric code. Plugin diagnostics use custom codes in the 90001–90063 range.

## Diagnostic Code

A numeric identifier for a specific diagnostic type. TypeScript reserves codes below 90000 for its own diagnostics. This plugin uses codes 90001–90063 for its custom diagnostics, allocated in blocks of 10 per capability. See [overview.md](overview.md#diagnostic-codes).

## Diagnostic Category

The severity level of a diagnostic: `ts.DiagnosticCategory.Error`, `ts.DiagnosticCategory.Warning`, or `ts.DiagnosticCategory.Suggestion`. Configured per capability via the plugin configuration.

## Must-Use Diagnostic

A diagnostic reported when a function call whose return type is `Result<T, E>` or `ResultAsync<T, E>` is used as an `ExpressionStatement` — meaning the return value is discarded. Analogous to Rust's `#[must_use]` attribute. Prevents silent error swallowing.

## Discarded Result

A `Result` or `ResultAsync` value that appears as the expression of an `ExpressionStatement` — it is evaluated but its value is not assigned, returned, passed as an argument, or otherwise consumed. This is the primary detection target of the must-use diagnostic.

## Unsafe Import Gating

A diagnostic reported when a source file imports from `@hex-di/result/unsafe` (via static `import`, dynamic `import()`, or `require()`) and the file does not match any of the configured `allowPatterns`. Complements the runtime subpath gating from [ADR-010](../result/decisions/010-unsafe-subpath.md) with static analysis.

## Allow Pattern

A glob pattern (e.g., `"**/tests/**"`) used to whitelist files where `@hex-di/result/unsafe` imports are permitted. Configured via `unsafeImportGating.allowPatterns`.

## Exhaustiveness Hint

A diagnostic reported when a `.match(onOk, onErr)` callback or a `switch` statement on a tagged error union does not cover all possible discriminant variants. The diagnostic lists the missing values. Only applies when the error type `E` is a union of objects with a common literal-typed discriminant property (default: `_tag`, configurable via `discriminantProperty`). Also includes warnings for catch-all panics, default-catches-single-variant, and duplicate arm bodies.

## Discriminant Property

The property name used to distinguish tagged error union members. Defaults to `_tag` (the convention from `createError()` and `createErrorGroup()`). Configurable via `exhaustivenessHints.discriminantProperty` to support alternative conventions like `type`, `kind`, or `code`.

## Tagged Error Union

A union type where each member is an object with a common discriminant property (default: `_tag`) containing a literal string. Produced by `createError(tag)` and `createErrorGroup(namespace)` from `@hex-di/result`. The exhaustiveness analyzer inspects these unions to determine which variants are handled.

## Catch-All Panic

A `.match()` error handler that immediately throws without meaningful processing, such as `(e) => { throw e }` or `() => { throw new Error("unexpected") }`. Detected by BEH-04-009 because it defeats the purpose of structured error handling — using `.expect("message")` is more explicit if panicking is intentional.

## Default Clause (Switch)

A `default:` case in a `switch` statement on an error discriminant. In the context of exhaustiveness analysis, a default clause suppresses the incomplete-switch diagnostic (BEH-04-006) because it handles all remaining variants. However, if it catches exactly one remaining variant, BEH-04-008 warns that an explicit `case` would be clearer.

## Phantom Type Translation

The process of intercepting TypeScript diagnostic messages (codes 2322, 2345) that involve `never` in Result type contexts and rewriting them with human-readable explanations. For example, replacing *"Type 'Ok<string, never>' is not assignable to type 'Result<string, MyError>'"* with an explanation of phantom type parameter semantics and suggested fixes.

## Error Union Tracking

A hover enhancement that displays the accumulated error type `E` at each step of an `andThen()` chain or `pipe()` composition. Computed by walking the call chain and extracting the `E` type parameter from the return type at each step.

## Code Fix Action

A `ts.CodeFixAction` returned by `getCodeFixesAtPosition` that suggests a code transformation to the user. Includes a `fixId`, description, and one or more `TextChange` objects specifying the replacement text and span. The plugin provides nine code fix types: wrap in `fromThrowable`, convert `isOk()` to `match()`, replace `unwrap()` with `unwrapOr()`, suggest `fromNullable()`, fill match cases, wrap in `ok()`/`err()`, wrap return type in `Result`, match-to-map simplification, and match-to-unwrapOr simplification.

## Result Type Info

The output of the core type detection module: a record indicating whether a `ts.Type` is a Result, ResultAsync, Ok, or Err, along with the extracted `T` (Ok type) and `E` (Err type) type parameters. Cached per `ts.Type` via `WeakMap`.

## Symbol Origin

The technique of tracing a type's symbol back to its declaration source file to determine whether it originates from `@hex-di/result`. Used by `result-type-checker.ts`: get the symbol from the type, access `symbol.declarations[0].getSourceFile().fileName`, and check if the path contains `@hex-di/result`.

## Structural Detection

A fallback type detection strategy that checks whether a type has the structural shape of a Result: a union of objects with `_tag: "Ok" | "Err"` literal properties and a property keyed by a symbol named `RESULT_BRAND`. Used when symbol-based detection is insufficient (e.g., for deeply aliased or conditional types).

## Import Scan

A lightweight pre-analysis pass that checks whether a source file contains any `ImportDeclaration` with a module specifier starting with `@hex-di/result`. Operates in O(n) on the statement count (not file size) by iterating only top-level statements. Used by the early-exit optimization to skip files that cannot contain Result values.

## Early Exit

A performance optimization where the plugin skips all analysis for a source file that contains no `import` declarations with module specifiers starting with `@hex-di/result` (as determined by the import scan). This avoids running type-checker queries on files that cannot contain Result values from the library.

## Quick Info

The hover information displayed when a user hovers over a symbol in the editor. Returned by `ts.LanguageService.getQuickInfoAtPosition()`. The plugin prepends accumulated error union information to the default Quick Info for `andThen()` chains.

## Expression Statement

A TypeScript AST node (`ts.SyntaxKind.ExpressionStatement`) representing an expression used as a statement. The expression is evaluated for its side effects and the resulting value is discarded. This is the detection target for must-use diagnostics because it represents a context where a Result value goes unused.

## Void Expression

A TypeScript AST node (`ts.SyntaxKind.VoidExpression`) representing the `void` operator applied to an expression. When a Result-returning call is wrapped in `void` (e.g., `void getResult()`), the must-use diagnostic does not fire because the discard is explicit and intentional.

## Plugin Configuration

The raw configuration object passed to the plugin via `tsconfig.json` `compilerOptions.plugins[]`. Contains boolean or object values for each capability. Parsed by `config/normalize.ts` into a `ResolvedPluginConfig` with all defaults applied.

## Resolved Plugin Configuration

The fully normalized configuration object where all optional fields have been filled with defaults. Used internally by all analyzers. Produced by `normalizeConfig()` from the raw plugin configuration.

## Type Check Cache

A `WeakMap<ts.Type, ResultTypeInfo>` that caches the result of `isResultType()` calls per `ts.Type` object. Because TypeScript's checker interns types (the same `ts.Type` object is reused for the same type), the cache achieves high hit rates within a single program generation. The `WeakMap` ensures automatic cleanup — when the TypeScript language server creates a new `ts.Program`, old `ts.Type` objects become unreachable and are garbage-collected, taking their cache entries with them.

## Program Generation

A new `ts.Program` instance created by the TypeScript language server when source files change. The plugin's type check cache is keyed on `ts.Type` objects from the current program. When a new program is created, old types are garbage-collected and the cache self-clears via `WeakMap` semantics.

## Narrowing Guard

A TypeScript type guard expression (e.g., `result.isOk()`, `result.isErr()`) that causes control-flow narrowing. After a narrowing guard in a conditional branch, TypeScript narrows the type from `Result<T, E>` to `Ok<T, E>` or `Err<T, E>`. The unsafe call-site analyzer (BEH-09-004) uses this narrowing to detect always-panicking and unnecessary unwrap calls.

## Unsafe Call-Site Analysis

Per-call-site detection of unsafe extraction patterns (unwrap, expect, throw) that complements import-level gating with granular analysis. Includes detection of unwrap inside Result-returning functions, always-panicking unwrap via control-flow narrowing, literal unwrap on ok()/err(), and assertions on Result state.

## Control-Flow Narrowing

TypeScript's built-in type narrowing after type guard checks. After `if (result.isOk())`, the type of `result` is narrowed from `Result<T, E>` to `Ok<T, E>`, and after `if (result.isErr())`, narrowed to `Err<T, E>`. The plugin leverages this narrowing for always-panicking and unnecessary unwrap detection.

## Code Quality Lint

A diagnostic that suggests idiomatic `@hex-di/result` patterns without flagging correctness issues. Defaults to `suggestion` severity. Examples: prefer `.isOkAnd(f)` over `.map(f).unwrapOr(false)`, prefer `.andThen(f)` over `.map(f).flatten()`, warn on `.map(f)` where `f` returns `void`.

## Error Type Quality Lint

A diagnostic that improves the quality and informativeness of error types in Result values. Detects uninformative error types (`void`, `undefined`, `unknown`), missing `@errors` JSDoc documentation on public functions, unnecessary Result wrapping on functions that always succeed, and `.mapErr()` callbacks that discard the original error.

## Semantic Token Modifier

A custom token modifier registered via `getEncodedSemanticClassifications` that enables editor themes to apply distinctive styling to Result-related identifiers. The plugin provides modifiers like `resultConstructor` (for `ok`/`err`), `unsafeResultAccess` (for `unwrap`/`expect`), and `resultTypeGuard` (for `isOk`/`isErr`).

## Identity Conversion

A no-op operation that returns its input unchanged. Examples: `.map(x => x)`, `.mapErr(e => e)`, `.andThen(v => ok(v))`, `.orElse(e => err(e))`. The code quality analyzer detects these as useless operations that can be removed.

## Result Type Hover Presentation

The set of hover tooltip enhancements (BEH-13) that rewrite TypeScript's default type display for Result, Ok, Err, ResultAsync, and structured error types. Includes Result type simplification (collapsing `Ok<T, E> | Err<T, E>` back to `Result<T, E>`), phantom type suppression (hiding `never` and irrelevant type parameters), structured error formatting (displaying `createError` types by tag name instead of raw structural expansion), and error union formatting (grouping variants by namespace).

## Phantom Type Suppression

A hover enhancement (BEH-13-002) that hides phantom type parameters from `Ok<T, E>` and `Err<T, E>` in narrowed contexts. On `Ok`, the error type `E` is phantom (not accessible at runtime) so it is hidden — `Ok<User, AppError>` displays as `Ok<User>`. On `Err`, the success type `T` is phantom so it is hidden — `Err<User, AppError>` displays as `Err<AppError>`. This eliminates confusion about why a success variant carries an error type parameter.

## Namespace-Qualified Error Name

The `{namespace}.{tag}` display format used for errors produced by `createErrorGroup()`. For example, an error with `_namespace: "Http"` and `_tag: "NotFound"` is displayed as `Http.NotFound` in hover tooltips and error union listings. This provides visual grouping and disambiguation when multiple error groups coexist in a union.

## Chain Transformation Visualization

A hover enhancement (BEH-13-012) that shows the full `T` and `E` type transformation at each step of a Result method chain — not just the error union (BEH-06) but also the success type transformation. Each step shows `T: A → B` and `E: C → C | D` with annotations like `(+ NewError)` marking newly introduced error variants. Supersedes BEH-06's error-only line when active.

## Error Propagation Trace

A hover enhancement (BEH-13-016) that shows which chain step introduced each error variant in a multi-step Result chain. When hovering over step N, the trace lists each error type in the accumulated union alongside the step that first introduced it. Helps developers understand where errors come from in long `andThen` chains.

## Function Return Type Summary

A hover enhancement (BEH-13-011) that displays a structured breakdown of a function's Result return type — the success type and each possible error variant with its fields — when hovering over the function name at its declaration or call site. Integrates with `@errors` JSDoc documentation when present.

## Unsafe Method Danger Indicator

A hover enhancement (BEH-13-013) that displays a warning when hovering over unsafe methods (`.expect()`, `.expectErr()`) or unsafe standalone functions (`unwrap`, `unwrapErr`). Shows the error types that could cause a panic, suggests safe alternatives, and indicates when the call is safe (narrowed to Ok) or always-panicking (narrowed to Err).

## Match Completeness Indicator

A hover enhancement (BEH-13-014) that shows whether a `.match()` call exhaustively handles all error variants when the error type is a tagged union. Displays each variant with a marker: `[x]` for explicitly handled, `[~]` for caught by default/catch-all, and `[ ]` for unhandled.
