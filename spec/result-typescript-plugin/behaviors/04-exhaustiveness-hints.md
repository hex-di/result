# 04 — Exhaustiveness Hints

Detect incomplete error handling in `.match()` callbacks and `switch` statements when the error type `E` is a tagged union (objects with literal `_tag` discriminant properties, as produced by `createError()` or `createErrorGroup()`).

## BEH-04-001: Match Exhaustiveness on Tagged Error Unions

When a `.match(onOk, onErr)` call is detected on a Result type whose `E` parameter is a tagged union, the analyzer inspects the `onErr` callback for completeness.

**Detection criteria**:

1. The call is a `ts.CallExpression` with `ts.isPropertyAccessExpression(callee)` where the property name is `match`
2. The receiver type (from `checker.getTypeAtLocation(callee.expression)`) is identified as `Result<T, E>` via the type checker
3. The `E` type is a union (`E.isUnion()`)
4. **Every** member of the union has a `_tag` property with a literal string type
5. The `onErr` callback (second argument) contains a `switch` statement on the callback parameter's `_tag` property

**Analysis of the onErr callback**:

The analyzer inspects the `onErr` function body:
- If the body contains a `SwitchStatement` on the parameter's `_tag`:
  - Collect all `CaseClause` values (string literals)
  - Compare against all possible `_tag` values from the error union
  - Report missing values
- If the body does NOT contain a `switch` on `_tag`:
  - The callback handles all errors uniformly — no diagnostic (this is valid usage)

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90020` (`INCOMPLETE_MATCH`) |
| Category | Configurable: `suggestion` (default), `warning`, `error` |
| Message | `match() onErr handler does not cover all error variants. Missing: {missingTags}. Add cases for the missing tags or use a default handler.` |
| Start | Start position of the `match` property access |
| Length | Length of the entire `.match(...)` call expression |

**Example — triggering**:

```ts
import { ok, err, createError, Result } from "@hex-di/result";

const NotFound = createError("NotFound");
const Forbidden = createError("Forbidden");
const Timeout = createError("Timeout");

type AppError =
  | ReturnType<ReturnType<typeof NotFound>>
  | ReturnType<ReturnType<typeof Forbidden>>
  | ReturnType<ReturnType<typeof Timeout>>;

declare function fetchData(): Result<string, AppError>;

fetchData().match(
  (value) => console.log(value),
  (error) => {
    switch (error._tag) {
      case "NotFound": return handleNotFound();
      case "Forbidden": return handleForbidden();
      // ⚠ Missing: "Timeout"
    }
  }
);
```

**Example — not triggering** (uniform handler):

```ts
fetchData().match(
  (value) => console.log(value),
  (error) => console.error("Failed:", error._tag)  // handles all errors uniformly
);
```

## BEH-04-002: Switch Exhaustiveness on Error Tag

When a `switch` statement operates on a Result-derived error's `_tag` and the error type is a tagged union, the analyzer checks for missing cases.

**Detection criteria**:

1. The node is a `ts.SwitchStatement`
2. The switch expression is a property access on `_tag`
3. The type of the object being accessed is a tagged union (every member has a `_tag` literal property)
4. The object type traces back to the `E` parameter of a `Result<T, E>` (or is obtained via `result.error`)

**Analysis**:

1. Collect all `_tag` literal string values from the union type
2. Collect all `CaseClause` values from the switch statement
3. Check for a `default` clause — if present, the switch is exhaustive
4. If no `default`, report any missing `_tag` values

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90021` (`INCOMPLETE_SWITCH`) |
| Category | Configurable: `suggestion` (default), `warning`, `error` |
| Message | `switch on error._tag does not cover all variants. Missing: {missingTags}. Add cases for the missing tags or add a default clause.` |
| Start | Start position of the `switch` keyword |
| Length | Length of the entire switch statement |

**Example**:

```ts
if (result.isErr()) {
  switch (result.error._tag) {
    case "NotFound":
      return handleNotFound();
    // ⚠ Missing: "Forbidden", "Timeout"
  }
}
```

## BEH-04-003: Standalone Match Function

The exhaustiveness analysis also applies to the standalone `match(onOk, onErr)` function from `@hex-di/result/fn`:

```ts
import { pipe, match } from "@hex-di/result/fn";

pipe(
  fetchData(),
  match(
    (value) => console.log(value),
    (error) => {
      switch (error._tag) {
        case "NotFound": return handleNotFound();
        // ⚠ Missing: "Forbidden", "Timeout"
      }
    }
  )
);
```

Detection: the standalone `match` function is identified by its symbol origin (declared in `@hex-di/result/fn/match.ts`). The same analysis logic applies to its second argument.

## BEH-04-004: Error Group Namespace Awareness

For errors created via `createErrorGroup(namespace)`, the `_tag` values within a group are the discriminants. The `_namespace` field is shared across the group and is NOT used as a discriminant for exhaustiveness purposes.

```ts
const DbError = createErrorGroup("Database");
const ConnFailed = DbError.create("ConnectionFailed");
const QueryFailed = DbError.create("QueryFailed");

type DbErr = ReturnType<ReturnType<typeof ConnFailed>>
           | ReturnType<ReturnType<typeof QueryFailed>>;

// Exhaustiveness checks against _tag: "ConnectionFailed" | "QueryFailed"
// NOT against _namespace: "Database"
```

## BEH-04-005: Non-Tagged Unions Are Ignored

If the error type `E` is a union where **any member** does not have a `_tag` property with a literal string type, the exhaustiveness analyzer produces no diagnostic.

**Not analyzed** (analyzer stays silent):

```ts
type E = string | number;                              // primitives, no _tag
type E = Error | { _tag: "Custom" };                   // Error has no _tag
type E = { _tag: string; msg: string };                // _tag is `string`, not a literal
type E = { code: "NOT_FOUND" } | { code: "TIMEOUT" }; // discriminant is `code`, not `_tag`
```

See [PINV-9](../invariants.md#pinv-9-exhaustiveness-only-for-tagged-unions).

## BEH-04-006: Default Clause Suppresses Diagnostic

A `switch` statement with a `default` clause is considered exhaustive regardless of which specific `_tag` cases are handled. No diagnostic is produced.

```ts
switch (error._tag) {
  case "NotFound": return handleNotFound();
  default: return handleOther(error);  // Covers Forbidden + Timeout — no diagnostic
}
```

## BEH-04-007: Custom Discriminant Property

By default, exhaustiveness analysis uses `_tag` as the discriminant property. This is the convention established by `createError()` and `createErrorGroup()`. However, some codebases use a different discriminant property name (e.g., `type`, `kind`, `code`).

The `discriminantProperty` configuration option allows specifying additional discriminant property names. The analyzer will check for exhaustiveness on any tagged union where ALL members share a common literal-typed property matching one of the configured names.

**Detection with custom discriminant**:

```ts
// With config: { discriminantProperty: ["_tag", "type"] }
type AppError =
  | { type: "NotFound"; path: string }
  | { type: "Forbidden"; userId: string }
  | { type: "Timeout"; ms: number };

declare function fetchData(): Result<string, AppError>;

fetchData().match(
  (value) => console.log(value),
  (error) => {
    switch (error.type) {
      case "NotFound": return handleNotFound();
      // ⚠ Missing: "Forbidden", "Timeout"
    }
  }
);
```

**Priority**: When a union has multiple candidate discriminant properties (e.g., both `_tag` and `type`), the analyzer uses the property that appears first in the `discriminantProperty` array.

**Default**: `["_tag"]` — only `_tag` is used unless explicitly configured.

## BEH-04-008: Warn on Default Catching Single Variant

When a `switch` on an error discriminant has a `default` clause that catches exactly ONE remaining variant, suggest replacing the `default` with an explicit `case` clause. A `default` that catches a single variant hides which specific error is being handled.

Closes Rust equivalent: `clippy::match_wildcard_for_single_variants`.

**Detection**:

1. The `switch` statement is on a discriminant property of a tagged error union
2. A `default` clause is present
3. The number of explicit `case` clauses equals the total number of union members minus one
4. Therefore, the `default` catches exactly one remaining variant

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90022` (`DEFAULT_CATCHES_SINGLE_VARIANT`) |
| Category | Configurable: `suggestion` (default) |
| Message | `Default clause catches only one variant: '{tag}'. Use an explicit case for clarity.` |
| Start | Start of the `default` keyword |
| Length | Length of the `default:` clause |

**Code fix**:

| Fix ID | `hex-default-to-explicit-case` |
|--------|-------------------------------|
| Description | `Replace default with explicit case '{tag}'` |

Before:
```ts
switch (error._tag) {
  case "NotFound": return handleNotFound();
  case "Forbidden": return handleForbidden();
  default: return handleTimeout(error); // only "Timeout" remains
}
```

After:
```ts
switch (error._tag) {
  case "NotFound": return handleNotFound();
  case "Forbidden": return handleForbidden();
  case "Timeout": return handleTimeout(error);
}
```

## BEH-04-009: Warn on Catch-All Panic in Error Handler

Detect `.match(onOk, onErr)` where the `onErr` callback immediately throws without handling the error meaningfully. This is equivalent to using `unwrap()` with extra steps — it defeats the purpose of the Result pattern.

Closes Rust equivalent: `clippy::match_wild_err_arm`.

**Detection targets**:

| Pattern | Issue |
|---------|-------|
| `.match(onOk, (e) => { throw e })` | Re-throws the error — no handling |
| `.match(onOk, () => { throw new Error("...") })` | Throws a new error — no handling |
| `.match(onOk, (_) => { throw new Error("unexpected") })` | Catch-all throw with discarded error |
| `.match(onOk, (e) => { throw new Error("failed", { cause: e }) })` | Re-wraps and throws |

**Not detected** (valid patterns):

| Pattern | Why valid |
|---------|-----------|
| `.match(onOk, (e) => { log(e); throw e })` | Side-effect before throw |
| `.match(onOk, (e) => { if (e._tag === "Critical") throw e; ... })` | Conditional throw |

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90023` (`CATCH_ALL_PANIC_IN_MATCH`) |
| Category | Configurable: `warning` (default), `suggestion` |
| Message | `Error handler immediately throws, defeating the purpose of .match(). Use .expect("message") if panicking is intentional, or handle the error properly.` |
| Start | Start of the `onErr` callback |
| Length | Length of the `onErr` callback |

**Detection heuristic**: The `onErr` callback body consists of a single statement that is a `ThrowStatement`. Multi-statement bodies with a `throw` at the end are NOT flagged because the preceding statements may perform useful work (logging, cleanup).

## BEH-04-010: Warn on Duplicate Match Arm Bodies

Detect `switch` statements on an error discriminant where two or more `case` clauses have identical handler bodies. Suggest combining them with fall-through.

Closes Rust equivalent: `clippy::match_same_arms`.

**Detection**:

1. The `switch` statement is on a discriminant property of a tagged error union
2. Two or more `CaseClause` nodes have textually identical statement bodies (after whitespace normalization)
3. The clauses are not adjacent fall-through cases (adjacent cases with no body between them are already combined)

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90024` (`DUPLICATE_MATCH_ARM_BODIES`) |
| Category | Configurable: `suggestion` (default) |
| Message | `Cases '{tag1}' and '{tag2}' have identical handlers. Consider combining them with fall-through.` |
| Start | Start of the second duplicate case |
| Length | Length of the duplicate case clause |

**Example — triggering**:

```ts
switch (error._tag) {
  case "NotFound":
    return showError("Resource not available");  // ← identical body
  case "Gone":
    return showError("Resource not available");  // ← flagged: same as "NotFound"
  case "Forbidden":
    return showForbidden();
}
```

**Suggested fix** (informational, not an auto-fix):

```ts
switch (error._tag) {
  case "NotFound":
  case "Gone":
    return showError("Resource not available");
  case "Forbidden":
    return showForbidden();
}
```

## BEH-04-011: Configuration

```ts
interface ExhaustivenessConfig {
  /** Enable exhaustiveness hints. Default: true */
  enabled?: boolean;
  /** Diagnostic severity for incomplete match/switch. Default: "suggestion" */
  severity?: "error" | "warning" | "suggestion";
  /** Discriminant property names to check. Default: ["_tag"] */
  discriminantProperty?: string[];
  /** Warn when default catches exactly one variant. Default: true */
  defaultCatchesSingleVariant?: boolean;
  /** Warn on catch-all panic in error handler. Default: true */
  catchAllPanicInMatch?: boolean | {
    enabled?: boolean;
    severity?: "warning" | "suggestion";
  };
  /** Warn on duplicate match arm bodies. Default: true */
  duplicateMatchArmBodies?: boolean;
}
```

Shorthand: `"exhaustivenessHints": true` is equivalent to `"exhaustivenessHints": { "enabled": true, "severity": "suggestion" }`. `"exhaustivenessHints": false` disables the diagnostic entirely.
