# 05 — Adapters

Thin wrappers for integrating `Result`/`ResultAsync` with third-party data fetching libraries. Exported from `@hex-di/result-react/adapters`.

## BEH-R05-001: toQueryFn

```ts
function toQueryFn<T, E>(
  fn: () => ResultAsync<T, E>
): () => Promise<T>
```

Converts a `ResultAsync`-returning function into a TanStack Query `queryFn`. The returned function resolves with the `Ok` value or throws the `Err` value (which TanStack Query catches and stores in `error`).

### Parameters

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `fn` | `() => ResultAsync<T, E>` | A function returning `ResultAsync`. |

### Return Value

A function `() => Promise<T>` suitable for `useQuery({ queryFn })`.

### Behavior

```ts
function toQueryFn<T, E>(fn: () => ResultAsync<T, E>): () => Promise<T> {
  return async () => {
    const result = await fn()
    if (result.isOk()) return result.value
    throw result.error
  }
}
```

### Why Throw

TanStack Query's error model requires `queryFn` to reject on failure. The adapter bridges the "errors as values" model to TanStack Query's "errors as exceptions" model at the boundary. This is an intentional impedance mismatch adapter, not a violation of [INV-R4](../invariants.md#inv-r4-no-exception-promotion) — the exception stays within TanStack Query's internal handling.

### Usage

```tsx
import { useQuery } from "@tanstack/react-query"
import { fromPromise } from "@hex-di/result"
import { toQueryFn } from "@hex-di/result-react/adapters"

const fetchUser = (id: string) =>
  fromPromise(
    fetch(`/api/users/${id}`).then(r => r.json()),
    (e) => ({ _tag: "FetchError" as const, cause: e })
  )

function UserProfile({ id }: { id: string }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: toQueryFn(() => fetchUser(id)),
  })

  if (isLoading) return <Skeleton />
  if (error) return <ErrorBanner error={error} />
  return <UserCard user={data} />
}
```

---

## BEH-R05-002: toQueryOptions

```ts
function toQueryOptions<T, E>(
  queryKey: readonly unknown[],
  fn: () => ResultAsync<T, E>
): { queryKey: readonly unknown[]; queryFn: () => Promise<T> }
```

Convenience wrapper that combines `queryKey` and a `ResultAsync`-returning function into a TanStack Query options object.

### Usage

```tsx
const userOptions = (id: string) =>
  toQueryOptions(["user", id], () => fetchUser(id))

// In component:
const { data } = useQuery(userOptions(userId))

// In prefetch:
await queryClient.prefetchQuery(userOptions(userId))
```

---

## BEH-R05-003: toSwrFetcher

```ts
function toSwrFetcher<K extends string, T, E>(
  fn: (key: K) => ResultAsync<T, E>
): (key: K) => Promise<T>
```

Converts a `ResultAsync`-returning function into an SWR fetcher. Same throw-on-Err semantics as [BEH-R05-001](#beh-r05-001-toqueryfn).

### Usage

```tsx
import useSWR from "swr"
import { toSwrFetcher } from "@hex-di/result-react/adapters"

const fetcher = toSwrFetcher((key: string) =>
  fromPromise(fetch(key).then(r => r.json()), toApiError)
)

function UserProfile({ id }: { id: string }) {
  const { data, error } = useSWR(`/api/users/${id}`, fetcher)
  // ...
}
```

---

## BEH-R05-004: toMutationFn

```ts
function toMutationFn<A, T, E>(
  fn: (args: A) => ResultAsync<T, E>
): (args: A) => Promise<T>
```

Converts a `ResultAsync`-returning function into a TanStack Query `mutationFn`. Same throw-on-Err semantics as `toQueryFn`.

### Usage

```tsx
import { useMutation } from "@tanstack/react-query"
import { toMutationFn } from "@hex-di/result-react/adapters"

const updateUser = (data: UpdateUserInput) =>
  fromPromise(
    fetch("/api/user", { method: "PUT", body: JSON.stringify(data) }).then(r => r.json()),
    toApiError
  )

function EditProfile() {
  const mutation = useMutation({
    mutationFn: toMutationFn(updateUser),
    onSuccess: (user) => queryClient.setQueryData(["user"], user),
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      mutation.mutate({ name: "Alice" })
    }}>
      {/* ... */}
    </form>
  )
}
```

---

## BEH-R05-005: toMutationOptions

```ts
function toMutationOptions<A, T, E>(
  fn: (args: A) => ResultAsync<T, E>,
  options?: Omit<UseMutationOptions<T, E, A>, "mutationFn">
): UseMutationOptions<T, E, A>
```

Convenience wrapper that combines a `ResultAsync`-returning function with TanStack Query mutation options.

### Usage

```tsx
const updateUserMutation = toMutationOptions(updateUser, {
  onSuccess: (user) => queryClient.setQueryData(["user"], user),
  onError: (error) => toast.error(error.message),
})

// In component:
const mutation = useMutation(updateUserMutation)
```
