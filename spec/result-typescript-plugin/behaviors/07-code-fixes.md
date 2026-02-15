# 07 — Code Fix Actions

Quick-fix code actions that suggest idiomatic `@hex-di/result` patterns. All fixes are provided through `getCodeFixesAtPosition` and are editor-only (Language Service Plugin). Closes Rust equivalents: `clippy::manual_map`, `clippy::manual_unwrap_or`; rust-analyzer assists: "Fill match arms", "Wrap in Ok/Err", "Wrap return type in Result".

## BEH-07-001: Wrap Try-Catch in fromThrowable

**Fix ID**: `hex-wrap-fromThrowable`

**Trigger**: A `try { ... } catch { ... }` block where the `try` body contains a single expression statement or variable declaration with a function call that could throw.

**Detection**:

1. The cursor is inside a `ts.TryStatement`
2. The `tryBlock` contains a single statement that is either:
   - A `VariableStatement` with a single declaration whose initializer is a `CallExpression`
   - An `ExpressionStatement` with a `CallExpression`
3. The `catchClause` exists

**Suggested replacement**:

Before:
```ts
try {
  const data = JSON.parse(input);
  // use data
} catch (e) {
  handleError(e);
}
```

After:
```ts
const data = fromThrowable(
  () => JSON.parse(input),
  (e) => /* error mapping */
);
```

**Code fix details**:

| Field | Value |
|-------|-------|
| Fix name | `hex-wrap-fromThrowable` |
| Description | `Wrap in fromThrowable() from @hex-di/result` |
| Changes | Replace the entire `try { ... } catch { ... }` with a `fromThrowable()` call |

**Limitations**:
- Only applies to `try` blocks with a single statement. Multi-statement try blocks are too complex to auto-refactor.
- The error mapping function body is left as a placeholder `(e) => e` — the developer must fill in the appropriate error transformation.
- An `import { fromThrowable } from "@hex-di/result"` is added if not already present.

## BEH-07-002: Convert isOk Check to match

**Fix ID**: `hex-isOk-to-match`

**Trigger**: An `if` statement that branches on `result.isOk()` or `result.isErr()` with both `then` and `else` branches.

**Detection**:

1. The node is a `ts.IfStatement`
2. The condition is a `ts.CallExpression` where:
   - The callee is a `ts.PropertyAccessExpression` with name `isOk` or `isErr`
   - The receiver type is `Result<T, E>`
3. Both `thenStatement` and `elseStatement` are present
4. Both branches are either block statements or single expression statements

**Suggested replacement**:

Before:
```ts
if (result.isOk()) {
  return processValue(result.value);
} else {
  return handleError(result.error);
}
```

After:
```ts
return result.match(
  (value) => processValue(value),
  (error) => handleError(error),
);
```

**Code fix details**:

| Field | Value |
|-------|-------|
| Fix name | `hex-isOk-to-match` |
| Description | `Convert isOk()/isErr() check to .match()` |
| Changes | Replace the entire `if/else` with a `.match()` call |

**Limitations**:
- Only applies when both branches exist. An `if (result.isOk()) { ... }` without `else` is not converted (the developer may intentionally handle only one variant).
- The match callback parameters are named `value` and `error`. If name conflicts exist in the surrounding scope, the developer must rename them.
- When the condition is `isErr()`, the `match` arguments are swapped: `match(onOk, onErr)` where `onOk` corresponds to the `else` branch and `onErr` to the `then` branch.

## BEH-07-003: Replace unwrap with unwrapOr

**Fix ID**: `hex-unwrap-to-unwrapOr`

**Trigger**: A call to `unwrap()` from `@hex-di/result/unsafe` (standalone function) or `.expect()` (instance method).

**Detection**:

1. The node is a `ts.CallExpression`
2. Either:
   - The callee is an `Identifier` named `unwrap` whose symbol traces to `@hex-di/result/unsafe`
   - The callee is a `PropertyAccessExpression` with name `expect` on a Result type

**Suggested replacement**:

Before (standalone):
```ts
import { unwrap } from "@hex-di/result/unsafe";
const value = unwrap(result);
```

After:
```ts
const value = result.unwrapOr(/* default value */);
```

Before (instance method):
```ts
const value = result.expect("should be Ok");
```

After:
```ts
const value = result.unwrapOr(/* default value */);
```

**Code fix details**:

| Field | Value |
|-------|-------|
| Fix name | `hex-unwrap-to-unwrapOr` |
| Description | `Replace unsafe unwrap/expect with .unwrapOr(defaultValue)` |
| Changes | Replace the call with `.unwrapOr()` and a placeholder default |

**Placeholder**: The default value is inserted as `/* default value */` — a comment placeholder that the developer replaces with the appropriate fallback value.

## BEH-07-004: Suggest fromNullable

**Fix ID**: `hex-fromNullable`

**Trigger**: An `if` statement that checks a value for `null` or `undefined` and uses it in both branches in a way compatible with Result creation.

**Detection**:

1. The node is a `ts.IfStatement`
2. The condition is one of:
   - `x != null` (loose null check)
   - `x !== null && x !== undefined`
   - `x !== undefined && x !== null`
   - `x !== null` (when the type includes `null`)
   - `x !== undefined` (when the type includes `undefined`)
3. The variable `x` has a type that includes `null` or `undefined`
4. Both `thenStatement` and `elseStatement` are present

**Suggested replacement**:

Before:
```ts
if (user != null) {
  return ok(user);
} else {
  return err("user not found");
}
```

After:
```ts
return fromNullable(user, () => "user not found");
```

**Code fix details**:

| Field | Value |
|-------|-------|
| Fix name | `hex-fromNullable` |
| Description | `Replace null check with fromNullable() from @hex-di/result` |
| Changes | Replace the `if/else` with a `fromNullable()` call |

**Limitations**:
- Only applies when the branches directly create `ok()`/`err()` Results or have simple return statements.
- Complex branch logic (multiple statements, additional conditions) prevents the fix from applying.
- An `import { fromNullable } from "@hex-di/result"` is added if not already present.

## BEH-07-005: Fill Match Cases

**Fix ID**: `hex-fill-match-cases`

**Trigger**: A `switch` statement on a tagged error union's discriminant property that is missing one or more case clauses (i.e., the `INCOMPLETE_MATCH` or `INCOMPLETE_SWITCH` diagnostic is active).

**Detection**:

1. The switch statement triggers `90020` (`INCOMPLETE_MATCH`) or `90021` (`INCOMPLETE_SWITCH`)
2. The missing tags are known from the exhaustiveness analysis
3. The code fix generates stub `case` clauses for each missing tag

**Suggested replacement**:

Before:
```ts
switch (error._tag) {
  case "NotFound": return handleNotFound();
}
// Missing: "Forbidden", "Timeout"
```

After:
```ts
switch (error._tag) {
  case "NotFound": return handleNotFound();
  case "Forbidden": throw new Error("TODO: handle Forbidden");
  case "Timeout": throw new Error("TODO: handle Timeout");
}
```

**Code fix details**:

| Field | Value |
|-------|-------|
| Fix name | `hex-fill-match-cases` |
| Description | `Add missing error cases: {missingTags}` |
| Changes | Insert `case` clauses before the closing `}` of the switch (or before the `default` clause if present) |

**Stub body**: Each generated case clause contains `throw new Error("TODO: handle {tag}")`. This is a placeholder that:
- Compiles without errors
- Fails at runtime with a descriptive message, alerting the developer to implement the handler
- Is detectable by other lints (BEH-04-009 catch-all panic)

**Batch application**: When `fixAllDescription` is provided, this fix can be applied to all incomplete switches in the file at once.

## BEH-07-006: Wrap in ok() / err()

**Fix ID**: `hex-wrap-in-ok` / `hex-wrap-in-err`

**Trigger**: A type error where a function returns `Result<T, E>` but a return statement provides a bare value (not wrapped in `ok()` or `err()`).

**Detection**:

1. TypeScript reports error `2322` (type not assignable) on a `return` statement
2. The function's declared return type is `Result<T, E>`
3. The returned expression's type is assignable to `T` (for `ok()` wrapping) or `E` (for `err()` wrapping)

**Suggested replacement (ok wrapping)**:

Before:
```ts
function getUser(id: string): Result<User, NotFoundError> {
  const user = db.find(id);
  return user;  // TS error: Type 'User' is not assignable to 'Result<User, NotFoundError>'
}
```

After:
```ts
function getUser(id: string): Result<User, NotFoundError> {
  const user = db.find(id);
  return ok(user);
}
```

**Suggested replacement (err wrapping)**:

Before:
```ts
function getUser(id: string): Result<User, string> {
  return "not found";  // TS error
}
```

After:
```ts
function getUser(id: string): Result<User, string> {
  return err("not found");
}
```

**Code fix details**:

| Field | Value |
|-------|-------|
| Fix name (ok) | `hex-wrap-in-ok` |
| Fix name (err) | `hex-wrap-in-err` |
| Description (ok) | `Wrap return value in ok()` |
| Description (err) | `Wrap return value in err()` |
| Changes | Wrap the return expression with `ok(expr)` or `err(expr)` and add import |

**Ambiguity**: When the expression type is assignable to both `T` and `E`, both code fixes are offered. The developer chooses which one to apply.

## BEH-07-007: Wrap Return Type in Result

**Fix ID**: `hex-wrap-return-type`

**Trigger**: A function that uses `ok()` or `err()` in its body but whose return type is not declared as `Result<T, E>`.

**Detection**:

1. The function body contains calls to `ok()` or `err()` from `@hex-di/result`
2. The function has an explicit return type annotation that is NOT `Result<T, E>` or `ResultAsync<T, E>`
3. OR the function has no return type annotation and TypeScript infers a union of `Ok | Err` rather than `Result`

**Suggested replacement**:

Before:
```ts
function validate(input: string) {
  if (input.length === 0) return err("empty");
  return ok(input.trim());
}
// Inferred: Ok<string, never> | Err<never, string>
```

After:
```ts
function validate(input: string): Result<string, string> {
  if (input.length === 0) return err("empty");
  return ok(input.trim());
}
```

**Code fix details**:

| Field | Value |
|-------|-------|
| Fix name | `hex-wrap-return-type` |
| Description | `Add Result<{T}, {E}> return type annotation` |
| Changes | Add or replace the return type annotation with `Result<T, E>` and add import |

**Type inference**: The fix infers `T` from the `ok()` call arguments and `E` from the `err()` call arguments. When multiple `ok()` or `err()` calls exist, the types are combined with union types.

## BEH-07-008: Convert match to map (Suggest Combinator)

**Fix ID**: `hex-match-to-map`

**Trigger**: A `.match(onOk, onErr)` call where the `onErr` callback simply re-wraps the error with `err()`, meaning the match is effectively a `.map()`.

**Detection**:

1. The call is `.match(onOk, onErr)` on a Result type
2. The `onErr` callback has the form `(e) => err(e)` — it returns `err()` wrapping its parameter unchanged
3. This means the match only transforms the Ok value — equivalent to `.map(onOk)`

Similarly, detect the reverse pattern: `onOk` is `(v) => ok(v)` and `onErr` performs the real work → equivalent to `.mapErr(onErr)`.

**Detection targets**:

| Pattern | Suggestion |
|---------|------------|
| `.match(f, (e) => err(e))` | `.map(f)` |
| `.match((v) => ok(v), f)` | `.mapErr(f)` |
| `.match(f, (e) => err(e)).unwrapOr(default)` | `.mapOr(default, f)` |

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90057` (`PREFER_COMBINATOR_OVER_MATCH`) |
| Category | `suggestion` |
| Message | `.match() with identity error handler can be simplified to .map(f).` |

**Code fix details**:

| Field | Value |
|-------|-------|
| Fix name | `hex-match-to-map` |
| Description | `Replace .match() with .map() (error handler is identity)` |
| Changes | Replace `.match(f, (e) => err(e))` with `.map(f)` |

## BEH-07-009: Suggest unwrapOr Over Manual Match

**Fix ID**: `hex-match-to-unwrapOr`

**Trigger**: A `.match(onOk, onErr)` call where the `onOk` callback is an identity function `(v) => v` and the `onErr` callback returns a constant default value.

**Detection**:

1. The call is `.match(onOk, onErr)` on a Result type
2. The `onOk` callback has the form `(v) => v` — identity function
3. The `onErr` callback returns a constant expression (literal, const variable, or expression not referencing the error parameter)

**Detection targets**:

| Pattern | Suggestion |
|---------|------------|
| `.match((v) => v, () => defaultValue)` | `.unwrapOr(defaultValue)` |
| `.match((v) => v, (e) => computeDefault(e))` | `.unwrapOrElse((e) => computeDefault(e))` |

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90058` (`PREFER_UNWRAP_OR_OVER_MATCH`) |
| Category | `suggestion` |
| Message | `.match() with identity Ok handler can be simplified to .unwrapOr({value}).` |

## BEH-07-010: Import Management

When a code fix introduces a call to a function from `@hex-di/result` (e.g., `fromThrowable`, `fromNullable`), the fix checks whether the import already exists:

1. If `import { ..., fromThrowable } from "@hex-di/result"` already exists — no change
2. If `import { ... } from "@hex-di/result"` exists without the needed function — add the function to the existing import's named imports
3. If no import from `@hex-di/result` exists — add a new `import { fromThrowable } from "@hex-di/result"` at the top of the file

## BEH-07-011: Configuration

```ts
interface CodeFixConfig {
  /** Enable code fix actions. Default: true */
  enabled?: boolean;
  /** Enable fromThrowable wrapping. Default: true */
  wrapInFromThrowable?: boolean;
  /** Enable isOk→match conversion. Default: true */
  convertIsOkToMatch?: boolean;
  /** Enable unwrap→unwrapOr replacement. Default: true */
  replaceUnwrapWithUnwrapOr?: boolean;
  /** Enable fromNullable suggestion. Default: true */
  suggestFromNullable?: boolean;
  /** Enable "Fill match cases" code action. Default: true */
  fillMatchCases?: boolean;
  /** Enable "Wrap in ok()/err()" code action. Default: true */
  wrapInOkErr?: boolean;
  /** Enable "Wrap return type in Result" code action. Default: true */
  wrapReturnType?: boolean;
  /** Enable "match → map/unwrapOr" simplification. Default: true */
  matchToCombinator?: boolean;
}
```

Shorthand: `"codeFixes": true` enables all fixes. `"codeFixes": false` disables all fixes. Individual fixes can be disabled via the object form.

## BEH-07-012: Fix Application

Each code fix produces a `ts.CodeFixAction`:

```ts
interface CodeFixAction {
  fixName: string;           // e.g., "hex-wrap-fromThrowable"
  description: string;       // Human-readable fix description
  changes: FileTextChanges[];// Array of file changes (typically one file)
  fixId: string;            // Same as fixName, used for "fix all" grouping
  fixAllDescription?: string;// Description for applying the fix everywhere
}
```

Each `FileTextChanges` contains an array of `TextChange` objects specifying the span (start + length) and the replacement text.
