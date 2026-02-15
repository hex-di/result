# 09 — Unsafe Call-Site Analysis

Per-call-site detection of unsafe extraction patterns. Complements import-level gating ([03-unsafe-import-gating.md](03-unsafe-import-gating.md)) with granular call-site analysis. Closes Rust equivalents: `clippy::unwrap_used`, `clippy::expect_used`, `clippy::unwrap_in_result`, `clippy::panic_in_result_fn`, `clippy::panicking_unwrap`, `clippy::unnecessary_literal_unwrap`, `clippy::assertions_on_result_states`.

## BEH-09-001: Unwrap / Expect Call-Site Detection

Detect every individual call to `unwrap()` from `@hex-di/result/unsafe` or `.expect()` / `.expectErr()` instance methods, regardless of whether the import is allowed by `unsafeImportGating.allowPatterns`.

This is finer-grained than import gating — it flags each call site, not the import statement.

**Detection targets**:

| Call Pattern | Detected? |
|-------------|-----------|
| `unwrap(result)` (standalone from `@hex-di/result/unsafe`) | Yes |
| `unwrapErr(result)` (standalone) | Yes |
| `result.expect("message")` (instance method) | Yes |
| `result.expectErr("message")` (instance method) | Yes |

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90040` (`UNWRAP_CALL_SITE`) |
| Category | Configurable: `allow` (default), `warning`, `error` |
| Message | `Unsafe extraction: '{method}' will throw if the Result is {opposite variant}. Consider .match(), .unwrapOr(), or .unwrapOrElse() instead.` |
| Start | Start of the call expression |
| Length | Length of the call expression |

**Default**: `allow` — this diagnostic is opt-in, matching Clippy's `restriction` category. Import-level gating (BEH-03) is the primary defense; call-site detection is for codebases that want maximum strictness.

## BEH-09-002: Unwrap Inside Result-Returning Functions

Detect `unwrap()`, `unwrapErr()`, `.expect()`, or `.expectErr()` calls inside functions whose return type is `Result<T, E>` or `ResultAsync<T, E>`. A function that returns Result is declaring "I handle errors via Result" — using a throwing extractor inside it contradicts that contract.

**Detection**:

1. Find all function declarations and arrow functions in the source file
2. Check if the return type (declared or inferred) is `Result<T, E>` or `ResultAsync<T, E>`
3. Walk the function body for calls to `unwrap`, `unwrapErr`, `.expect()`, `.expectErr()`
4. Report each call site

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90041` (`UNWRAP_IN_RESULT_FN`) |
| Category | Configurable: `warning` (default), `error`, `suggestion` |
| Message | `Unsafe extraction inside a Result-returning function. This function returns Result but uses '{method}' which throws. Propagate the error with .andThen() or .mapErr() instead.` |
| Start | Start of the call expression |
| Length | Length of the call expression |

**Exceptions**:
- Calls inside nested functions/closures that do NOT return Result are not flagged (only the outermost Result-returning function scope counts)
- Calls inside `fromThrowable()` or `tryCatch()` wrappers are not flagged (the throw is handled)

## BEH-09-003: Throw Inside Result-Returning Functions

Detect `throw` statements inside functions whose return type is `Result<T, E>` or `ResultAsync<T, E>`. A function that returns Result should use `err()` instead of throwing.

**Detection**:

1. Find all function declarations and arrow functions with Result return type
2. Walk the function body for `ts.ThrowStatement` nodes
3. Report each throw statement

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90042` (`THROW_IN_RESULT_FN`) |
| Category | Configurable: `warning` (default), `error`, `suggestion` |
| Message | `throw statement inside a Result-returning function. Use 'return err(...)' instead of throwing to maintain the Result error channel.` |
| Start | Start of the throw statement |
| Length | Length of the throw statement |

**Exceptions**:
- Throws inside `catch` blocks are not flagged (re-throwing is a valid pattern)
- Throws inside nested functions/closures that do NOT return Result are not flagged
- `assertNever()` calls (which throw) are not flagged (exhaustiveness guards are intentional)

## BEH-09-004: Always-Panicking Unwrap

Detect `unwrap()` or `.expect()` calls where control-flow analysis proves the Result is in the `Err` variant, meaning the unwrap will always throw.

**Detection**:

1. After `if (result.isErr())` or `if (!result.isOk())`, within the truthy branch:
   - `result.expect("msg")` will always throw
   - `unwrap(result)` will always throw
2. After a type guard narrows the type to `Err<T, E>`:
   - Any `unwrap()` on the narrowed value will always throw

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90043` (`ALWAYS_PANICKING_UNWRAP`) |
| Category | `error` (not configurable — this is always a bug) |
| Message | `This unwrap/expect will always throw: the Result has been narrowed to Err at this point.` |
| Start | Start of the call expression |
| Length | Length of the call expression |

**Note**: This leverages TypeScript's control-flow narrowing. After `if (result.isErr())`, TypeScript narrows `result` to `Err<T, E>`, and calling `.expect()` on `Err` always throws.

Similarly, detect always-succeeding unwrap (after `isOk()` narrowing) and suggest accessing `.value` directly:

| Code | `90044` (`UNNECESSARY_UNWRAP`) |
|------|-------------------------------|
| Category | `suggestion` |
| Message | `Unnecessary unwrap: the Result has been narrowed to Ok at this point. Access .value directly.` |

## BEH-09-005: Literal Unwrap

Detect `unwrap()` or `.expect()` on a Result literal where the variant is statically known:

```ts
ok(42).expect("impossible");       // always succeeds — unwrap is unnecessary
err("fail").expect("should be ok"); // always throws — this is a bug
```

**Detection**:

1. The receiver of `.expect()` is a direct call to `ok()` or `err()`
2. `ok(value).expect(msg)` → always succeeds → suggest just using `value`
3. `err(error).expect(msg)` → always throws → report as error

**Diagnostic for unnecessary literal unwrap**:

| Field | Value |
|-------|-------|
| Code | `90045` (`LITERAL_UNWRAP`) |
| Category | `warning` |
| Message | `Unnecessary unwrap on ok() literal. The value '{value}' can be used directly.` |

**Diagnostic for always-failing literal unwrap**:

Uses `90043` (`ALWAYS_PANICKING_UNWRAP`) with message: `This expect() on err() will always throw.`

## BEH-09-006: Assert on Result State

Detect assertions on Result state that produce poor error messages:

```ts
// Poor — assertion message doesn't show the error value
console.assert(result.isOk());
expect(result.isOk()).toBe(true);  // in non-test files only

// Also detected in non-test code:
if (!result.isOk()) throw new Error("expected ok");
```

**Detection**:

1. `console.assert(result.isOk())` or `console.assert(result.isErr())`
2. Any call to an `assert`-like function with `result.isOk()` or `result.isErr()` as argument
3. Not detected in test files (files matching `**/*.test.ts`, `**/*.spec.ts`, `**/tests/**`)

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90046` (`ASSERT_RESULT_STATE`) |
| Category | Configurable: `suggestion` (default) |
| Message | `Asserting on Result state produces uninformative errors. Use .expect("message") or .match() to handle the error with context.` |

## BEH-09-007: Configuration

```ts
interface UnsafeCallSiteConfig {
  /** Enable per-call-site unwrap/expect detection. Default: false (opt-in) */
  unwrapCallSite?: boolean | {
    enabled?: boolean;
    severity?: "error" | "warning" | "suggestion" | "allow";
  };
  /** Warn on unwrap/expect inside Result-returning functions. Default: true */
  unwrapInResultFn?: boolean | {
    enabled?: boolean;
    severity?: "error" | "warning" | "suggestion";
  };
  /** Warn on throw inside Result-returning functions. Default: true */
  throwInResultFn?: boolean | {
    enabled?: boolean;
    severity?: "error" | "warning" | "suggestion";
  };
  /** Detect always-panicking or unnecessary unwrap. Default: true */
  alwaysPanickingUnwrap?: boolean;
  /** Detect literal unwrap on ok()/err(). Default: true */
  literalUnwrap?: boolean;
  /** Detect assert on Result state. Default: true */
  assertResultState?: boolean | {
    enabled?: boolean;
    severity?: "error" | "warning" | "suggestion";
  };
}
```

This is nested under the top-level plugin config as `unsafeCallSite`.
