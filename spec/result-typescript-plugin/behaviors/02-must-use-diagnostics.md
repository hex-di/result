# 02 — Must-Use Diagnostics

Detect when a `Result`-returning or `ResultAsync`-returning function call is used as an expression statement, meaning the value is discarded. Analogous to Rust's `#[must_use]` attribute.

## BEH-02-001: Discarded Result Detection

The analyzer visits every `ts.ExpressionStatement` in the source file. For each, it obtains the type of `node.expression` via `checker.getTypeAtLocation()` and checks whether the type is `Result<T, E>` or `ResultAsync<T, E>` using the result type checker ([01-result-type-detection.md](01-result-type-detection.md)).

If the expression type is a Result or ResultAsync, and no exception applies (see [BEH-02-002](#beh-02-002-exceptions)), a diagnostic is reported.

**Diagnostic for Result**:

| Field | Value |
|-------|-------|
| Code | `90001` (`MUST_USE_RESULT`) |
| Category | Configurable: `warning` (default), `error`, or `suggestion` |
| Message | `Result value is discarded. Handle it with .match(), .unwrapOr(), or assign to a variable. Use 'void expr' to explicitly discard.` |
| Start | Start position of the expression |
| Length | Length of the expression (excluding the trailing semicolon) |

**Diagnostic for ResultAsync**:

| Field | Value |
|-------|-------|
| Code | `90002` (`MUST_USE_RESULT_ASYNC`) |
| Category | Configurable: `warning` (default), `error`, or `suggestion` |
| Message | `ResultAsync value is discarded. Await and handle it, or use 'void expr' to explicitly discard.` |
| Start | Start position of the expression |
| Length | Length of the expression |

## BEH-02-002: Exceptions

The following patterns are **not** flagged, because the Result value is consumed:

### Assigned to a variable

```ts
const x = getResult();     // VariableStatement — not an ExpressionStatement
let y;
y = getResult();           // ExpressionStatement, but expression is AssignmentExpression — value consumed
```

Assignment expressions (`=`, `+=`, etc.) where the right-hand side is a Result are not flagged because the value is captured in the left-hand side.

### Returned from a function

```ts
function wrapper() {
  return getResult();       // ReturnStatement — not an ExpressionStatement
}
```

### Passed as an argument

```ts
handleResult(getResult());  // CallExpression argument — not an ExpressionStatement
[getResult()];              // ArrayLiteralExpression — not an ExpressionStatement
```

### Used in an expression context

```ts
const x = condition ? getResult() : other;  // ConditionalExpression — not an ExpressionStatement
const arr = [getResult()];                  // ArrayLiteralExpression
```

### Yielded in a generator

```ts
function* gen() {
  yield getResult();        // YieldExpression — not an ExpressionStatement at the statement level
  yield* getResult();       // Ditto
}
```

### Explicitly voided

```ts
void getResult();           // VoidExpression — explicit discard, diagnostic suppressed
```

The analyzer checks `ts.isVoidExpression(node.expression)` and skips the diagnostic when true.

### Awaited and assigned

```ts
const x = await getResultAsync();  // VariableStatement — not an ExpressionStatement
```

Note: `await getResultAsync();` as a bare statement IS flagged — the `await` unwraps the `ResultAsync` to a `Result`, which is then discarded.

## BEH-02-003: Detection Targets

The must-use diagnostic fires for any `ExpressionStatement` whose expression type resolves to Result or ResultAsync, regardless of how the value was produced:

| Pattern | Detected? |
|---------|-----------|
| `ok(42);` | Yes — `Ok<number, never>` is a Result |
| `err("fail");` | Yes — `Err<never, string>` is a Result |
| `getResult();` where `getResult(): Result<T, E>` | Yes |
| `result.map(f);` | Yes — `map` returns a new Result |
| `result.andThen(f);` | Yes — `andThen` returns a new Result |
| `fromThrowable(() => parse(x), mapErr);` | Yes — returns Result |
| `fromPromise(fetch(url), mapErr);` | Yes — returns ResultAsync |
| `all(r1, r2, r3);` | Yes — returns Result |
| `pipe(result, map(f), andThen(g));` | Yes — `pipe` returns a Result when the input and functions produce Results |
| `safeTry(function*() { ... });` | Yes — returns Result |
| `Result.Do.andThen(bind("x", f));` | Yes — returns Result |

## BEH-02-004: Non-Detection Targets

The following patterns are **not** detected as discarded Results:

| Pattern | Why not? |
|---------|----------|
| `console.log(result);` | `console.log` returns `void`, not Result |
| `result.isOk();` | Returns `boolean`, not Result |
| `result.match(onOk, onErr);` | Returns the match handler's return type, not Result (unless handler returns Result) |
| `result.unwrapOr(default);` | Returns `T \| U`, not Result |
| `result.toNullable();` | Returns `T \| null`, not Result |
| `someNonResultFn();` | Return type is not Result |

## BEH-02-005: Configuration

```ts
interface MustUseConfig {
  /** Enable must-use diagnostics. Default: true */
  enabled?: boolean;
  /** Diagnostic severity. Default: "warning" */
  severity?: "error" | "warning" | "suggestion";
}
```

Shorthand: `"mustUse": true` is equivalent to `"mustUse": { "enabled": true, "severity": "warning" }`. `"mustUse": false` disables the diagnostic entirely.
