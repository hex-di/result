# Test Strategy

Testing pyramid and policy for the `@hex-di/result-typescript-plugin` package.

## Test Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲           Manual editor validation
                 ╱──────╲
                ╱ Integ.  ╲        Full LS / transformer integration
               ╱────────────╲
              ╱ Fixture-based ╲    Diagnostic assertion on .ts fixtures
             ╱──────────────────╲
            ╱ Unit Tests          ╲  Per-analyzer Vitest runtime
           ╱────────────────────────╲
```

| Level | Tool | File Pattern | Purpose |
|-------|------|-------------|---------|
| Unit | Vitest | `tests/unit/*.test.ts` | Per-analyzer logic correctness |
| Fixture | Vitest | `tests/fixture/*.test.ts` | Diagnostics on real `.ts` files with `@expect-diagnostic` comments |
| Integration | Vitest | `tests/integration/*.test.ts` | Full Language Service and Transformer pipeline |
| E2E | Manual | N/A | Visual confirmation in VS Code / Neovim |

## Level 1: Unit Tests

### Tooling

- **Runner**: Vitest
- **File pattern**: `tests/unit/*.test.ts`

### What Unit Tests Cover

Each analysis module (`src/analysis/*.ts`) has a corresponding unit test file. Tests create virtual TypeScript programs using the Compiler API with mock `@hex-di/result` type declarations.

| Analyzer Module | Test File | Validates |
|----------------|-----------|-----------|
| `result-type-checker.ts` | `result-type-checker.test.ts` | Positive/negative type identification, cache behavior, early exit |
| `must-use-detector.ts` | `must-use-detector.test.ts` | Detection targets, exceptions (assignment, return, void, arguments) |
| `unsafe-import-detector.ts` | `unsafe-import-detector.test.ts` | Static/dynamic/require import detection, allow pattern matching |
| `exhaustiveness-analyzer.ts` | `exhaustiveness-analyzer.test.ts` | Tagged union detection, missing tags, default clause, non-tagged ignoring |
| `phantom-type-translator.ts` | `phantom-type-translator.test.ts` | Translation rules, conservative matching, original preservation |
| `error-union-tracker.ts` | `error-union-tracker.test.ts` | Chain hover, pipe hover, type formatting |
| `code-fix-analyzer.ts` | `code-fix-analyzer.test.ts` | Each fix type detection, replacement text generation |
| `config/normalize.ts` | `config.test.ts` | Default application, boolean shorthand, invalid input handling |
| `utils/glob-match.ts` | `glob-match.test.ts` | Pattern matching, cross-platform path normalization |

### Virtual Program Construction

Unit tests create in-memory TypeScript programs using mock type declarations:

```ts
function createTestProgram(sourceText: string): {
  program: ts.Program;
  sourceFile: ts.SourceFile;
  checker: ts.TypeChecker;
} {
  // Create a CompilerHost that serves:
  // 1. The test source file
  // 2. Mock @hex-di/result type declarations (Result, Ok, Err, etc.)
  // 3. Standard TypeScript lib declarations
}
```

The mock declarations include:
- `Result<T, E> = Ok<T, E> | Err<T, E>` with `_tag`, brand, and methods
- `ResultAsync<T, E>` with brand
- `ok<T>(value: T): Ok<T, never>` and `err<E>(error: E): Err<never, E>`
- `RESULT_BRAND` and `RESULT_ASYNC_BRAND` unique symbols
- `createError(tag)` return type with `_tag` literal
- Subpath module declarations for `@hex-di/result/unsafe`, `@hex-di/result/fn`, etc.

### Naming Convention

```ts
describe("must-use-detector", () => {
  describe("detectDiscardedResults", () => {
    it("detects discarded Result from function call", () => { ... });
    it("does NOT flag assigned Result", () => { ... });
    it("does NOT flag returned Result", () => { ... });
    it("does NOT flag voided Result", () => { ... });
    it("does NOT flag Result passed as argument", () => { ... });
    it("detects discarded ResultAsync", () => { ... });
    it("respects enabled=false config", () => { ... });
  });
});
```

### Coverage Targets

| Metric | Target |
|--------|--------|
| Line coverage | > 95% |
| Branch coverage | > 90% |
| Function coverage | 100% |

## Level 2: Fixture-Based Tests

### Tooling

- **Runner**: Vitest
- **File pattern**: `tests/fixture/*.test.ts`
- **Fixtures**: `tests/fixtures/**/*.ts`

### Approach

Fixture files are real TypeScript source files with `@expect-diagnostic` comments indicating expected diagnostics:

```ts
// tests/fixtures/must-use/discarded-result.ts
import { ok, err, Result } from "@hex-di/result";

function getResult(): Result<number, string> { return ok(1); }

getResult();           // @expect-diagnostic 90001
const x = getResult(); // no diagnostic
void getResult();      // no diagnostic
return getResult();    // no diagnostic (inside function)
```

The test runner:
1. Creates a TypeScript program from the fixture file (with real `@hex-di/result` type declarations)
2. Runs the analyzer on the source file
3. Parses `@expect-diagnostic {code}` comments from the fixture
4. Asserts that every expected diagnostic is present and no unexpected diagnostics are reported

### Fixture Categories

| Category | Directory | Tests |
|----------|-----------|-------|
| Must-use | `tests/fixtures/must-use/` | Discarded calls, assignment, return, void, arguments, pipe |
| Unsafe imports | `tests/fixtures/unsafe/` | Static import, dynamic import, require, allowed files |
| Exhaustiveness | `tests/fixtures/exhaustiveness/` | Complete match, incomplete match, switch, default clause, non-tagged |
| Phantom types | `tests/fixtures/phantom/` | Ok mismatch, Err mismatch, composition mismatch |
| Error union | `tests/fixtures/chain/` | andThen chains, pipe compositions |
| Code fixes | `tests/fixtures/code-fixes/` | try-catch, isOk check, unwrap, null check |

## Level 3: Integration Tests

### Tooling

- **Runner**: Vitest
- **File pattern**: `tests/integration/*.test.ts`

### Language Service Plugin Integration

Create a full `ts.LanguageService` instance with the plugin loaded:

```ts
function createLanguageServiceWithPlugin(
  files: Record<string, string>,
  pluginConfig: Partial<PluginConfig>
): { languageService: ts.LanguageService; dispose: () => void };
```

Test the complete pipeline:
- `languageService.getSemanticDiagnostics(fileName)` returns plugin diagnostics
- `languageService.getQuickInfoAtPosition(fileName, position)` returns enhanced hover
- `languageService.getCodeFixesAtPosition(fileName, start, end, codes, ...)` returns plugin fixes

### Transformer Integration

Create a full `ts.Program` and run the transformer:

```ts
function runTransformerOnSource(
  sourceText: string,
  config: Partial<PluginConfig>
): ts.Diagnostic[];
```

Verify that the transformer produces the same diagnostics as the LS plugin for shared capabilities.

### Parity Tests

For each shared capability (must-use, unsafe import gating, exhaustiveness), a parity test runs the same source through both the LS plugin and the transformer and asserts that the diagnostic codes, positions, and messages are identical.

## Level 4: E2E (Manual)

Manual validation in editors to confirm:
- Diagnostics appear with correct severity and position
- Hover shows accumulated error unions
- Code fixes appear in the quick-fix menu and produce correct replacements
- Configuration changes take effect after tsconfig reload

This level is not automated. It is performed before each release.

## CI Job Summary

| Job | Level | Blocks PR |
|-----|-------|-----------|
| Lint | — | Yes |
| Type Check | — | Yes |
| Unit Tests | Unit | Yes |
| Fixture Tests | Fixture | Yes |
| Integration Tests | Integration | Yes |
| Build | — | Yes |
