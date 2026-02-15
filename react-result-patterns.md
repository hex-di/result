# React Result Pattern Examples and Code

## Detailed Implementation Patterns

### 1. Neverthrow React Patterns

#### Custom Hook Implementation
```typescript
import { Result, ok, err, ResultAsync } from 'neverthrow';
import { useState, useEffect, useCallback } from 'react';

// Basic Result hook
export function useResult<T, E>(
  initial?: Result<T, E>
): {
  result: Result<T, E> | undefined;
  setResult: (result: Result<T, E>) => void;
  setOk: (value: T) => void;
  setErr: (error: E) => void;
} {
  const [result, setResult] = useState(initial);

  const setOk = useCallback((value: T) => {
    setResult(ok(value));
  }, []);

  const setErr = useCallback((error: E) => {
    setResult(err(error));
  }, []);

  return { result, setResult, setOk, setErr };
}

// Async Result hook with loading state
export function useAsyncResult<T, E>(
  asyncFn: () => ResultAsync<T, E>,
  deps: React.DependencyList = []
): {
  loading: boolean;
  result: Result<T, E> | undefined;
  refetch: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result<T, E>>();

  const execute = useCallback(() => {
    setLoading(true);
    asyncFn()
      .then((res) => {
        setResult(res);
        setLoading(false);
      })
      .catch((error) => {
        setResult(err(error as E));
        setLoading(false);
      });
  }, deps);

  useEffect(() => {
    execute();
  }, deps);

  return { loading, result, refetch: execute };
}

// Result with mutation
export function useResultMutation<T, E, Args extends any[]>(
  mutationFn: (...args: Args) => ResultAsync<T, E>
): {
  mutate: (...args: Args) => void;
  mutateAsync: (...args: Args) => Promise<Result<T, E>>;
  loading: boolean;
  result: Result<T, E> | undefined;
  reset: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result<T, E>>();

  const mutateAsync = useCallback(async (...args: Args) => {
    setLoading(true);
    const res = await mutationFn(...args);
    setResult(res);
    setLoading(false);
    return res;
  }, [mutationFn]);

  const mutate = useCallback((...args: Args) => {
    mutateAsync(...args);
  }, [mutateAsync]);

  const reset = useCallback(() => {
    setResult(undefined);
    setLoading(false);
  }, []);

  return { mutate, mutateAsync, loading, result, reset };
}
```

#### Component Pattern
```typescript
interface ResultViewProps<T, E> {
  result: Result<T, E> | undefined;
  loading?: boolean;
  onSuccess: (value: T) => React.ReactNode;
  onError: (error: E) => React.ReactNode;
  onLoading?: () => React.ReactNode;
  onEmpty?: () => React.ReactNode;
}

export function ResultView<T, E>({
  result,
  loading,
  onSuccess,
  onError,
  onLoading = () => <>Loading...</>,
  onEmpty = () => null,
}: ResultViewProps<T, E>) {
  if (loading) return <>{onLoading()}</>;
  if (!result) return <>{onEmpty()}</>;

  return (
    <>
      {result.match(
        (value) => onSuccess(value),
        (error) => onError(error)
      )}
    </>
  );
}
```

### 2. Effect React Integration

#### Using @effect/experimental
```typescript
import { Effect, Either, pipe } from 'effect';
import { useEffect, useFiber, useStream } from '@effect/experimental';

// Basic Effect hook
export function UserProfile({ userId }: { userId: string }) {
  const userEffect = useEffect(
    () => fetchUser(userId),
    [userId]
  );

  return userEffect.match({
    onLoading: () => <div>Loading user...</div>,
    onError: (error) => <div>Error: {error.message}</div>,
    onSuccess: (user) => <div>Welcome, {user.name}!</div>,
  });
}

// Stream subscription
export function LiveFeed() {
  const messages = useStream(
    () => messageStream,
    { initialValue: [] }
  );

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}

// Fiber management
export function LongRunningTask() {
  const fiber = useFiber(
    () => pipe(
      longComputation,
      Effect.tap((progress) =>
        Effect.log(`Progress: ${progress}%`)
      )
    ),
    []
  );

  return (
    <div>
      <button onClick={fiber.interrupt}>Cancel</button>
      {fiber.status === 'running' && <div>Processing...</div>}
      {fiber.status === 'done' && <div>Complete!</div>}
      {fiber.status === 'interrupted' && <div>Cancelled</div>}
    </div>
  );
}
```

#### Effect Error Boundary
```typescript
import { EffectErrorBoundary } from '@effect/experimental';

export function App() {
  return (
    <EffectErrorBoundary
      fallback={(error) => (
        <div>
          <h2>Something went wrong</h2>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
    >
      <YourApp />
    </EffectErrorBoundary>
  );
}
```

### 3. fp-ts React Patterns

#### Custom Hooks
```typescript
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { useState, useEffect } from 'react';

// TaskEither hook
export function useTaskEither<E, A>(
  task: TE.TaskEither<E, A>,
  deps: React.DependencyList = []
): {
  loading: boolean;
  either: E.Either<E, A> | null;
} {
  const [loading, setLoading] = useState(true);
  const [either, setEither] = useState<E.Either<E, A> | null>(null);

  useEffect(() => {
    setLoading(true);
    task().then((result) => {
      setEither(result);
      setLoading(false);
    });
  }, deps);

  return { loading, either };
}

// Option hook
export function useOption<A>(
  initial: O.Option<A> = O.none
): [O.Option<A>, (option: O.Option<A>) => void] {
  const [option, setOption] = useState(initial);
  return [option, setOption];
}

// Remote Data pattern (common with fp-ts)
type RemoteData<E, A> =
  | { _tag: 'initial' }
  | { _tag: 'pending' }
  | { _tag: 'failure'; error: E }
  | { _tag: 'success'; data: A };

export function useRemoteData<E, A>(
  fetchFn: () => TE.TaskEither<E, A>,
  deps: React.DependencyList = []
): RemoteData<E, A> {
  const [state, setState] = useState<RemoteData<E, A>>({ _tag: 'initial' });

  useEffect(() => {
    setState({ _tag: 'pending' });
    fetchFn()().then(
      E.fold(
        (error) => setState({ _tag: 'failure', error }),
        (data) => setState({ _tag: 'success', data })
      )
    );
  }, deps);

  return state;
}
```

#### Component Patterns
```typescript
interface EitherViewProps<E, A> {
  either: E.Either<E, A>;
  onLeft: (error: E) => React.ReactNode;
  onRight: (value: A) => React.ReactNode;
}

export function EitherView<E, A>({
  either,
  onLeft,
  onRight,
}: EitherViewProps<E, A>) {
  return <>{pipe(either, E.fold(onLeft, onRight))}</>;
}

interface OptionViewProps<A> {
  option: O.Option<A>;
  onSome: (value: A) => React.ReactNode;
  onNone: () => React.ReactNode;
}

export function OptionView<A>({
  option,
  onSome,
  onNone,
}: OptionViewProps<A>) {
  return <>{pipe(option, O.fold(onNone, onSome))}</>;
}
```

### 4. TanStack Query Integration

#### With neverthrow
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { Result, ResultAsync } from 'neverthrow';

export function useResultQuery<T, E>(
  key: string[],
  queryFn: () => ResultAsync<T, E>,
  options?: UseQueryOptions<Result<T, E>>
) {
  return useQuery({
    queryKey: key,
    queryFn: () => queryFn(),
    ...options,
  });
}

// Usage
function UserProfile({ id }: { id: string }) {
  const { data: result, isLoading } = useResultQuery(
    ['user', id],
    () => fetchUser(id),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (!result) return null;

  return result.match(
    (user) => <div>{user.name}</div>,
    (error) => <div>Error: {error.message}</div>
  );
}
```

#### With fp-ts
```typescript
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';

export function useTaskEitherQuery<E, A>(
  key: string[],
  task: TE.TaskEither<E, A>,
  options?: UseQueryOptions<E.Either<E, A>>
) {
  return useQuery({
    queryKey: key,
    queryFn: task,
    ...options,
  });
}

// Mutation
export function useTaskEitherMutation<E, A, TVariables = void>(
  mutationFn: (variables: TVariables) => TE.TaskEither<E, A>,
  options?: UseMutationOptions<E.Either<E, A>, unknown, TVariables>
) {
  return useMutation({
    mutationFn: (variables: TVariables) => mutationFn(variables)(),
    ...options,
  });
}
```

### 5. SWR Integration

```typescript
import useSWR from 'swr';
import { Result } from 'neverthrow';

export function useSwrResult<T, E>(
  key: string | null,
  fetcher: () => Promise<Result<T, E>>,
  options?: SWRConfiguration<Result<T, E>>
) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    fetcher,
    options
  );

  return {
    result: data,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

// With fp-ts
import * as TE from 'fp-ts/TaskEither';

export function useSwrTaskEither<E, A>(
  key: string | null,
  task: TE.TaskEither<E, A>,
  options?: SWRConfiguration<E.Either<E, A>>
) {
  return useSWR(key, task, options);
}
```

### 6. Form Validation with Results

```typescript
import { Result, ok, err, combine } from 'neverthrow';

type ValidationError = {
  field: string;
  message: string;
};

export function useFormValidation<T extends Record<string, any>>(
  validators: {
    [K in keyof T]: (value: T[K]) => Result<T[K], ValidationError>;
  }
) {
  const [values, setValues] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = (field: keyof T, value: T[keyof T]) => {
    const result = validators[field](value);

    result.match(
      () => setErrors((prev) => ({ ...prev, [field]: undefined })),
      (error) => setErrors((prev) => ({ ...prev, [field]: error.message }))
    );

    return result;
  };

  const validateAll = (): Result<T, ValidationError[]> => {
    const results = Object.entries(validators).map(([field, validator]) => {
      const value = values[field as keyof T];
      return validator(value as any).mapErr((e) => ({ ...e, field }));
    });

    return combine(results as Result<any, ValidationError>[])
      .map(() => values as T)
      .mapErr((errors) => errors);
  };

  const handleChange = (field: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    validate(field, value);
  };

  return {
    values,
    errors,
    handleChange,
    validateAll,
    isValid: Object.keys(errors).length === 0,
  };
}
```

### 7. Suspense Integration

```typescript
// React 18+ with use() hook
import { use } from 'react';
import { ResultAsync } from 'neverthrow';

function wrapPromise<T, E>(promise: Promise<Result<T, E>>) {
  let status = 'pending';
  let result: Result<T, E>;

  const suspender = promise.then(
    (r) => {
      status = 'success';
      result = r;
    },
    (e) => {
      status = 'error';
      result = err(e);
    }
  );

  return {
    read() {
      if (status === 'pending') {
        throw suspender;
      } else {
        return result;
      }
    },
  };
}

export function useSuspenseResult<T, E>(
  asyncFn: () => ResultAsync<T, E>
): Result<T, E> {
  const resource = wrapPromise(asyncFn());
  return resource.read();
}

// Component using Suspense
function UserProfile({ id }: { id: string }) {
  const result = useSuspenseResult(() => fetchUser(id));

  return result.match(
    (user) => <div>{user.name}</div>,
    (error) => <div>Error: {error.message}</div>
  );
}

// Parent component
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorBoundary>
        <UserProfile id="123" />
      </ErrorBoundary>
    </Suspense>
  );
}
```

### 8. Server Components (Next.js App Router)

```typescript
// app/user/[id]/page.tsx
import { Result, ok, err } from 'neverthrow';

async function fetchUser(id: string): Promise<Result<User, Error>> {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) {
      return err(new Error('User not found'));
    }
    const user = await res.json();
    return ok(user);
  } catch (error) {
    return err(error as Error);
  }
}

export default async function UserPage({ params }: { params: { id: string } }) {
  const result = await fetchUser(params.id);

  return result.match(
    (user) => (
      <div>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
      </div>
    ),
    (error) => (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
      </div>
    )
  );
}
```

### 9. Error Boundary Integration

```typescript
import { Component, ErrorInfo, ReactNode } from 'react';
import { Result, err } from 'neverthrow';

interface Props {
  children: ReactNode;
  fallback: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ResultErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, this.reset);
    }

    return this.props.children;
  }
}

// Hook to throw Result errors to boundary
export function useThrowResultError() {
  return <E>(result: Result<any, E>) => {
    if (result.isErr()) {
      throw result.error;
    }
  };
}
```

### 10. Testing Utilities

```typescript
import { render, waitFor } from '@testing-library/react';
import { Result, ok, err } from 'neverthrow';

// Test helper for Result components
export async function renderWithResult<T, E>(
  Component: React.FC<{ result: Result<T, E> }>,
  result: Result<T, E>
) {
  return render(<Component result={result} />);
}

// Mock async Result
export function mockAsyncResult<T, E>(
  value: T | E,
  isError = false,
  delay = 0
): () => Promise<Result<T, E>> {
  return () =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(isError ? err(value as E) : ok(value as T));
      }, delay);
    });
}

// Test example
describe('UserProfile', () => {
  it('renders user on success', async () => {
    const mockFetch = mockAsyncResult({ name: 'John', email: 'john@example.com' });

    const { getByText } = render(
      <UserProfile fetchUser={mockFetch} />
    );

    await waitFor(() => {
      expect(getByText('John')).toBeInTheDocument();
    });
  });

  it('renders error on failure', async () => {
    const mockFetch = mockAsyncResult(new Error('Network error'), true);

    const { getByText } = render(
      <UserProfile fetchUser={mockFetch} />
    );

    await waitFor(() => {
      expect(getByText('Network error')).toBeInTheDocument();
    });
  });
});
```