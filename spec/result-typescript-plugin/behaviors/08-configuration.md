# 08 — Configuration

Plugin configuration schema, defaults, normalization, and validation.

## BEH-08-001: Configuration Source

The plugin configuration is specified in the consumer's `tsconfig.json` under `compilerOptions.plugins[]`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@hex-di/result-typescript-plugin",
        "mustUse": { "enabled": true, "severity": "warning" },
        "unsafeImportGating": {
          "enabled": true,
          "severity": "error",
          "allowPatterns": ["**/tests/**"]
        },
        "exhaustivenessHints": true,
        "phantomTypeTranslation": true,
        "errorUnionTracking": true,
        "codeFixes": true
      }
    ]
  }
}
```

For the Language Service Plugin, the raw config object is received via `ts.server.PluginCreateInfo.config`. For the Compiler Transformer, it is received as the second argument to the default export function.

## BEH-08-002: Configuration Schema

```ts
interface PluginConfig {
  /** Must-use diagnostics for discarded Result values. */
  mustUse?: boolean | MustUseConfig;

  /** Unsafe import gating for @hex-di/result/unsafe. */
  unsafeImportGating?: boolean | UnsafeImportConfig;

  /** Exhaustiveness hints for match() on tagged error unions. */
  exhaustivenessHints?: boolean | ExhaustivenessConfig;

  /** Phantom type error translation. */
  phantomTypeTranslation?: boolean;

  /** Error union tracking on hover. */
  errorUnionTracking?: boolean;

  /** Quick-fix code actions. */
  codeFixes?: boolean | CodeFixConfig;

  /** Per-call-site unsafe extraction analysis. */
  unsafeCallSite?: boolean | UnsafeCallSiteConfig;

  /** Code quality lints suggesting idiomatic patterns. */
  codeQuality?: boolean | CodeQualityConfig;

  /** Error type quality lints. */
  errorTypeQuality?: boolean | ErrorTypeQualityConfig;

  /** IDE-specific enhancements (auto-import, semantic tokens). */
  ideEnhancements?: boolean | IdeEnhancementsConfig;

  /** Result type hover presentation enhancements. */
  resultHover?: boolean | ResultHoverConfig;
}

interface MustUseConfig {
  enabled?: boolean;
  severity?: "error" | "warning" | "suggestion";
}

interface UnsafeImportConfig {
  enabled?: boolean;
  severity?: "error" | "warning";
  allowPatterns?: string[];
}

interface ExhaustivenessConfig {
  enabled?: boolean;
  severity?: "error" | "warning" | "suggestion";
  discriminantProperty?: string[];
  defaultCatchesSingleVariant?: boolean;
  catchAllPanicInMatch?: boolean | { enabled?: boolean; severity?: "warning" | "suggestion" };
  duplicateMatchArmBodies?: boolean;
}

interface CodeFixConfig {
  enabled?: boolean;
  wrapInFromThrowable?: boolean;
  convertIsOkToMatch?: boolean;
  replaceUnwrapWithUnwrapOr?: boolean;
  suggestFromNullable?: boolean;
  fillMatchCases?: boolean;
  wrapInOkErr?: boolean;
  wrapReturnType?: boolean;
  matchToCombinator?: boolean;
}

interface UnsafeCallSiteConfig {
  unwrapCallSite?: boolean | { enabled?: boolean; severity?: "error" | "warning" | "suggestion" | "allow" };
  unwrapInResultFn?: boolean | { enabled?: boolean; severity?: "error" | "warning" | "suggestion" };
  throwInResultFn?: boolean | { enabled?: boolean; severity?: "error" | "warning" | "suggestion" };
  alwaysPanickingUnwrap?: boolean;
  literalUnwrap?: boolean;
  assertResultState?: boolean | { enabled?: boolean; severity?: "error" | "warning" | "suggestion" };
}

interface CodeQualityConfig {
  enabled?: boolean;
  severity?: "error" | "warning" | "suggestion";
  preferIsOkAnd?: boolean;
  preferAndThen?: boolean;
  mapVoidReturn?: boolean | { severity?: "error" | "warning" | "suggestion" };
  preferMapOr?: boolean;
  unnecessaryLazyEvaluation?: boolean;
  uselessIdentityConversion?: boolean | { severity?: "error" | "warning" | "suggestion" };
}

interface ErrorTypeQualityConfig {
  enabled?: boolean;
  uninformativeErrorType?: boolean | { enabled?: boolean; severity?: "error" | "warning" | "suggestion"; additionalTypes?: string[] };
  missingErrorsDoc?: boolean | { enabled?: boolean; severity?: "warning" | "suggestion" };
  unnecessaryResultWrapping?: boolean | { enabled?: boolean; severity?: "warning" | "suggestion" };
  mapErrDiscardsOriginal?: boolean | { enabled?: boolean; severity?: "warning" | "suggestion" };
}

interface IdeEnhancementsConfig {
  autoImport?: boolean;
  semanticTokens?: boolean;
  diagnosticNavigation?: boolean;
}

interface ResultHoverConfig {
  /** Enable Result type display simplification. Default: true */
  resultTypeSimplification?: boolean;
  /** Suppress phantom type parameters in narrowed Ok/Err. Default: true */
  phantomTypeSuppression?: boolean;
  /** Format structured error types with tag names. Default: true */
  errorTypeFormatting?: boolean;
  /** Format error union types with variant list. Default: true */
  errorUnionFormatting?: boolean;
  /** Maximum variants to display before truncation. Default: 10 */
  maxVariantsDisplayed?: number;
  /** Show function return type summary with error variants. Default: true */
  functionReturnSummary?: boolean;
  /** Show chain transformation visualization. Default: true */
  chainTransformationView?: boolean;
  /** Show danger indicators on unsafe methods. Default: true */
  unsafeMethodIndicator?: boolean;
  /** Show match completeness indicator. Default: true */
  matchCompletenessIndicator?: boolean;
  /** Show all discriminant values on _tag hover. Default: true */
  discriminantValueList?: boolean;
  /** Show error propagation trace in chains. Default: true */
  errorPropagationTrace?: boolean;
  /** Enrich Result method hover with human-readable docs. Default: true */
  methodDocumentation?: boolean;
}
```

## BEH-08-003: Default Values

When no configuration is provided (just `{ "name": "@hex-di/result-typescript-plugin" }`), all capabilities are enabled with these defaults:

| Property | Default |
|----------|---------|
| `mustUse.enabled` | `true` |
| `mustUse.severity` | `"warning"` |
| `unsafeImportGating.enabled` | `true` |
| `unsafeImportGating.severity` | `"error"` |
| `unsafeImportGating.allowPatterns` | `[]` (no files allowed) |
| `exhaustivenessHints.enabled` | `true` |
| `exhaustivenessHints.severity` | `"suggestion"` |
| `exhaustivenessHints.discriminantProperty` | `["_tag"]` |
| `exhaustivenessHints.defaultCatchesSingleVariant` | `true` |
| `exhaustivenessHints.catchAllPanicInMatch` | `true` |
| `exhaustivenessHints.duplicateMatchArmBodies` | `true` |
| `phantomTypeTranslation` | `true` |
| `errorUnionTracking` | `true` |
| `codeFixes.enabled` | `true` |
| `codeFixes.*` (all fix types) | `true` |
| `unsafeCallSite.unwrapCallSite` | `false` (opt-in) |
| `unsafeCallSite.unwrapInResultFn` | `true` |
| `unsafeCallSite.throwInResultFn` | `true` |
| `unsafeCallSite.alwaysPanickingUnwrap` | `true` |
| `unsafeCallSite.literalUnwrap` | `true` |
| `unsafeCallSite.assertResultState` | `true` |
| `codeQuality.enabled` | `true` |
| `codeQuality.severity` | `"suggestion"` |
| `errorTypeQuality.enabled` | `true` |
| `errorTypeQuality.missingErrorsDoc` | `false` (opt-in) |
| `errorTypeQuality.*` (other lints) | `true` |
| `ideEnhancements.autoImport` | `true` |
| `ideEnhancements.semanticTokens` | `true` |
| `ideEnhancements.diagnosticNavigation` | `true` |
| `resultHover.resultTypeSimplification` | `true` |
| `resultHover.phantomTypeSuppression` | `true` |
| `resultHover.errorTypeFormatting` | `true` |
| `resultHover.errorUnionFormatting` | `true` |
| `resultHover.maxVariantsDisplayed` | `10` |
| `resultHover.functionReturnSummary` | `true` |
| `resultHover.chainTransformationView` | `true` |
| `resultHover.unsafeMethodIndicator` | `true` |
| `resultHover.matchCompletenessIndicator` | `true` |
| `resultHover.discriminantValueList` | `true` |
| `resultHover.errorPropagationTrace` | `true` |
| `resultHover.methodDocumentation` | `true` |

See [PINV-4](../invariants.md#pinv-4-configuration-defaults-preserve-safety).

## BEH-08-004: Boolean Shorthand

Each capability that accepts an object config also accepts a boolean:

| Shorthand | Equivalent |
|-----------|------------|
| `"mustUse": true` | `"mustUse": { "enabled": true, "severity": "warning" }` |
| `"mustUse": false` | `"mustUse": { "enabled": false }` |
| `"unsafeImportGating": true` | `"unsafeImportGating": { "enabled": true, "severity": "error", "allowPatterns": [] }` |
| `"unsafeImportGating": false` | `"unsafeImportGating": { "enabled": false }` |
| `"exhaustivenessHints": true` | `"exhaustivenessHints": { "enabled": true, "severity": "suggestion" }` |
| `"exhaustivenessHints": false` | `"exhaustivenessHints": { "enabled": false }` |
| `"codeFixes": true` | `"codeFixes": { "enabled": true, ... all fixes true }` |
| `"codeFixes": false` | `"codeFixes": { "enabled": false }` |

## BEH-08-005: Normalization

The `normalizeConfig()` function transforms raw `PluginConfig` into a fully resolved `ResolvedPluginConfig`:

```ts
interface ResolvedPluginConfig {
  mustUse: { enabled: boolean; severity: DiagnosticSeverity };
  unsafeImportGating: { enabled: boolean; severity: DiagnosticSeverity; allowPatterns: string[] };
  exhaustivenessHints: {
    enabled: boolean;
    severity: DiagnosticSeverity;
    discriminantProperty: string[];
    defaultCatchesSingleVariant: boolean;
    catchAllPanicInMatch: { enabled: boolean; severity: DiagnosticSeverity };
    duplicateMatchArmBodies: boolean;
  };
  phantomTypeTranslation: boolean;
  errorUnionTracking: boolean;
  codeFixes: {
    enabled: boolean;
    wrapInFromThrowable: boolean;
    convertIsOkToMatch: boolean;
    replaceUnwrapWithUnwrapOr: boolean;
    suggestFromNullable: boolean;
    fillMatchCases: boolean;
    wrapInOkErr: boolean;
    wrapReturnType: boolean;
    matchToCombinator: boolean;
  };
  unsafeCallSite: {
    unwrapCallSite: { enabled: boolean; severity: DiagnosticSeverity | "allow" };
    unwrapInResultFn: { enabled: boolean; severity: DiagnosticSeverity };
    throwInResultFn: { enabled: boolean; severity: DiagnosticSeverity };
    alwaysPanickingUnwrap: boolean;
    literalUnwrap: boolean;
    assertResultState: { enabled: boolean; severity: DiagnosticSeverity };
  };
  codeQuality: {
    enabled: boolean;
    severity: DiagnosticSeverity;
    preferIsOkAnd: boolean;
    preferAndThen: boolean;
    mapVoidReturn: { severity: DiagnosticSeverity };
    preferMapOr: boolean;
    unnecessaryLazyEvaluation: boolean;
    uselessIdentityConversion: { severity: DiagnosticSeverity };
  };
  errorTypeQuality: {
    enabled: boolean;
    uninformativeErrorType: { enabled: boolean; severity: DiagnosticSeverity; additionalTypes: string[] };
    missingErrorsDoc: { enabled: boolean; severity: DiagnosticSeverity };
    unnecessaryResultWrapping: { enabled: boolean; severity: DiagnosticSeverity };
    mapErrDiscardsOriginal: { enabled: boolean; severity: DiagnosticSeverity };
  };
  ideEnhancements: {
    autoImport: boolean;
    semanticTokens: boolean;
    diagnosticNavigation: boolean;
  };
  resultHover: {
    resultTypeSimplification: boolean;
    phantomTypeSuppression: boolean;
    errorTypeFormatting: boolean;
    errorUnionFormatting: boolean;
    maxVariantsDisplayed: number;
    functionReturnSummary: boolean;
    chainTransformationView: boolean;
    unsafeMethodIndicator: boolean;
    matchCompletenessIndicator: boolean;
    discriminantValueList: boolean;
    errorPropagationTrace: boolean;
    methodDocumentation: boolean;
  };
}

type DiagnosticSeverity = "error" | "warning" | "suggestion";
```

Every field has a concrete value — no optionals remain.

**Algorithm**:

1. For each capability, check if the raw value is:
   - `undefined` → apply all defaults
   - `true` → apply defaults with `enabled: true`
   - `false` → apply defaults with `enabled: false`
   - An object → merge with defaults, object properties take precedence
2. Validate severity values against allowed options
3. Validate `allowPatterns` is an array of strings (if present)
4. Return the resolved config

## BEH-08-006: Invalid Configuration Handling

If the raw configuration contains invalid values, the normalizer falls back to defaults for the invalid properties. No error is thrown — the plugin logs a warning to the TypeScript server log if available.

| Invalid input | Behavior |
|---------------|----------|
| `"mustUse": "yes"` | Treated as `true` (truthy) |
| `"mustUse": { "severity": "critical" }` | `severity` falls back to default `"warning"` |
| `"unsafeImportGating": { "allowPatterns": "**/*.ts" }` | `allowPatterns` falls back to default `[]` (must be an array) |
| `"codeFixes": { "unknownFix": true }` | Unknown properties are ignored |
| `"unknownCapability": true` | Unknown top-level properties are ignored |

## BEH-08-007: Transformer Configuration

The compiler transformer accepts the same configuration schema. Properties specific to editor-only features (`phantomTypeTranslation`, `errorUnionTracking`, `codeFixes`, `ideEnhancements`, `resultHover`) are accepted but ignored — the transformer runs must-use, unsafe import gating, exhaustiveness, unsafe call-site, code quality, and error type quality diagnostics.

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "@hex-di/result-typescript-plugin/transformer",
        "mustUse": { "severity": "error" },
        "unsafeImportGating": { "severity": "error" },
        "exhaustivenessHints": { "severity": "error" }
      }
    ]
  }
}
```

## BEH-08-008: Configuration Reload

When a user modifies `tsconfig.json` and the TypeScript language server reloads the project, the plugin re-reads the configuration from the updated `PluginCreateInfo.config` and re-normalizes it. No editor restart is required for configuration changes to take effect (subject to the TypeScript server's own reload behavior).
