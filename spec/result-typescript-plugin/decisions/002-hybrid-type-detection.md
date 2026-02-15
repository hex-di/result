# ADR-002: Hybrid Type Detection — Symbol Origin + Structural Fallback

## Status

Accepted

## Context

The plugin must determine whether a `ts.Type` represents `Result<T, E>`, `Ok<T, E>`, `Err<T, E>`, or `ResultAsync<T, E>` from `@hex-di/result`. There are three possible strategies:

1. **Name-based detection**: Check `checker.typeToString(type)` for patterns like `Result<...>`. Simple but fragile — name collisions with other libraries, aliased types lose their original name.

2. **Symbol origin detection**: Trace the type's symbol to its declaration source file and verify the file path contains `@hex-di/result`. Robust for direct usage and re-exports, but fails for deeply aliased types, conditional types, and mapped types where the original symbol is obscured.

3. **Structural detection**: Check if the type has the structural shape of a Result (union with `_tag: "Ok" | "Err"` members and a `RESULT_BRAND` symbol property). Works for obscured types but could theoretically match non-`@hex-di/result` types that coincidentally share the structure.

## Decision

Use a **hybrid strategy**: symbol origin detection (primary) with structural fallback.

**Order of operations**:

1. Check `type.getSymbol()` or `type.aliasSymbol` → trace to declaration file → verify `@hex-di/result` origin
2. If inconclusive, check if the type is a union with the Result structural shape
3. For the structural check, verify the `RESULT_BRAND` property's symbol also originates from `@hex-di/result`

The structural fallback has a guard: the brand symbol itself must trace to `@hex-di/result`, preventing false positives from unrelated libraries.

## Consequences

**Positive**:
- Symbol origin handles 95%+ of cases with zero false positives
- Structural fallback catches edge cases (conditional types, mapped types, type intersections)
- The brand symbol guard on structural detection prevents false positives from other Result implementations
- Performance: symbol origin is a fast path (no type iteration needed)

**Negative**:
- Two code paths to maintain and test
- Structural detection is more expensive (iterates union members, checks properties)
- If another library uses a symbol literally named `RESULT_BRAND` declared in a file path containing `@hex-di/result`, it could falsely match. This is practically impossible.

**Trade-off accepted**: The accuracy improvement from the hybrid approach justifies the additional complexity.
