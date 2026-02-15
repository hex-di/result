# 12 — IDE Enhancements

Additional editor-specific features that improve the developer experience when working with `@hex-di/result`. These features are Language Service Plugin only — they have no compiler transformer equivalent.

## BEH-12-001: Auto-Import Suggestions for Result API

When the developer types a `@hex-di/result` function name that is not imported, the plugin suggests auto-importing from the optimal subpath. TypeScript's built-in auto-import may not always choose the most tree-shakeable path.

**Trigger**: A `getCompletionsAtPosition` request returns completions for identifiers matching `@hex-di/result` exports.

**Import path resolution**:

| Function | Suggested Import Path | Notes |
|---------|----------------------|-------|
| `ok`, `err`, `Result`, `fromThrowable`, `fromNullable`, `fromPromise` | `@hex-di/result` | Main entry point |
| `map`, `andThen`, `orElse`, `match`, `pipe`, etc. | `@hex-di/result/fn` | Standalone combinators |
| `unwrap`, `unwrapErr` | `@hex-di/result/unsafe` | With warning annotation |
| `createError`, `createErrorGroup` | `@hex-di/result/errors` | Error factories |
| `ResultAsync` | `@hex-di/result/async` | Async entry point |

**Behavior**:

1. Intercept `getCompletionEntryDetails` for Result API symbols
2. If the symbol is from `@hex-di/result/unsafe`, add a warning to the detail text: *"⚠ Unsafe: this function throws on Err values. Consider .unwrapOr() or .match() instead."*
3. The import path follows the `exports` map in `@hex-di/result/package.json` — the plugin reads the package's exports to determine the canonical import paths

**Exceptions**:
- If the user has already imported the function from a different subpath (e.g., `@hex-di/result/fn/map` instead of `@hex-di/result/fn`), the existing path style is preserved
- Auto-import is suppressed if the function name conflicts with a local declaration in scope

## BEH-12-002: Semantic Token Enhancements

Provide additional semantic token modifiers for Result-related identifiers, enabling syntax themes to highlight Result patterns distinctively.

**Custom semantic token modifiers**:

| Identifier | Token Modifier | Condition |
|-----------|---------------|-----------|
| `ok`, `err` | `resultConstructor` | When the symbol traces to `@hex-di/result` |
| `unwrap`, `unwrapErr`, `expect`, `expectErr` | `unsafeResultAccess` | When the symbol traces to `@hex-di/result/unsafe` or is an instance method on Result |
| `match` | `resultExhaustiveHandler` | When called as `.match()` on a Result type |
| `isOk`, `isErr` | `resultTypeGuard` | When called as a method on a Result type |
| `Result`, `ResultAsync` | `resultType` | When the symbol is the Result type from `@hex-di/result` |

**Integration**: The modifiers are registered via `getEncodedSemanticClassifications` decorator. VS Code (and other editors supporting semantic tokens) can apply custom colors:

```json
// Example VS Code settings:
{
  "editor.semanticTokenColorCustomizations": {
    "rules": {
      "*.unsafeResultAccess": { "foreground": "#FF6B6B", "fontStyle": "bold" },
      "*.resultConstructor": { "foreground": "#51CF66" }
    }
  }
}
```

**Default**: Semantic token enhancements are enabled by default but have no visual effect unless the user's editor theme applies styles to the custom modifiers.

## BEH-12-003: Diagnostic Quick-Navigation

When multiple Result-related diagnostics exist in a file, the plugin provides structured related-information links to help navigate between them.

**Behavior**:

1. When a `MUST_USE_RESULT` diagnostic is on a function call, the diagnostic's `relatedInformation` includes a link to the function's declaration showing its Result return type
2. When an `INCOMPLETE_MATCH` diagnostic fires, the related information lists each missing tag with a link to the error type's definition
3. When an `UNSAFE_IMPORT` diagnostic fires, the related information links to the plugin configuration that controls `allowPatterns`

**Related Information format**:

Each related information entry is a `ts.DiagnosticRelatedInformation`:
```ts
{
  category: ts.DiagnosticCategory.Message,
  code: 0,  // informational
  file: sourceFile,
  start: declarationPosition,
  length: declarationLength,
  messageText: "Function declared here returns Result<User, AppError>"
}
```

## BEH-12-004: Configuration

```ts
interface IdeEnhancementsConfig {
  /** Enable auto-import path optimization. Default: true */
  autoImport?: boolean;
  /** Enable semantic token modifiers. Default: true */
  semanticTokens?: boolean;
  /** Enable diagnostic quick-navigation links. Default: true */
  diagnosticNavigation?: boolean;
}
```

Nested under the top-level plugin config as `ideEnhancements`.
