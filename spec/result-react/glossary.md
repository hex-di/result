# Glossary

Terminology used throughout the `@hex-di/result-react` specification. Terms defined in the [core library glossary](../result/glossary.md) are not repeated here.

## Match Component

A render-prop React component that accepts a `Result<T, E>` and two render functions (`ok` and `err`), rendering the appropriate branch. Enforces exhaustiveness at the type level — both props are required. See [01-components.md](behaviors/01-components.md).

## Render Prop

A React pattern where a component accepts functions as props that return `ReactNode`. Preferred over compound components for type inference and exhaustiveness enforcement. See [ADR-R006](decisions/R006-render-props-over-compound.md).

## Stable Reference

A callback or object returned by a hook whose identity does not change between renders. Achieved via `useMemo` or `useCallback` with empty dependency arrays. All action objects from hooks in this package are stable references.

## Generation Tracking

A technique for preventing stale async state updates. Each invocation of an async operation increments a generation counter. When the operation resolves, it only updates state if its generation matches the current generation. See [02-async-hooks.md](behaviors/02-async-hooks.md).

## Eager Hook

A hook that executes its async operation immediately on mount and when dependencies change. `useResultAsync` is an eager hook. Contrast with [Lazy Hook](#lazy-hook).

## Lazy Hook

A hook that does not execute its async operation automatically. Execution is triggered by calling `execute()`. `useResultAction` is a lazy hook. Contrast with [Eager Hook](#eager-hook).

## Adapter

A thin wrapper function that converts between `Result`/`ResultAsync` and the data types expected by third-party libraries (TanStack Query, SWR). Adapters live in the `@hex-di/result-react/adapters` subpath. See [ADR-R004](decisions/R004-adapter-strategy.md).

## Server Action

A React 19 / Next.js function marked with `"use server"` that runs on the server and can be called from client components. `fromAction` wraps server actions to return `ResultAsync`. See [04-utilities.md](behaviors/04-utilities.md).

## Optimistic Update

A UI pattern where the interface is updated immediately with an expected value before the server confirms the change. `useOptimisticResult` wraps React 19's `useOptimistic` to work with Result values. See [03-composition-hooks.md](behaviors/03-composition-hooks.md).

## Resource

A Suspense-compatible cache object created outside the component tree via `createResultResource`. Supports `read()` (returns Result or suspends), `preload()` (eager fetch), and `invalidate()` (cache clear). Enables the render-as-you-fetch pattern. See [02-async-hooks.md](behaviors/02-async-hooks.md).

## Transition

A React 19 concurrent feature that allows state updates to be deferred so the UI remains responsive. `useResultTransition` wraps `useTransition` to execute Result-returning async operations inside transitions. See [03-composition-hooks.md](behaviors/03-composition-hooks.md).

## Retry

An optional behavior of `useResultAsync` where `Err` results are automatically re-attempted with configurable delay and predicate. Retries respect abort signals — aborting cancels all pending retries. See [INV-R8](invariants.md#inv-r8-retry-abort-propagation).
