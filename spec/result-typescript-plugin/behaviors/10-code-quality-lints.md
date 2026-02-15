# 10 — Code Quality Lints

Style and quality diagnostics that suggest idiomatic `@hex-di/result` patterns and prevent common mistakes. Closes Rust equivalents: `clippy::manual_unwrap_or_default`, `clippy::manual_is_variant_and`, `clippy::bind_instead_of_map`, `clippy::result_map_unit_fn`, `clippy::map_unwrap_or`, `clippy::unnecessary_lazy_evaluations`, `clippy::useless_conversion`.

All diagnostics in this category default to `suggestion` severity.

## BEH-10-001: Suggest unwrapOrDefault

Detect `.match(v => v, () => defaultValue)` or `.unwrapOr(defaultValue)` where `defaultValue` is the type's default value, and suggest `.unwrapOr(defaultValue)` or simplification.

More specifically, detect patterns equivalent to Rust's `unwrap_or_default()`:

```ts
// Detected: unwrapOr with type default value
result.unwrapOr("");         // string default
result.unwrapOr(0);          // number default
result.unwrapOr(false);      // boolean default
result.unwrapOr([]);         // array default
result.unwrapOr({});         // object default
```

This is informational only — `@hex-di/result` does not have `unwrapOrDefault()` because TypeScript has no `Default` trait. The diagnostic provides a hint when the default is a common "zero value":

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90050` (`UNWRAP_OR_DEFAULT_HINT`) |
| Category | `suggestion` |
| Message | `Result unwrapped with the type's default value ({value}). Consider if this default is intentional or if the error should be handled explicitly.` |

## BEH-10-002: Suggest isOkAnd / isErrAnd

Detect `.map(f).unwrapOr(false)` or equivalent patterns where the developer checks a predicate on the Ok value and gets a boolean result. Suggest `.isOkAnd(f)` instead.

**Detection targets**:

| Pattern | Suggestion |
|---------|------------|
| `result.map(f).unwrapOr(false)` where `f` returns `boolean` | `result.isOkAnd(f)` |
| `result.mapErr(f).unwrapOr(false)` where `f` returns `boolean` | `result.isErrAnd(f)` |
| `result.isOk() && predicate(result.value)` | `result.isOkAnd(predicate)` |
| `result.isErr() && predicate(result.error)` | `result.isErrAnd(predicate)` |

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90051` (`PREFER_IS_OK_AND`) |
| Category | `suggestion` |
| Message | `This pattern can be simplified to .isOkAnd(f) / .isErrAnd(f).` |

## BEH-10-003: Suggest andThen Over map + flatten

Detect `.map(f).flatten()` where `f` returns `Result<U, E>`, and suggest `.andThen(f)` instead. The `andThen` method combines mapping and flattening in one step.

**Detection targets**:

| Pattern | Suggestion |
|---------|------------|
| `result.map(f).flatten()` where `f: (T) => Result<U, E>` | `result.andThen(f)` |
| `pipe(result, map(f), flatten())` | `pipe(result, andThen(f))` |

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90052` (`PREFER_AND_THEN`) |
| Category | `suggestion` |
| Message | `.map(f).flatten() can be simplified to .andThen(f).` |

## BEH-10-004: Warn on map Returning void

Detect `.map(f)` where `f` returns `void` / `undefined`. This creates `Result<void, E>` which is rarely useful — the developer likely wants `.inspect(f)` (side-effect without changing the value) or `.andTee(f)` (side-effect with error suppression).

**Detection**:

1. The call is `.map(callback)` on a Result type
2. The return type of `callback` is `void` or `undefined` (via `checker.getTypeAtLocation()`)

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90053` (`MAP_VOID_RETURN`) |
| Category | Configurable: `warning` (default), `suggestion` |
| Message | `.map() callback returns void, creating Result<void, E>. Use .inspect() for side effects that should preserve the original value, or .andTee() for error-suppressing side effects.` |

**Code fix**: Offer to replace `.map(f)` with `.inspect(f)`:

| Fix ID | `hex-map-to-inspect` |
|--------|---------------------|
| Description | `Replace .map() with .inspect() (preserves original value)` |

## BEH-10-005: Suggest mapOr Over map + unwrapOr

Detect `.map(f).unwrapOr(defaultValue)` and suggest `.mapOr(defaultValue, f)` instead. The `mapOr` method combines mapping and extraction in one step.

**Detection targets**:

| Pattern | Suggestion |
|---------|------------|
| `result.map(f).unwrapOr(default)` | `result.mapOr(default, f)` |
| `result.map(f).unwrapOrElse(defaultFn)` | `result.mapOrElse(defaultFn, f)` |
| `pipe(result, map(f), unwrapOr(default))` | `pipe(result, mapOr(default, f))` |

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90054` (`PREFER_MAP_OR`) |
| Category | `suggestion` |
| Message | `.map(f).unwrapOr(default) can be simplified to .mapOr(default, f).` |

## BEH-10-006: Suggest unwrapOr Over unwrapOrElse for Literals

Detect `.unwrapOrElse(() => literal)` where the callback always returns a constant value. Since the callback adds no value (it doesn't use the error parameter and returns a static value), `.unwrapOr(literal)` is simpler.

**Detection**:

1. The call is `.unwrapOrElse(callback)` on a Result type
2. The callback does not reference its error parameter
3. The callback body is a single expression that is a literal (string, number, boolean, null, undefined, array literal, object literal) or a reference to a `const` variable

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90055` (`UNNECESSARY_LAZY_EVALUATION`) |
| Category | `suggestion` |
| Message | `.unwrapOrElse(() => {value}) can be simplified to .unwrapOr({value}). Use .unwrapOrElse() only when the default requires computation or uses the error.` |

## BEH-10-007: Warn on Useless Identity Conversions

Detect `.map(x => x)` (identity map), `.mapErr(e => e)` (identity mapErr), `.andThen(x => ok(x))` (identity bind), and `.orElse(e => err(e))` (identity orElse). These calls are no-ops.

**Detection targets**:

| Pattern | Issue |
|---------|-------|
| `result.map(x => x)` | Identity function — no transformation |
| `result.map(v => v)` | Same with different parameter name |
| `result.mapErr(e => e)` | Identity on error — no transformation |
| `result.andThen(v => ok(v))` | Wraps in Ok then immediately flattens — no-op |
| `result.orElse(e => err(e))` | Wraps in Err then immediately recovers — no-op |
| `result.mapBoth(v => v, e => e)` | Both sides are identity |

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90056` (`USELESS_IDENTITY_CONVERSION`) |
| Category | `warning` |
| Message | `Useless identity conversion: .{method}({param} => {param}) has no effect. Remove the call.` |

## BEH-10-008: Configuration

All code quality lints are grouped under a single config key:

```ts
interface CodeQualityConfig {
  /** Enable all code quality lints. Default: true */
  enabled?: boolean;
  /** Default severity for all code quality lints. Default: "suggestion" */
  severity?: "error" | "warning" | "suggestion";
  /** Individual lint overrides */
  preferIsOkAnd?: boolean;
  preferAndThen?: boolean;
  mapVoidReturn?: boolean | { severity?: "error" | "warning" | "suggestion" };
  preferMapOr?: boolean;
  unnecessaryLazyEvaluation?: boolean;
  uselessIdentityConversion?: boolean | { severity?: "error" | "warning" | "suggestion" };
}
```

Nested under the top-level plugin config as `codeQuality`.
