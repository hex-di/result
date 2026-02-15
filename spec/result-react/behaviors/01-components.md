# 01 — Components

React components for declarative Result pattern matching.

## BEH-R01-001: Match

```tsx
function Match<T, E>(props: MatchProps<T, E>): React.ReactElement
```

A render-prop component that accepts a `Result<T, E>` and renders the appropriate branch.

### Props

```ts
interface MatchProps<T, E> {
  result: Result<T, E>
  ok: (value: T) => React.ReactNode
  err: (error: E) => React.ReactNode
}
```

Both `ok` and `err` are required. Omitting either is a TypeScript compilation error. See [INV-R5](../invariants.md#inv-r5-match-exhaustiveness).

### Behavior

1. Calls `result.match(ok, err)` internally
2. Returns the result wrapped in a React fragment
3. When `result` changes variant (Ok → Err or Err → Ok), the previous branch's component tree is unmounted and the new branch is mounted — they have independent component state

### Usage

```tsx
import { Match } from "@hex-di/result-react"

<Match
  result={userResult}
  ok={(user) => <UserCard user={user} />}
  err={(error) => <ErrorBanner message={error.message} />}
/>
```

### Key Isolation

Each branch produces a distinct component subtree. When the variant flips, React unmounts the old branch and mounts the new one. This means:
- Form state inside the `ok` branch resets when the result becomes `Err`
- Effects in each branch run independently
- Error boundaries inside one branch do not affect the other

This is the primary advantage over inline `result.match()`, which shares the same component scope for both branches.

### Implementation

```tsx
function Match<T, E>({ result, ok, err }: MatchProps<T, E>): React.ReactElement {
  return result.isOk()
    ? <React.Fragment key="ok">{ok(result.value)}</React.Fragment>
    : <React.Fragment key="err">{err(result.error)}</React.Fragment>
}
```

The `key` prop ensures React treats the two branches as distinct subtrees.

### Why Not Compound Components

See [ADR-R006](../decisions/R006-render-props-over-compound.md). Render props provide:
- Full generic inference from the `result` prop to the `ok`/`err` callbacks
- Compile-time exhaustiveness (both props required)
- No children scanning overhead
- No Fragment/memo compatibility issues

### Why Not MatchOption

The `Option` type's `.match()` method works directly in JSX without a wrapper component:

```tsx
{avatar.match(
  (url) => <img src={url} alt="avatar" />,
  () => <DefaultAvatar />
)}
```

Option is a composition tool, not a state container. Providing `MatchOption` would add surface area without solving a real problem. See [ADR-R005](../decisions/R005-no-option-hooks.md).
