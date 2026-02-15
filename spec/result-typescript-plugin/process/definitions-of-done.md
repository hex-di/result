# Definitions of Done

Per-feature acceptance criteria for the `@hex-di/result-typescript-plugin` package.

## Feature Definition of Done

A feature (new analyzer, code fix, or hover enhancement) is **done** when all of the following are satisfied:

### 1. Specification

- [ ] Behavior spec file exists or is updated in `spec/result-typescript-plugin/behaviors/`
- [ ] New glossary terms are added to `spec/result-typescript-plugin/glossary.md`
- [ ] If an architectural decision was made, an ADR exists in `spec/result-typescript-plugin/decisions/`
- [ ] If a new analysis-time guarantee is introduced, an invariant is added to `spec/result-typescript-plugin/invariants.md`
- [ ] `spec/result-typescript-plugin/overview.md` is updated: API tables, diagnostic codes, source file map
- [ ] Cross-reference links between specs are valid

### 2. Unit Tests (Vitest)

- [ ] Unit tests exist in `tests/unit/` for the new or modified analyzer module
- [ ] Positive cases: the analyzer detects the targeted pattern
- [ ] Negative cases: the analyzer does NOT fire on valid code
- [ ] Edge cases: aliased types, re-exported types, conditional types, generic functions
- [ ] Configuration: the analyzer respects `enabled: false` and severity settings
- [ ] Line coverage > 95% for new code
- [ ] Branch coverage > 90% for new code
- [ ] Function coverage = 100% for new code

### 3. Fixture Tests

- [ ] Fixture `.ts` files exist in `tests/fixtures/` with `@expect-diagnostic` annotations
- [ ] Fixtures cover the primary detection pattern (happy path)
- [ ] Fixtures cover non-detection patterns (code that should NOT trigger)
- [ ] Fixtures cover edge cases listed in the behavior spec

### 4. Integration Tests

- [ ] LS plugin integration test verifies the diagnostic appears via `getSemanticDiagnostics`
- [ ] If the feature is shared (must-use, unsafe import, exhaustiveness, unsafe call-site, code quality, error type quality): transformer integration test verifies identical diagnostics
- [ ] If the feature is shared: parity test confirms LS and transformer produce identical results
- [ ] If the feature is a hover enhancement: `getQuickInfoAtPosition` integration test
- [ ] If the feature is a code fix: `getCodeFixesAtPosition` integration test

### 5. Documentation

- [ ] JSDoc comments on every public-facing function and interface
- [ ] `@example` tag with usage in JSDoc where appropriate
- [ ] `@since` tag with the version that introduced the feature

### 6. API Surface

- [ ] No unintended new exports
- [ ] Diagnostic codes are added to `diagnostic-codes.ts` and documented in `overview.md`
- [ ] Configuration schema is updated in `config/schema.ts` if new options are added

### 7. Build

- [ ] `tsc -p tsconfig.build.json` succeeds with no errors
- [ ] Both entry points (`index.ts` and `transformer.ts`) compile correctly
- [ ] No circular dependencies between modules

### 8. Changeset

- [ ] Changeset file created via `pnpm changeset`
- [ ] Semantic version impact is correct
- [ ] Changeset description is clear and end-user-oriented

## Bug Fix Definition of Done

A bug fix is **done** when:

- [ ] Root cause is identified and documented in the commit message
- [ ] Regression test is added (fixture or unit) that fails without the fix and passes with it
- [ ] Existing tests still pass
- [ ] Changeset is created (patch version)

## Analyzer Definition of Done

When adding a **new analyzer** (a new capability), additional criteria apply:

- [ ] The analyzer module is in `src/analysis/` and follows the pure-function pattern: takes `ts.TypeChecker` + `ts.SourceFile`, returns diagnostic descriptors
- [ ] The analyzer is integrated into `language-service/diagnostics.ts` (or `hover.ts`/`code-fixes.ts` as appropriate)
- [ ] If enforceable (capabilities 1–3, 7–9), the analyzer is integrated into `compiler/transformer-factory.ts`
- [ ] The analyzer has a dedicated diagnostic code (or codes) registered in `diagnostic-codes.ts` within the correct block (see [ADR-004](../decisions/004-diagnostic-code-allocation.md))
- [ ] The diagnostic code → config property mapping is documented in the overview.md diagnostic codes table
- [ ] The analyzer respects the early-exit optimization (skips files without `@hex-di/result` imports)
- [ ] The analyzer uses the `WeakMap` type cache from `utils/cache.ts` for type checks
- [ ] The configuration schema supports `enabled` and `severity` for the new capability
- [ ] Default values are documented in the behavior spec and implemented in `config/normalize.ts`
- [ ] The module dependency graph in `overview.md` is updated to include the new module
