# 11 — Error Type Quality Lints

Diagnostics that improve the quality and informativeness of error types in Result values. Closes Rust equivalents: `clippy::result_unit_err`, `clippy::missing_errors_doc`, `clippy::unnecessary_wraps`, `clippy::map_err_ignore`.

All diagnostics in this category default to `suggestion` severity unless otherwise noted.

## BEH-11-001: Warn on Uninformative Error Types

Detect `Result<T, E>` where `E` is `void`, `undefined`, `null`, `unknown`, or `never` in function return types. These error types carry no information about what went wrong, making error handling meaningless.

**Detection**:

1. Find all function declarations, method declarations, and arrow functions
2. Check if the return type (declared or inferred) is `Result<T, E>` or `ResultAsync<T, E>`
3. Extract `E` and check if it is one of the uninformative types

**Detection targets**:

| Error Type | Issue |
|-----------|-------|
| `void` | `err(undefined)` — no information about the failure |
| `undefined` | Same as `void` — no error payload |
| `null` | `err(null)` — no information about the failure |
| `unknown` | Error type is untyped — callers cannot safely inspect it |
| `never` | Impossible error — the function can never fail, `Result` wrapping is unnecessary |

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90060` (`UNINFORMATIVE_ERROR_TYPE`) |
| Category | Configurable: `suggestion` (default), `warning`, `error` |
| Message (void/undefined/null) | `Result error type is '{type}' which carries no information. Use a descriptive error type (e.g., createError("...")) so callers can understand and handle failures.` |
| Message (unknown) | `Result error type is 'unknown'. Use a specific error type so callers can safely inspect and handle errors without type assertions.` |
| Message (never) | `Result error type is 'never', meaning this function can never fail. Consider returning T directly instead of Result<T, never>.` |
| Start | Start of the return type annotation (or function name if inferred) |
| Length | Length of the return type annotation (or function signature) |

**Exceptions**:
- Generic functions where `E` is a type parameter are not flagged (the caller provides the error type)
- Functions in test files (matching `**/*.test.ts`, `**/*.spec.ts`, `**/tests/**`) are not flagged
- `Result<void, E>` where the VALUE is void is NOT detected by this rule (a void success value is valid for side-effect operations)

## BEH-11-002: Require @errors JSDoc on Public Result-Returning Functions

Detect exported functions that return `Result<T, E>` or `ResultAsync<T, E>` without an `@errors` or `@throws` JSDoc tag. Public functions should document their failure modes.

**Detection**:

1. Find all function declarations, method declarations, and variable declarations with arrow function initializers
2. Filter to only those with the `export` modifier (or are members of an exported class/interface)
3. Check if the return type is `Result<T, E>` or `ResultAsync<T, E>`
4. Check if the function has a JSDoc comment containing `@errors` or `@throws`
5. If no documentation tag is found, emit diagnostic

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90061` (`MISSING_ERRORS_DOC`) |
| Category | Configurable: `suggestion` (default), `warning` |
| Message | `Exported function returns Result but has no @errors JSDoc tag. Document the error conditions so callers know what failures to expect.` |
| Start | Start of the function name |
| Length | Length of the function name |

**What counts as documented**:

```ts
/**
 * Fetches a user by ID.
 * @errors NotFoundError if the user doesn't exist
 * @errors ForbiddenError if the caller lacks permission
 */
export function getUser(id: string): Result<User, GetUserError> { ... }

/**
 * @throws {NotFoundError} when the resource is missing
 */
export function getResource(id: string): Result<Resource, NotFoundError> { ... }
```

Both `@errors` and `@throws` tags are accepted. The tag content is not validated — any non-empty documentation satisfies the lint.

**Exceptions**:
- Non-exported (private/internal) functions are not flagged
- Functions that override an interface method are not flagged (the interface should document errors)
- Functions in test files are not flagged
- Functions with `@internal` JSDoc tag are not flagged

## BEH-11-003: Detect Unnecessary Result Wrapping

Detect private/internal functions that always return `ok(...)` and never return `err(...)` or call functions that could produce `Err`. The `Result` wrapping adds no value — the function could return `T` directly.

**Detection**:

1. Find all function declarations and arrow functions that are NOT exported
2. Check if the return type is `Result<T, E>` or is inferred as `Ok<T, never>`
3. Walk the function body:
   - Collect all `return` statements and their expressions
   - Check if ANY return expression is an `err()` call → if yes, skip (wrapping is justified)
   - Check if the function calls any function returning `Result` and uses propagation patterns (`andThen`, `yield*`, etc.) → if yes, skip
   - Check if ALL return expressions are `ok(value)` calls or the implicit return is an `ok()` → flag
4. Also detect via inferred return type: if TypeScript infers the return type as `Ok<T, never>` (the `E` parameter is `never`), the function can never fail

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90062` (`UNNECESSARY_RESULT_WRAPPING`) |
| Category | Configurable: `suggestion` (default), `warning` |
| Message | `Function always returns Ok — the Result wrapping is unnecessary. Consider returning '{T}' directly.` |
| Start | Start of the function name |
| Length | Length of the function name |

**Exceptions**:
- Exported functions are not flagged (they may need the Result type for API compatibility)
- Functions that satisfy an interface or type alias expecting a Result return are not flagged
- Functions that are arguments to higher-order functions expecting `() => Result<T, E>` are not flagged
- Short functions (≤ 3 statements) are not flagged when they contain a single `return ok(value)` — this pattern is common for factory functions and adapters
- Async functions returning `ResultAsync<T, E>` are not flagged if they await other async operations (which could theoretically fail at runtime even if not typed as such)

## BEH-11-004: Warn on mapErr Discarding Original Error

Detect `.mapErr(callback)` where the callback does not reference its error parameter, discarding the original error information. This makes debugging difficult because the original cause is lost.

**Detection**:

1. The call is `.mapErr(callback)` on a Result type
2. The callback has exactly one parameter
3. The parameter name starts with `_` (conventional unused marker) OR the parameter is never referenced in the callback body
4. The callback returns a new error (not the parameter)

**Detection targets**:

| Pattern | Issue |
|---------|-------|
| `.mapErr((_) => new AppError("failed"))` | Original error discarded |
| `.mapErr((_e) => createError("Mapped")())` | Original error discarded (underscore prefix) |
| `.mapErr(() => "error")` | No parameter at all — original error unavailable |
| `pipe(result, mapErr((_) => ...))` | Standalone function form |

**Not detected** (these are valid):

| Pattern | Why valid |
|---------|-----------|
| `.mapErr((e) => new AppError("failed", { cause: e }))` | Original error preserved as cause |
| `.mapErr((e) => ({ ...e, context: "extra" }))` | Original error spread into new error |
| `.mapErr((e) => wrapError(e))` | Original error passed to wrapping function |

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90063` (`MAP_ERR_DISCARDS_ORIGINAL`) |
| Category | Configurable: `suggestion` (default), `warning` |
| Message | `.mapErr() callback discards the original error. Preserve the original error as a 'cause' property for debugging: .mapErr((e) => new Error("...", { cause: e })).` |
| Start | Start of the callback expression |
| Length | Length of the callback expression |

**Code fix**: Offer to add the error parameter and wrap it:

| Fix ID | `hex-mapErr-preserve-cause` |
|--------|---------------------------|
| Description | `Preserve original error as cause in .mapErr()` |

Before:
```ts
result.mapErr((_) => new AppError("operation failed"))
```

After:
```ts
result.mapErr((e) => new AppError("operation failed", { cause: e }))
```

## BEH-11-005: Configuration

```ts
interface ErrorTypeQualityConfig {
  /** Enable all error type quality lints. Default: true */
  enabled?: boolean;
  /** Warn on uninformative error types (void, undefined, unknown, never). Default: true */
  uninformativeErrorType?: boolean | {
    enabled?: boolean;
    severity?: "error" | "warning" | "suggestion";
    /** Additional types to consider uninformative. Default: [] */
    additionalTypes?: string[];
  };
  /** Require @errors JSDoc on exported Result-returning functions. Default: false (opt-in) */
  missingErrorsDoc?: boolean | {
    enabled?: boolean;
    severity?: "warning" | "suggestion";
  };
  /** Warn on private functions that always return Ok. Default: true */
  unnecessaryResultWrapping?: boolean | {
    enabled?: boolean;
    severity?: "warning" | "suggestion";
  };
  /** Warn on .mapErr() discarding original error. Default: true */
  mapErrDiscardsOriginal?: boolean | {
    enabled?: boolean;
    severity?: "warning" | "suggestion";
  };
}
```

Nested under the top-level plugin config as `errorTypeQuality`.

**Defaults**: `missingErrorsDoc` defaults to `false` (opt-in) because many codebases don't enforce JSDoc documentation. All other lints default to `true`.
