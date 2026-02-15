# 06 — Error Union Tracking

Display the accumulated error type `E` on hover at each step of an `andThen()` chain or `pipe()` composition. This capability is editor-only (Language Service Plugin) — the compiler transformer does not run it.

## BEH-06-001: Method Chain Hover

When the cursor hovers over a chaining method name (`.andThen`, `.orElse`, `.map`, `.mapErr`, `.andThrough`, `.flatten`) on a Result type, the plugin prepends the accumulated error union to the hover display.

**Detection**:

1. The hover position is on a `ts.Identifier` that is the name part of a `ts.PropertyAccessExpression`
2. The parent of the property access is a `ts.CallExpression`
3. The return type of the call expression is `Result<T, E>` (via `checker.getTypeAtLocation()`)
4. The method name is one of: `andThen`, `orElse`, `map`, `mapErr`, `mapBoth`, `andThrough`, `flatten`, `flip`

**Hover enhancement**:

The plugin prepends to the existing `QuickInfo.displayParts`:

```
(error union) ValidationError | DbError | NotifyError
```

Where the error union is the `E` type parameter from the return type, formatted via `checker.typeToString(errType, node, TypeFormatFlags.NoTruncation)`.

**Example**:

```ts
ok(42)
  .andThen(validate)    // hover: (error union) ValidationError
  .andThen(save)        // hover: (error union) ValidationError | DbError
  .andThen(notify)      // hover: (error union) ValidationError | DbError | NotifyError
```

## BEH-06-002: Pipe Composition Hover

When the cursor hovers over a function argument in a `pipe()` call from `@hex-di/result/fn`, the plugin shows the Result type at that step of the composition.

**Detection**:

1. The hover position is inside a `ts.CallExpression` whose callee is `pipe` from `@hex-di/result/fn`
2. The hover is on one of the function arguments (not the first value argument)
3. The return type of the pipe up to and including the hovered function is `Result<T, E>`

**Hover enhancement**:

```
(pipe step 3) Result<Saved, ValidationError | DbError>
(error union) ValidationError | DbError
```

**Example**:

```ts
import { pipe, map, andThen } from "@hex-di/result/fn";

pipe(
  ok(rawInput),
  map(sanitize),        // hover: (pipe step 1) Result<Sanitized, never>
  andThen(validate),    // hover: (pipe step 2) Result<Valid, ValidationError>
  andThen(save),        // hover: (pipe step 3) Result<Saved, ValidationError | DbError>
);
```

## BEH-06-003: Type Formatting

The error union type is formatted using `checker.typeToString()` with the following flags:

- `ts.TypeFormatFlags.NoTruncation` — do not truncate long union types with `...`
- `ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope` — preserve type alias names when possible

If the formatted type exceeds 200 characters, it is truncated with `...` to prevent hover popups from becoming unwieldy.

## BEH-06-004: Non-Result Chains Are Ignored

If the return type of a method chain or pipe step is not a `Result` or `ResultAsync`, the hover enhancement does not apply. The original TypeScript hover is returned unchanged.

## BEH-06-005: ResultAsync Chain Support

Error union tracking also applies to `ResultAsync` method chains:

```ts
fromPromise(fetch(url), mapErr)
  .map(r => r.json())             // hover: (error union) FetchError
  .andThen(validateResponse)      // hover: (error union) FetchError | ValidationError
  .andThen(saveToDb)              // hover: (error union) FetchError | ValidationError | DbError
```

The `ResultAsync<T, E>` type is identified by the type checker, and `E` is extracted from its type arguments.

## BEH-06-006: Configuration

```ts
/** Enable error union tracking on hover. Default: true */
errorUnionTracking?: boolean;
```

When `false`, `getQuickInfoAtPosition` returns the original TypeScript hover unchanged.
