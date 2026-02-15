# @hex-di/result-react API Analysis

## Core Type System Understanding

Based on the core library analysis:
- `Ok<T, E>` has phantom type `E = never` when created via `ok(value)`
- `Err<T, E>` has phantom type `T = never` when created via `err(error)`
- Both types are frozen objects with closures, not classes
- `Result<T, E> = Ok<T, E> | Err<T, E>` discriminated union with `_tag`

## 1. Generic Inference for Match Component

### Compound Component Approach

```typescript
// Current proposed API
interface MatchProps<T, E> {
  result: Result<T, E>
  children: React.ReactNode
}

// Analysis: Generic inference SUCCESS
<Match result={ok(42)}>
  {/* TypeScript infers T=number, E=never correctly */}
  <Match.Ok>{(value) => /* value: number */ }</Match.Ok>
  <Match.Err>{(error) => /* error: never */ }</Match.Err>
</Match>
```

**Problem:** The compound component children don't have access to parent generics without context.

**Improved Solution:**

```typescript
interface MatchContext<T, E> {
  result: Result<T, E>
}

const MatchContextInternal = React.createContext<MatchContext<any, any> | null>(null)

interface MatchProps<T, E> {
  result: Result<T, E>
  children: React.ReactNode
}

interface MatchOkProps<T, E> {
  children: (value: T) => React.ReactNode
  fallback?: React.ReactNode // For when not matched
}

interface MatchErrProps<T, E> {
  children: (error: E) => React.ReactNode
  fallback?: React.ReactNode
}

function Match<T, E>(props: MatchProps<T, E>) {
  return (
    <MatchContextInternal.Provider value={{ result: props.result }}>
      {props.children}
    </MatchContextInternal.Provider>
  )
}

Match.Ok = function MatchOk<T, E>(props: MatchOkProps<T, E>) {
  const context = React.useContext(MatchContextInternal) as MatchContext<T, E>
  if (!context) throw new Error('Match.Ok must be used within Match')

  if (context.result.isOk()) {
    return <>{props.children(context.result.value)}</>
  }
  return <>{props.fallback ?? null}</>
}

Match.Err = function MatchErr<T, E>(props: MatchErrProps<T, E>) {
  const context = React.useContext(MatchContextInternal) as MatchContext<T, E>
  if (!context) throw new Error('Match.Err must be used within Match')

  if (context.result.isErr()) {
    return <>{props.children(context.result.error)}</>
  }
  return <>{props.fallback ?? null}</>
}
```

### Render Props Alternative (Better Inference)

```typescript
interface MatchProps<T, E> {
  result: Result<T, E>
  ok: (value: T) => React.ReactNode
  err: (error: E) => React.ReactNode
}

// Usage with perfect inference
<Match
  result={ok(42)}
  ok={(value) => <div>{value * 2}</div>} // value: number
  err={(error) => <div>Error</div>}      // error: never
/>

// Implementation
function Match<T, E>(props: MatchProps<T, E>): React.ReactElement {
  return <>{props.result.match(props.ok, props.err)}</>
}
```

**Verdict:** Render props provide better type inference and are simpler. Compound components require context gymnastics.

## 2. useResult Overloads Analysis

### Current Proposal Issues

```typescript
// Problem 1: E=never is too narrow
const [result, actions] = useResult(ok("hello"))
// Inferred: [Result<string, never>, actions]

// User wants to set an error later:
actions.setErr(new Error("fail")) // ❌ Type error! E=never

// Problem 2: Widening E requires explicit annotation
const [result, actions] = useResult<string, Error>(ok("hello"))
// Now actions.setErr works, but verbose
```

### Improved Solution with Better Inference

```typescript
// Add constraint-based overloads
declare function useResult<T = unknown, E = unknown>(): [
  Result<T, E> | undefined,
  ResultActions<T, E>
]

declare function useResult<T, E>(
  initial: Result<T, E>
): [Result<T, E>, ResultActions<T, E>]

// Smart constructor for common case
declare function useResult<T>(
  initial: Ok<T, never>
): [Result<T, unknown>, ResultActions<T, unknown>]

// Actions interface
interface ResultActions<T, E> {
  setOk: (value: T) => void
  setErr: (error: E) => void
  set: (result: Result<T, E>) => void
  reset: () => void
  // Add mappers for ergonomics
  mapValue: (fn: (prev: T) => T) => void
  mapError: (fn: (prev: E) => E) => void
}

// Even better: Builder pattern
function useResultBuilder<T = unknown, E = unknown>() {
  return {
    withOk: <U>(value: U) => useResult<U, E>(ok(value)),
    withErr: <F>(error: F) => useResult<T, F>(err(error)),
    empty: () => useResult<T, E>()
  }
}

// Usage
const [result, actions] = useResultBuilder<string, Error>().withOk("hello")
```

## 3. useResultCallback Inference

### Problem Analysis

```typescript
declare function useResultCallback<A extends unknown[], T, E>(
  fn: (...args: A) => ResultAsync<T, E> | Result<T, E>
): UseResultCallbackReturn<A, T, E>

// Inference challenge: Multiple generics + union return type
const { execute } = useResultCallback(
  async (id: number) => {
    if (id < 0) return err("invalid") // Result<never, string>
    return ok(id * 2) // Result<number, never>
  }
)
// TypeScript struggles: T = number | never, E = string | never
// Simplifies to: T = number, E = string ✅
```

### Improved Solution with Better Constraints

```typescript
// Split sync and async for better inference
declare function useResultCallback<A extends unknown[], T, E>(
  fn: (...args: A) => Result<T, E>
): UseResultCallbackReturn<A, T, E>

declare function useResultCallback<A extends unknown[], T, E>(
  fn: (...args: A) => ResultAsync<T, E>
): UseResultCallbackReturn<A, T, E>

// Add inference helper
type InferResultType<R> = R extends Result<infer T, any> ? T :
                          R extends ResultAsync<infer T, any> ? T : never

type InferResultError<R> = R extends Result<any, infer E> ? E :
                           R extends ResultAsync<any, infer E> ? E : never

// Better signature using conditional types
declare function useResultCallback<
  Fn extends (...args: any[]) => Result<any, any> | ResultAsync<any, any>
>(fn: Fn): {
  result: Result<InferResultType<ReturnType<Fn>>, InferResultError<ReturnType<Fn>>> | undefined
  isLoading: boolean
  execute: (...args: Parameters<Fn>) => Promise<Result<InferResultType<ReturnType<Fn>>, InferResultError<ReturnType<Fn>>>>
  reset: () => void
}

// Usage - perfect inference
const { execute, result } = useResultCallback(
  (id: number, name: string) =>
    id > 0 ? ok({ id, name }) : err(new Error("Invalid"))
)
// execute: (id: number, name: string) => Promise<Result<{id: number, name: string}, Error>>
```

## 4. ActionError Design

### Current Proposal Issue

```typescript
interface ActionError {
  readonly _tag: "ActionError"
  readonly cause: unknown // Too vague
}
```

### Improved Solution

```typescript
// Generic ActionError with cause type
interface ActionError<C = unknown> {
  readonly _tag: "ActionError"
  readonly cause: C
  readonly message: string
  readonly stack?: string
  readonly timestamp: number
}

// Smart constructor with error normalization
function createActionError(cause: unknown): ActionError {
  if (cause instanceof Error) {
    return {
      _tag: "ActionError",
      cause,
      message: cause.message,
      stack: cause.stack,
      timestamp: Date.now()
    }
  }
  return {
    _tag: "ActionError",
    cause,
    message: String(cause),
    timestamp: Date.now()
  }
}

// Enhanced fromAction with custom mapper
declare function fromAction<A extends unknown[], T>(
  action: (...args: A) => Promise<T>
): (...args: A) => ResultAsync<T, ActionError>

declare function fromAction<A extends unknown[], T, E>(
  action: (...args: A) => Promise<T>,
  mapError: (error: unknown) => E
): (...args: A) => ResultAsync<T, E>

// Usage
const fetchUser = fromAction(
  async (id: number) => fetch(`/user/${id}`).then(r => r.json()),
  (error) => ({ type: 'FETCH_ERROR' as const, error })
)
```

## 5. Discriminated Union Narrowing

### Problem with undefined unions

```typescript
function useResultAsync<T, E>(...): {
  result: Result<T, E> | undefined
  // ...
}

// Narrowing issue
const { result } = useResultAsync(fetchUser, [userId])

if (result?.isOk()) {
  // result is Result<T, E> | undefined still!
  // Need: result.value ❌
  console.log(result.value) // Property 'value' does not exist
}

// Must do:
if (result && result.isOk()) {
  console.log(result.value) // ✅ Now works
}
```

### Solution: Loading State Discrimination

```typescript
// Better: Use discriminated union for loading state
type AsyncResultState<T, E> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success', result: Ok<T, E> }
  | { status: 'error', result: Err<T, E> }

declare function useResultAsync<T, E>(
  fn: (signal: AbortSignal) => ResultAsync<T, E>,
  deps: DependencyList
): AsyncResultState<T, E> & {
  refetch: () => void
}

// Usage with better ergonomics
const state = useResultAsync(fetchUser, [userId])

switch (state.status) {
  case 'success':
    return <div>{state.result.value}</div> // ✅ Narrowed to Ok
  case 'error':
    return <div>{state.result.error}</div> // ✅ Narrowed to Err
  case 'loading':
    return <Spinner />
  case 'idle':
    return null
}

// Alternative: Separate loading flag
declare function useResultAsync<T, E>(
  fn: (signal: AbortSignal) => ResultAsync<T, E>,
  deps: DependencyList
): {
  result: Result<T, E> | null // null instead of undefined
  isLoading: boolean
  isIdle: boolean
  refetch: () => void
}
```

## 6. Type Widening Pitfalls

### Problem: Composing Different Error Types

```typescript
const { result: userResult } = useResultAsync(
  () => fetchUser(id), // ResultAsync<User, NetworkError>
  [id]
)

const { result: postsResult } = useResultAsync(
  () => fetchPosts(id), // ResultAsync<Post[], ApiError>
  [id]
)

// Composition problem
const combined = userResult?.andThen(user =>
  postsResult?.map(posts => ({ user, posts }))
)
// Type error: NetworkError | ApiError union becomes messy
```

### Solution: Error Union Helpers

```typescript
// Helper type for combining error types
type CombineErrors<E1, E2> = E1 | E2

// Builder for combining multiple async results
function useResultsCombined<T extends Record<string, Result<any, any> | undefined>>(
  results: T
): Result<
  { [K in keyof T]: T[K] extends Result<infer V, any> ? V : never },
  { [K in keyof T]: T[K] extends Result<any, infer E> ? E : never }[keyof T]
> | undefined {
  const values = Object.values(results)
  if (values.some(r => r === undefined)) return undefined

  // Implementation using Result.all
  return Result.all(values as Result<unknown, unknown>[])
}

// Usage
const combined = useResultsCombined({
  user: userResult,
  posts: postsResult
})
// Type: Result<{ user: User, posts: Post[] }, NetworkError | ApiError> | undefined
```

## 7. Exhaustiveness Checking

### Problem: No Compile-Time Enforcement

```typescript
// Current: No way to enforce both branches
<Match result={result}>
  <Match.Ok>{(v) => <div>{v}</div>}</Match.Ok>
  {/* Forgot Match.Err - no error! */}
</Match>
```

### Solution: Type-Level Exhaustiveness

```typescript
// Solution 1: Required props pattern
interface MatchExhaustiveProps<T, E> {
  result: Result<T, E>
  children: [
    React.ReactElement<MatchOkProps<T>>,
    React.ReactElement<MatchErrProps<E>>
  ]
}

// Solution 2: Builder pattern with compile-time checks
class MatchBuilder<T, E, HasOk = false, HasErr = false> {
  constructor(private result: Result<T, E>) {}

  ok(render: (value: T) => React.ReactNode): MatchBuilder<T, E, true, HasErr> {
    // ...
    return this as any
  }

  err(render: (error: E) => React.ReactNode): MatchBuilder<T, E, HasOk, true> {
    // ...
    return this as any
  }

  // Only available when both branches defined
  build(this: MatchBuilder<T, E, true, true>): React.ReactElement {
    // ...
  }
}

// Usage
Match.with(result)
  .ok(v => <div>{v}</div>)
  .err(e => <div>{e}</div>)
  .build() // ✅ Compile error if missing branch

// Solution 3: Simpler - just use the match method
function Match<T, E>(props: {
  result: Result<T, E>
  ok: (value: T) => React.ReactNode
  err: (error: E) => React.ReactNode
}): React.ReactElement {
  return <>{props.result.match(props.ok, props.err)}</>
}
// This enforces both branches at compile time!
```

## Final Recommendations

### 1. Prefer Render Props Over Compound Components
```typescript
// Simple, great inference, exhaustive
<Match result={result} ok={v => ...} err={e => ...} />
```

### 2. Use Discriminated Unions for Async States
```typescript
type AsyncState<T, E> =
  | { status: 'idle' | 'loading' }
  | { status: 'success', data: Ok<T, E> }
  | { status: 'error', data: Err<T, E> }
```

### 3. Provide Error Type Widening Utilities
```typescript
// Helper to widen error type
function widenError<T, E, E2>(result: Result<T, E>): Result<T, E | E2> {
  return result
}

// In hook
const [result, actions] = useResult<string, Error | null>(ok("hello"))
```

### 4. Use Builder Pattern for Complex APIs
```typescript
const query = useResultQuery(fetchUser)
  .withDeps([userId])
  .withErrorHandler(e => console.error(e))
  .withRetry(3)
  .build()
```

### 5. Leverage the Core Library's Type System
```typescript
// Don't fight the phantom types, embrace them
type OkOnly<T> = Ok<T, never>
type ErrOnly<E> = Err<never, E>

// Hooks can accept these for better inference
function useOkState<T>(initial: T): [OkOnly<T>, (v: T) => void]
function useErrState<E>(initial: E): [ErrOnly<E>, (e: E) => void]
```

### 6. Consider Separate Hooks for Different Use Cases
```typescript
// Instead of one overloaded useResult:
useResultState<T, E>()     // Managed state
useResultValue<T, E>()      // Simple value wrapper
useResultAsync<T, E>()      // Async operations
useResultMachine<T, E>()    // State machine pattern
```

### 7. Add Type-Safe Event Handlers
```typescript
interface ResultFormProps<T, E> {
  onSuccess?: (value: T) => void
  onError?: (error: E) => void
  onResult?: (result: Result<T, E>) => void
}
```

## Example: Complete Implementation

```typescript
// Match with perfect inference and exhaustiveness
export function Match<T, E>(props: {
  result: Result<T, E>
  ok: (value: T) => React.ReactNode
  err: (error: E) => React.ReactNode
}): React.ReactElement {
  return <>{props.result.match(props.ok, props.err)}</>
}

// Async hook with discriminated union
export function useResultAsync<T, E>(
  fn: (signal: AbortSignal) => ResultAsync<T, E>,
  deps: React.DependencyList
): AsyncResultState<T, E> {
  const [state, setState] = useState<AsyncResultState<T, E>>({ status: 'idle' })

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })

    fn(controller.signal)
      .then(result => {
        if (!controller.signal.aborted) {
          setState(
            result.isOk()
              ? { status: 'success', data: result }
              : { status: 'error', data: result }
          )
        }
      })

    return () => controller.abort()
  }, deps)

  return state
}

// State hook with smart defaults
export function useResult<T, E = unknown>(
  initial?: Result<T, E>
): [Result<T, E> | undefined, ResultActions<T, E>] {
  const [result, setResult] = useState(initial)

  const actions = useMemo(() => ({
    setOk: (value: T) => setResult(ok(value)),
    setErr: (error: E) => setResult(err(error)),
    set: setResult,
    reset: () => setResult(initial),
    mapValue: (fn: (v: T) => T) =>
      setResult(r => r?.map(fn) as Result<T, E>),
    mapError: (fn: (e: E) => E) =>
      setResult(r => r?.mapErr(fn) as Result<T, E>)
  }), [initial])

  return [result, actions]
}
```