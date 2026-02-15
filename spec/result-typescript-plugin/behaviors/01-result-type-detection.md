# 01 — Result Type Detection

Core type identification module that determines whether a `ts.Type` originates from `@hex-di/result`. All other analyzers depend on this module.

## BEH-01-001: Symbol Origin Detection

Given a `ts.Type`, the detector traces its symbol to the declaration source file:

1. Obtain the symbol via `type.getSymbol()` or `type.aliasSymbol`
2. Access `symbol.declarations[0].getSourceFile().fileName`
3. Check if the path contains `@hex-di/result/` (node_modules) or `packages/result/` (workspace)
4. Verify the symbol name is one of: `Result`, `Ok`, `Err`, `ResultAsync`

**Positive matches**:
- `Result<T, E>` aliased directly from `@hex-di/result`
- `Ok<T, E>` returned by `ok(value)` from `@hex-di/result`
- `Err<T, E>` returned by `err(error)` from `@hex-di/result`
- `ResultAsync<T, E>` from `@hex-di/result/async`
- Re-exported types: `export type MyResult<T> = Result<T, string>` — the alias symbol traces back to `@hex-di/result`

**Negative matches** (must NOT identify):
- Plain objects with `{ _tag: "Ok", value: T }` shape but no brand
- Types named `Result` from other packages (`ts-results`, `neverthrow`, `fp-ts`, etc.)
- The string literal `"Result"` or `"Ok"` as identifiers

## BEH-01-002: Structural Fallback Detection

When symbol origin tracing is inconclusive (e.g., the type is a conditional type, mapped type, or intersection that obscures the original symbol), the detector falls back to structural analysis:

1. Check if the type is a union: `type.isUnion()`
2. For each union member, check for a `_tag` property with literal type `"Ok"` or `"Err"`
3. For each union member, check for a property keyed by a symbol whose name is `"RESULT_BRAND"` and whose declaration originates from `@hex-di/result`

All members must pass both checks for the type to be identified as a Result.

**Applies to**:
- `type Foo = condition extends true ? Ok<string, never> : Err<never, number>` — resolves to a Result union
- `Extract<SomeUnion, Result<any, any>>` — extracted type retains Result structure

**Does NOT apply to**:
- A single `Ok<T, E>` or `Err<T, E>` (not a union) — symbol origin should catch these
- Types that structurally resemble Result but lack the brand symbol

## BEH-01-003: Type Argument Extraction

For identified Result types, the detector extracts the `T` (Ok) and `E` (Err) type parameters:

- For `Result<T, E>` (a union): extract `T` and `E` from `checker.getTypeArguments()` on the alias type reference, or infer from the union members' `value`/`error` property types
- For `Ok<T, E>`: `T` = type of the `value` property; `E` = second type argument (phantom, typically `never`)
- For `Err<T, E>`: `T` = first type argument (phantom, typically `never`); `E` = type of the `error` property
- For `ResultAsync<T, E>`: extract from the type arguments of the `ResultAsync` generic

The extracted types are returned in a `ResultTypeInfo` record:

```ts
interface ResultTypeInfo {
  isResult: boolean;
  isResultAsync: boolean;
  isOk: boolean;
  isErr: boolean;
  okType: ts.Type | undefined;
  errType: ts.Type | undefined;
}
```

## BEH-01-004: ResultAsync Detection

`ResultAsync<T, E>` is identified by:

1. **Symbol origin**: Symbol name `ResultAsync` from a declaration file in `@hex-di/result`
2. **Structural fallback**: An object type with a property keyed by a symbol named `"RESULT_ASYNC_BRAND"` whose declaration originates from `@hex-di/result`

`ResultAsync` is NOT a union type — it is a class. Detection uses symbol origin as the primary strategy.

## BEH-01-005: Cache Behavior

Type detection results are cached in a `WeakMap<ts.Type, ResultTypeInfo>`:

- **Cache hit**: If the `ts.Type` object is already in the cache, return the cached `ResultTypeInfo` without re-analysis
- **Cache miss**: Run the detection algorithm, store the result in the cache, and return it
- **Cache invalidation**: No explicit invalidation is needed. TypeScript interns `ts.Type` objects per `ts.Program`. When a new `ts.Program` is created (after file changes), old `ts.Type` objects become unreachable and the `WeakMap` entries are garbage-collected

## BEH-01-006: Import Scan for Early Exit

Before running any analysis on a source file, the plugin scans the file's top-level statements for `ImportDeclaration` nodes with a module specifier starting with `@hex-di/result`:

```ts
function hasResultImport(sourceFile: ts.SourceFile): boolean
```

- Checks `(stmt.moduleSpecifier as ts.StringLiteral).text` for prefix `@hex-di/result`
- Scans only top-level statements — does not descend into function bodies or blocks
- Returns `true` if any matching import is found, `false` otherwise

When this function returns `false`, all analyzers skip the file entirely, returning empty diagnostic arrays.

**Edge case**: Dynamic `import("@hex-di/result/...")` inside function bodies is NOT detected by the early exit scan. This is acceptable because:
- Dynamic imports of `@hex-di/result` are rare in practice
- The import scan is a performance optimization, not a correctness requirement
- If a dynamic import introduces a Result type, symbol-origin detection will still identify it when the type checker is queried
