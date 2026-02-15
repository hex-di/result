# Invariants

Runtime guarantees and contracts enforced by the `@hex-di/result-react` implementation.

## INV-R1: Stable Action References

All action callbacks returned by hooks (`setOk`, `setErr`, `set`, `reset`, `execute`, `refetch`) maintain the same function identity across re-renders. Consumers can safely pass them to `useEffect` dependency arrays and memoized child components without causing unnecessary re-renders.

**Source**: All hook implementations use `useMemo` or `useCallback` with stable dependency arrays.

**Implication**: Components receiving actions as props can use `React.memo` effectively. Effects depending on actions do not re-run spuriously.

## INV-R2: Abort on Cleanup

All async hooks abort in-flight operations via `AbortController.abort()`:

- **`useResultAsync`**: Aborts when the component unmounts or the dependency array changes (new request supersedes the old one). Implemented via `useEffect` cleanup.
- **`useResultAction`**: Aborts the previous operation when `execute()` is called again, when `reset()` is called, or when the component unmounts. Implemented via per-execution `AbortController`.

**Source**: `hooks/use-result-async.ts` and `hooks/use-result-action.ts`.

**Implication**: No state updates occur on unmounted components. Stale responses from superseded requests are discarded. In-flight HTTP requests are actually cancelled (not just ignored), preventing resource leaks.

## INV-R3: Generation Guard

Async hooks track a generation counter that increments on each new invocation. When an async operation resolves, it only updates state if its generation matches the current generation. This prevents out-of-order responses from overwriting newer data.

**Source**: `hooks/use-result-async.ts` and `hooks/use-result-action.ts` — `generationRef` pattern.

**Implication**: Rapid dependency changes (e.g., fast typing in a search field) never produce stale results in the UI.

## INV-R4: No Exception Promotion

No component or hook in this package promotes throwing as a primary error handling pattern. `Result` errors flow through render props and hook return values, not through exception boundaries.

**Source**: Architecture-level constraint. See [ADR-R001](decisions/R001-no-error-boundary.md).

**Implication**: Consistent with the core library's "errors as values" philosophy. Components always have explicit access to the error via the `err` render prop or `result.isErr()` check.

## INV-R5: Match Exhaustiveness

The `Match` component requires both `ok` and `err` render props at the type level. Omitting either prop produces a TypeScript compilation error.

**Source**: `components/match.tsx` — both props are required in the `MatchProps` interface.

**Implication**: Every `Result` rendered via `Match` has both branches handled. No silent omission of error states.

## INV-R6: Suspense Contract

`useResultSuspense` throws a `Promise` (not an `Error`) to trigger React Suspense when the async operation is pending. Once resolved, it returns `Result<T, E>` — never `undefined`. Errors are values in the `Err` branch, not thrown.

**Source**: `hooks/use-result-suspense.ts` — throws the pending promise for Suspense, returns resolved `Result`.

**Implication**: Parent `<Suspense>` boundaries catch the thrown promise. The resolved value is always a `Result`, consistent with [INV-R4](#inv-r4-no-exception-promotion).

## INV-R7: Strict Mode Compatibility

All hooks function correctly under React 18/19 StrictMode, which double-invokes effects in development. The generation tracking ([INV-R3](#inv-r3-generation-guard)) and abort-on-cleanup ([INV-R2](#inv-r2-abort-on-cleanup)) patterns handle the double-mount/unmount cycle without producing duplicate state updates or memory leaks.

**Source**: All effect-based hooks use the cleanup → abort → generation pattern.

**Implication**: Development and production behavior are consistent. No warnings or stale state from StrictMode double-rendering.

## INV-R8: Retry Abort Propagation

When `useResultAsync` is configured with `retry > 0`, aborting the signal (via unmount, deps change, or refetch) cancels all pending retries. No retry attempt fires after abort. The `retryDelay` timer is cleared and no further invocations of `fn` occur.

**Source**: `hooks/use-result-async.ts` — retry loop checks `signal.aborted` before each attempt and clears delay timers on abort.

**Implication**: Users can safely configure retry without risk of orphaned retry attempts continuing after the component unmounts or deps change.

## INV-R9: Resource Cache Isolation

Each `ResultResource` instance maintains its own independent cache. Calling `invalidate()` on one resource does not affect other resources. The cache lifecycle is: empty → pending (after `preload()` or first `read()`) → resolved → empty (after `invalidate()`).

**Source**: `hooks/create-result-resource.ts` — closure-scoped cache per `createResultResource` call.

**Implication**: Multiple resources can be created for different data without interference. Cache invalidation is explicit and scoped.

## INV-R10: Server Utility Purity

All exports from `@hex-di/result-react/server` are pure functions with no React hooks, no `useState`, no `useEffect`, and no dependency on the React runtime beyond JSX types. They can be called in React Server Components, server actions, API routes, or any non-React context.

**Source**: `server/*.ts` — no imports from `react` except type-level JSX types.

**Implication**: The `/server` subpath never triggers `"use client"` requirements. It can be imported in any server-side context without bundler errors.
