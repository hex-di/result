# Recommended React API for @hex-di/result-react

Based on extensive analysis of existing Result libraries and their React usage patterns, here's a practical, minimal API that addresses real needs without over-engineering.

## Executive Summary

**Keep:**
- Simple async Result hook
- React Query/SWR adapters
- Suspense support (optional)
- Server action helpers (for Next.js)

**Drop:**
- Match components (unnecessary abstraction)
- Stateful Result/Option hooks (non-problem)
- Custom error boundaries (regular ones work)
- Complex Option handling (rarely used)

## The Minimal API (< 2KB gzipped)

### 1. Core Async Hook

```typescript
/**
 * Fetches data and returns a Result
 * Covers 80% of real-world use cases
 */
export function useResultAsync<T, E = Error>(
  fn: () => Promise<Result<T, E>>,
  deps?: DependencyList
): {
  result: Result<T, E> | undefined
  isLoading: boolean
  isRefetching: boolean
  refetch: () => Promise<void>
  reset: () => void
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { result, isLoading } = useResultAsync(
    () => fetchUser(userId),
    [userId]
  )

  if (isLoading) return <Spinner />
  if (!result) return null

  // Clean, simple, idiomatic
  return result.match(
    user => <div>{user.name}</div>,
    error => <Alert>{error.message}</Alert>
  )
}
```

### 2. React Query Adapter

```typescript
/**
 * Converts Result-returning functions for React Query
 * Integrates with existing infrastructure
 */
export function toQueryFn<T, E>(
  fn: () => Promise<Result<T, E>>
): () => Promise<T> {
  return async () => {
    const result = await fn()
    return result.unwrapOrThrow() // Throws for React Query's error handling
  }
}

// Usage with React Query
const { data, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: toQueryFn(() => fetchUser(userId))
})
```

### 3. SWR Adapter

```typescript
/**
 * Converts Result-returning functions for SWR
 */
export function toSwrFetcher<T, E>(
  fn: (...args: any[]) => Promise<Result<T, E>>
): (...args: any[]) => Promise<T> {
  return async (...args) => {
    const result = await fn(...args)
    return result.unwrapOrThrow()
  }
}

// Usage with SWR
const { data, error } = useSWR(
  ['user', userId],
  toSwrFetcher(fetchUser)
)
```

### 4. Suspense Support (Optional)

```typescript
/**
 * For apps using React Suspense
 * Suspends while loading, returns Result when ready
 */
export function useResultSuspense<T, E = Error>(
  fn: () => Promise<Result<T, E>>,
  deps?: DependencyList
): Result<T, E>

// Usage
function UserProfileSuspense({ userId }: { userId: string }) {
  const result = useResultSuspense(
    () => fetchUser(userId),
    [userId]
  )

  return result.match(
    user => <div>{user.name}</div>,
    error => <Alert>{error.message}</Alert>
  )
}

// Parent component
function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <ErrorBoundary>
        <UserProfileSuspense userId="123" />
      </ErrorBoundary>
    </Suspense>
  )
}
```

### 5. Server Action Helpers (Next.js)

```typescript
/**
 * Wraps Next.js server actions to return Results
 */
export function wrapServerAction<Args extends any[], T, E>(
  action: (...args: Args) => Promise<Result<T, E>>
): (...args: Args) => Promise<
  | { success: true; data: T }
  | { success: false; error: E }
>

// Usage in server action
export const updateUser = wrapServerAction(
  async (id: string, data: UserData): Promise<Result<User, ValidationError>> => {
    const validation = validateUserData(data)
    if (validation.isErr()) return validation

    return await saveUser(id, validation.value)
  }
)

// Usage in client component
function EditUserForm({ userId }: { userId: string }) {
  async function handleSubmit(formData: FormData) {
    const result = await updateUser(userId, formData)

    if (!result.success) {
      toast.error(result.error.message)
      return
    }

    toast.success('User updated')
    router.push(`/users/${result.data.id}`)
  }
}
```

### 6. Form Validation Helper (Optional but useful)

```typescript
/**
 * Result-based form validation
 */
export function useResultValidation<Input, Output, E = ValidationError>(
  validator: (input: Input) => Result<Output, E>
) {
  const [errors, setErrors] = useState<E>()

  const validate = useCallback((input: Input): Output | undefined => {
    const result = validator(input)

    if (result.isErr()) {
      setErrors(result.error)
      return undefined
    }

    setErrors(undefined)
    return result.value
  }, [validator])

  return {
    validate,
    errors,
    clearErrors: () => setErrors(undefined)
  }
}

// Usage
function ContactForm() {
  const { validate, errors } = useResultValidation(validateContactForm)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const validated = validate(data)

    if (validated) {
      submitForm(validated)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      {errors?.email && <span>{errors.email}</span>}
      <button type="submit">Submit</button>
    </form>
  )
}
```

## What NOT to Include

### ❌ Match Components

```typescript
// DON'T DO THIS
<Match result={result}>
  <Match.Ok>{(data) => <div>{data}</div>}</Match.Ok>
  <Match.Err>{(error) => <div>{error}</div>}</Match.Err>
</Match>

// Just use the method
result.match(
  data => <div>{data}</div>,
  error => <div>{error}</div>
)
```

**Why not?**
- No real benefit over inline matching
- Adds bundle size
- More verbose
- No other Result library has needed this

### ❌ Stateful Result Hook

```typescript
// DON'T DO THIS
const { result, setOk, setErr, reset } = useResult<User, Error>()

// Developers would rather use
const [user, setUser] = useState<User>()
const [error, setError] = useState<Error>()
```

**Why not?**
- Solves a non-existent problem
- Conflates Result pattern with state management
- Adds unnecessary complexity

### ❌ Custom Result Boundary

```typescript
// DON'T DO THIS
<ResultBoundary fallback={<ErrorFallback />}>
  {/* ... */}
</ResultBoundary>

// Regular ErrorBoundary already works
<ErrorBoundary fallback={<ErrorFallback />}>
  {/* result.unwrapOrThrow() will be caught */}
</ErrorBoundary>
```

**Why not?**
- ErrorBoundary already catches unwrap errors
- No need for Result-specific boundary

## Implementation Priorities

### Phase 1: Core (Ship First)
1. `useResultAsync` - The workhorse hook
2. `toQueryFn` - React Query adapter
3. TypeScript types and inference

### Phase 2: Ecosystem (Based on Feedback)
1. `toSwrFetcher` - SWR adapter
2. `wrapServerAction` - Next.js helper
3. `useResultSuspense` - If users request it

### Phase 3: Nice-to-Have (If Proven Useful)
1. `useResultValidation` - Form validation
2. Additional adapters as needed

## Key Design Principles

1. **Don't Reinvent the Wheel**: Integrate with React Query/SWR, don't compete
2. **Keep It Simple**: One way to do things, not three
3. **Follow React Conventions**: Hooks start with `use`, follow Rules of Hooks
4. **Minimize Bundle Size**: < 2KB gzipped for core
5. **Excellent TypeScript**: Perfect inference, no manual annotations needed
6. **Real-World Focus**: Solve actual problems developers face

## Success Metrics

- **Adoption**: Developers choose this over hand-rolling their own
- **Bundle Size**: Stays under 2KB gzipped
- **Type Safety**: Zero runtime errors from type issues
- **Integration**: Works seamlessly with React Query/SWR
- **Learning Curve**: New developers productive in < 10 minutes

## Comparison with Proposed API

| Feature | Proposed | Recommended | Reasoning |
|---------|----------|-------------|-----------|
| Match Components | ✅ | ❌ | Unnecessary abstraction |
| useResult (stateful) | ✅ | ❌ | Non-problem |
| useOption | ✅ | ❌ | Rarely used in React |
| useResultAsync | ✅ | ✅ | Core value proposition |
| useResultCallback | ✅ | ❌ | Confusing naming, useResultAsync covers it |
| useResultSuspense | ✅ | ⚠️ | Optional, based on demand |
| ResultBoundary | ✅ | ❌ | Regular ErrorBoundary works |
| fromAction | ✅ | ✅ | Renamed to wrapServerAction |
| fromFormState | ✅ | ❌ | Too specific, unclear value |
| React Query adapter | ❌ | ✅ | Essential for real apps |
| SWR adapter | ❌ | ✅ | Popular alternative |
| Form validation | ❌ | ⚠️ | Common use case, include if space |

## Conclusion

The React ecosystem doesn't need another complex state management solution. It needs simple, composable utilities that integrate Result types with existing React patterns and popular libraries.

Focus on:
- **One excellent async hook** that handles the common case
- **Adapters for popular libraries** rather than reimplementing their features
- **Minimal API surface** that's easy to learn and hard to misuse
- **Perfect TypeScript inference** so developers never fight the types

Skip the clever abstractions. Ship the tools developers actually need.