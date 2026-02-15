# ADR-001: Dual Delivery — Language Service Plugin + Compiler Transformer

## Status

Accepted

## Context

Static analysis for `@hex-di/result` needs to run in two contexts:

1. **Editor-time** — Real-time diagnostics, hover enhancements, and code fix suggestions while the developer writes code. Requires a TypeScript Language Service Plugin.
2. **Build-time** — Enforceable diagnostics that fail CI when violated. Requires a Compiler Transformer loaded via `ts-patch`.

These are two separate integration points with different TypeScript APIs:
- LS Plugin: `ts.server.PluginModule` with `create(info: PluginCreateInfo)` returning a decorated `LanguageService`
- Transformer: `ts.TransformerFactory<ts.SourceFile>` receiving a `TransformationContext`

Options:
1. **Two separate packages** — `@hex-di/result-ls-plugin` and `@hex-di/result-transformer`
2. **One package, two entry points** — `@hex-di/result-typescript-plugin` with subpath exports

## Decision

One package with two entry points:

- `@hex-di/result-typescript-plugin` → Language Service Plugin entry (`src/index.ts`)
- `@hex-di/result-typescript-plugin/transformer` → Compiler Transformer entry (`src/transformer.ts`)

Both entry points share the same analysis modules from `src/analysis/`. The LS plugin invokes all 6 capabilities; the transformer invokes only the 3 enforceable ones (must-use, unsafe import gating, exhaustiveness).

## Consequences

**Positive**:
- Single dependency for consumers: `pnpm add -D @hex-di/result-typescript-plugin`
- Shared analysis logic guarantees diagnostic parity ([PINV-3](../invariants.md#pinv-3-diagnostic-parity-between-ls-and-transformer))
- One test suite covers both delivery mechanisms
- Simpler versioning — both entry points advance in lockstep

**Negative**:
- The LS plugin entry pulls in code-fix and hover modules that the transformer does not use. This has negligible impact since the plugin is `devDependencies`-only and tree-shaking does not apply to devtools.
- Consumers must understand two different `tsconfig.json` configuration patterns (`name` vs `transform`)

**Trade-off accepted**: The ergonomic and maintenance benefits of a single package outweigh the minor conceptual overhead.
