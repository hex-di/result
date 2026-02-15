# 13 — Result Type Hover Presentation

Enhance the hover tooltip presentation for `Result<T, E>`, `Ok<T, E>`, `Err<T, E>`, `ResultAsync<T, E>`, and structured error types produced by `createError()` and `createErrorGroup()`. This capability is editor-only (Language Service Plugin) — the compiler transformer does not run it.

## Motivation

TypeScript's default hover display produces noisy, hard-to-read tooltips for Result and error types:

| Context | Current (native TypeScript) | Problem |
|---------|---------------------------|---------|
| Variable typed `Result<User, AppError>` | `Ok<User, AppError> \| Err<User, AppError>` | Expanded union instead of the alias name |
| Ok value after narrowing | `Ok<User, AppError>` | Phantom `AppError` parameter is confusing — Ok doesn't carry errors |
| Err value after narrowing | `Err<User, AppError>` | Phantom `User` parameter is confusing — Err doesn't carry success values |
| Error from `createError("NotFound")` | `Readonly<{ _tag: "NotFound"; readonly resource: string; readonly id: string }>` | Raw structural type with `Readonly<>` wrapper noise |
| Error from `createErrorGroup("Http").create("NotFound")` | `Readonly<{ _namespace: "Http"; _tag: "NotFound"; readonly url: string; readonly status: number }>` | Two-level discrimination buried in noise |
| Error union `E` in Result | `Readonly<{ _tag: "NotFound"; ... }> \| Readonly<{ _tag: "Timeout"; ... }> \| Readonly<{ _tag: "ParseFailed"; ... }>` | Unreadable wall of expanded structural types |
| `ResultAsync<T, E>` variable | `ResultAsync<User, Readonly<{ _tag: "NotFound" } & { resource: string }>>` | Nested intersections and structural noise |

The plugin rewrites these hover tooltips into clean, human-readable presentations that surface the information developers actually need: variant names, error tag taxonomy, and meaningful type parameters — while suppressing phantom types and structural boilerplate.

## BEH-13-001: Result Type Display Simplification

When the cursor hovers over a variable or expression whose type is `Result<T, E>`, the plugin replaces TypeScript's expanded union form with the alias name.

**Detection**:

1. The hover position is on a `ts.Identifier` or `ts.Expression`
2. The type at that position (via `checker.getTypeAtLocation()`) is identified as a `Result<T, E>` by `result-type-checker.ts`
3. The type is a union of `Ok<T, E> | Err<T, E>` (TypeScript's expansion of the `Result` alias)

**Rewrite rule**:

Replace the `displayParts` type string:

```
// Before (native TypeScript):
const user: Ok<User, AppError> | Err<User, AppError>

// After (plugin-enhanced):
const user: Result<User, AppError>
```

When the error type `E` is a tagged union (from `createError` or `createErrorGroup`), the plugin formats the error type as a tag-name list:

```
// Before:
const user: Ok<User, Readonly<{ _tag: "NotFound"; ... }> | Readonly<{ _tag: "Timeout"; ... }>> | Err<User, ...>

// After:
const user: Result<User, NotFound | Timeout>
```

**Documentation section** (appended below the display parts):

```
Result type from @hex-di/result
  Ok → User
  Err → NotFound | Timeout
```

When `E` is a union of grouped errors, the documentation uses namespace-qualified names:

```
Result type from @hex-di/result
  Ok → User
  Err → Http.NotFound | Http.Timeout | Validation.InvalidField
```

**Exceptions**:

- If the original `QuickInfo` already uses the `Result<T, E>` alias name (not expanded), only the documentation section is added
- If the type is not from `@hex-di/result` (i.e., `result-type-checker.ts` cannot confirm origin), no rewriting occurs

## BEH-13-002: Phantom Type Suppression in Ok/Err

When hovering over a narrowed `Ok<T, E>` or `Err<T, E>` value, suppress the phantom type parameter that carries no runtime information.

**Detection**:

1. The type at the hover position is `Ok<T, E>` or `Err<T, E>` (not a union — i.e., narrowed via `isOk()`, `isErr()`, or control flow)
2. For `Ok<T, E>`: the `E` parameter is phantom (not accessible at runtime)
3. For `Err<T, E>`: the `T` parameter is phantom (not accessible at runtime)

**Rewrite rules**:

For `Ok`:

```
// Before:
const val: Ok<User, NotFoundError | TimeoutError>

// After:
const val: Ok<User>
```

For `Err`:

```
// Before:
const err: Err<User, NotFoundError>

// After:
const err: Err<NotFoundError>
```

**Documentation section**:

For `Ok`:
```
Narrowed Result — success variant
  value: User
  (error type suppressed: NotFoundError | TimeoutError)
```

For `Err`:
```
Narrowed Result — error variant
  error: NotFoundError
  (success type suppressed: User)
```

**Edge case — `never` phantom types**:

When the phantom parameter is `never` (from `ok()` or `err()` factory functions before widening), the suppression applies identically but the documentation omits the "suppressed" note since `never` carries no information:

```
// ok(42) produces Ok<number, never>

// Before:
const val: Ok<number, never>

// After:
const val: Ok<number>

// Documentation:
Ok value
  value: number
```

## BEH-13-003: Structured Error Type Presentation

When hovering over a variable whose type is a structured error produced by `createError()`, present it with the tag name prominent and fields listed cleanly.

**Detection**:

1. The type at the hover position has a `_tag` property with a literal string type
2. The type structurally matches the `createError` output: `Readonly<{ _tag: Tag } & Fields>`
3. Optionally confirmed via symbol origin tracing to `@hex-di/result/errors`

**Rewrite rule for display parts**:

```
// Before:
const error: Readonly<{ _tag: "NotFound"; readonly resource: string; readonly id: string }>

// After:
const error: NotFound
```

The tag name from `_tag` becomes the display name.

**Documentation section**:

```
Error type (from createError)
  _tag: "NotFound"
  resource: string
  id: string
```

**Formatting rules**:

1. The `_tag` property is always listed first
2. The `readonly` modifier is stripped from field display (all fields are readonly by construction — showing it is noise)
3. The `Readonly<>` wrapper is stripped from the display name
4. Fields are listed one per line with their types
5. If the type has no additional fields beyond `_tag`, the documentation shows just the tag:

```
Error type (from createError)
  _tag: "NotFound"
  (no additional fields)
```

## BEH-13-004: Grouped Error Type Presentation

When hovering over a variable whose type is a structured error produced by `createErrorGroup()`, present it with the namespace-qualified tag name.

**Detection**:

1. The type at the hover position has both `_namespace` and `_tag` properties with literal string types
2. The type structurally matches the `createErrorGroup` output: `Readonly<{ _namespace: NS; _tag: Tag } & Fields>`

**Rewrite rule for display parts**:

```
// Before:
const error: Readonly<{ _namespace: "Http"; _tag: "NotFound"; readonly url: string; readonly status: number }>

// After:
const error: Http.NotFound
```

The display name is `{_namespace}.{_tag}`.

**Documentation section**:

```
Error type (from createErrorGroup)
  _namespace: "Http"
  _tag: "NotFound"
  url: string
  status: number
```

**Formatting rules**:

1. `_namespace` is listed first, then `_tag`, then remaining fields
2. Same stripping of `readonly` and `Readonly<>` as BEH-13-003
3. The namespace.tag dot notation is used consistently wherever this error type appears in other hover enhancements (BEH-13-001 error union display, BEH-06 error union tracking)

## BEH-13-005: Error Union Type Presentation

When hovering over a type that is a union of structured errors (the `E` position in `Result<T, E>` or a standalone error union variable), present each variant as a named tag with its fields summarized.

**Detection**:

1. The type at the hover position is a union type
2. Every member of the union has a `_tag` property with a literal string type (i.e., it is a tagged error union)

**Rewrite rule for display parts**:

```
// Before:
const error: Readonly<{ _tag: "NotFound"; readonly resource: string }> | Readonly<{ _tag: "Timeout"; readonly duration: number }> | Readonly<{ _tag: "ParseFailed"; readonly raw: string }>

// After:
const error: NotFound | Timeout | ParseFailed
```

**Documentation section** — expanded variant list:

```
Tagged error union (3 variants)
  | NotFound { resource: string }
  | Timeout { duration: number }
  | ParseFailed { raw: string }
```

For grouped errors (with `_namespace`):

```
// Before:
const error: Readonly<{ _namespace: "Http"; _tag: "NotFound"; ... }> | Readonly<{ _namespace: "Http"; _tag: "Timeout"; ... }> | Readonly<{ _namespace: "Db"; _tag: "ConnectionFailed"; ... }>

// After:
const error: Http.NotFound | Http.Timeout | Db.ConnectionFailed
```

**Documentation section** — grouped by namespace:

```
Tagged error union (3 variants, 2 groups)
  Http (2 variants)
    | NotFound { url: string, status: number }
    | Timeout { url: string, duration: number }
  Db (1 variant)
    | ConnectionFailed { host: string, port: number }
```

**Mixed unions** (some members have `_namespace`, some do not):

```
Tagged error union (3 variants)
  | NotFound { resource: string }
  Http (2 variants)
    | Timeout { url: string, duration: number }
    | ServerError { url: string, status: number }
```

Ungrouped variants are listed first, then grouped variants sorted by namespace.

**Truncation**: If the union has more than 10 variants, variants beyond the 10th are collapsed:

```
Tagged error union (15 variants)
  | NotFound { resource: string }
  | Timeout { duration: number }
  ... (8 more variants)
  | ParseFailed { raw: string }
  ... and 5 more
```

The first 8 and last 2 are shown; the middle is collapsed. This prevents hover popups from becoming unwieldy.

## BEH-13-006: ResultAsync Presentation

When hovering over a `ResultAsync<T, E>` variable, apply the same simplification rules as `Result<T, E>`, plus indicate the async nature.

**Rewrite rule for display parts**:

```
// Before:
const result: ResultAsync<User, Readonly<{ _tag: "NotFound"; ... }> | Readonly<{ _tag: "Timeout"; ... }>>

// After:
const result: ResultAsync<User, NotFound | Timeout>
```

**Documentation section**:

```
ResultAsync type from @hex-di/result (awaitable)
  Ok → User
  Err → NotFound | Timeout

  Await this value to get Result<User, NotFound | Timeout>
```

The "(awaitable)" marker and await hint help developers understand that `ResultAsync` implements `PromiseLike` and can be `await`ed to get a synchronous `Result`.

## BEH-13-007: Interaction with Error Union Tracking (BEH-06)

When both BEH-06 (error union tracking) and BEH-13 (type presentation) are active, BEH-06's `(error union)` line uses BEH-13's formatting for the error type:

```
// Before (BEH-06 without BEH-13):
(error union) Readonly<{ _tag: "ValidationError"; ... }> | Readonly<{ _tag: "DbError"; ... }> | Readonly<{ _tag: "NotifyError"; ... }>

// After (BEH-06 with BEH-13):
(error union) ValidationError | DbError | NotifyError
```

BEH-13 formatting is applied to the error union string produced by BEH-06 before it is prepended to the hover display. If BEH-13 is disabled but BEH-06 is enabled, the raw `checker.typeToString()` output is used (existing behavior).

## BEH-13-008: Display Parts Construction

The plugin constructs `ts.SymbolDisplayPart[]` arrays using the appropriate `kind` values for syntax highlighting in the editor:

| Content | `SymbolDisplayPart.kind` | Example |
|---------|-------------------------|---------|
| `Result`, `Ok`, `Err`, `ResultAsync` | `"aliasName"` | `Result` in blue/teal |
| Type parameter names (`User`, `string`, etc.) | `"aliasName"` or `"keyword"` | As appropriate |
| Error tag names (`NotFound`, `Timeout`) | `"className"` | `NotFound` in type color |
| Namespace names (`Http`, `Db`) | `"moduleName"` | `Http` in module color |
| Punctuation (`<`, `>`, `|`, `.`, `,`) | `"punctuation"` | Standard punctuation color |
| Keywords (`const`, `let`, `type`) | `"keyword"` | Standard keyword color |
| Documentation text | `"text"` | Default text color |

The `kind` values correspond to VS Code's semantic token types and produce appropriate syntax highlighting in the hover tooltip.

## BEH-13-009: Hover Presentation Precedence

When multiple hover enhancements could apply to the same position, they are composed in this order:

1. **BEH-06**: Error union tracking line is prepended (if on a chain method)
2. **BEH-13**: Type presentation rewrites the display parts and adds documentation
3. **Original TypeScript QuickInfo**: Preserved as the base; plugin enhancements modify or extend it

If the original QuickInfo has documentation (from JSDoc), the plugin's documentation is prepended before the original documentation, separated by a blank line:

```
Result type from @hex-di/result          ← plugin documentation
  Ok → User
  Err → NotFound | Timeout

Fetches a user by ID.                    ← original JSDoc
@param id - The user's unique identifier
@returns The user if found
```

## BEH-13-010: Non-Result Types Are Never Modified

The plugin only modifies hover display for types that are confirmed to originate from `@hex-di/result` via `result-type-checker.ts`. Types from other libraries that happen to have similar structure (e.g., a third-party `Result` type or objects with `_tag` properties) are never modified.

**Detection boundary**:

- `Result`, `Ok`, `Err`, `ResultAsync` — confirmed via symbol origin tracing to `@hex-di/result`
- Structured errors with `_tag` — confirmed via symbol origin tracing to `@hex-di/result/errors` (from `createError`/`createErrorGroup`) OR by checking if the error type appears in the `E` position of a confirmed `Result<T, E>` type

This prevents false positives when other libraries use discriminated unions with `_tag` or `_namespace` properties.

## BEH-13-011: Function Return Type Summary

When hovering over a function name (at its declaration or at a call site) whose return type is `Result<T, E>` or `ResultAsync<T, E>`, display a structured outcome summary below the standard signature.

**Detection**:

1. The hover position is on a `ts.FunctionDeclaration`, `ts.ArrowFunction`, `ts.MethodDeclaration`, or a `ts.CallExpression` callee
2. The function's return type (via `checker.getReturnTypeOfSignature()`) is `Result<T, E>` or `ResultAsync<T, E>`

**Documentation section — simple error type**:

```ts
function getUser(id: string): Result<User, NotFoundError>
```

```
Returns Result
  Ok → User
  Err → NotFoundError { resource: string, id: string }
```

**Documentation section — tagged error union**:

```ts
function processOrder(order: Order): Result<Receipt, OrderError>
```

```
Returns Result (3 possible errors)
  Ok → Receipt
  Err → OutOfStock { productId: string, requested: number }
     |  PaymentFailed { gateway: string, reason: string }
     |  ShippingUnavailable { region: string }
```

**Documentation section — grouped errors**:

```ts
function syncData(source: DataSource): Result<SyncReport, SyncError>
```

```
Returns Result (5 possible errors, 2 groups)
  Ok → SyncReport
  Err →
    Db (2 variants)
      | ConnectionFailed { host: string }
      | QueryTimeout { query: string, duration: number }
    Api (3 variants)
      | Unauthorized { endpoint: string }
      | RateLimited { retryAfter: number }
      | ServerError { status: number, body: string }
```

**Call site hover**: When hovering over a function call (not the declaration), the same summary is appended. If the function has `@errors` JSDoc documentation (see BEH-11-002), the JSDoc description is shown alongside each variant:

```ts
/**
 * @errors NotFoundError - User does not exist in the database
 * @errors PermissionError - Caller lacks read access to this user
 */
function getUser(id: string): Result<User, NotFoundError | PermissionError>
```

```
Returns Result (2 possible errors)
  Ok → User
  Err → NotFoundError { resource: string, id: string }
              User does not exist in the database
     |  PermissionError { requiredRole: string }
              Caller lacks read access to this user
```

**ResultAsync variant**: Same layout, with the awaitable marker:

```
Returns ResultAsync (awaitable, 2 possible errors)
  Ok → User
  Err → NotFoundError | PermissionError
```

**Edge cases**:

- If `E` is `never` (function always succeeds), show: `Returns Result (infallible) — Ok → User`
- If `E` is `unknown` or `Error`, show the raw type without variant expansion: `Returns Result — Ok → User, Err → unknown`
- If the return type is a complex conditional type, fall back to TypeScript's native display

## BEH-13-012: Chain Transformation Visualization

When hovering over a chaining method (`.map`, `.andThen`, `.mapErr`, `.orElse`, `.mapBoth`, `.flatten`, `.flip`) on a Result, show the full type transformation — both `T` and `E` — not just the error union from BEH-06.

**Detection**: Same as BEH-06-001, but this enhancement adds the `T` transformation alongside the `E` tracking.

**Documentation section**:

```ts
ok<RawInput, never>(rawInput)
  .map(sanitize)           // hover on "map":
  .andThen(validate)       // hover on "andThen":
  .andThen(save)           // hover on "save":
  .mapErr(toAppError)      // hover on "mapErr":
```

Hover on `.map(sanitize)`:

```
(chain step) map: sanitize
  T: RawInput → Sanitized
  E: never (unchanged)
  Result<Sanitized, never>
```

Hover on `.andThen(validate)`:

```
(chain step) andThen: validate
  T: Sanitized → Valid
  E: never → ValidationError   (+ ValidationError)
  Result<Valid, ValidationError>
```

Hover on `.andThen(save)`:

```
(chain step) andThen: save
  T: Valid → Saved
  E: ValidationError → ValidationError | DbError   (+ DbError)
  Result<Saved, ValidationError | DbError>
```

Hover on `.mapErr(toAppError)`:

```
(chain step) mapErr: toAppError
  T: Saved (unchanged)
  E: ValidationError | DbError → AppError
  Result<Saved, AppError>
```

**New errors marker**: When `andThen` or `orElse` introduces new error variants, they are annotated with `(+ NewVariant)` to clearly show what was added at this step.

**Transformation summary for each method type**:

| Method | T transformation | E transformation |
|--------|-----------------|------------------|
| `.map(f)` | `T → U` (f's return) | unchanged |
| `.mapErr(f)` | unchanged | `E → F` (f's return) |
| `.mapBoth(fOk, fErr)` | `T → U` | `E → F` |
| `.andThen(f)` | `T → U` | `E → E \| F` (union grows) |
| `.orElse(f)` | `T → T \| U` (union grows) | `E → F` (replaced) |
| `.flatten()` | `Result<U, E2> → U` | `E → E \| E2` (union grows) |
| `.flip()` | `T → E` (swapped) | `E → T` (swapped) |
| `.andThrough(f)` | unchanged | `E → E \| F` (union grows) |

**Interaction with BEH-06**: BEH-13-012 supersedes BEH-06's error-only line when active. If BEH-13-012 is disabled but BEH-06 is enabled, the original error-only line is shown. When both are active, BEH-13-012's richer format replaces BEH-06's `(error union)` line.

## BEH-13-013: Unsafe Method Danger Indicator

When hovering over an unsafe method (`.expect()`, `.expectErr()`) or an unsafe standalone function (`unwrap`, `unwrapErr` from `@hex-di/result/unsafe`), show a warning with the types that could cause a panic.

**Detection**:

1. The hover position is on an unsafe method name or function call
2. The receiver type is `Result<T, E>`, `Ok<T, E>`, or `Err<T, E>`

**Documentation section — `.expect()` on Result<T, E>**:

```ts
const user = getUser(id);
user.expect("user should exist");   // hover on "expect"
```

```
!! UNSAFE — panics on Err variant

Throws if this Result is Err. Error types that would cause panic:
  | NotFoundError { resource: string, id: string }
  | PermissionError { requiredRole: string }

Consider safe alternatives:
  .unwrapOr(defaultUser)     → User
  .unwrapOrElse(handleErr)   → User
  .match(onOk, onErr)        → A | B
```

**Documentation section — `.expect()` on narrowed Ok<T, E>**:

```ts
if (result.isOk()) {
  result.expect("safe");   // hover on "expect"
}
```

```
Safe — this Result is narrowed to Ok<User>
  .expect() will never throw in this branch
```

**Documentation section — `.expect()` on narrowed Err<T, E>**:

```ts
if (result.isErr()) {
  result.expect("will throw");   // hover on "expect"
}
```

```
!! ALWAYS PANICS — this Result is narrowed to Err

Error value: NotFoundError { resource: string, id: string }

This .expect() call will always throw. Did you mean .expectErr()?
```

**Documentation section — `unwrap()` from `@hex-di/result/unsafe`**:

```ts
import { unwrap } from "@hex-di/result/unsafe";
const user = unwrap(getUser(id));   // hover on "unwrap"
```

```
!! UNSAFE — panics on Err variant (imported from @hex-di/result/unsafe)

Throws if the Result is Err. Error types that would cause panic:
  | NotFoundError { resource: string, id: string }

Consider safe alternatives:
  result.unwrapOr(defaultUser)
  result.match(onOk, onErr)
```

## BEH-13-014: Match Completeness Indicator

When hovering over `.match()` on a Result whose `E` is a tagged union, show the match coverage status and the list of handled/unhandled variants.

**Detection**:

1. The hover position is on the `.match` identifier of a `CallExpression`
2. The receiver type is `Result<T, E>` where `E` is a tagged union

**Documentation section — complete match**:

```ts
result.match(
  user => renderProfile(user),
  err => {
    switch (err._tag) {
      case "NotFound": return renderNotFound();
      case "Forbidden": return renderForbidden();
    }
  }
);
```

```
match — exhaustive (2/2 error variants handled)
  Ok → (value: User) => JSX.Element
  Err →
    [x] NotFound    → renderNotFound()
    [x] Forbidden   → renderForbidden()
```

**Documentation section — incomplete match**:

```ts
result.match(
  user => renderProfile(user),
  err => renderError(err)    // generic handler, doesn't switch on _tag
);
```

```
match — generic error handler (3 error variants)
  Ok → (value: User) => JSX.Element
  Err → (error: NotFound | Forbidden | RateLimited) => JSX.Element
    Unhandled variants: NotFound, Forbidden, RateLimited
    Consider switching on err._tag for exhaustive handling
```

**Documentation section — partial match with default**:

```ts
result.match(
  user => renderProfile(user),
  err => {
    switch (err._tag) {
      case "NotFound": return renderNotFound();
      default: return renderGenericError(err);
    }
  }
);
```

```
match — partial (1/3 explicit, 2 caught by default)
  Ok → (value: User) => JSX.Element
  Err →
    [x] NotFound            → renderNotFound()
    [~] Forbidden           → default (renderGenericError)
    [~] RateLimited         → default (renderGenericError)
```

**Marker legend**: `[x]` = explicitly handled, `[~]` = caught by default/catch-all, `[ ]` = unhandled.

## BEH-13-015: Discriminant Value List on Property Access

When hovering over the `._tag` or `._namespace` property access on an error type, show all possible values.

**Detection**:

1. The hover position is on a `ts.PropertyAccessExpression` where the property name is `_tag` or `_namespace` (or the configured `discriminantProperty`)
2. The receiver type is a tagged error union

**Documentation section — `._tag` on error union**:

```ts
result.match(ok, err => {
  err._tag   // hover on "_tag"
});
```

```
Discriminant "_tag" — 4 possible values:
  "NotFound"          → NotFound { resource: string, id: string }
  "Forbidden"         → Forbidden { requiredRole: string }
  "RateLimited"       → RateLimited { retryAfter: number }
  "ServerError"       → ServerError { status: number, body: string }
```

**Documentation section — `._tag` on narrowed type**:

After narrowing (e.g., in a `case` clause), show the narrowed value:

```ts
switch (err._tag) {
  case "NotFound":
    err._tag   // hover on "_tag"
```

```
Discriminant "_tag" — narrowed to "NotFound"
  NotFound { resource: string, id: string }
```

**Documentation section — `._namespace` on grouped error**:

```ts
err._namespace   // hover on "_namespace"
```

```
Error group namespace — 2 possible values:
  "Http"   → Http.NotFound | Http.Timeout | Http.ServerError
  "Db"     → Db.ConnectionFailed | Db.QueryTimeout
```

## BEH-13-016: Error Propagation Trace in Chains

When hovering over any step in a chain, show which step introduced each error variant — a propagation trace.

**Detection**:

1. The hover position is on a chain method (same as BEH-13-012)
2. The chain has 2+ steps that modify the error type

**Documentation section**:

```ts
ok(rawInput)
  .andThen(validate)      // step 1: introduces ValidationError
  .andThen(save)           // step 2: introduces DbError
  .andThen(notify)         // step 3: introduces NotifyError
  .mapErr(toAppError)      // step 4: replaces all with AppError
```

Hover on `.andThen(notify)` (step 3):

```
(chain step 3 of 4) andThen: notify
  T: Saved → Notified
  E: ValidationError | DbError → ValidationError | DbError | NotifyError

Error propagation trace:
  ValidationError      ← step 1 (.andThen(validate))
  DbError              ← step 2 (.andThen(save))
  NotifyError          ← step 3 (.andThen(notify))    [new at this step]
```

Hover on `.mapErr(toAppError)` (step 4):

```
(chain step 4 of 4) mapErr: toAppError
  T: Notified (unchanged)
  E: ValidationError | DbError | NotifyError → AppError

Error propagation trace:
  AppError             ← step 4 (.mapErr(toAppError))
  (replaced: ValidationError, DbError, NotifyError from steps 1-3)
```

**Chain boundary detection**: The trace walks backward from the current step through the chain, collecting the first step where each error variant appeared. The trace is bounded by the current chain (stops at the initial value, not at prior chains in other functions).

## BEH-13-017: Result Method Documentation Enrichment

When hovering over a Result method name, enrich the native TypeScript signature display with a human-readable explanation of what the method does in Result semantics.

**Detection**:

1. The hover position is on a method name that is a property of `Ok`, `Err`, or `Result`
2. The method is confirmed to be from `@hex-di/result` via symbol origin

**Documentation section** (prepended before native TypeScript docs):

| Method | Enriched documentation |
|--------|----------------------|
| `.map(f)` | *Transforms the success value. If this Result is Ok, applies `f` to the value. If Err, returns the Err unchanged.* |
| `.mapErr(f)` | *Transforms the error value. If this Result is Err, applies `f` to the error. If Ok, returns the Ok unchanged.* |
| `.andThen(f)` | *Chains a fallible operation. If Ok, applies `f` (which may fail). If Err, short-circuits and returns the Err. Error types accumulate as a union.* |
| `.orElse(f)` | *Recovers from an error. If Err, applies `f` (which may produce a different Result). If Ok, returns the Ok unchanged.* |
| `.match(onOk, onErr)` | *Exhaustive extraction. Runs `onOk` on the value if Ok, `onErr` on the error if Err. Forces handling of both cases.* |
| `.unwrapOr(default)` | *Safe extraction with fallback. Returns the value if Ok, or `default` if Err.* |
| `.unwrapOrElse(f)` | *Safe extraction with computed fallback. Returns the value if Ok, or the result of `f(error)` if Err.* |
| `.expect(msg)` | *Unsafe extraction. Returns the value if Ok. **Throws** with `msg` if Err. Prefer `.unwrapOr()` or `.match()`.* |
| `.isOk()` | *Type guard. Returns `true` if Ok, narrowing the type to `Ok<T, E>` in the truthy branch.* |
| `.isErr()` | *Type guard. Returns `true` if Err, narrowing the type to `Err<T, E>` in the truthy branch.* |
| `.isOkAnd(f)` | *Conditional check. Returns `true` if Ok and `f(value)` is true. Does not narrow.* |
| `.toNullable()` | *Converts to nullable. Returns the value if Ok, `null` if Err. Discards the error.* |
| `.toUndefined()` | *Converts to optional. Returns the value if Ok, `undefined` if Err. Discards the error.* |
| `.toAsync()` | *Lifts this synchronous Result into a ResultAsync for async chaining.* |
| `.flatten()` | *Removes one level of Result nesting. `Result<Result<T, E2>, E>` becomes `Result<T, E \| E2>`.* |
| `.flip()` | *Swaps Ok and Err. `Ok<T, E>` becomes `Err<E, T>` and vice versa.* |
| `.andThrough(f)` | *Side-effect chain. Runs `f(value)` for its Result, keeping the original value if `f` succeeds. Errors propagate.* |
| `.andTee(f)` | *Side-effect tap. Runs `f(value)` for its side effects if Ok. Always returns this Result unchanged.* |
| `.orTee(f)` | *Error side-effect tap. Runs `f(error)` for its side effects if Err. Always returns this Result unchanged.* |
| `.inspect(f)` | *Debug tap. Runs `f(value)` if Ok, then returns this Result. Use for logging.* |
| `.inspectErr(f)` | *Debug error tap. Runs `f(error)` if Err, then returns this Result. Use for logging.* |
| `.mapBoth(fOk, fErr)` | *Transforms both variants. Applies `fOk` to the value if Ok, `fErr` to the error if Err.* |
| `.mapOr(default, f)` | *Map-with-fallback. Applies `f` to the value if Ok, returns `default` if Err.* |
| `.mapOrElse(fErr, fOk)` | *Map-with-computed-fallback. Applies `fOk` if Ok, applies `fErr` if Err.* |
| `.and(other)` | *Logical AND. Returns `other` if this is Ok, otherwise returns this Err.* |
| `.or(other)` | *Logical OR. Returns this Ok if Ok, otherwise returns `other`.* |
| `.merge()` | *Extracts either the value or the error (both must be the same type or a union is returned).* |
| `.intoTuple()` | *Converts to a Go-style `[error, value]` tuple. Ok becomes `[null, value]`, Err becomes `[error, null]`.* |
| `.contains(value)` | *Checks if this is Ok with a value equal to `value`.* |
| `.containsErr(error)` | *Checks if this is Err with an error equal to `error`.* |

**Behavior on narrowed types**: When the Result is narrowed to `Ok` or `Err`, methods that are no-ops on that variant get an additional note:

```
// hovering .mapErr(f) on a narrowed Ok<T, E>:
Transforms the error value. If this Result is Err, applies `f` to the error. If Ok, returns the Ok unchanged.

Note: This Result is narrowed to Ok — .mapErr() has no effect here. Consider removing this call.
```

## BEH-13-018: Configuration (updated)

```ts
interface ResultHoverConfig {
  /** Enable Result type display simplification (BEH-13-001). Default: true */
  resultTypeSimplification?: boolean;

  /** Suppress phantom type parameters in narrowed Ok/Err (BEH-13-002). Default: true */
  phantomTypeSuppression?: boolean;

  /** Format structured error types with tag names (BEH-13-003, BEH-13-004). Default: true */
  errorTypeFormatting?: boolean;

  /** Format error union types with variant list (BEH-13-005). Default: true */
  errorUnionFormatting?: boolean;

  /** Maximum variants to display before truncation (BEH-13-005). Default: 10 */
  maxVariantsDisplayed?: number;

  /** Show function return type summary with error variants (BEH-13-011). Default: true */
  functionReturnSummary?: boolean;

  /** Show chain transformation visualization (BEH-13-012). Default: true */
  chainTransformationView?: boolean;

  /** Show danger indicators on unsafe methods (BEH-13-013). Default: true */
  unsafeMethodIndicator?: boolean;

  /** Show match completeness indicator (BEH-13-014). Default: true */
  matchCompletenessIndicator?: boolean;

  /** Show all discriminant values on _tag hover (BEH-13-015). Default: true */
  discriminantValueList?: boolean;

  /** Show error propagation trace in chains (BEH-13-016). Default: true */
  errorPropagationTrace?: boolean;

  /** Enrich Result method hover with human-readable docs (BEH-13-017). Default: true */
  methodDocumentation?: boolean;
}
```

Nested under the top-level plugin config as `resultHover`:

```json
{
  "compilerOptions": {
    "plugins": [{
      "name": "@hex-di/result-typescript-plugin",
      "resultHover": {
        "resultTypeSimplification": true,
        "phantomTypeSuppression": true,
        "errorTypeFormatting": true,
        "errorUnionFormatting": true,
        "maxVariantsDisplayed": 10,
        "functionReturnSummary": true,
        "chainTransformationView": true,
        "unsafeMethodIndicator": true,
        "matchCompletenessIndicator": true,
        "discriminantValueList": true,
        "errorPropagationTrace": true,
        "methodDocumentation": true
      }
    }]
  }
}
```

When the entire `resultHover` config is set to `false` (boolean shorthand), all hover presentation enhancements are disabled. When set to `true` or omitted, all defaults apply.
