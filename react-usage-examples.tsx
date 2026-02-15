// Real-world examples of how Result libraries are used in React

// ============================================================================
// 1. NEVERTHROW - Most popular Result library
// ============================================================================

import { Result, ok, err } from 'neverthrow'
import { useEffect, useState } from 'react'

// How neverthrow users ACTUALLY handle Results in React
function NeverthrowExample() {
  const [result, setResult] = useState<Result<User, ApiError>>()

  useEffect(() => {
    fetchUser()
      .then(setResult)
  }, [])

  // Direct pattern matching - clean and simple
  if (!result) return <div>Loading...</div>

  return result.match(
    (user) => <UserProfile user={user} />,
    (error) => <ErrorMessage error={error} />
  )
}

// What people actually build: simple wrappers around fetch
async function fetchUser(): Promise<Result<User, ApiError>> {
  try {
    const response = await fetch('/api/user')
    if (!response.ok) {
      return err({ code: response.status, message: 'Failed to fetch' })
    }
    return ok(await response.json())
  } catch (e) {
    return err({ code: 0, message: 'Network error' })
  }
}

// ============================================================================
// 2. EFFECT - Most sophisticated approach
// ============================================================================

import { Effect, pipe } from 'effect'
import { useEffect as useReactEffect } from 'react'

// Effect users embrace the full FP paradigm
function EffectExample() {
  const [state, setState] = useState<
    | { _tag: 'loading' }
    | { _tag: 'error'; error: Error }
    | { _tag: 'success'; data: User }
  >({ _tag: 'loading' })

  useReactEffect(() => {
    const program = pipe(
      fetchUserEffect(),
      Effect.matchEffect({
        onFailure: (error) => Effect.succeed({ _tag: 'error' as const, error }),
        onSuccess: (data) => Effect.succeed({ _tag: 'success' as const, data })
      })
    )

    Effect.runPromise(program).then(setState)
  }, [])

  switch (state._tag) {
    case 'loading': return <div>Loading...</div>
    case 'error': return <ErrorMessage error={state.error} />
    case 'success': return <UserProfile user={state.data} />
  }
}

// ============================================================================
// 3. FP-TS - Academic but powerful
// ============================================================================

import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import { pipe as fpPipe } from 'fp-ts/function'

// fp-ts users love their pipes
function FpTsExample() {
  const [either, setEither] = useState<E.Either<Error, User>>()

  useReactEffect(() => {
    const task = fetchUserTaskEither()
    task().then(setEither)
  }, [])

  if (!either) return <div>Loading...</div>

  return fpPipe(
    either,
    E.fold(
      (error) => <ErrorMessage error={error} />,
      (user) => <UserProfile user={user} />
    )
  )
}

// ============================================================================
// 4. REACT QUERY - What most people actually use
// ============================================================================

import { useQuery } from '@tanstack/react-query'

// This is what 90% of React developers actually want
function ReactQueryExample() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await fetch('/api/user')
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json() as Promise<User>
    }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <ErrorMessage error={error} />
  return <UserProfile user={data!} />
}

// ============================================================================
// 5. WHAT DEVELOPERS ACTUALLY BUILD
// ============================================================================

// A. Simple async Result hook (covers 80% of use cases)
function useAsyncResult<T, E = Error>(
  fn: () => Promise<Result<T, E>>,
  deps: any[] = []
) {
  const [state, setState] = useState<{
    result?: Result<T, E>
    isLoading: boolean
  }>({ isLoading: true })

  useEffect(() => {
    setState({ isLoading: true })
    fn().then(result => setState({ result, isLoading: false }))
  }, deps)

  return state
}

// Usage - this is what developers want
function RealWorldComponent() {
  const { result, isLoading } = useAsyncResult(
    () => fetchUser(),
    []
  )

  if (isLoading) return <Spinner />
  if (!result) return null

  return result.match(
    user => <UserProfile user={user} />,
    error => <ErrorAlert error={error} />
  )
}

// B. React Query adapter (for serious apps)
const userQuery = {
  queryKey: ['user'],
  queryFn: async () => {
    const result = await fetchUser()
    if (result.isErr()) throw result.error
    return result.value
  }
}

// C. Form validation with Results (actual use case)
function useFormValidation<T>(
  schema: (data: unknown) => Result<T, ValidationError[]>
) {
  const [errors, setErrors] = useState<ValidationError[]>()

  const validate = (data: unknown) => {
    const result = schema(data)
    if (result.isErr()) {
      setErrors(result.error)
      return false
    }
    setErrors(undefined)
    return true
  }

  return { validate, errors }
}

// ============================================================================
// 6. WHAT NOBODY ACTUALLY NEEDS
// ============================================================================

// ❌ Match components - unnecessary abstraction
function NobodyWantsThis() {
  return (
    <Match result={result}>
      <Match.Ok>{(data) => <div>{data}</div>}</Match.Ok>
      <Match.Err>{(error) => <div>{error}</div>}</Match.Err>
    </Match>
  )
  // Why? When this is cleaner:
  // return result.match(
  //   data => <div>{data}</div>,
  //   error => <div>{error}</div>
  // )
}

// ❌ Stateful Result holder - solving a non-problem
function useResult<T, E>(initial?: Result<T, E>) {
  const [result, setResult] = useState(initial)
  // ... bunch of methods nobody asked for

  // Developers would rather just use:
  // const [data, setData] = useState<T>()
  // const [error, setError] = useState<E>()
}

// ❌ Custom ResultBoundary - regular ErrorBoundary works fine
class ResultBoundary extends Component {
  // Why? ErrorBoundary already catches all errors including unwrap()
}

// ============================================================================
// 7. THE IDEAL MINIMAL API
// ============================================================================

// This is all you need for a Result React library:

// 1. Basic async hook
export function useResultAsync<T, E>(
  fn: () => Promise<Result<T, E>>,
  deps?: any[]
): {
  result: Result<T, E> | undefined
  isLoading: boolean
  refetch: () => void
}

// 2. React Query adapter
export function toQueryFn<T, E>(
  fn: () => Promise<Result<T, E>>
): () => Promise<T> {
  return async () => {
    const result = await fn()
    if (result.isErr()) throw result.error
    return result.value
  }
}

// 3. Suspense support (if you must)
export function useResultSuspense<T, E>(
  fn: () => Promise<Result<T, E>>,
  deps?: any[]
): Result<T, E> {
  // Implementation with use() or throw promise
}

// That's it. Everything else is over-engineering.

// ============================================================================
// Types for examples
// ============================================================================

interface User {
  id: string
  name: string
  email: string
}

interface ApiError {
  code: number
  message: string
}

interface ValidationError {
  field: string
  message: string
}

declare function UserProfile(props: { user: User }): JSX.Element
declare function ErrorMessage(props: { error: any }): JSX.Element
declare function ErrorAlert(props: { error: any }): JSX.Element
declare function Spinner(): JSX.Element

declare function fetchUserEffect(): Effect.Effect<User, Error>
declare function fetchUserTaskEither(): TE.TaskEither<Error, User>