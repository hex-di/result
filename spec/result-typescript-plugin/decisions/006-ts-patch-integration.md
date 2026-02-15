# ADR-006: Compiler Transformer via ts-patch

## Status

Accepted

## Context

TypeScript does not natively support custom compiler transformers in `tsconfig.json`. To run transformers at compile time, a patching tool is needed. The options are:

1. **ts-patch** (active, v3.0+): Patches the TypeScript compiler to support a `transform` property in `plugins[]`. Supports `context.addDiagnostic()` for diagnostic-only transformers. Actively maintained.
2. **ttypescript** (deprecated): Similar approach but abandoned since 2022. Not compatible with TypeScript 5.x.
3. **Custom build scripts**: Use the TypeScript Compiler API directly in a custom build script. Maximum flexibility but no standard configuration pattern.
4. **Wait for native support**: TypeScript has experimental transformer APIs, but there is no stable `tsconfig.json`-based loading mechanism as of TypeScript 5.9.

## Decision

Use `ts-patch >= 3.0` as the transformer loading mechanism.

Consumers install `ts-patch` and run `npx ts-patch install` to patch their local TypeScript installation. Then they use `tspc` (the patched compiler) instead of `tsc`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "@hex-di/result-typescript-plugin/transformer",
        "mustUse": { "severity": "error" }
      }
    ]
  }
}
```

```bash
npx tspc --noEmit  # Type-check with transformer diagnostics
```

The transformer is **optional** — the Language Service Plugin works without `ts-patch`.

## Consequences

**Positive**:
- Standard configuration via `tsconfig.json` — no custom build scripts
- `ts-patch` is the de facto standard for TypeScript transformers
- `context.addDiagnostic()` is clean and supported in v3.0+
- The transformer is a pure diagnostic pass (no AST modification), minimizing risk
- Optional — consumers who only want editor DX can skip `ts-patch` entirely

**Negative**:
- `ts-patch` is a third-party dependency that patches the TypeScript compiler binary. It could break with future TypeScript releases.
- Consumers must remember to run `npx ts-patch install` after updating TypeScript.
- `ts-patch` adds a step to the CI setup (install + use `tspc`).
- If TypeScript eventually adds native transformer support, `ts-patch` becomes unnecessary — but migration would be straightforward (change the entry point format).

**Mitigation**: The transformer is explicitly optional. Documentation clearly states that the Language Service Plugin provides the same diagnostics in real-time without `ts-patch`. The transformer is recommended only for CI enforcement where build failure is desired.

**Trade-off accepted**: `ts-patch` is the only viable option for `tsconfig.json`-based transformer loading in TypeScript 5.x. The risk of breakage is mitigated by the optional nature of the transformer.
