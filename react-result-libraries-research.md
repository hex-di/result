# React Integration for TypeScript Result/Either/Option Libraries

## Research Overview
This document analyzes the React integration story for popular TypeScript Result/Either/Option monad libraries as of early 2024.

## 1. **neverthrow**

### Official React Support
- **No official React bindings** in the core library
- The library is framework-agnostic by design

### Community Packages
- **`neverthrow-react`** - Community package providing React hooks
  - Provides `useAsyncResult` hook for async operations
  - Not actively maintained (last update ~2022)
- Various GitHub issues discuss React patterns but no official solution

### Hooks Available
- Community hooks typically include:
  - `useAsyncResult` - For handling async Result operations
  - `useResult` - Basic Result state management

### Components
- No official component library
- Community solutions focus on hooks rather than components

### Integration Features
- **Suspense**: No built-in support
- **Server Components**: No specific support
- **Data Fetching**: Manual integration required with TanStack Query/SWR
- **Type Inference**: Good when using the base library, community packages vary
- **Error Boundaries**: Manual integration required
- **Testing**: No React-specific testing utilities

## 2. **Effect** (@effect/platform)

### Official React Support
- **Experimental React package**: `@effect/experimental`
- Includes React-specific modules and hooks
- Active development with regular updates

### Hooks Available
- `useEffect` - Run Effect in React lifecycle
- `useStream` - Subscribe to Effect streams
- `useFiber` - Manage Effect fibers in React
- `useAsyncEffect` - Handle async Effects

### Components
- Error boundary components with Effect integration
- Suspense-compatible components

### Integration Features
- **Suspense**: Full support via `@effect/experimental`
- **Server Components**: Experimental support
- **Data Fetching**: Integration with Effect's built-in data fetching
- **Type Inference**: Excellent, maintains Effect's strong typing
- **Error Boundaries**: Custom error boundaries that understand Effect errors
- **Testing**: Effect test utilities work with React components

## 3. **fp-ts**

### Official React Support
- **No official React bindings**
- Pure functional library without framework-specific code

### Community Packages
- **`fp-ts-react`** - Unmaintained community package
- **`fp-ts-contrib`** - Contains some React utilities but not comprehensive
- Most users create custom hooks

### Common Patterns
```typescript
// Common custom hook pattern
function useTaskEither<E, A>(task: TaskEither<E, A>) {
  const [state, setState] = useState<Either<E, A> | null>(null);

  useEffect(() => {
    task().then(setState);
  }, []);

  return state;
}
```

### Integration Features
- **Suspense**: No built-in support
- **Server Components**: No specific support
- **Data Fetching**: Often used with fp-ts-remote-data pattern
- **Type Inference**: Excellent with custom hooks
- **Error Boundaries**: Manual integration
- **Testing**: Standard React testing approaches

## 4. **purify-ts**

### Official React Support
- **No official React bindings**
- Framework-agnostic design

### Community Support
- Limited community packages
- Users typically write custom hooks

### Common Patterns
- Custom `useMaybe` and `useEither` hooks
- Integration with async operations via `EitherAsync`

### Integration Features
- **Suspense**: No built-in support
- **Server Components**: No specific support
- **Data Fetching**: Manual integration required
- **Type Inference**: Good with custom implementations
- **Error Boundaries**: Manual integration
- **Testing**: No specific utilities

## 5. **oxide.ts**

### Official React Support
- **No official React bindings**
- Lightweight library focused on core Result type

### Community Support
- Very limited React-specific packages
- Small community compared to other libraries

### Integration Features
- **Suspense**: No support
- **Server Components**: No specific support
- **Data Fetching**: Manual integration
- **Type Inference**: Good for basic use cases
- **Error Boundaries**: Manual integration
- **Testing**: No specific utilities

## 6. **true-myth**

### Official React Support
- **No official React bindings**
- Focus on core Maybe/Result types

### Community Support
- Minimal React ecosystem
- Users create custom integration

### Integration Features
- **Suspense**: No support
- **Server Components**: No specific support
- **Data Fetching**: Manual integration
- **Type Inference**: Good with TypeScript
- **Error Boundaries**: Manual integration
- **Testing**: No specific utilities

## 7. **ts-results** / **ts-results-es**

### Official React Support
- **No official React bindings**
- Rust-inspired Result/Option types only

### Community Support
- Some GitHub discussions about React patterns
- No maintained React packages

### Common Patterns
```typescript
// Custom hook example
function useAsyncResult<T, E>(
  fn: () => Promise<Result<T, E>>
): Result<T, E> | undefined {
  const [result, setResult] = useState<Result<T, E>>();

  useEffect(() => {
    fn().then(setResult);
  }, []);

  return result;
}
```

### Integration Features
- **Suspense**: No support
- **Server Components**: No specific support
- **Data Fetching**: Manual integration
- **Type Inference**: Good basic inference
- **Error Boundaries**: Manual integration
- **Testing**: No specific utilities

## 8. **option-t**

### Official React Support
- **No official React bindings**
- Large API surface but no React-specific code

### Community Support
- Very limited React ecosystem
- Primarily used in non-React contexts

### Integration Features
- **Suspense**: No support
- **Server Components**: No specific support
- **Data Fetching**: Manual integration
- **Type Inference**: Good with TypeScript
- **Error Boundaries**: Manual integration
- **Testing**: No specific utilities

## 9. **@badrap/result**

### Official React Support
- **No official React bindings**
- Minimal, focused library

### Community Support
- No known React packages
- Very small community

### Integration Features
- **Suspense**: No support
- **Server Components**: No specific support
- **Data Fetching**: Manual integration
- **Type Inference**: Basic but functional
- **Error Boundaries**: Manual integration
- **Testing**: No specific utilities

## 10. **pratica**

### Official React Support
- **No official React bindings**
- Functional programming utilities without React integration

### Community Support
- No known React packages
- Limited adoption in React projects

### Integration Features
- **Suspense**: No support
- **Server Components**: No specific support
- **Data Fetching**: Manual integration
- **Type Inference**: Good for basic cases
- **Error Boundaries**: Manual integration
- **Testing**: No specific utilities

## Standalone React Result Libraries

### **react-use-result**
- Standalone library for Result pattern in React
- Provides hooks like `useResult` and `useAsyncResult`
- Not tied to specific Result implementation
- Limited maintenance

### **react-either**
- Lightweight React hooks for Either pattern
- Basic `useEither` hook
- Not actively maintained

### **use-async-result**
- Generic async Result hook
- Works with any Result-like type
- Minimal feature set

## Patterns in the Wild

### Common Custom Hook Patterns

1. **Basic Result Hook**
```typescript
function useResult<T, E>(
  initialValue?: Result<T, E>
): [Result<T, E> | undefined, (result: Result<T, E>) => void] {
  const [result, setResult] = useState(initialValue);
  return [result, setResult];
}
```

2. **Async Result Hook with Loading State**
```typescript
function useAsyncResult<T, E>(
  asyncFn: () => Promise<Result<T, E>>,
  deps: DependencyList = []
) {
  const [state, setState] = useState<{
    loading: boolean;
    result?: Result<T, E>;
  }>({ loading: true });

  useEffect(() => {
    setState({ loading: true });
    asyncFn().then(result => setState({ loading: false, result }));
  }, deps);

  return state;
}
```

3. **Result with Suspense**
```typescript
function useResultWithSuspense<T, E>(
  promise: Promise<Result<T, E>>
): Result<T, E> {
  const result = use(promise); // React 18+ use hook
  return result;
}
```

### TanStack Query Integration Pattern
```typescript
function useQueryResult<T, E>(
  key: string[],
  fn: () => Promise<Result<T, E>>
) {
  return useQuery({
    queryKey: key,
    queryFn: fn,
    select: (data) => data, // Result is returned as-is
  });
}
```

### SWR Integration Pattern
```typescript
function useSwrResult<T, E>(
  key: string,
  fetcher: () => Promise<Result<T, E>>
) {
  const { data, error, isLoading } = useSWR(key, fetcher);

  if (isLoading) return { loading: true };
  if (error) return { result: Err(error) };
  return { result: data };
}
```

## Framework-Native Patterns

### Remix
- Uses thrown responses and error boundaries
- `json()` and `defer()` for data responses
- Error boundaries handle failures
- No built-in Result type but similar error handling patterns

### Next.js
- Server Actions return plain objects or throw
- `notFound()` and `redirect()` for control flow
- Error boundaries for error handling
- No built-in Result type

### React Server Components
- Async components can throw for error boundaries
- No standard Result pattern
- Community moving toward try/catch with error boundaries

## Blog Posts and Articles

### Popular Patterns
1. **"Functional Error Handling in React"** - Common pattern using fp-ts
2. **"Railway-Oriented Programming in React"** - Result chaining patterns
3. **"Type-Safe Error Handling with neverthrow"** - Integration strategies
4. **"Effect + React: A Perfect Match?"** - Effect ecosystem integration

### Common Recommendations
- Create custom hooks for your specific Result library
- Use error boundaries for unrecoverable errors
- Leverage Suspense for loading states
- Consider Result types for form validation
- Use discriminated unions for component state

## Summary and Recommendations

### Best React Integration
1. **Effect** - Most comprehensive React support with experimental package
2. **neverthrow** - Good community patterns despite no official support
3. **fp-ts** - Strong patterns but requires custom implementation

### For New Projects
- **If you need comprehensive React support**: Use Effect with @effect/experimental
- **If you want simplicity**: Use neverthrow with custom hooks
- **If you're already using fp-ts**: Create custom React bindings

### Key Findings
- Most Result libraries lack official React support
- Effect is the only library with serious React investment
- Community packages are often unmaintained
- Custom hooks are the most common integration pattern
- Suspense and Server Component support is rare
- Type inference is generally good with custom implementations

### Future Trends
- Growing interest in Effect for React applications
- Move toward Suspense-compatible Result patterns
- Integration with React Server Components
- Better error boundary integration
- More sophisticated data fetching patterns