# Competitor Comparison — React Integration

Feature matrix comparing `@hex-di/result-react` against React integration stories of TypeScript Result/Either libraries and the broader React ecosystem.

Companion to the [core library comparison](../../result/comparisons/competitors.md).

## Package Overview

| Package | React Integration | Type | Notes |
|---------|------------------|------|-------|
| `@hex-di/result-react` | Official package (spec'd) | Standalone hooks + components | This package |
| `neverthrow` | None (custom hooks) | Community DIY | Most popular TS Result library, no React package |
| `effect` / `@effect/experimental` | Official experimental | Full framework hooks | Only library with serious React investment |
| `fp-ts` | None (unmaintained community) | Community DIY | `fp-ts-react` abandoned since 2022 |
| `true-myth` | None | Community DIY | No known React packages |
| `oxide.ts` | None | Community DIY | No known React packages |
| `purify-ts` | None | Community DIY | No known React packages |
| `option-t` | None | Community DIY | No known React packages |
| `ts-results-es` | None | Community DIY | No known React packages |

## Scoring Dimensions

Each dimension is rated 0–10. A score of 10 represents the theoretical best for a React integration layer of a standalone TypeScript Result library.

| # | Dimension | What It Measures |
|---|-----------|------------------|
| 1 | Pattern Matching UI | Declarative rendering of Ok/Err branches — components, render props, exhaustiveness enforcement |
| 2 | State Management | Hooks for holding Result in React state with ergonomic setters and stable references |
| 3 | Async Integration | Hooks for async Result operations — loading state, abort, race condition handling, generation tracking |
| 4 | Suspense Support | Integration with React Suspense — thrown promises, React 19 `use()`, streaming |
| 5 | Type Inference in JSX | Generic propagation from Result to render callbacks, overload selection, phantom type handling |
| 6 | Concurrent Mode Safety | StrictMode double-mount handling, abort-on-cleanup, stale closure prevention, transition support |
| 7 | Server Component Compat | Works in RSC context, proper "use client" boundaries, server action integration |
| 8 | Data Fetching Adapters | Integration with TanStack Query, SWR, or other caching layers |
| 9 | Optimistic Updates | Support for React 19 `useOptimistic` or equivalent patterns |
| 10 | Composition / Do-Notation | Sequential multi-Result composition within React lifecycle (generators, do-notation) |
| 11 | Testing Utilities | Custom matchers, render helpers, hook testing support |
| 12 | API Consistency | Naming alignment with core library, consistent return shapes, follows established patterns |
| 13 | Bundle Impact | Additional bundle cost of the React layer, tree-shaking, subpath exports |
| 14 | Documentation Quality | Usage examples, type-level docs, migration guides, spec-level documentation |
| 15 | Philosophy Alignment | Maintains core library's "errors as values" principle in the React layer |

## React Integration Ratings

| Dimension | hex-di/result-react | neverthrow (DIY) | Effect | fp-ts (DIY) | true-myth (DIY) | oxide.ts (DIY) | purify-ts (DIY) | option-t (DIY) | ts-results-es (DIY) |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Pattern Matching UI | 9 | 4 | 7 | 5 | 5 | 3 | 4 | 3 | 3 |
| State Management | 9 | 5 | 6 | 4 | 4 | 3 | 4 | 3 | 3 |
| Async Integration | 10 | 6 | 8 | 4 | 2 | 2 | 3 | 2 | 2 |
| Suspense Support | 9 | 2 | 7 | 2 | 1 | 1 | 1 | 1 | 1 |
| Type Inference in JSX | 10 | 6 | 8 | 6 | 5 | 4 | 5 | 4 | 4 |
| Concurrent Mode Safety | 10 | 3 | 8 | 3 | 2 | 2 | 2 | 2 | 2 |
| Server Component Compat | 9 | 4 | 6 | 3 | 3 | 3 | 3 | 3 | 3 |
| Data Fetching Adapters | 9 | 4 | 5 | 3 | 2 | 2 | 2 | 2 | 2 |
| Optimistic Updates | 8 | 1 | 4 | 1 | 1 | 1 | 1 | 1 | 1 |
| Composition / Do-Notation | 9 | 4 | 9 | 6 | 3 | 2 | 3 | 2 | 2 |
| Testing Utilities | 9 | 2 | 6 | 2 | 2 | 1 | 1 | 1 | 1 |
| API Consistency | 10 | 5 | 7 | 5 | 5 | 5 | 5 | 5 | 4 |
| Bundle Impact | 9 | 8 | 4 | 5 | 8 | 9 | 7 | 9 | 8 |
| Documentation Quality | 9 | 3 | 7 | 3 | 3 | 2 | 2 | 2 | 2 |
| Philosophy Alignment | 10 | 6 | 6 | 7 | 6 | 5 | 5 | 6 | 5 |
| **TOTAL** | **139** | **63** | **96** | **59** | **52** | **45** | **48** | **46** | **43** |

## Per-Library Justifications

### @hex-di/result-react (139/150)

- **Pattern Matching UI 9**: Render-prop `Match` component with full exhaustiveness enforcement. Both `ok` and `err` required at type level. Key isolation for independent branch state. `matchResult`/`matchOption` server utilities extend pattern matching to RSC. Loses 1pt because there is no Option-specific React component (intentional — see [ADR-R005](../decisions/R005-no-option-hooks.md)).
- **State Management 9**: `useResult` with stable action references ([INV-R1](../invariants.md#inv-r1-stable-action-references)), overloads for initialized/uninitialized. Loses 1pt: phantom type `E = never` issue requires explicit type params when using `setErr` with an Ok-initialized result.
- **Async Integration 10**: `useResultAsync` (eager) + `useResultAction` (lazy) with generation tracking ([INV-R3](../invariants.md#inv-r3-generation-guard)), AbortSignal support on both hooks ([INV-R2](../invariants.md#inv-r2-abort-on-cleanup)), race condition prevention. Built-in retry with exponential backoff (`retry`, `retryDelay`, `retryOn`) — retries respect abort signals ([INV-R8](../invariants.md#inv-r8-retry-abort-propagation)).
- **Suspense Support 9**: `useResultSuspense` with React 19 `use()` support. `createResultResource` for render-as-you-fetch pattern with `preload()`, `read()`, and `invalidate()` ([INV-R9](../invariants.md#inv-r9-resource-cache-isolation)). Errors remain as values in `Err` branch. Loses 1pt: no streaming SSR integration (framework-specific).
- **Type Inference in JSX 10**: Render props provide full generic inference from `result` to callbacks. No compound component inference breakage. Phantom types documented with explicit workarounds. See [type-system/inference.md](../type-system/inference.md).
- **Concurrent Mode Safety 10**: StrictMode double-mount handled via abort + generation pattern ([INV-R7](../invariants.md#inv-r7-strict-mode-compatibility)). `useOptimisticResult` supports transitions. `useResultTransition` wraps React 19 `useTransition` with Result semantics.
- **Server Component Compat 9**: Dedicated `/server` subpath with `matchResult`, `matchResultAsync`, `matchOption`, `resultAction` — all RSC-safe pure functions ([INV-R10](../invariants.md#inv-r10-server-utility-purity)). Clear `"use client"` boundary guidance table. React version compatibility matrix documents per-export React 18/19 support. `fromAction` + `resultAction` cover client and server action patterns. Loses 1pt: RSC ecosystem still evolving, streaming integration deferred.
- **Data Fetching Adapters 9**: `toQueryFn`, `toQueryOptions`, `toMutationFn`, `toMutationOptions` for TanStack Query. `toSwrFetcher` for SWR. `to*` naming convention documented in [ADR-R007](../decisions/R007-adapter-naming.md). Optional peer dependencies documented in overview. Loses 1pt: no cache-hydration helpers (framework-specific).
- **Optimistic Updates 8**: `useOptimisticResult` wraps React 19 `useOptimistic` with Result semantics. Loses 2pts: React 19 only (no fallback for React 18), no rollback integration with error display.
- **Composition / Do-Notation 9**: `useSafeTry` (sync + async generators) bridges the core library's `safeTry` into React lifecycle. Core `bind`/`let_` Do notation available directly inside `useResultAsync` for imperative-style composition (see [ADR-R008](../decisions/R008-no-do-notation-hook.md) for why a dedicated hook was not provided). Loses 1pt: Effect's fiber-based composition handles more complex concurrency patterns.
- **Testing Utilities 9**: Custom Vitest matchers (`toBeOk`, `toBeErr`, `toBeLoading`), `renderWithResult` helper, `createResultFixture` for test data factories with `ok()`/`err()`/`okAsync()`/`errAsync()`, `mockResultAsync` for controllable deferred resolution with explicit single-resolution contract, `ResultDecorator` for Storybook. Loses 1pt: no MSW integration helpers (external dependency).
- **API Consistency 10**: Follows core library's `from*` constructor pattern, `match` naming, consistent object return shapes. `useResultAction` naming avoids React collision. `to*` adapter prefix documented in [ADR-R007](../decisions/R007-adapter-naming.md), complementing core's `from*`/`to*` directionality.
- **Bundle Impact 9**: Four subpath exports (core/adapters/server/testing). No barrel re-exports of core types. Adapters and server utilities tree-shake when unused. Loses 1pt: React peer dependency is inherent overhead.
- **Documentation Quality 9**: Full spec with 7 behavior specs, 8 ADRs, 10 invariants, type-system docs, test strategy with integration test plans, competitor comparison matrix. Loses 1pt: no interactive playground (requires infrastructure).
- **Philosophy Alignment 10**: No error boundary component. No exception promotion. Errors always flow as values through render props and hook returns. Server utilities maintain the same principle. Explicit decision record explaining why ([ADR-R001](../decisions/R001-no-error-boundary.md)).

### neverthrow — DIY (63/150)

- **Pattern Matching UI 4**: No component. Inline `.match()` works but no exhaustiveness enforcement in JSX, no key isolation between branches.
- **State Management 5**: Manual `useState<Result<T, E>>()`. No stable setters, no ergonomic helpers. Users write custom hooks.
- **Async Integration 6**: `ResultAsync` exists as a chaining primitive. Users build their own `useResultAsync` with `useEffect`. No generation tracking or abort handling built in.
- **Suspense Support 2**: No Suspense integration. Users must manually throw promises and convert between `ResultAsync` and Suspense.
- **Type Inference in JSX 6**: `.match()` infers types correctly. No component-level inference. Generic propagation depends on user implementation.
- **Concurrent Mode Safety 3**: No built-in handling. Users must implement abort + generation patterns themselves.
- **Server Component Compat 4**: `Result` types work in RSC. No server action helpers.
- **Data Fetching Adapters 4**: No adapters. Users wrap `ResultAsync` in `queryFn` manually. Blog posts document the pattern.
- **Optimistic Updates 1**: No integration. Manual implementation required.
- **Composition / Do-Notation 4**: `safeTry` generators exist in core but no React lifecycle bridge.
- **Testing Utilities 2**: No React testing utilities. Core has basic matchers.
- **API Consistency 5**: Core API is consistent but no React-specific naming conventions.
- **Bundle Impact 8**: Small core library (~8KB). No React layer overhead.
- **Documentation Quality 3**: Good core README. No React usage docs beyond community blog posts.
- **Philosophy Alignment 6**: Core is errors-as-values. But no React guidance means developers may reach for `_unsafeUnwrap` with error boundaries.

### Effect / @effect/experimental (96/150)

- **Pattern Matching UI 7**: `Match` type from Effect provides pattern matching. Not a React component — used with `.pipe()` and `Match.tag()`. Functional but not React-idiomatic.
- **State Management 6**: `useEffect` hook (not React's) runs Effects. State management is Effect-style, not React-style. Steeper learning curve.
- **Async Integration 8**: Effect fibers provide advanced async with interruption, timeout, retry. React bridge via `useAsyncEffect`. More powerful than simple hooks but heavier.
- **Suspense Support 7**: `Runtime.runPromise` can trigger Suspense. Experimental SSR support. Not as turnkey as a simple `useResultSuspense`.
- **Type Inference in JSX 8**: Strong inference via Effect's type system. Some complexity with `R` (requirements) type parameter.
- **Concurrent Mode Safety 8**: Fiber interruption handles cleanup. StrictMode compatible. Transition support via Effect runtime.
- **Server Component Compat 6**: Experimental RSC features. Effect runtime needs client-side initialization.
- **Data Fetching Adapters 5**: Effect has its own HTTP client. No TanStack Query/SWR adapters — the ecosystem expects you to use Effect's data layer.
- **Optimistic Updates 4**: Can be implemented via Effect's state management but no turnkey `useOptimistic` bridge.
- **Composition / Do-Notation 9**: Effect's generator-based Do notation is best-in-class. React integration through `useAsyncEffect` + generators.
- **Testing Utilities 6**: Effect has testing utilities (`@effect/vitest`). React-specific testing helpers are limited.
- **API Consistency 7**: Consistent within Effect's ecosystem. But Effect's naming diverges from React conventions (`useEffect` collision).
- **Bundle Impact 4**: Effect runtime is ~50KB+. Heavy for simple Result use cases.
- **Documentation Quality 7**: Comprehensive Effect docs. React integration section is thinner.
- **Philosophy Alignment 6**: Effect treats errors as typed values (defects vs failures). But the framework's power encourages complex patterns beyond simple Result matching.

### fp-ts — DIY (59/150)

- **Pattern Matching UI 5**: `fold` / `match` on `Either` works inline. No component. `pipe(either, fold(...))` is idiomatic but verbose.
- **State Management 4**: Manual `useState<Either<E, T>>()`. No helpers. HKT encoding makes custom hooks harder to type.
- **Async Integration 4**: `TaskEither` exists but bridging to React lifecycle is manual and awkward. No abort handling.
- **Suspense Support 2**: No integration. Manual promise extraction from `TaskEither`.
- **Type Inference in JSX 6**: `fold` infers well. Pipe chains have good inference. HKT encoding occasionally confuses.
- **Concurrent Mode Safety 3**: No built-in handling.
- **Server Component Compat 3**: `Either` types work in RSC. No server action helpers.
- **Data Fetching Adapters 3**: Manual wrapping. `fp-ts-remote-data` pattern exists in community.
- **Optimistic Updates 1**: No integration.
- **Composition / Do-Notation 6**: `Do` notation via `chain` and `bind`. Works but is verbose and less ergonomic than generators.
- **Testing Utilities 2**: No React testing utilities.
- **API Consistency 5**: Consistent within fp-ts. Different naming (`Either` vs `Result`, `fold` vs `match`).
- **Bundle Impact 5**: ~30KB. Poor tree-shaking in practice due to module structure.
- **Documentation Quality 3**: API docs are terse. Community-driven React tutorials.
- **Philosophy Alignment 7**: Strictly functional. Errors always as values. But verbose style discourages adoption in React codebases.

### true-myth — DIY (52/150)

- **Pattern Matching UI 5**: `.match()` method works inline. Standalone `match` function for pipe style.
- **State Management 4**: Manual `useState`. No helpers.
- **Async Integration 2**: No async wrapper. Manual `Promise<Result>`.
- **Suspense Support 1**: No integration.
- **Type Inference in JSX 5**: Good method-level inference. No component-level.
- **Concurrent Mode Safety 2**: No handling.
- **Server Component Compat 3**: Result types work in RSC.
- **Data Fetching Adapters 2**: No adapters.
- **Optimistic Updates 1**: No integration.
- **Composition / Do-Notation 3**: No generators, no Do notation.
- **Testing Utilities 2**: No React utilities.
- **API Consistency 5**: Consistent naming within library.
- **Bundle Impact 8**: Small (~5KB).
- **Documentation Quality 3**: Good TypeDoc but no React docs.
- **Philosophy Alignment 6**: Errors as values, but no guidance for React usage.

### oxide.ts — DIY (45/150)

- **Pattern Matching UI 3**: `.match()` method. No component.
- **State Management 3**: Manual `useState`.
- **Async Integration 2**: No async wrapper.
- **Suspense Support 1**: No integration.
- **Type Inference in JSX 4**: Basic inference.
- **Concurrent Mode Safety 2**: No handling.
- **Server Component Compat 3**: Types work in RSC.
- **Data Fetching Adapters 2**: No adapters.
- **Optimistic Updates 1**: No integration.
- **Composition / Do-Notation 2**: No generators, no Do notation.
- **Testing Utilities 1**: No utilities.
- **API Consistency 5**: Rust-faithful naming.
- **Bundle Impact 9**: Very small (~3KB).
- **Documentation Quality 2**: README only.
- **Philosophy Alignment 5**: Errors as values but `unwrap()` is ungated.

### purify-ts — DIY (48/150)

- **Pattern Matching UI 4**: `.caseOf()` method provides pattern matching. No component.
- **State Management 4**: Manual `useState`. Class instances.
- **Async Integration 3**: `EitherAsync` exists but limited.
- **Suspense Support 1**: No integration.
- **Type Inference in JSX 5**: ADT-based, decent inference.
- **Concurrent Mode Safety 2**: No handling.
- **Server Component Compat 3**: Types work in RSC.
- **Data Fetching Adapters 2**: No adapters.
- **Optimistic Updates 1**: No integration.
- **Composition / Do-Notation 3**: Chain-based. No generators.
- **Testing Utilities 1**: No utilities.
- **API Consistency 5**: Haskell-inspired naming.
- **Bundle Impact 7**: Moderate (~15KB).
- **Documentation Quality 2**: Docs site with examples.
- **Philosophy Alignment 5**: Errors as values. Codec validation is a strength.

### option-t — DIY (46/150)

- **Pattern Matching UI 3**: Function-based `unwrapOrElse`. No component.
- **State Management 3**: Manual `useState`. Plain objects.
- **Async Integration 2**: No async wrapper.
- **Suspense Support 1**: No integration.
- **Type Inference in JSX 4**: Simple types, basic inference.
- **Concurrent Mode Safety 2**: No handling.
- **Server Component Compat 3**: Types work in RSC.
- **Data Fetching Adapters 2**: No adapters.
- **Optimistic Updates 1**: No integration.
- **Composition / Do-Notation 2**: Function composition only.
- **Testing Utilities 1**: No utilities.
- **API Consistency 5**: Consistent internally.
- **Bundle Impact 9**: Tiny bundle.
- **Documentation Quality 2**: Sparse docs.
- **Philosophy Alignment 6**: Plain objects, functional style.

### ts-results-es — DIY (43/150)

- **Pattern Matching UI 3**: `.match()` method. No component.
- **State Management 3**: Manual `useState`. Class instances.
- **Async Integration 2**: No async wrapper.
- **Suspense Support 1**: No integration.
- **Type Inference in JSX 4**: Basic generics.
- **Concurrent Mode Safety 2**: No handling.
- **Server Component Compat 3**: Types work in RSC.
- **Data Fetching Adapters 2**: No adapters.
- **Optimistic Updates 1**: No integration.
- **Composition / Do-Notation 2**: No generators.
- **Testing Utilities 1**: No utilities.
- **API Consistency 4**: Rust-inspired but some divergence.
- **Bundle Impact 8**: Small ESM bundle.
- **Documentation Quality 2**: README only.
- **Philosophy Alignment 5**: `unwrap()` is ungated.

## Consolidated Rating Matrix

| Dimension | hex-di | neverthrow | Effect | fp-ts | true-myth | oxide.ts | purify-ts | option-t | ts-results-es |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Pattern Matching UI | 9 | 4 | 7 | 5 | 5 | 3 | 4 | 3 | 3 |
| State Management | 9 | 5 | 6 | 4 | 4 | 3 | 4 | 3 | 3 |
| Async Integration | 10 | 6 | 8 | 4 | 2 | 2 | 3 | 2 | 2 |
| Suspense Support | 9 | 2 | 7 | 2 | 1 | 1 | 1 | 1 | 1 |
| Type Inference in JSX | 10 | 6 | 8 | 6 | 5 | 4 | 5 | 4 | 4 |
| Concurrent Mode Safety | 10 | 3 | 8 | 3 | 2 | 2 | 2 | 2 | 2 |
| Server Component Compat | 9 | 4 | 6 | 3 | 3 | 3 | 3 | 3 | 3 |
| Data Fetching Adapters | 9 | 4 | 5 | 3 | 2 | 2 | 2 | 2 | 2 |
| Optimistic Updates | 8 | 1 | 4 | 1 | 1 | 1 | 1 | 1 | 1 |
| Composition / Do-Notation | 9 | 4 | 9 | 6 | 3 | 2 | 3 | 2 | 2 |
| Testing Utilities | 9 | 2 | 6 | 2 | 2 | 1 | 1 | 1 | 1 |
| API Consistency | 10 | 5 | 7 | 5 | 5 | 5 | 5 | 5 | 4 |
| Bundle Impact | 9 | 8 | 4 | 5 | 8 | 9 | 7 | 9 | 8 |
| Documentation Quality | 9 | 3 | 7 | 3 | 3 | 2 | 2 | 2 | 2 |
| Philosophy Alignment | 10 | 6 | 6 | 7 | 6 | 5 | 5 | 6 | 5 |
| **TOTAL** | **139** | **63** | **96** | **59** | **52** | **45** | **48** | **46** | **43** |

## Ranking

| Rank | Implementation | Score | Gap to #1 | React Layer Type |
|:----:|----------------|:-----:|:---------:|------------------|
| 1 | **@hex-di/result-react** | **139** | — | Official package |
| 2 | Effect | 96 | −43 | Official experimental |
| 3 | neverthrow | 63 | −76 | Community DIY |
| 4 | fp-ts | 59 | −80 | Community DIY |
| 5 | true-myth | 52 | −87 | Community DIY |
| 6 | purify-ts | 48 | −91 | Community DIY |
| 7 | option-t | 46 | −93 | Community DIY |
| 8 | oxide.ts | 45 | −94 | Community DIY |
| 9 | ts-results-es | 43 | −96 | Community DIY |

## Key Observations

### Why @hex-di/result-react leads

1. **Purpose-built** — The only standalone Result library with a dedicated, spec-driven React package. All others either provide no React layer (7 of 9) or are part of a larger framework (Effect).
2. **Philosophy consistency** — The explicit decision to reject `ResultBoundary` ([ADR-R001](../decisions/R001-no-error-boundary.md)) keeps the "errors as values" principle intact through the React layer. Effect's error boundary component breaks this.
3. **Type inference** — Render props enforce exhaustiveness at compile time. No other library's React story achieves this.
4. **Modern React** — React 19 features (`useOptimistic`, `use()`, server actions) are first-class, not afterthoughts.

### Where Effect is stronger

1. **Composition / Do-Notation (9 vs 9)** — Tied. Effect's fiber-based composition handles complex concurrency patterns. `useSafeTry` (sync + async generators) and core `bind`/`let_` inside `useResultAsync` cover the common cases well.

### Where @hex-di/result-react is stronger

1. **Bundle Impact (9 vs 4)** — Effect's runtime is ~50KB+. The Result-React package adds minimal overhead.
2. **Philosophy Alignment (10 vs 6)** — Effect's `ErrorBoundary` and complex error channels blur the "errors as values" line.
3. **Type Inference in JSX (10 vs 8)** — Effect's `R` type parameter (requirements) adds inference complexity in React context.
4. **Data Fetching Adapters (9 vs 5)** — Effect expects you to use its own data layer. Result-React adapts to TanStack Query/SWR with query and mutation adapters.
5. **Optimistic Updates (8 vs 4)** — First-class `useOptimisticResult` vs Effect's manual implementation.
6. **Server Component Compat (9 vs 6)** — Dedicated `/server` subpath with RSC-safe utilities. Effect's runtime needs client-side initialization.
7. **Testing Utilities (9 vs 6)** — Fixture factories, controllable mocks, Storybook decorators. Effect's testing is less React-focused.
8. **Async Integration (10 vs 8)** — Built-in retry with exponential backoff, `createResultResource` for render-as-you-fetch. Clean, targeted hooks vs Effect's heavier runtime.
9. **Concurrent Mode Safety (10 vs 8)** — `useResultTransition` wraps React 19 `useTransition` directly. Complete StrictMode + abort + generation coverage.

## Remaining Gap Analysis

Dimensions where `@hex-di/result-react` scores below 10 after improvements:

| Dimension | Score | Gap | Reason |
|-----------|:-----:|:---:|--------|
| Pattern Matching UI | 9 | 1 | No Option-specific React component. Intentional omission per [ADR-R005](../decisions/R005-no-option-hooks.md). `matchOption` in `/server` subpath covers RSC use case. |
| State Management | 9 | 1 | Phantom type `E = never` issue when initializing with `ok()`. Documented workaround (explicit type params). |
| Suspense Support | 9 | 1 | No streaming SSR integration — requires framework-specific work (Next.js, Remix). |
| Data Fetching Adapters | 9 | 1 | No cache-hydration helpers — framework-specific (TanStack Query handles this internally). |
| Optimistic Updates | 8 | 2 | React 19 only (no fallback for React 18). No rollback-to-error integration. |
| Composition / Do-Notation | 9 | 1 | Effect's fiber-based composition handles more complex concurrency patterns. |
| Testing Utilities | 9 | 1 | No MSW integration helpers — external dependency, not core responsibility. |
| Bundle Impact | 9 | 1 | Inherent React peer dependency overhead. Cannot improve further. |
| Documentation Quality | 9 | 1 | No interactive playground (requires infrastructure). |
| Philosophy Alignment | 10 | 0 | At ceiling. |
| Type Inference in JSX | 10 | 0 | At ceiling. |
| Concurrent Mode Safety | 10 | 0 | At ceiling. |
| Async Integration | 10 | 0 | At ceiling. |
| Server Component Compat | 9 | 1 | RSC ecosystem still evolving. Streaming Result integration deferred. |
| API Consistency | 10 | 0 | At ceiling. |

The 11-point gap from 139 to perfect 150 breaks down as: 6 dimensions at ceiling (10/10), 7 dimensions at 9/10 (each losing 1pt to inherent platform limitations, intentional design decisions, or external dependencies), and 1 dimension at 8/10 (Optimistic Updates, limited by React 18 compatibility).

## Strategic Summary

### Competitive position

`@hex-di/result-react` is the **first dedicated, spec-driven React integration package** for a standalone TypeScript Result library. The landscape is:

- **7 of 9 libraries** have zero official React support — developers build custom hooks
- **Effect** has official React hooks but they're part of a 50KB+ framework with steep learning curve
- **@hex-di/result-react** fills the gap: lightweight, purpose-built, philosophically consistent

### Biggest advantages

1. **Spec-driven design** — 20+ spec files, 8 ADRs, 10 invariants. No other Result library's React layer has this level of documentation.
2. **Type-level exhaustiveness** — Render props ensure both Ok and Err branches are handled at compile time.
3. **Modern React** — React 19 features are first-class, not retrofitted.
4. **Adapter strategy** — Works with TanStack Query/SWR instead of competing.

### Biggest risks

1. **Ecosystem** — No users yet. The spec is comprehensive but untested in production.
2. **React 19 dependency** — `useOptimisticResult` and `useResultSuspense` are less useful on React 18.
3. **Framework evolution** — RSC patterns are still stabilizing. Server Component utilities may need redesign.
