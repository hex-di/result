# ADR-005: No Runtime Dependency on @hex-di/result

## Status

Accepted

## Context

The plugin identifies `Result<T, E>` types from `@hex-di/result`. It could do this by:

1. **Importing the library**: `import { RESULT_BRAND } from "@hex-di/result"` and comparing symbols directly. This creates a runtime dependency and version-coupling.
2. **Inspecting types by name and origin**: Use the TypeScript Compiler API to trace type symbols to their declaration files and check if the path contains `@hex-di/result`. No import needed.

## Decision

The plugin has **no runtime dependency** on `@hex-di/result`. It identifies Result types purely through the TypeScript Compiler API by:

1. Tracing type symbols to their declaration source files
2. Checking if the file path contains `@hex-di/result/` or `packages/result/` (workspace)
3. Verifying symbol names match expected identifiers (`Result`, `Ok`, `Err`, `ResultAsync`, `RESULT_BRAND`)

`@hex-di/result` appears only as a `devDependency` (for test fixtures that import the library to create test programs).

## Consequences

**Positive**:
- No version coupling. The plugin works with any version of `@hex-di/result` that declares types with the expected names in the expected file structure.
- No installation bloat. The plugin does not pull in `@hex-di/result` as a transitive dependency.
- Clean separation. The plugin is a pure devtool — it has no place in a production dependency graph.
- Works in workspaces where `@hex-di/result` is a sibling package (path detection handles `packages/result/`)

**Negative**:
- If `@hex-di/result` renames its type symbols or restructures its source files, the plugin's detection logic must be updated. This is mitigated by the fact that both packages are in the same monorepo and share a release cycle.
- Cannot compare the `RESULT_BRAND` symbol directly — must identify it by name and origin, which is slightly less precise than direct reference equality. The structural fallback ([ADR-002](002-hybrid-type-detection.md)) mitigates this.

**Trade-off accepted**: The decoupling benefits far outweigh the maintenance cost of keeping detection logic aligned with the library's type declarations.
