# Test Strategy

Testing approach for `@hex-di/result-react`, aligned with the [core library's test strategy](../../result/process/test-strategy.md).

## Test Pyramid

| Level | Tool | Pattern | Purpose |
| ----- | ---- | ------- | ------- |
| Level 1: Unit | Vitest + React Testing Library | `*.test.ts` / `*.test.tsx` | Component and hook runtime behavior |
| Level 2: Type | Vitest typecheck | `*.test-d.ts` / `*.test-d.tsx` | Generic inference, overload selection, exhaustiveness |
| Level 3: Integration | Vitest + React Testing Library | `integration/*.test.tsx` | Full component trees with async hooks |

## Level 1: Unit Tests

### Component Tests

Test the `Match` component renders the correct branch:

```tsx
// tests/components/match.test.tsx
describe("Match", () => {
  it("renders ok branch when result is Ok", () => {
    render(
      <Match
        result={ok(42)}
        ok={(n) => <p data-testid="ok">{n}</p>}
        err={(e) => <p data-testid="err">{e}</p>}
      />
    )
    expect(screen.getByTestId("ok")).toHaveTextContent("42")
    expect(screen.queryByTestId("err")).not.toBeInTheDocument()
  })

  it("renders err branch when result is Err", () => {
    render(
      <Match
        result={err("fail")}
        ok={(n) => <p data-testid="ok">{n}</p>}
        err={(e) => <p data-testid="err">{e}</p>}
      />
    )
    expect(screen.getByTestId("err")).toHaveTextContent("fail")
    expect(screen.queryByTestId("ok")).not.toBeInTheDocument()
  })

  it("unmounts previous branch on variant change", () => {
    // Tests key isolation (key="ok" vs key="err")
  })
})
```

### Hook Tests

Test hooks using `renderHook` from React Testing Library:

```tsx
// tests/hooks/use-result.test.ts
describe("useResult", () => {
  it("starts as undefined when no initial value", () => {
    const { result } = renderHook(() => useResult<string, Error>())
    expect(result.current.result).toBeUndefined()
  })

  it("starts with initial value when provided", () => {
    const { result } = renderHook(() => useResult(ok("hello")))
    expect(result.current.result).toBeOk("hello")
  })

  it("setOk updates to Ok", () => {
    const { result } = renderHook(() => useResult<string, Error>())
    act(() => result.current.setOk("world"))
    expect(result.current.result).toBeOk("world")
  })

  it("actions are referentially stable", () => {
    const { result, rerender } = renderHook(() => useResult<string, Error>())
    const first = result.current.setOk
    rerender()
    expect(result.current.setOk).toBe(first)
  })
})
```

### Async Hook Tests

```tsx
// tests/hooks/use-result-async.test.ts
describe("useResultAsync", () => {
  it("sets isLoading to true during fetch", () => { ... })
  it("sets result to Ok on success", async () => { ... })
  it("sets result to Err on failure", async () => { ... })
  it("aborts on unmount", async () => { ... })
  it("aborts previous request on deps change", async () => { ... })
  it("handles strict mode double-mount", async () => { ... })
  it("refetch re-executes the operation", async () => { ... })
  it("discards stale responses via generation tracking", async () => { ... })
})
```

## Level 2: Type Tests

Verify generic inference and exhaustiveness at the type level:

```tsx
// tests/types/match.test-d.tsx
import { expectTypeOf } from "vitest"

test("Match infers T and E from result prop", () => {
  const result: Result<number, string> = ok(42)
  ;<Match
    result={result}
    ok={(value) => {
      expectTypeOf(value).toEqualTypeOf<number>()
      return null
    }}
    err={(error) => {
      expectTypeOf(error).toEqualTypeOf<string>()
      return null
    }}
  />
})

test("useResult without initial infers undefined union", () => {
  const { result } = useResult<string, Error>()
  expectTypeOf(result).toEqualTypeOf<Result<string, Error> | undefined>()
})

test("useResult with initial infers defined", () => {
  const { result } = useResult(ok("hello"))
  expectTypeOf(result).toEqualTypeOf<Result<string, never>>()
})

test("useResultAction infers argument types", () => {
  const { execute } = useResultAction(
    (id: string, name: string) => ResultAsync.ok({ id, name })
  )
  expectTypeOf(execute).toEqualTypeOf<
    (id: string, name: string) => Promise<Result<{ id: string; name: string }, never>>
  >()
})
```

## Level 3: Integration Tests

Full component trees with async hooks, testing realistic user flows:

```tsx
// tests/integration/async-flow.test.tsx
describe("async data flow", () => {
  it("renders loading → success → refetch → success", async () => {
    // Renders a component using useResultAsync + Match
    // Verifies the full lifecycle from loading state through resolution
  })

  it("renders loading → error → retry → success", async () => {
    // Tests error recovery via refetch
  })
})

// tests/integration/retry-flow.test.tsx
describe("retry with backoff", () => {
  it("renders loading → error → retry(1) → retry(2) → success", async () => {
    // useResultAsync with retry: 2, retryDelay: exponential
    // Verifies isLoading stays true during retries, result set only after final resolution
  })

  it("abort cancels pending retries", async () => {
    // useResultAsync with retry: 3, unmount during retry delay
    // Verifies no further fn() calls after abort
  })
})

// tests/integration/resource-suspense.test.tsx
describe("createResultResource + Suspense", () => {
  it("preload → read → resolve → render", async () => {
    // Creates resource, preloads, wraps component in Suspense
    // Verifies fallback shown while pending, result rendered after resolution
  })

  it("invalidate → re-suspend → resolve", async () => {
    // Creates resource, resolves, invalidates, verifies re-suspension
  })
})

// tests/integration/safe-try-flow.test.tsx
describe("useSafeTry sequential composition", () => {
  it("renders loading → sequential fetches → success", async () => {
    // Three sequential yield* operations with Match rendering
  })

  it("short-circuits on first Err", async () => {
    // Second yield* returns Err, third is never called
  })
})

// tests/integration/server-client-boundary.test.tsx
describe("server-client boundary", () => {
  it("matchResult renders correct branch in non-hook context", () => {
    // Tests matchResult as a pure function returning ReactNode
  })

  it("resultAction wraps server action correctly", async () => {
    // Tests resultAction returns Promise<Result>, not ResultAsync
  })
})
```

## Test File Map

| Behavior Spec | Test File(s) |
| ------------- | ------------ |
| [01-components.md](../behaviors/01-components.md) | `tests/components/match.test.tsx`, `tests/types/match.test-d.tsx` |
| [02-async-hooks.md](../behaviors/02-async-hooks.md) | `tests/hooks/use-result-async.test.ts`, `tests/hooks/use-result-action.test.ts`, `tests/hooks/use-result-suspense.test.tsx`, `tests/hooks/create-result-resource.test.ts` |
| [03-composition-hooks.md](../behaviors/03-composition-hooks.md) | `tests/hooks/use-result.test.ts`, `tests/hooks/use-optimistic-result.test.tsx`, `tests/hooks/use-safe-try.test.ts`, `tests/hooks/use-result-transition.test.tsx` |
| [04-utilities.md](../behaviors/04-utilities.md) | `tests/utilities/from-action.test.ts` |
| [05-adapters.md](../behaviors/05-adapters.md) | `tests/adapters/tanstack-query.test.ts`, `tests/adapters/swr.test.ts` |
| [06-testing.md](../behaviors/06-testing.md) | `tests/testing/matchers.test.ts`, `tests/testing/fixtures.test.ts`, `tests/testing/mocks.test.ts`, `tests/testing/storybook.test.tsx` |
| [07-server.md](../behaviors/07-server.md) | `tests/server/match-result.test.ts`, `tests/server/match-result-async.test.ts`, `tests/server/match-option.test.ts`, `tests/server/result-action.test.ts` |

## Invariant Verification Map

| Invariant | Verified By |
| --------- | ----------- |
| [INV-R1](../invariants.md#inv-r1-stable-action-references) | `use-result.test.ts` — referential equality across renders |
| [INV-R2](../invariants.md#inv-r2-abort-on-cleanup) | `use-result-async.test.ts` — abort signal on unmount |
| [INV-R3](../invariants.md#inv-r3-generation-guard) | `use-result-async.test.ts` — stale response rejection |
| [INV-R4](../invariants.md#inv-r4-no-exception-promotion) | Architecture-level; verified by absence of error boundaries in tests |
| [INV-R5](../invariants.md#inv-r5-match-exhaustiveness) | `match.test-d.tsx` — type-level exhaustiveness |
| [INV-R6](../invariants.md#inv-r6-suspense-contract) | `use-result-suspense.test.tsx` — Suspense boundary rendering |
| [INV-R7](../invariants.md#inv-r7-strict-mode-compatibility) | `use-result-async.test.ts` — StrictMode double-mount test |
| [INV-R8](../invariants.md#inv-r8-retry-abort-propagation) | `use-result-async.test.ts` — retry cancellation on abort/unmount |
| [INV-R9](../invariants.md#inv-r9-resource-cache-isolation) | `create-result-resource.test.ts` — independent cache lifecycle |
| [INV-R10](../invariants.md#inv-r10-server-utility-purity) | `match-result.test.ts`, `result-action.test.ts` — no React runtime dependency |
