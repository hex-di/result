# Competitor Comparison

Feature matrix comparing `@hex-di/result` against TypeScript Result/Either libraries and cross-language implementations.

## Package Overview

| Package | Version Assessed | Category | Notes |
|---------|-----------------|----------|-------|
| `@hex-di/result` | 1.0.0 | Standalone Result | This library |
| `neverthrow` | 8.x | Standalone Result | Most popular TS Result library |
| `effect` (Effect) | 3.x | Full framework | Result is one module in a large ecosystem |
| `fp-ts` | 2.x | FP toolkit | `Either<E, A>` + ecosystem |
| `true-myth` | 7.x | Standalone Result | Ember-origin, standalone functions |
| `oxide.ts` | 1.x | Standalone Result | Rust-inspired API |
| `purify-ts` | 2.x | FP toolkit | ADT-based, class instances |
| `option-t` | 49.x | Standalone Result/Option | Minimal, function-based |
| `ts-results-es` | 4.x | Standalone Result | ESM fork of ts-results |

## Scoring Dimensions

Each dimension is rated 0–10. A score of 10 represents the theoretical best for a standalone TypeScript Result library.

| # | Dimension | What It Measures |
|---|-----------|------------------|
| 1 | Type Safety | Inference quality, phantom types, error accumulation types, narrowing |
| 2 | API Completeness | Breadth of methods/constructors vs Rust's `Result` + community expectations |
| 3 | Composability | Chaining, piping, generator support, Do notation, combinators |
| 4 | Dev Ergonomics | Learning curve, discoverability, editor support, error messages |
| 5 | Async Support | Native async wrapper, Promise integration, async combinators |
| 6 | Error Handling Patterns | Tagged errors, error groups, exhaustiveness, accumulation strategies |
| 7 | Immutability | Runtime enforcement, freeze guarantees, shallow vs deep |
| 8 | Safety Guarantees | Brand validation, forgery resistance, runtime invariants |
| 9 | Performance | Overhead per operation, allocation cost, zero-cost abstractions |
| 10 | Bundle Efficiency | Tree-shaking, subpath exports, dead code elimination |
| 11 | Interop | JSON serialization, schema standards, framework bridges |
| 12 | Documentation Quality | API docs, guides, examples, migration paths |
| 13 | Ecosystem & Adoption | npm downloads, GitHub stars, community size |
| 14 | Maintenance & CI | Release cadence, TS matrix, mutation testing, changelogs |
| 15 | Cross-Language Alignment | Faithfulness to Rust/Haskell/Kotlin Result idioms |

## TypeScript Library Ratings

| Dimension | hex-di/result | neverthrow | Effect | fp-ts | true-myth | oxide.ts | purify-ts | option-t | ts-results-es |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Type Safety | 10 | 7 | 10 | 9 | 7 | 6 | 7 | 6 | 5 |
| API Completeness | 9 | 7 | 10 | 9 | 7 | 6 | 7 | 5 | 5 |
| Composability | 9 | 7 | 10 | 9 | 8 | 5 | 7 | 7 | 4 |
| Dev Ergonomics | 8 | 8 | 5 | 4 | 7 | 7 | 6 | 5 | 7 |
| Async Support | 9 | 8 | 10 | 5 | 3 | 3 | 4 | 3 | 3 |
| Error Handling | 8 | 5 | 9 | 7 | 4 | 4 | 5 | 3 | 3 |
| Immutability | 10 | 5 | 8 | 7 | 8 | 5 | 6 | 8 | 5 |
| Safety Guarantees | 10 | 3 | 7 | 5 | 4 | 3 | 3 | 3 | 2 |
| Performance | 8 | 8 | 6 | 5 | 7 | 8 | 6 | 9 | 8 |
| Bundle Efficiency | 6 | 7 | 4 | 3 | 8 | 7 | 5 | 9 | 7 |
| Interop | 7 | 5 | 8 | 6 | 5 | 4 | 5 | 4 | 4 |
| Documentation | 8 | 7 | 9 | 6 | 8 | 5 | 6 | 4 | 4 |
| Ecosystem | 1 | 7 | 9 | 8 | 4 | 3 | 4 | 3 | 3 |
| Maintenance | 5 | 6 | 9 | 4 | 6 | 4 | 4 | 7 | 4 |
| Cross-Language | 10 | 6 | 7 | 8 | 7 | 8 | 6 | 5 | 6 |
| **Total** | **119** | **96** | **126** | **95** | **93** | **78** | **83** | **81** | **70** |

### Per-Library Justifications

#### @hex-di/result (119/150)

- **Type Safety 10**: Phantom types (`Ok<T, never>`), branded validation, full discriminated union narrowing, comprehensive inference utilities (`InferOk`, `InferErr`, `FlattenResult`, etc.).
- **API Completeness 9**: Missing `Option<T>`, `and()`/`or()`, `contains()`/`containsErr()`, `mapOr()`/`mapOrElse()`, `transpose()`. Otherwise comprehensive.
- **Composability 9**: Generator-based early return (`safeTry`), 4 combinators, method chaining. Missing Do notation and standalone pipe-friendly functions.
- **Dev Ergonomics 8**: Good method names, clear error messages. Missing unsafe import gating and structured `UnwrapError`.
- **Async Support 9**: Full `ResultAsync` class with chaining. Missing brand-based identity, `fromCallback`, `race`.
- **Error Handling 8**: `createError(tag)` + `assertNever`. Missing `createErrorGroup` for namespaced error families.
- **Immutability 10**: `Object.freeze()` on every instance, documented invariant.
- **Safety Guarantees 10**: `RESULT_BRAND` unique symbol, brand-based `isResult()`, frozen instances.
- **Performance 8**: Closure-based (no prototype), frozen objects. Minor per-instance allocation cost. Improvable to 9 via published benchmark suite and selective prototype optimization ([ADR-013](../decisions/013-performance-strategy.md)).
- **Bundle Efficiency 6**: Tree-shakeable exports but no subpath exports, no standalone function module, single entry point.
- **Interop 7**: `toJSON()` serialization, `intoTuple()` Go-style. Missing `fromJSON()`, Standard Schema, `structuredClone` guidance.
- **Documentation 8**: Full spec files, ADRs, glossary, invariants. Missing competitor comparisons (this document) and migration guides.
- **Ecosystem 1**: Pre-release, no npm downloads, no community yet.
- **Maintenance 5**: No CI matrix, no nightly canary, no conventional commits, no changesets.
- **Cross-Language 10**: Faithful to Rust's `Result` API naming and semantics.

#### neverthrow (96/150)

- **Type Safety 7**: Good inference but no phantom types. Error type widening in some cases.
- **API Completeness 7**: Core methods present. Missing `flip`, `mapBoth`, `andThrough`, `intoTuple`, `merge`.
- **Composability 7**: Method chaining + `safeTry` generators. No standalone functions, no Do notation.
- **Dev Ergonomics 8**: Simple API, good naming, easy learning curve.
- **Async Support 8**: `ResultAsync` class, similar to hex-di/result. No brand.
- **Error Handling 5**: No tagged error factory, no error groups, basic `_unsafeUnwrap`.
- **Immutability 5**: No `Object.freeze()`, relies on TypeScript `readonly`.
- **Safety Guarantees 3**: No brand symbol, structural checking only.
- **Performance 8**: Class-based, prototype sharing. Low per-instance cost.
- **Bundle Efficiency 7**: Tree-shakeable, but no subpath exports.
- **Interop 5**: Basic serialization. No Standard Schema.
- **Documentation 7**: Good README, JSDoc. No spec-level documentation.
- **Ecosystem 7**: ~2M npm weekly downloads, active community.
- **Maintenance 6**: Regular releases, GitHub Actions CI. No mutation testing.
- **Cross-Language 6**: Rust-inspired but diverges on naming (e.g., `_unsafeUnwrap`).

#### Effect (126/150)

- **Type Safety 10**: Advanced type-level programming, branded types, full inference.
- **API Completeness 10**: Exhaustive — Result, Option, Stream, Schema, every utility imaginable.
- **Composability 10**: Pipe, Do notation, generators, Effect system, layers.
- **Dev Ergonomics 5**: Steep learning curve, large surface area, unfamiliar concepts for most TS devs.
- **Async Support 10**: Native fiber-based async, full concurrency primitives.
- **Error Handling 9**: Cause tracking, defects vs failures, tagged errors, error channels.
- **Immutability 8**: Values are immutable by convention and design, some runtime enforcement.
- **Safety Guarantees 7**: Branded types, but complexity creates more surface area for misuse.
- **Performance 6**: Fiber runtime overhead, not zero-cost for simple Result use cases.
- **Bundle Efficiency 4**: Large bundle even with tree-shaking due to runtime dependencies.
- **Interop 8**: Schema, serialization, platform integrations.
- **Documentation 9**: Extensive docs site, tutorials, examples, API reference.
- **Ecosystem 9**: Growing rapidly, ~500K weekly downloads, corporate backing.
- **Maintenance 9**: Daily releases, full CI matrix, conventional commits.
- **Cross-Language 7**: Inspired by Scala ZIO / Haskell, not Rust-aligned.

#### fp-ts (95/150)

- **Type Safety 9**: Higher-kinded type emulation, full algebraic type classes.
- **API Completeness 9**: `Either`, `Option`, `TaskEither`, `IO`, `Reader`, full FP toolkit.
- **Composability 9**: `pipe()`, `flow()`, type class instances, extensive combinators.
- **Dev Ergonomics 4**: Steep learning curve, HKT encoding is complex, error messages are cryptic.
- **Async Support 5**: `TaskEither` exists but awkward compared to native async/await.
- **Error Handling 7**: `Either` + type classes, but no tagged error helpers.
- **Immutability 7**: Functional style encourages immutability, no runtime enforcement.
- **Safety Guarantees 5**: No brand validation, structural types only.
- **Performance 5**: Function call overhead from pipe chains, no runtime optimization.
- **Bundle Efficiency 3**: Large dependency tree, poor tree-shaking in practice.
- **Interop 6**: `io-ts` for schema validation, some ecosystem bridges.
- **Documentation 6**: API docs exist but are terse, community-driven tutorials.
- **Ecosystem 8**: ~1.5M weekly downloads, large FP community.
- **Maintenance 4**: Maintenance mode, no new features, slow response to issues.
- **Cross-Language 8**: Faithful to Haskell type class hierarchy.

#### true-myth (93/150)

- **Type Safety 7**: Good inference, `Maybe` + `Result`. No phantom types.
- **API Completeness 7**: Core methods present. No async wrapper, limited combinators.
- **Composability 8**: Standalone functions + method chaining. `pipe`-friendly.
- **Dev Ergonomics 7**: Good docs, clear naming. Standalone function style may be unfamiliar.
- **Async Support 3**: No async wrapper. Manual `Promise<Result>` handling.
- **Error Handling 4**: Basic tagged union, no error factory helpers.
- **Immutability 8**: Class-based with readonly properties, some freeze behavior.
- **Safety Guarantees 4**: `instanceof` checks (cross-realm issues), no brand.
- **Performance 7**: Class-based, efficient. No notable overhead.
- **Bundle Efficiency 8**: Good tree-shaking, standalone function imports.
- **Interop 5**: Basic serialization, no Standard Schema.
- **Documentation 8**: Excellent API docs, guides, TypeDoc.
- **Ecosystem 4**: ~50K weekly downloads, smaller community.
- **Maintenance 6**: Active maintenance, regular releases.
- **Cross-Language 7**: Inspired by Rust and Elm.

#### oxide.ts (78/150)

- **Type Safety 6**: Basic inference, no phantom types, limited narrowing.
- **API Completeness 6**: Core Rust methods. Missing async, combinators, error helpers.
- **Composability 5**: Method chaining only. No pipe, no generators.
- **Dev Ergonomics 7**: Rust-familiar API, simple to learn.
- **Async Support 3**: No async wrapper.
- **Error Handling 4**: Basic `unwrap`/`expect`, no tagged error support.
- **Immutability 5**: No freeze, readonly types only.
- **Safety Guarantees 3**: No brand, structural checks.
- **Performance 8**: Lightweight, minimal overhead.
- **Bundle Efficiency 7**: Small bundle, tree-shakeable.
- **Interop 4**: Minimal serialization support.
- **Documentation 5**: README-only docs.
- **Ecosystem 3**: ~20K weekly downloads.
- **Maintenance 4**: Infrequent updates.
- **Cross-Language 8**: Very faithful to Rust naming and semantics.

#### purify-ts (83/150)

- **Type Safety 7**: ADT-based, decent inference. Some type widening issues.
- **API Completeness 7**: `Either`, `Maybe`, `Codec`, several utilities.
- **Composability 7**: Method chaining, codec composition. No generators.
- **Dev Ergonomics 6**: Class-based API, reasonable learning curve.
- **Async Support 4**: `EitherAsync` exists but limited.
- **Error Handling 5**: Basic pattern matching, no tagged error helpers.
- **Immutability 6**: Class instances, no freeze.
- **Safety Guarantees 3**: `instanceof` checks only.
- **Performance 6**: Class overhead, codec validation cost.
- **Bundle Efficiency 5**: Moderate bundle size, limited tree-shaking.
- **Interop 5**: Codec-based validation.
- **Documentation 6**: Docs site with examples.
- **Ecosystem 4**: ~100K weekly downloads.
- **Maintenance 4**: Slow release cadence.
- **Cross-Language 6**: Haskell-inspired naming.

#### option-t (81/150)

- **Type Safety 6**: Simple types, minimal inference utilities.
- **API Completeness 5**: Minimal API surface, function-based.
- **Composability 7**: Standalone functions, pipe-friendly.
- **Dev Ergonomics 5**: Unfamiliar API, minimal docs.
- **Async Support 3**: No async wrapper.
- **Error Handling 3**: No error utilities.
- **Immutability 8**: Plain objects, functional style.
- **Safety Guarantees 3**: No brand, no validation.
- **Performance 9**: Near-zero overhead, minimal allocations.
- **Bundle Efficiency 9**: Excellent tree-shaking, tiny bundle.
- **Interop 4**: Minimal.
- **Documentation 4**: Sparse.
- **Ecosystem 3**: ~15K weekly downloads.
- **Maintenance 7**: Regular updates, good CI.
- **Cross-Language 5**: Loosely Rust-inspired.

#### ts-results-es (70/150)

- **Type Safety 5**: Basic generics, no phantom types, no inference utilities.
- **API Completeness 5**: Core methods only. No async, limited transformations.
- **Composability 4**: Method chaining only. No combinators.
- **Dev Ergonomics 7**: Very simple API, easy to learn.
- **Async Support 3**: No async wrapper.
- **Error Handling 3**: Basic unwrap/expect only.
- **Immutability 5**: No freeze.
- **Safety Guarantees 2**: `instanceof` only, class-based.
- **Performance 8**: Lightweight class instances.
- **Bundle Efficiency 7**: Small, ESM-first.
- **Interop 4**: Minimal.
- **Documentation 4**: README only.
- **Ecosystem 3**: ~10K weekly downloads.
- **Maintenance 4**: Community-maintained fork.
- **Cross-Language 6**: Rust-inspired.

## Cross-Language Ratings

Reference implementations from languages with native or established Result types.

| Dimension | Rust std | Kotlin Arrow | Swift Result | Scala ZIO | Haskell Either | Gleam Result | Go errors |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Type Safety | 10 | 9 | 8 | 10 | 10 | 9 | 3 |
| API Completeness | 10 | 9 | 7 | 10 | 9 | 7 | 4 |
| Composability | 10 | 9 | 6 | 10 | 10 | 8 | 2 |
| Dev Ergonomics | 8 | 7 | 9 | 5 | 4 | 9 | 8 |
| Async Support | 9 | 9 | 8 | 10 | 7 | 7 | 6 |
| Error Handling | 10 | 8 | 7 | 10 | 8 | 7 | 5 |
| Immutability | 9 | 8 | 7 | 9 | 10 | 10 | 3 |
| Safety Guarantees | 10 | 8 | 8 | 9 | 9 | 9 | 2 |
| Performance | 10 | 7 | 9 | 7 | 7 | 8 | 9 |
| Bundle Efficiency | 10 | 7 | 9 | 6 | 7 | 9 | 10 |
| Interop | 8 | 8 | 8 | 8 | 6 | 7 | 7 |
| Documentation | 10 | 8 | 9 | 8 | 7 | 8 | 9 |
| Ecosystem | 10 | 7 | 10 | 7 | 8 | 4 | 10 |
| Maintenance | 10 | 8 | 10 | 8 | 8 | 7 | 10 |
| Cross-Language | 10 | 8 | 7 | 8 | 10 | 8 | 3 |
| **Total** | **144** | **120** | **122** | **125** | **120** | **118** | **81** |

### Key observations

- **Rust** sets the standard at 144/150. Its only gap is ergonomics (borrow checker complexity) and interop (FFI friction).
- **Scala ZIO** and **Swift Result** score highest among managed-language implementations thanks to native language support and strong ecosystems.
- **Go errors** scores lowest — error handling is explicit but lacks type safety, composability, and immutability guarantees.

## Consolidated Current Score Matrix

All 16 implementations rated across 15 dimensions. Scores reflect the current state of each library/language.

| Dimension | hex-di | neverthrow | Effect | fp-ts | true-myth | oxide.ts | purify-ts | option-t | ts-results-es | Rust | Kotlin Arrow | Swift | Scala ZIO | Haskell | Gleam | Go |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Type Safety | 10 | 7 | 10 | 9 | 7 | 6 | 7 | 6 | 5 | 10 | 9 | 8 | 10 | 10 | 9 | 3 |
| API Completeness | 9 | 7 | 10 | 9 | 7 | 6 | 7 | 5 | 5 | 10 | 9 | 7 | 10 | 9 | 7 | 4 |
| Composability | 9 | 7 | 10 | 9 | 8 | 5 | 7 | 7 | 4 | 10 | 9 | 6 | 10 | 10 | 8 | 2 |
| Dev Ergonomics | 8 | 8 | 5 | 4 | 7 | 7 | 6 | 5 | 7 | 8 | 7 | 9 | 5 | 4 | 9 | 8 |
| Async Support | 9 | 8 | 10 | 5 | 3 | 3 | 4 | 3 | 3 | 9 | 9 | 8 | 10 | 7 | 7 | 6 |
| Error Handling | 8 | 5 | 9 | 7 | 4 | 4 | 5 | 3 | 3 | 10 | 8 | 7 | 10 | 8 | 7 | 5 |
| Immutability | 10 | 5 | 8 | 7 | 8 | 5 | 6 | 8 | 5 | 9 | 8 | 7 | 9 | 10 | 10 | 3 |
| Safety Guarantees | 10 | 3 | 7 | 5 | 4 | 3 | 3 | 3 | 2 | 10 | 8 | 8 | 9 | 9 | 9 | 2 |
| Performance | 8 | 8 | 6 | 5 | 7 | 8 | 6 | 9 | 8 | 10 | 7 | 9 | 7 | 7 | 8 | 9 |
| Bundle Efficiency | 6 | 7 | 4 | 3 | 8 | 7 | 5 | 9 | 7 | 10 | 7 | 9 | 6 | 7 | 9 | 10 |
| Interop | 7 | 5 | 8 | 6 | 5 | 4 | 5 | 4 | 4 | 8 | 8 | 8 | 8 | 6 | 7 | 7 |
| Documentation | 8 | 7 | 9 | 6 | 8 | 5 | 6 | 4 | 4 | 10 | 8 | 9 | 8 | 7 | 8 | 9 |
| Ecosystem | 1 | 7 | 9 | 8 | 4 | 3 | 4 | 3 | 3 | 10 | 7 | 10 | 7 | 8 | 4 | 10 |
| Maintenance | 5 | 6 | 9 | 4 | 6 | 4 | 4 | 7 | 4 | 10 | 8 | 10 | 8 | 8 | 7 | 10 |
| Cross-Language | 10 | 6 | 7 | 8 | 7 | 8 | 6 | 5 | 6 | 10 | 8 | 7 | 8 | 10 | 8 | 3 |
| **TOTAL** | **119** | **96** | **126** | **95** | **93** | **78** | **83** | **81** | **70** | **144** | **120** | **122** | **125** | **120** | **118** | **81** |

### Current Ranking

| Rank | Implementation | Score | Category |
|:----:|----------------|:-----:|----------|
| 1 | Rust std | 144 | Cross-language |
| 2 | Effect | 126 | TypeScript |
| 3 | Scala ZIO | 125 | Cross-language |
| 4 | Swift Result | 122 | Cross-language |
| 5 | Kotlin Arrow | 120 | Cross-language |
| 6 | Haskell Either | 120 | Cross-language |
| 7 | **hex-di/result** | **119** | **TypeScript** |
| 8 | Gleam Result | 118 | Cross-language |
| 9 | neverthrow | 96 | TypeScript |
| 10 | fp-ts | 95 | TypeScript |
| 11 | true-myth | 93 | TypeScript |
| 12 | purify-ts | 83 | TypeScript |
| 13 | option-t | 81 | TypeScript |
| 14 | Go errors | 81 | Cross-language |
| 15 | oxide.ts | 78 | TypeScript |
| 16 | ts-results-es | 70 | TypeScript |

`hex-di/result` currently ranks 7th overall and 2nd among TypeScript libraries (behind Effect). The 7-point gap to Effect is concentrated in Ecosystem (−8), Maintenance (−4), and Bundle Efficiency (−2), partially offset by leads in Immutability (+2), Safety Guarantees (+3), Dev Ergonomics (+3), and Cross-Language (+3).

## Gap Analysis

Dimensions where `@hex-di/result` scores below the TypeScript leader or below 9/10:

| Dimension | Current | Leader | Leader Score | Gap | Improvement Path |
|-----------|:-------:|--------|:------------:|:---:|-----------------|
| API Completeness | 9 | Effect | 10 | 1 | Add `Option<T>`, `and()`, `or()`, `contains()`, `containsErr()`, `mapOr()`, `mapOrElse()`, `transpose()` → [ADR-009](../decisions/009-option-type.md), [03-transformation.md](../behaviors/03-transformation.md) |
| Composability | 9 | Effect | 10 | 1 | Add Do notation, standalone pipe-friendly functions → [ADR-007](../decisions/007-dual-api-surface.md), [ADR-012](../decisions/012-do-notation.md) |
| Dev Ergonomics | 8 | neverthrow | 8 | 0* | Gate unsafe ops, add `UnwrapError` with context → [ADR-010](../decisions/010-unsafe-subpath.md) |
| Async Support | 9 | Effect | 10 | 1 | Brand-based `isResultAsync()`, `fromCallback`, `race` → [ADR-008](../decisions/008-result-async-brand.md) |
| Error Handling | 8 | Effect | 9 | 1 | Add `createErrorGroup()` → [08-error-patterns.md](../behaviors/08-error-patterns.md) |
| Bundle Efficiency | 6 | option-t | 9 | 3 | Subpath exports, standalone function module → [ADR-011](../decisions/011-subpath-exports.md), [ADR-007](../decisions/007-dual-api-surface.md) |
| Interop | 7 | Effect | 8 | 1 | Add `fromJSON()`, Standard Schema, `structuredClone` notes → [13-interop.md](../behaviors/13-interop.md) |
| Performance | 8 | option-t | 9 | 1 | Published benchmark suite proving <5% end-to-end overhead; selective prototype if needed → [ADR-013](../decisions/013-performance-strategy.md), [14-benchmarks.md](../behaviors/14-benchmarks.md) |
| Ecosystem | 1 | Effect | 9 | 8 | Requires time, adoption, community building (cannot be spec'd) |
| Maintenance | 5 | Effect | 9 | 4 | CI matrix, nightly canary, conventional commits, changesets → [ci-maintenance.md](../process/ci-maintenance.md) |

*Dev Ergonomics is tied with the leader but can be improved from 8→10 with unsafe gating.

## Projected Scores After Improvements

After implementing all spec'd improvements:

| Dimension | Current | Projected | Delta | Notes |
|-----------|:-------:|:---------:|:-----:|-------|
| Type Safety | 10 | 10 | 0 | Already at ceiling |
| API Completeness | 9 | 10 | +1 | Option type + new methods |
| Composability | 9 | 10 | +1 | Do notation + standalone functions |
| Dev Ergonomics | 8 | 10 | +2 | Unsafe gating + UnwrapError |
| Async Support | 9 | 10 | +1 | Brand + fromCallback + race |
| Error Handling | 8 | 10 | +2 | Error groups + partition + zipOrAccumulate |
| Immutability | 10 | 10 | 0 | Already at ceiling |
| Safety Guarantees | 10 | 10 | 0 | Already at ceiling |
| Performance | 8 | 9 | +1 | Published benchmark suite + selective prototype if needed |
| Bundle Efficiency | 6 | 10 | +4 | Subpath exports + standalone functions |
| Interop | 7 | 9 | +2 | fromJSON + Standard Schema |
| Documentation | 8 | 9 | +1 | This comparison + migration guides |
| Ecosystem | 1 | 1 | 0 | Cannot be spec'd, requires time |
| Maintenance | 5 | 9 | +4 | CI matrix + process docs |
| Cross-Language | 10 | 10 | 0 | Already at ceiling |
| **Total** | **119** | **137** | **+18** | |

**Note**: Ecosystem (1→1) is the only dimension that cannot be improved through specification alone. Reaching 10/10 on Ecosystem requires npm adoption, GitHub stars, and community contributions over time. The projected 137/150 represents the practical ceiling achievable through spec and implementation work.

### Projected Full Matrix

Consolidated rating matrix with `hex-di/result` projected scores against all TypeScript and cross-language implementations.

| Dimension | hex-di (projected) | neverthrow | Effect | fp-ts | true-myth | oxide.ts | purify-ts | option-t | ts-results-es | Rust | Kotlin Arrow | Swift | Scala ZIO | Haskell | Gleam | Go |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Type Safety | 10 | 7 | 10 | 9 | 7 | 6 | 7 | 6 | 5 | 10 | 9 | 8 | 10 | 10 | 9 | 3 |
| API Completeness | 10 | 7 | 10 | 9 | 7 | 6 | 7 | 5 | 5 | 10 | 9 | 7 | 10 | 9 | 7 | 4 |
| Composability | 10 | 7 | 10 | 9 | 8 | 5 | 7 | 7 | 4 | 10 | 9 | 6 | 10 | 10 | 8 | 2 |
| Dev Ergonomics | 10 | 8 | 5 | 4 | 7 | 7 | 6 | 5 | 7 | 8 | 7 | 9 | 5 | 4 | 9 | 8 |
| Async Support | 10 | 8 | 10 | 5 | 3 | 3 | 4 | 3 | 3 | 9 | 9 | 8 | 10 | 7 | 7 | 6 |
| Error Handling | 10 | 5 | 9 | 7 | 4 | 4 | 5 | 3 | 3 | 10 | 8 | 7 | 10 | 8 | 7 | 5 |
| Immutability | 10 | 5 | 8 | 7 | 8 | 5 | 6 | 8 | 5 | 9 | 8 | 7 | 9 | 10 | 10 | 3 |
| Safety Guarantees | 10 | 3 | 7 | 5 | 4 | 3 | 3 | 3 | 2 | 10 | 8 | 8 | 9 | 9 | 9 | 2 |
| Performance | 9 | 8 | 6 | 5 | 7 | 8 | 6 | 9 | 8 | 10 | 7 | 9 | 7 | 7 | 8 | 9 |
| Bundle Efficiency | 10 | 7 | 4 | 3 | 8 | 7 | 5 | 9 | 7 | 10 | 7 | 9 | 6 | 7 | 9 | 10 |
| Interop | 9 | 5 | 8 | 6 | 5 | 4 | 5 | 4 | 4 | 8 | 8 | 8 | 8 | 6 | 7 | 7 |
| Documentation | 9 | 7 | 9 | 6 | 8 | 5 | 6 | 4 | 4 | 10 | 8 | 9 | 8 | 7 | 8 | 9 |
| Ecosystem | 1 | 7 | 9 | 8 | 4 | 3 | 4 | 3 | 3 | 10 | 7 | 10 | 7 | 8 | 4 | 10 |
| Maintenance | 9 | 6 | 9 | 4 | 6 | 4 | 4 | 7 | 4 | 10 | 8 | 10 | 8 | 8 | 7 | 10 |
| Cross-Language | 10 | 6 | 7 | 8 | 7 | 8 | 6 | 5 | 6 | 10 | 8 | 7 | 8 | 10 | 8 | 3 |
| **TOTAL** | **137** | **96** | **126** | **95** | **93** | **78** | **83** | **81** | **70** | **144** | **120** | **122** | **125** | **120** | **118** | **81** |

### Projected Ranking

| Rank | Implementation | Score | Category |
|:----:|----------------|:-----:|----------|
| 1 | Rust std | 144 | Cross-language |
| 2 | **hex-di/result (projected)** | **137** | **TypeScript** |
| 3 | Effect | 126 | TypeScript |
| 4 | Scala ZIO | 125 | Cross-language |
| 5 | Swift Result | 122 | Cross-language |
| 6 | Kotlin Arrow | 120 | Cross-language |
| 7 | Haskell Either | 120 | Cross-language |
| 8 | Gleam Result | 118 | Cross-language |
| 9 | neverthrow | 96 | TypeScript |
| 10 | fp-ts | 95 | TypeScript |
| 11 | true-myth | 93 | TypeScript |
| 12 | purify-ts | 83 | TypeScript |
| 13 | option-t | 81 | TypeScript |
| 14 | Go errors | 81 | Cross-language |
| 15 | oxide.ts | 78 | TypeScript |
| 16 | ts-results-es | 70 | TypeScript |

The 13-point gap from projected 137 to perfect 150 breaks down as: Ecosystem 9pts (requires adoption over time), Performance 1pt (10 requires Rust-level zero-cost), Interop 1pt (full 10 needs RxJS companion), Documentation 1pt (needs live docs site), Maintenance 1pt (needs release history).

## Strategic Summary

### Strengths to preserve

1. **Type Safety** (10) — Phantom types, brand validation, and inference utilities are best-in-class among standalone libraries.
2. **Immutability** (10) — Runtime `Object.freeze()` enforcement is unique among TS Result libraries.
3. **Safety Guarantees** (10) — Brand-based validation prevents the structural forgery that plagues all competitors.
4. **Cross-Language Alignment** (10) — Faithful Rust naming makes the library instantly familiar to Rust developers.

### Gaps to close

1. **Bundle Efficiency** (6→10) — The highest-impact improvement. Subpath exports and standalone functions bring this to parity with option-t's best-in-class tree-shaking.
2. **Maintenance** (5→9) — CI matrix, conventional commits, and changesets establish trust and professionalism.
3. **Dev Ergonomics** (8→10) — Unsafe gating and structured `UnwrapError` make the library safer and more developer-friendly.
4. **API Completeness** (9→10) — The `Option<T>` type and new methods complete the API surface to match or exceed Rust's stdlib.

### What cannot be spec'd

- **Ecosystem** requires community adoption over time
- **Performance** beyond 9 requires Rust-level zero-cost abstractions (not possible in JavaScript); 9 is achievable via published benchmarks and selective prototype optimization per [ADR-013](../decisions/013-performance-strategy.md)
- **Documentation** quality improves incrementally with each spec addition
