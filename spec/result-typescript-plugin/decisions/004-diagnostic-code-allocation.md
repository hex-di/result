# ADR-004: Diagnostic Code Allocation

## Status

Accepted

## Context

TypeScript diagnostics have numeric codes (e.g., `2322` for "Type 'X' is not assignable to type 'Y'"). Plugin diagnostics need their own codes that:

1. Do not conflict with TypeScript's internal codes
2. Are stable across versions (consumers may filter by code)
3. Are grouped logically by capability

TypeScript uses codes in the range 1000–9999 for its own diagnostics. The range 90000+ is conventionally available for plugins and custom tools.

## Decision

Allocate custom diagnostic codes in the **90001–90099** range, grouped by capability in blocks of 10:

| Range | Capability | Status |
|-------|------------|--------|
| 90001–90009 | Must-use diagnostics | 2 allocated |
| 90010–90019 | Unsafe import gating | 2 allocated |
| 90020–90029 | Exhaustiveness hints | 5 allocated |
| 90030–90039 | Phantom type translation | 1 allocated |
| 90040–90049 | Unsafe call-site analysis | 7 allocated |
| 90050–90059 | Code quality lints | 9 allocated |
| 90060–90069 | Error type quality lints | 4 allocated |
| 90070–90099 | **Reserved** for future capabilities | 0 allocated |

Codes within each block are assigned sequentially starting from the block's base. Unallocated slots within a block (e.g., 90003–90009) are reserved for future diagnostics in that capability. The 90070–90099 range is reserved for entirely new capability categories not yet specified.

See [overview.md](../overview.md#diagnostic-codes) for the full allocation table with 29 diagnostic codes.

All codes are defined in `language-service/diagnostic-codes.ts` as a frozen constant object.

## Consequences

**Positive**:
- No conflict with TypeScript's internal diagnostic codes
- Logical grouping allows room for future diagnostics within each capability
- Consumers can filter or suppress specific codes without affecting others
- Codes are stable ([PINV-5](../invariants.md#pinv-5-diagnostic-codes-are-stable))

**Negative**:
- The 90000+ range is conventional, not officially reserved. Another plugin could use the same codes. In practice this is unlikely and would only cause confusion in diagnostic filtering, not incorrect behavior.

**Trade-off accepted**: The convention is well-established in the TypeScript plugin ecosystem. The risk of collision is negligible.
