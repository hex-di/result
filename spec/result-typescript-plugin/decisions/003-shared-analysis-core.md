# ADR-003: Shared Analysis Core

## Status

Accepted

## Context

The plugin has two delivery mechanisms (Language Service Plugin and Compiler Transformer) that need to produce identical diagnostics for the shared capabilities (must-use, unsafe import gating, exhaustiveness). If each delivery mechanism implements its own analysis, behavioral drift is inevitable.

Options:

1. **Duplicate logic**: Each delivery mechanism has its own analyzer implementations. Simple initially but diverges over time.
2. **Shared analysis modules**: Both delivery mechanisms import from a common `analysis/` directory. One implementation, tested once, used twice.
3. **Abstract analyzer interface**: Define an interface that both mechanisms implement. Over-engineered for the current scope.

## Decision

All analysis logic lives in `src/analysis/` as pure functions that accept TypeScript Compiler API objects (`ts.TypeChecker`, `ts.SourceFile`, `ts.Node`) and return diagnostic data structures. Both `language-service/diagnostics.ts` and `compiler/transformer-factory.ts` import from these modules.

The analysis functions do not depend on any Language Service or Transformer-specific API. They receive the type checker and source file, and return arrays of diagnostic descriptors that the callers convert to `ts.Diagnostic` objects appropriate for their context.

## Consequences

**Positive**:
- Guaranteed diagnostic parity ([PINV-3](../invariants.md#pinv-3-diagnostic-parity-between-ls-and-transformer))
- Single set of unit tests covers both delivery paths
- Bug fixes in analyzers automatically apply to both LS and transformer
- Clean separation of concerns: analysis is pure, integration is thin

**Negative**:
- The analysis functions cannot use LS-specific features (like accessing the project's file system watcher) — they must work with only the type checker and source files
- Some diagnostics need context conversion (analysis returns a generic descriptor, LS and transformer convert to their respective `ts.Diagnostic` formats)

**Trade-off accepted**: The parity guarantee is more valuable than the flexibility of LS-specific analysis features. Context conversion is a trivial mapping.
