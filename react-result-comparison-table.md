# React Result Libraries Comparison Table

## Feature Comparison Matrix

| Library | Official React | Community React | Hooks | Components | Suspense | RSC | TanStack Query | Type Inference | Error Boundary | Testing Utils |
|---------|---------------|-----------------|-------|------------|----------|-----|----------------|----------------|----------------|---------------|
| **neverthrow** | ❌ | ⚠️ (unmaintained) | Custom | Custom | ❌ | ❌ | Manual | ⭐⭐⭐⭐ | Manual | ❌ |
| **Effect** | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | Built-in | ⭐⭐⭐⭐⭐ | ✅ | ✅ |
| **fp-ts** | ❌ | ⚠️ (limited) | Custom | Custom | ❌ | ❌ | Manual | ⭐⭐⭐⭐⭐ | Manual | ❌ |
| **purify-ts** | ❌ | ❌ | Custom | Custom | ❌ | ❌ | Manual | ⭐⭐⭐ | Manual | ❌ |
| **oxide.ts** | ❌ | ❌ | Custom | Custom | ❌ | ❌ | Manual | ⭐⭐⭐ | Manual | ❌ |
| **true-myth** | ❌ | ❌ | Custom | Custom | ❌ | ❌ | Manual | ⭐⭐⭐ | Manual | ❌ |
| **ts-results** | ❌ | ❌ | Custom | Custom | ❌ | ❌ | Manual | ⭐⭐⭐ | Manual | ❌ |
| **option-t** | ❌ | ❌ | Custom | Custom | ❌ | ❌ | Manual | ⭐⭐⭐ | Manual | ❌ |
| **@badrap/result** | ❌ | ❌ | Custom | Custom | ❌ | ❌ | Manual | ⭐⭐ | Manual | ❌ |
| **pratica** | ❌ | ❌ | Custom | Custom | ❌ | ❌ | Manual | ⭐⭐ | Manual | ❌ |

### Legend
- ✅ Full support
- ⚠️ Partial/experimental support
- ❌ No support
- Custom = Requires custom implementation
- Manual = Manual integration required
- ⭐ Type inference quality (1-5 stars)

## Detailed Feature Analysis

### React Hook Support

| Library | Available Hooks | Quality | Maintenance |
|---------|-----------------|---------|-------------|
| **Effect** | useEffect, useStream, useFiber, useAsyncEffect | Production-ready | Active |
| **neverthrow** | Community: useAsyncResult, useResult | Variable | Unmaintained |
| **fp-ts** | Community: useTaskEither, useOption | DIY quality | User-maintained |
| Others | None - DIY required | Varies | N/A |

### Data Fetching Integration

| Library | TanStack Query | SWR | Native Fetch | Complexity |
|---------|----------------|-----|--------------|------------|
| **Effect** | Via Effect.promise | Via Effect.promise | Native Effect | Low (built-in) |
| **neverthrow** | Custom wrapper | Custom wrapper | ResultAsync | Medium |
| **fp-ts** | TaskEither wrapper | TaskEither wrapper | TaskEither | Medium |
| Others | Custom implementation | Custom implementation | Varies | High |

### Server-Side Rendering (SSR) & React Server Components (RSC)

| Library | SSR Support | RSC Support | Hydration | Streaming |
|---------|-------------|-------------|-----------|-----------|
| **Effect** | ✅ | Experimental | ✅ | ✅ |
| **neverthrow** | ✅ (pure) | ✅ (pure) | N/A | N/A |
| **fp-ts** | ✅ (pure) | ✅ (pure) | N/A | N/A |
| Others | ✅ (pure) | ✅ (pure) | N/A | N/A |

### Bundle Size Impact

| Library | Core Size | React Additions | Tree-Shakeable | Total Impact |
|---------|-----------|-----------------|-----------------|--------------|
| **neverthrow** | ~8KB | +2-5KB (custom) | ✅ | ~10-13KB |
| **Effect** | ~50KB | +15KB | ✅ | ~65KB |
| **fp-ts** | ~30KB | +3-5KB (custom) | ✅ | ~33-35KB |
| **purify-ts** | ~15KB | +2-3KB (custom) | ✅ | ~17-18KB |
| **oxide.ts** | ~5KB | +2KB (custom) | ✅ | ~7KB |
| **ts-results** | ~3KB | +2KB (custom) | ✅ | ~5KB |
| **@badrap/result** | ~2KB | +2KB (custom) | ✅ | ~4KB |

## Community & Ecosystem

### GitHub Stats (as of early 2024)

| Library | Stars | Issues | Last Update | React Issues/PRs |
|---------|-------|--------|-------------|------------------|
| **neverthrow** | 3.5k+ | 50+ | Active | 15+ |
| **Effect** | 3k+ | 100+ | Daily | 20+ |
| **fp-ts** | 10k+ | 100+ | Active | 30+ |
| **purify-ts** | 1.5k+ | 20+ | Sporadic | 5+ |
| **oxide.ts** | 500+ | 10+ | Sporadic | 2+ |
| **ts-results** | 300+ | 5+ | Sporadic | 3+ |

### NPM Downloads (Weekly)

| Library | Core Package | React Package |
|---------|--------------|---------------|
| **neverthrow** | 200k+ | 500 (community) |
| **Effect** | 50k+ | 5k+ |
| **fp-ts** | 400k+ | 1k (community) |
| **purify-ts** | 20k+ | N/A |
| **oxide.ts** | 5k+ | N/A |
| **ts-results** | 10k+ | N/A |

## Real-World Usage Patterns

### Popular Combinations

1. **neverthrow + TanStack Query**
   - Most common for new projects
   - Good TypeScript support
   - Requires custom hooks

2. **Effect + Effect Ecosystem**
   - Comprehensive solution
   - Steeper learning curve
   - Best long-term support

3. **fp-ts + fp-ts-contrib**
   - Popular in FP-heavy codebases
   - Requires significant setup
   - Excellent type safety

4. **Custom Result Type + React**
   - Many teams build their own
   - Tailored to specific needs
   - Full control

## Migration Paths

### From Promises to Result

| From | To neverthrow | To Effect | To fp-ts |
|------|---------------|-----------|----------|
| **Complexity** | Low | High | Medium |
| **Type Changes** | Minimal | Significant | Moderate |
| **Learning Curve** | 1-2 days | 1-2 weeks | 3-5 days |
| **Tooling Changes** | None | Some | None |

### Between Result Libraries

| Migration | Difficulty | Auto-migration | Type Compatibility |
|-----------|------------|----------------|-------------------|
| neverthrow → Effect | High | ❌ | Adapter needed |
| fp-ts → Effect | Medium | Partial | Some compatibility |
| neverthrow → fp-ts | Medium | ❌ | Different APIs |
| Any → Custom | Low | N/A | Full control |

## Testing Strategies

### Testing Support by Library

| Library | React Testing Library | Jest | Vitest | E2E Testing |
|---------|----------------------|------|--------|-------------|
| **Effect** | ✅ (with utilities) | ✅ | ✅ | ✅ |
| **neverthrow** | Manual | ✅ | ✅ | ✅ |
| **fp-ts** | Manual | ✅ | ✅ | ✅ |
| Others | Manual | ✅ | ✅ | ✅ |

### Common Testing Patterns

```typescript
// Testing approach comparison

// neverthrow
expect(result.isOk()).toBe(true);
expect(result._unsafeUnwrap()).toEqual(expectedValue);

// Effect
expect(Effect.runSync(effect)).toEqual(expectedValue);

// fp-ts
expect(isRight(either)).toBe(true);
expect(getOrElse(() => null)(either)).toEqual(expectedValue);
```

## Performance Considerations

### Runtime Performance

| Library | Overhead | Memory Usage | GC Pressure | Optimization |
|---------|----------|--------------|-------------|--------------|
| **neverthrow** | Low | Low | Low | Good |
| **Effect** | Medium | Medium | Medium | Excellent |
| **fp-ts** | Low-Medium | Low | Low | Good |
| **oxide.ts** | Very Low | Very Low | Very Low | Excellent |
| **ts-results** | Very Low | Very Low | Very Low | Excellent |

### Development Performance

| Library | IDE Support | Type Checking Speed | Build Time Impact |
|---------|-------------|--------------------|--------------------|
| **neverthrow** | Good | Fast | Minimal |
| **Effect** | Excellent | Slower | Moderate |
| **fp-ts** | Good | Medium | Minimal |
| **Simple libs** | Basic | Very Fast | Negligible |

## Recommendations by Use Case

### Enterprise Application
**Recommended**: Effect
- Comprehensive ecosystem
- Active development
- Professional support available
- Best React integration

### Startup/MVP
**Recommended**: neverthrow
- Simple API
- Quick to learn
- Good enough React patterns
- Active community

### Functional Programming Team
**Recommended**: fp-ts
- Pure FP approach
- Extensive ecosystem
- Academic backing
- Composable abstractions

### Microservices/API
**Recommended**: neverthrow or ts-results
- Lightweight
- Simple error handling
- Easy to understand
- Minimal overhead

### Component Library
**Recommended**: Custom Result type
- No external dependencies
- Full control over API
- Optimized for your use case
- Better tree-shaking

### Legacy Migration
**Recommended**: Start with neverthrow
- Gradual adoption possible
- Works alongside promises
- Minimal breaking changes
- Clear migration path

## Future Outlook

### Trends
1. **Effect gaining momentum** - Most active development
2. **React 19 features** - Better async component support
3. **Server Components** - More Result patterns in RSC
4. **Type-level programming** - More sophisticated types
5. **Native TC39 proposal** - Possible future ECMAScript Result type

### Investment Safety

| Library | 1 Year | 3 Years | 5 Years | Risk Level |
|---------|--------|---------|---------|------------|
| **Effect** | ✅ | ✅ | ✅ | Low |
| **neverthrow** | ✅ | ✅ | ⚠️ | Low-Medium |
| **fp-ts** | ✅ | ✅ | ✅ | Low |
| Others | ⚠️ | ❓ | ❓ | High |

## Decision Matrix

### Quick Decision Guide

Choose **Effect** if:
- You need comprehensive React support
- You're building a large application
- You want an all-in-one solution
- You can invest in learning

Choose **neverthrow** if:
- You want simplicity
- You need quick adoption
- You're okay with custom React hooks
- You prefer explicit error handling

Choose **fp-ts** if:
- You're already using FP patterns
- You want mathematical correctness
- You need extensive combinators
- Your team knows category theory

Choose **Custom** if:
- You have specific requirements
- You want zero dependencies
- You need full control
- You're building a library