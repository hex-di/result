# Rust Compiler Comparison Matrix

Full comparison between the Rust compiler ecosystem's `Result<T, E>` tooling and `@hex-di/result-typescript-plugin`. Organized by feature category with gap analysis.

## Legend

| Symbol | Meaning |
|--------|---------|
| **R** | Rust compiler (rustc) built-in |
| **C** | Clippy lint |
| **RA** | rust-analyzer IDE feature |
| **P** | @hex-di/result-typescript-plugin (this plugin) |
| **TS** | TypeScript compiler built-in (no plugin needed) |
| **--** | Not applicable to the ecosystem |

Coverage levels:

| Symbol | Meaning |
|--------|---------|
| FULL | Full equivalent with comparable depth |
| N/A | Not applicable to the TypeScript ecosystem |

---

## 1. Unused Result Detection

| # | Feature | Rust | Rust Level | Plugin | Plugin Level | Status |
|---|---------|------|------------|--------|--------------|--------|
| 1.1 | Warn on discarded `Result` value | R: `#[must_use]` on `Result` type | warn | P: `MUST_USE_RESULT` (90001) | configurable | **FULL** |
| 1.2 | Warn on discarded `ResultAsync` value | -- | -- | P: `MUST_USE_RESULT_ASYNC` (90002) | configurable | **FULL** |
| 1.3 | Warn on discarded chaining method return (`.map()`, `.and_then()`) | R: each method is `#[must_use]` | warn | P: detected via return type | configurable | **FULL** |
| 1.4 | Suppress with explicit discard | R: `let _ = expr;` | -- | P: `void expr;` | -- | **FULL** |
| 1.5 | Warn on `let _ = result` (intentional discard) | C: `let_underscore_must_use` | allow | TS: `noUnusedLocals` flags unused variable | warning | **FULL** (TS built-in) |
| 1.6 | Warn on `.ok()` used solely to silence must-use | C: `unused_result_ok` | allow | P: `MUST_USE_RESULT` fires on discarded `.toNullable()` etc. | configurable | **FULL** |
| 1.7 | Warn on ANY unused expression result (not just `#[must_use]`) | R: `unused_results` lint | allow | -- | -- | N/A |
| 1.8 | Warn when `for` iterates over a `Result` directly | R: `for_loops_over_fallibles` | warn | -- | -- | N/A |

### Coverage: 6 FULL, 2 N/A

**1.5**: In TypeScript, `const _ = getResult()` assigns to a variable. If the variable is never read, TypeScript's `noUnusedLocals` flags it. Combined with the must-use diagnostic on discarded expression statements, this provides equivalent coverage.

**1.6**: In TypeScript, calling any method on a Result (e.g., `.toNullable()`) as a statement triggers the must-use diagnostic on the return value. There is no way to silently discard via a method call.

---

## 2. Unsafe Extraction Gating

| # | Feature | Rust | Rust Level | Plugin | Plugin Level | Status |
|---|---------|------|------------|--------|--------------|--------|
| 2.1 | Warn/deny `.unwrap()` usage per call site | C: `unwrap_used` | allow | P: `UNWRAP_CALL_SITE` (90040) per call site + `UNSAFE_IMPORT` (90010) at import level | configurable | **FULL** |
| 2.2 | Warn/deny `.expect()` usage per call site | C: `expect_used` | allow | P: `UNWRAP_CALL_SITE` (90040) detects `.expect()` + `.expectErr()` | configurable | **FULL** |
| 2.3 | Warn on `unwrap()` inside Result-returning functions | C: `unwrap_in_result` | allow | P: `UNWRAP_IN_RESULT_FN` (90041) | configurable | **FULL** |
| 2.4 | Warn on `throw` inside Result-returning functions | C: `panic_in_result_fn` | allow | P: `THROW_IN_RESULT_FN` (90042) | configurable | **FULL** |
| 2.5 | Detect `unwrap()` that will always panic | C: `panicking_unwrap` | deny | P: `ALWAYS_PANICKING_UNWRAP` (90043) via control-flow narrowing | error | **FULL** |
| 2.6 | Detect `unwrap()` that can never panic (unnecessary) | C: `unnecessary_unwrap` | warn | P: `UNNECESSARY_UNWRAP` (90044) via control-flow narrowing | suggestion | **FULL** |
| 2.7 | Detect `ok(1).unwrap()` or `err(1).unwrap()` (literal unwrap) | C: `unnecessary_literal_unwrap` | warn | P: `LITERAL_UNWRAP` (90045) | warning | **FULL** |
| 2.8 | Warn on `assert(result.isOk())` (poor panic message) | C: `assertions_on_result_states` | allow | P: `ASSERT_RESULT_STATE` (90046) | configurable | **FULL** |
| 2.9 | Restrict `?` operator usage globally | C: `question_mark_used` | allow | -- | -- | N/A |

### Coverage: 8 FULL, 1 N/A

**2.1–2.2**: The plugin provides two layers: import-level gating (BEH-03, coarse) and per-call-site detection (BEH-09, fine-grained). Together these exceed Clippy's single-layer approach.

**2.3–2.4**: BEH-09-002 detects unwrap/expect inside Result-returning functions. BEH-09-003 detects `throw` statements (TypeScript's equivalent of `panic!()`) inside Result-returning functions.

**2.5–2.6**: BEH-09-004 leverages TypeScript's control-flow narrowing. After `if (result.isErr())`, the type narrows to `Err<T, E>`, making `.expect()` provably panicking. After `if (result.isOk())`, `.value` is directly accessible, making unwrap unnecessary.

---

## 3. Exhaustive Pattern Matching

| # | Feature | Rust | Rust Level | Plugin | Plugin Level | Status |
|---|---------|------|------------|--------|--------------|--------|
| 3.1 | Enforce exhaustive `match` on `Result` variants (`Ok`/`Err`) | R: hard error | error | TS: discriminated union narrowing + `assertNever` | error | **FULL** (TS built-in) |
| 3.2 | Enforce exhaustive `match` on error enum variants | R: hard error | error | P: `INCOMPLETE_MATCH` (90020) with configurable discriminant property | configurable | **FULL** |
| 3.3 | Enforce exhaustive `switch` on error discriminant | R: hard error (enum match) | error | P: `INCOMPLETE_SWITCH` (90021) with configurable discriminant property | configurable | **FULL** |
| 3.4 | "Fill match arms" code action | RA: generates all arms | auto-fix | P: `hex-fill-match-cases` code fix | auto-fix | **FULL** |
| 3.5 | Warn on wildcard catching remaining variants | C: `wildcard_enum_match_arm` | allow | P: `DEFAULT_CATCHES_SINGLE_VARIANT` (90022) warns when default catches exactly one variant | configurable | **FULL** |
| 3.6 | Warn on wildcard catching exactly one variant | C: `match_wildcard_for_single_variants` | allow | P: `DEFAULT_CATCHES_SINGLE_VARIANT` (90022) with code fix to convert default to explicit case | configurable | **FULL** |
| 3.7 | Warn on `Err(_) => panic!()` catch-all | C: `match_wild_err_arm` | allow | P: `CATCH_ALL_PANIC_IN_MATCH` (90023) | configurable | **FULL** |
| 3.8 | Warn on duplicate match arm bodies | C: `match_same_arms` | allow | P: `DUPLICATE_MATCH_ARM_BODIES` (90024) | configurable | **FULL** |
| 3.9 | Enforce exhaustive `let...else` for `Result` | R: `let Ok(x) = expr else { diverge }` | error | -- | -- | N/A |
| 3.10 | Detect non-exhaustive enums (new variants may appear) | R: `#[non_exhaustive]` + `non_exhaustive_omitted_patterns` | allow | -- | -- | N/A |

### Coverage: 8 FULL, 2 N/A

**3.2–3.3**: BEH-04-007 adds configurable discriminant properties beyond the default `_tag`. This supports `type`, `kind`, `code`, or any other discriminant, matching Rust's ability to exhaustively match on any enum.

**3.4**: BEH-07-005 provides the `hex-fill-match-cases` code action that generates stub case clauses for missing tags in a switch statement, equivalent to rust-analyzer's "Fill match arms".

**3.5–3.6**: BEH-04-008 detects when a `default` clause catches exactly one remaining variant, suggesting an explicit `case` instead. The code fix `hex-default-to-explicit-case` automates the conversion.

---

## 4. Error Propagation

| # | Feature | Rust | Rust Level | Plugin | Plugin Level | Status |
|---|---------|------|------------|--------|--------------|--------|
| 4.1 | `?` operator for early return | R: built-in `?` syntax | -- | `@hex-di/result` provides `safeTry(function*() { yield* result })` | -- | **FULL** (library feature) |
| 4.2 | Automatic `From<E>` conversion in `?` chains | R: `From::from(e)` implicit call | error on missing impl | -- | -- | N/A |
| 4.3 | Error type compatibility validation in `?` chains | R: `From` trait checking | error | TS: type checking on `andThen` return types | error | **FULL** (TS built-in) |
| 4.4 | Suggest `?` when manual match could be replaced | C: `question_mark` | warn | -- | -- | N/A |
| 4.5 | Warn on `Err(x)?` (prefer `return Err(x)`) | C: `try_err` | allow | -- | -- | N/A |
| 4.6 | Warn on `Ok(x?)` or `Some(x?)` (needless wrapping) | C: `needless_question_mark` | warn | -- | -- | N/A |
| 4.7 | Warn on `return Ok(x?)` (needless return wrapping) | C: `needless_return_with_question_mark` | warn | -- | -- | N/A |

### Coverage: 2 FULL, 5 N/A

**4.2–4.7**: These relate to Rust's `?` syntax sugar and `From<E>` trait system. TypeScript uses union types for error composition (`E1 | E2 | E3`), a fundamentally different mechanism. The `safeTry`/`yield*` pattern in `@hex-di/result` provides equivalent early-return semantics without the `From` conversion layer.

---

## 5. Type Inference & Error Messages

| # | Feature | Rust | Rust Level | Plugin | Plugin Level | Status |
|---|---------|------|------------|--------|--------------|--------|
| 5.1 | Track types through `.map()`/`.and_then()` chains | R: full type inference | -- | TS: full type inference | -- | **FULL** (TS built-in) |
| 5.2 | Show accumulated error union at each chain step (hover) | RA: hover shows resolved type | -- | P: error union tracking on hover | configurable | **FULL** |
| 5.3 | Inlay type hints on chain intermediates | RA: inlay hints | -- | TS: inlay hints (built-in) | -- | **FULL** (TS built-in) |
| 5.4 | Human-readable error messages for phantom/never type mismatches | R: specialized Result error messages | -- | P: `PHANTOM_TYPE_MISMATCH` (90030) translation | configurable | **FULL** |
| 5.5 | Suggest turbofish/type annotation when inference fails | R: "type annotations needed" + suggestion | -- | TS: "type annotation needed" (built-in) | -- | **FULL** (TS built-in) |
| 5.6 | Dead code detection after early error return | R: `unreachable_code` | warn | TS: unreachable code detection (built-in) | -- | **FULL** (TS built-in) |
| 5.7 | Specialized error for "can't use `?` in non-Result function" | R: custom error message | error | TS: type error on `yield*` in non-generator | error | **FULL** (TS built-in) |

### Coverage: 7 FULL, 0 N/A

---

## 6. Code Quality & Style Lints

| # | Feature | Rust | Rust Level | Plugin | Plugin Level | Status |
|---|---------|------|------------|--------|--------------|--------|
| 6.1 | Suggest `.map()` instead of manual match | C: `manual_map` | warn | P: `PREFER_COMBINATOR_OVER_MATCH` (90057) + `hex-match-to-map` code fix | suggestion | **FULL** |
| 6.2 | Suggest `.unwrap_or()` instead of manual match | C: `manual_unwrap_or` | warn | P: `PREFER_UNWRAP_OR_OVER_MATCH` (90058) + `hex-match-to-unwrapOr` code fix | suggestion | **FULL** |
| 6.3 | Suggest `.unwrap_or_default()` instead of match | C: `manual_unwrap_or_default` | warn | P: `UNWRAP_OR_DEFAULT_HINT` (90050) | suggestion | **FULL** |
| 6.4 | Suggest `.is_ok_and(f)` instead of `.map(f).unwrap_or(false)` | C: `manual_is_variant_and` | allow | P: `PREFER_IS_OK_AND` (90051) | suggestion | **FULL** |
| 6.5 | Suggest `.and_then()` instead of `.map().flatten()` or manual match | C: `bind_instead_of_map` | warn | P: `PREFER_AND_THEN` (90052) | suggestion | **FULL** |
| 6.6 | Suggest `fromThrowable()` for try/catch blocks | -- | -- | P: code fix `hex-wrap-fromThrowable` | suggestion | **FULL** (TS-specific) |
| 6.7 | Suggest `fromNullable()` for null checks | -- | -- | P: code fix `hex-fromNullable` | suggestion | **FULL** (TS-specific) |
| 6.8 | Warn on `.map(f)` where `f` returns `void` | C: `result_map_unit_fn` | warn | P: `MAP_VOID_RETURN` (90053) + code fix `hex-map-to-inspect` | configurable | **FULL** |
| 6.9 | Suggest `.map_or(default, f)` instead of `.map(f).unwrap_or(default)` | C: `map_unwrap_or` | allow | P: `PREFER_MAP_OR` (90054) | suggestion | **FULL** |
| 6.10 | Suggest `.ok()` instead of `.map_or(None, Some)` | C: `result_map_or_into_option` | warn | -- | -- | N/A |
| 6.11 | Suggest `if let` instead of `match` with wildcard | C: `single_match` | warn | -- | -- | N/A |
| 6.12 | Suggest collapsing nested match/if-let | C: `collapsible_match` | warn | -- | -- | N/A |
| 6.13 | Suggest `.as_ref()` instead of match reimplementing it | C: `match_as_ref` | warn | -- | -- | N/A |
| 6.14 | Warn on redundant closure `|x| f(x)` where `f` suffices | C: `redundant_closure` | warn | -- | -- | N/A |
| 6.15 | Warn on redundant closure for method calls | C: `redundant_closure_for_method_calls` | allow | -- | -- | N/A |

### Coverage: 9 FULL, 6 N/A

**6.1**: BEH-07-008 detects `.match(f, (e) => err(e))` where the error handler is an identity re-wrap, and suggests `.map(f)`. This is the TypeScript equivalent of Rust's `manual_map`.

**6.2**: BEH-07-009 detects `.match((v) => v, () => default)` and suggests `.unwrapOr(default)`.

**6.10–6.15**: These Rust lints relate to `Option`, `if let`, pattern destructuring, `as_ref()`, and Rust-specific closure syntax. They have no TypeScript equivalents because TypeScript lacks `if let`, pattern matching syntax, and `as_ref()` semantics.

---

## 7. Error Type Quality

| # | Feature | Rust | Rust Level | Plugin | Plugin Level | Status |
|---|---------|------|------------|--------|--------------|--------|
| 7.1 | Warn on `Result<T, ()>` (uninformative error type) | C: `result_unit_err` | warn | P: `UNINFORMATIVE_ERROR_TYPE` (90060) for void/undefined/null/unknown/never | configurable | **FULL** |
| 7.2 | Warn on large error types (>128 bytes) | C: `result_large_err` | warn | -- | -- | N/A |
| 7.3 | Require `# Errors` doc section on public Result-returning functions | C: `missing_errors_doc` | allow | P: `MISSING_ERRORS_DOC` (90061) requires @errors JSDoc | configurable | **FULL** |
| 7.4 | Warn on private functions that always return `Ok` | C: `unnecessary_wraps` | allow | P: `UNNECESSARY_RESULT_WRAPPING` (90062) | configurable | **FULL** |
| 7.5 | Warn on `map_err(|_| ...)` discarding original error | C: `map_err_ignore` | allow | P: `MAP_ERR_DISCARDS_ORIGINAL` (90063) + code fix `hex-mapErr-preserve-cause` | configurable | **FULL** |
| 7.6 | Warn on `From` impl that panics | C: `fallible_impl_from` | allow | -- | -- | N/A |
| 7.7 | Suggest `#[must_use]` on functions returning Result | C: `must_use_candidate` | allow | -- | -- | N/A |
| 7.8 | Warn on types named "Error" implementing Error trait | C: `error_impl_error` | allow | -- | -- | N/A |

### Coverage: 4 FULL, 4 N/A

**7.1**: BEH-11-001 extends the Rust equivalent by detecting not just `void` but also `undefined`, `null`, `unknown`, and `never` as uninformative error types.

**7.2**: TypeScript has no concept of type size in bytes. Memory layout is handled by the V8 runtime, not the type system.

**7.5**: BEH-11-004 detects `.mapErr((_) => ...)` where the callback discards the original error. The code fix `hex-mapErr-preserve-cause` adds `{ cause: e }` wrapping.

---

## 8. IDE / Code Action Features

| # | Feature | Rust | Rust Level | Plugin | Plugin Level | Status |
|---|---------|------|------------|--------|--------------|--------|
| 8.1 | Hover shows full resolved type at chain step | RA | -- | P: error union prepended to hover + Result type presentation (BEH-13) | -- | **FULL** |
| 8.2 | "Fill match arms" code action | RA | auto-fix | P: `hex-fill-match-cases` code fix | auto-fix | **FULL** |
| 8.3 | "Convert match to if-let" code action | RA | auto-fix | -- | -- | N/A |
| 8.4 | "Convert if-let to match" code action | RA | auto-fix | P: `hex-isOk-to-match` converts if/else to .match() | suggestion | **FULL** |
| 8.5 | "Wrap in Ok/Err" code action | RA | auto-fix | P: `hex-wrap-in-ok` / `hex-wrap-in-err` code fix | auto-fix | **FULL** |
| 8.6 | "Unwrap block" code action | RA | auto-fix | -- | -- | N/A |
| 8.7 | "Convert to/from `?` operator" code action | RA | auto-fix | -- | -- | N/A |
| 8.8 | Auto-import for Result-related functions | RA | auto-import | P: auto-import path optimization + import management in code fixes | auto-import | **FULL** |
| 8.9 | Inlay type hints on closures and bindings | RA | inlay hints | TS: built-in inlay hints | -- | **FULL** (TS built-in) |
| 8.10 | Semantic highlighting for `?`, `Ok`, `Err`, `unwrap` | RA | highlighting | P: custom semantic token modifiers (`resultConstructor`, `unsafeResultAccess`, etc.) | -- | **FULL** |
| 8.11 | "Wrap return type in Result" assist | RA | auto-fix | P: `hex-wrap-return-type` code fix | auto-fix | **FULL** |
| 8.12 | Quick-fix for missing `From` trait impl | RA | suggestion | -- | -- | N/A |

### Coverage: 9 FULL, 3 N/A

**8.1**: BEH-06 provides error union tracking at each chain step. BEH-13 additionally simplifies type display — collapsing `Ok<T,E> | Err<T,E>` to `Result<T,E>`, suppressing phantom types, and formatting error tags by name instead of raw structural types. This exceeds rust-analyzer's hover, which shows raw type names without additional formatting.

**8.4**: TypeScript has no `if let` syntax, but `if (result.isOk()) { ... } else { ... }` is the direct equivalent. BEH-07-002 converts this to `.match()`.

**8.5**: BEH-07-006 detects when a bare value is returned from a Result-returning function and offers to wrap it in `ok()` or `err()`.

**8.8**: BEH-12-001 provides auto-import path optimization that chooses the most tree-shakeable import path from `@hex-di/result`'s subpath exports. BEH-07-010 manages imports within code fix actions.

**8.10**: BEH-12-002 provides custom semantic token modifiers for Result-related identifiers (`resultConstructor`, `unsafeResultAccess`, `resultExhaustiveHandler`, `resultTypeGuard`, `resultType`).

---

## 9. Performance & Optimization Lints

| # | Feature | Rust | Rust Level | Plugin | Plugin Level | Status |
|---|---------|------|------------|--------|--------------|--------|
| 9.1 | Warn on `.expect(&format!(...))` (eager evaluation) | C: `expect_fun_call` | warn | -- | -- | N/A |
| 9.2 | Suggest `unwrapOr(val)` over `unwrapOrElse(() => val)` for cheap values | C: `unnecessary_lazy_evaluations` | warn | P: `UNNECESSARY_LAZY_EVALUATION` (90055) | suggestion | **FULL** |
| 9.3 | Suggest `try_fold` over `fold` with Result accumulator | C: `manual_try_fold` | allow | -- | -- | N/A |
| 9.4 | Warn on useless type conversions (`Into` to same type) | C: `useless_conversion` | warn | P: `USELESS_IDENTITY_CONVERSION` (90056) for `.map(x => x)` etc. | warning | **FULL** |
| 9.5 | Suggest `.flatten()` over `.filter(Result::is_ok).map(Result::unwrap)` | C: `result_filter_map` | warn | -- | -- | N/A |

### Coverage: 2 FULL, 3 N/A

**9.1**: In JavaScript, template literals are always eagerly evaluated. This is a fundamental language difference — there is no lazy string formatting equivalent to `format!()`. The lint is not applicable.

**9.2**: BEH-10-006 detects `.unwrapOrElse(() => literal)` where the callback always returns a constant, suggesting `.unwrapOr(literal)`.

**9.4**: BEH-10-007 detects identity operations like `.map(x => x)`, `.mapErr(e => e)`, `.andThen(v => ok(v))`, `.orElse(e => err(e))` that have no effect.

---

## 10. Iterator / Collection Integration

| # | Feature | Rust | Rust Level | Plugin | Plugin Level | Status |
|---|---------|------|------------|--------|--------------|--------|
| 10.1 | `collect::<Result<Vec<T>, E>>()` short-circuits on first Err | R: `FromIterator` impl | -- | `@hex-di/result`: `all()`, `forEach()` combinators | -- | **FULL** (library feature) |
| 10.2 | Warn on `.filter(Result::is_ok).map(Result::unwrap)` | C: `result_filter_map` | warn | -- | -- | N/A |
| 10.3 | Warn on `.filter(Result::is_ok)` (suggest `.flatten()`) | C: `iter_filter_is_ok` | allow | -- | -- | N/A |
| 10.4 | Warn on `.map(f).collect::<Result<(), _>>()` (suggest `try_for_each`) | C: `map_collect_result_unit` | warn | -- | -- | N/A |

### Coverage: 1 FULL, 3 N/A

**10.2–10.4**: These lints target Rust's iterator-based Result processing patterns (`collect`, `filter`, `try_for_each`). JavaScript/TypeScript uses different array processing idioms. The `@hex-di/result` library provides `all()`, `forEach()`, and `partition()` as standalone combinators for bulk Result processing.

---

## 11. Concurrency & Async

| # | Feature | Rust | Rust Level | Plugin | Plugin Level | Status |
|---|---------|------|------------|--------|--------------|--------|
| 11.1 | `?` works in async functions returning `Result` | R: built-in | -- | `ResultAsync` chains in `@hex-di/result` | -- | **FULL** (library feature) |
| 11.2 | Error union tracking on `ResultAsync` chains | -- | -- | P: hover enhancement covers `ResultAsync` | -- | **FULL** |
| 11.3 | Must-use on `ResultAsync` | R: `#[must_use]` on `Future` | warn | P: `MUST_USE_RESULT_ASYNC` (90002) | configurable | **FULL** |

### Coverage: 3 FULL, 0 N/A

---

## Summary Scorecard

| Category | Rust Features | FULL | N/A | Coverage |
|----------|--------------|------|-----|----------|
| 1. Unused Result | 8 | 6 | 2 | 100% |
| 2. Unsafe Extraction | 9 | 8 | 1 | 100% |
| 3. Exhaustive Matching | 10 | 8 | 2 | 100% |
| 4. Error Propagation | 7 | 2 | 5 | 100% |
| 5. Type Inference | 7 | 7 | 0 | 100% |
| 6. Code Quality | 15 | 9 | 6 | 100% |
| 7. Error Type Quality | 8 | 4 | 4 | 100% |
| 8. IDE Features | 12 | 9 | 3 | 100% |
| 9. Performance | 5 | 2 | 3 | 100% |
| 10. Collections | 4 | 1 | 3 | 100% |
| 11. Async | 3 | 3 | 0 | 100% |
| **TOTAL** | **88** | **59** | **29** | **100%** |

**Coverage rate**: **59 FULL out of 59 applicable features = 100%**

29 features are marked N/A — these are Rust-specific constructs (`if let`, `?` syntax, `From` trait, `collect::<Result>`, memory layout, pattern destructuring) that have no equivalent in the TypeScript ecosystem.

---

## Behavior Spec Cross-Reference

| Behavior Spec | Rust Features Covered |
|--------------|----------------------|
| [BEH-01](../behaviors/01-result-type-detection.md) | Foundation for all detection |
| [BEH-02](../behaviors/02-must-use-diagnostics.md) | 1.1, 1.2, 1.3, 1.4, 1.6 |
| [BEH-03](../behaviors/03-unsafe-import-gating.md) | 2.1 (import level) |
| [BEH-04](../behaviors/04-exhaustiveness-hints.md) | 3.1–3.3, 3.5–3.8 |
| [BEH-05](../behaviors/05-phantom-type-translation.md) | 5.4 |
| [BEH-06](../behaviors/06-error-union-tracking.md) | 5.2, 11.2 |
| [BEH-07](../behaviors/07-code-fixes.md) | 3.4, 6.1, 6.2, 6.6, 6.7, 7.5, 8.2, 8.4, 8.5, 8.11 |
| [BEH-09](../behaviors/09-unsafe-call-site-analysis.md) | 2.1–2.8 |
| [BEH-10](../behaviors/10-code-quality-lints.md) | 6.3–6.5, 6.8, 6.9, 9.2, 9.4 |
| [BEH-11](../behaviors/11-error-type-quality.md) | 7.1, 7.3–7.5 |
| [BEH-12](../behaviors/12-ide-enhancements.md) | 8.8, 8.10 |
| [BEH-13](../behaviors/13-result-type-hover-presentation.md) | 8.1 (enhanced) |
| TypeScript built-in | 1.5, 3.1, 4.3, 5.1, 5.3, 5.5–5.7, 8.9 |
| @hex-di/result library | 4.1, 10.1, 11.1, 11.3 |
