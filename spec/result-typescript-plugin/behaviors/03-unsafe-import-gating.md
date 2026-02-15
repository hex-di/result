# 03 — Unsafe Import Gating

Detect and restrict imports from `@hex-di/result/unsafe` to explicitly allowed file patterns. Complements the runtime subpath gating from [ADR-010](../../result/decisions/010-unsafe-subpath.md) with static analysis enforcement.

## BEH-03-001: Static Import Detection

The analyzer visits every `ts.ImportDeclaration` in the source file. For each:

1. Extract the module specifier: `(node.moduleSpecifier as ts.StringLiteral).text`
2. Check if it equals `"@hex-di/result/unsafe"` exactly
3. If matched, check the source file path against `allowPatterns`
4. If the file is not allowed, report a diagnostic

```ts
// Detected:
import { unwrap } from "@hex-di/result/unsafe";
import { unwrap, unwrapErr } from "@hex-di/result/unsafe";
import * as unsafe from "@hex-di/result/unsafe";
import "@hex-di/result/unsafe";  // side-effect import
```

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90010` (`UNSAFE_IMPORT`) |
| Category | Configurable: `error` (default), `warning` |
| Message | `Import from '@hex-di/result/unsafe' is not allowed in this file. Unsafe extractors (unwrap, unwrapErr) throw on the wrong variant. Use .match(), .unwrapOr(), or add this file to 'allowPatterns'.` |
| Start | Start position of the module specifier string literal |
| Length | Length of the module specifier string literal |

## BEH-03-002: Dynamic Import Detection

The analyzer also detects dynamic `import()` expressions targeting `@hex-di/result/unsafe`:

```ts
// Detected:
const unsafe = await import("@hex-di/result/unsafe");
import("@hex-di/result/unsafe").then(m => m.unwrap(result));
```

Detection: visit `ts.CallExpression` nodes where `node.expression.kind === ts.SyntaxKind.ImportKeyword` and the first argument is a string literal equal to `"@hex-di/result/unsafe"`.

**Diagnostic**:

| Field | Value |
|-------|-------|
| Code | `90011` (`UNSAFE_IMPORT_DYNAMIC`) |
| Category | Same as `UNSAFE_IMPORT` (inherits from configuration) |
| Message | `Dynamic import of '@hex-di/result/unsafe' is not allowed in this file. Add this file to 'allowPatterns' if intentional.` |
| Start | Start position of the `import(...)` call expression |
| Length | Length of the `import(...)` call expression |

## BEH-03-003: Require Detection

The analyzer detects CommonJS `require()` calls targeting `@hex-di/result/unsafe`:

```ts
// Detected:
const { unwrap } = require("@hex-di/result/unsafe");
const unsafe = require("@hex-di/result/unsafe");
```

Detection: visit `ts.CallExpression` nodes where `node.expression` is an `Identifier` with name `require` and the first argument is a string literal equal to `"@hex-di/result/unsafe"`.

The diagnostic uses code `90010` (`UNSAFE_IMPORT`), same as static imports.

## BEH-03-004: Allow Patterns

The `allowPatterns` configuration accepts an array of glob patterns. A file is allowed if **any** pattern matches its absolute file path (as reported by `sourceFile.fileName`).

**Glob syntax**:
- `*` matches any characters within a single path segment (excluding `/`)
- `**` matches zero or more path segments (including separators)
- Patterns use forward slashes (`/`) regardless of platform
- Patterns are matched against the normalized forward-slash file path

**Examples**:

| Pattern | Matches |
|---------|---------|
| `**/tests/**` | Any file under a `tests/` directory at any depth |
| `**/*.test.ts` | Any file ending in `.test.ts` at any depth |
| `**/scripts/**` | Any file under a `scripts/` directory |
| `src/legacy/**` | Files under `src/legacy/` relative to project root |

**Default**: When `allowPatterns` is not specified or is an empty array, **no files** are allowed to import from `@hex-di/result/unsafe`. Every such import triggers a diagnostic.

## BEH-03-005: Path Normalization

Before matching, file paths are normalized:

1. Backslashes (`\`) are replaced with forward slashes (`/`) for cross-platform consistency
2. The path is the full absolute path from `sourceFile.fileName` (e.g., `/Users/dev/project/src/service.ts`)
3. Patterns are matched using the glob matcher from `utils/glob-match.ts`

See [PINV-8](../invariants.md#pinv-8-allow-patterns-match-file-paths-consistently).

## BEH-03-006: Configuration

```ts
interface UnsafeImportConfig {
  /** Enable unsafe import gating. Default: true */
  enabled?: boolean;
  /** Diagnostic severity. Default: "error" */
  severity?: "error" | "warning";
  /** Glob patterns where @hex-di/result/unsafe imports are allowed. Default: [] */
  allowPatterns?: string[];
}
```

Shorthand: `"unsafeImportGating": true` is equivalent to `"unsafeImportGating": { "enabled": true, "severity": "error", "allowPatterns": [] }`. `"unsafeImportGating": false` disables the diagnostic entirely.

## BEH-03-007: No Type Checking Required

Unlike other analyzers, the unsafe import detector does not require the type checker. It operates purely on AST inspection of import statements and their module specifier strings. This makes it the cheapest analyzer to run.
