# 05 — Phantom Type Translation

Intercept TypeScript diagnostic messages involving `never` type mismatches in Result contexts and rewrite them with human-readable explanations. This capability is editor-only (Language Service Plugin) — the compiler transformer does not run it.

## BEH-05-001: Target Diagnostic Codes

The translator inspects TypeScript diagnostics with the following codes:

| TS Code | Message Pattern | Trigger Context |
|---------|----------------|-----------------|
| `2322` | *Type 'X' is not assignable to type 'Y'* | Variable assignment, return statement, property initialization |
| `2345` | *Argument of type 'X' is not assignable to parameter of type 'Y'* | Function argument passing |

Other diagnostic codes are passed through unchanged.

## BEH-05-002: Detection Criteria

A diagnostic is a candidate for translation when **all** of the following are true:

1. The diagnostic code is 2322 or 2345
2. The flattened message text contains one of: `Ok<`, `Err<`, `Result<`, or `ResultAsync<`
3. The flattened message text contains `never`
4. The diagnostic has a valid source file and start position
5. The type at the diagnostic position (via `checker.getTypeAtLocation()`) is confirmed as a Result type by the type checker

If any condition is not met, the diagnostic is passed through unchanged.

## BEH-05-003: Translation Rules

### Rule 1: Ok phantom error mismatch

**Original**: `Type 'Ok<string, never>' is not assignable to type 'Result<string, MyError>'`

**Translated**: `Result type mismatch: 'ok("value")' produces 'Ok<string, never>' which does not satisfy 'Result<string, MyError>'. The phantom error type 'never' means this Ok value has no specific error type yet. Fix: add an explicit type annotation 'const x: Result<string, MyError> = ok("value")' — since 'never' extends any type, this assignment is valid when TypeScript can see the target type.`

**When this fires**: A developer creates `ok(value)` and tries to assign it to a variable or parameter typed as `Result<T, SpecificError>` where TypeScript cannot infer the assignment.

### Rule 2: Err phantom value mismatch

**Original**: `Type 'Err<never, string>' is not assignable to type 'Result<number, string>'`

**Translated**: `Result type mismatch: 'err("error")' produces 'Err<never, string>' which does not satisfy 'Result<number, string>'. The phantom value type 'never' means this Err value has no specific success type yet. Fix: add an explicit type annotation 'const x: Result<number, string> = err("error")' — since 'never' extends any type, this assignment is valid when TypeScript can see the target type.`

### Rule 3: Mixed Ok/Err composition failure

**Original**: `Type 'Ok<string, never> | Err<never, number>' is not assignable to type 'Result<string, string>'`

**Translated**: `Result composition type mismatch: the Result union 'Ok<string, never> | Err<never, number>' has error type 'number' but target expects error type 'string'. The phantom 'never' parameters are not the issue — the concrete types 'number' and 'string' are incompatible.`

### Rule 4: Never access error

**Original**: `Property 'X' does not exist on type 'never'`

**Translated**: Only when the `never` type traces to a Result context: `This expression is typed as 'never' because TypeScript has narrowed a Result to an impossible state. Check if you are accessing '.value' on an Err or '.error' on an Ok after narrowing.`

## BEH-05-004: Original Diagnostic Preservation

When a diagnostic is translated, the original message is preserved as `relatedInformation`:

```ts
{
  code: 90030,  // PHANTOM_TYPE_MISMATCH
  category: ts.DiagnosticCategory.Suggestion,
  messageText: "Result type mismatch: ...",  // human-readable translation
  file: originalDiagnostic.file,
  start: originalDiagnostic.start,
  length: originalDiagnostic.length,
  relatedInformation: [
    {
      category: ts.DiagnosticCategory.Message,
      messageText: "Original TypeScript error: Type 'Ok<string, never>' is not assignable to ...",
      file: originalDiagnostic.file,
      start: originalDiagnostic.start,
      length: originalDiagnostic.length,
    }
  ]
}
```

See [PINV-10](../invariants.md#pinv-10-phantom-type-translation-preserves-original-diagnostic).

## BEH-05-005: Conservative Matching

The translator only rewrites diagnostics that clearly match Result-related patterns. If the `never` in the message could refer to a non-Result context (e.g., a function returning `never`, or an exhausted union unrelated to Result), the diagnostic is passed through unchanged.

The confirmation step (checking the type at the diagnostic position) ensures that only Result-related diagnostics are rewritten. See [PINV-2](../invariants.md#pinv-2-no-false-positive-diagnostics).

## BEH-05-006: Message Chain Handling

TypeScript diagnostics can have nested `DiagnosticMessageChain` structures rather than flat strings. The translator:

1. Flattens the message chain using `ts.flattenDiagnosticMessageText(messageText, "\n")`
2. Runs pattern detection on the flattened string
3. If translation applies, the rewritten message replaces the top-level `messageText` (the entire chain is replaced with a flat string)
4. The original chain is preserved in `relatedInformation`

## BEH-05-007: Configuration

```ts
/** Enable phantom type error translation. Default: true */
phantomTypeTranslation?: boolean;
```

When `false`, all diagnostics from `getSemanticDiagnostics` are passed through unmodified.
